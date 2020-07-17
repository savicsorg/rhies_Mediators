#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express');
const medUtils = require('openhim-mediator-utils');
const winston = require('winston');
const _ = require('underscore');
//var facServerrequest = require('http')
var https = require('https');
var http = require('http');
const cron = require('node-cron');
const cronPushing = require('node-cron');
var myConfig = require('../config/config')
var facServerrequest = require('request');
var counterI = 0;

var tools = require('../utils/tools');
const fs = require('fs');
var getFacilityRegistry = [];


// Logging setup
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { level: 'info', timestamp: true, colorize: true });

// Config
var config = {}; // this will vary depending on whats set in openhim-core
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config');
const mediatorConfig = require('../config/mediator.json');

var port = process.env.NODE_ENV === 'test' ? 7001 : mediatorConfig.endpoints[0].port;

/**
 * setupApp - configures the http server for this mediator
 *
 * @return {express.App}  the configured http server
 */
function setupApp() {
  
  // start the rest of your app here
  const app = express();


  //Pushing Facility information to openMRS instances db
  cronPushing.schedule(myConfig.facilityregistry.pushingschedule, () =>{

    var openmrsInstancesTab = myConfig.facilityregistry.openmrsinstances
    app.all('*', function(req, myResponse) {
      var msgBuffer = "";
      var statusLog = 0;
      // + ":" + myConfig.facilityregistry.server.port 
      var endpoint = myConfig.facilityregistry.server.url + myConfig.facilityregistry.server.urlPattern;
      facServerrequest.get(endpoint, function(error,response,body) {
        if(error){
          console.log("There is an error while retrieving facilities");
          msgBuffer = 'Error while connecting to the facility registry Server. Check if the facility registry server (app and DB) is on and/or the Internet connection.';
          tools.reportEndOfProcess(req, myResponse, error, 500 , msgBuffer);
        } else {
          var facilitiesTab = JSON.parse(body).FacilitiesList;
          winston.info('PUSHING START with a list of ' + facilitiesTab.length + ' facilities to update (or add) ...for : ' + tools.getTodayDate());
          for(var i=0; i<openmrsInstancesTab.length; i++){
              tools.updateOpenmrsFacilitiesList(openmrsInstancesTab[i].name, openmrsInstancesTab[i].port, openmrsInstancesTab[i].pwd, facilitiesTab, function(result){
                msgBuffer = msgBuffer + result + '  ';
                counterI = i;
                if (i == (openmrsInstancesTab.length-1)){
                  tools.reportEndOfProcess(req, myResponse, null, 200 , msgBuffer);
                }  
              });  
          }
          
        }
      });
      
    });
    
    var hostname = myConfig.api.openhimServer;
    var requestOptions = {
      port: '5000',
      path: '/facilityregistry/',
      method:'POST',
      auth: myConfig.api.routeUser + ":" + myConfig.api.routePass,
      headers : {
        'content-type':'application/json'
      }
    };
    var sendRequest = https.request(hostname,requestOptions, function(rq, rs){});
    sendRequest.on('error', function(err){
      winston.info("Error details: ", err);
    });
    sendRequest.end();
  });
    
  return app;

}




/**
 * start - starts the mediator
 *
 * @param  {Function} callback a node style callback that is called once the
 * server is started
 */
function start(callback) {
    if (apiConf.api.trustSelfSigned) { process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' }
  
  if (apiConf.register) {
  //if (false) {
      medUtils.registerMediator(apiConf.api, mediatorConfig, (err) => {
        if (err) {
          winston.error('Failed to register this mediator, check your config')
          winston.error(err.stack)
          process.exit(1)
        }
        apiConf.api.urn = mediatorConfig.urn
        medUtils.fetchConfig(apiConf.api, (err, newConfig) => {
          winston.info('Received initial config:')
          winston.info(JSON.stringify(newConfig))
          config = newConfig
          if (err) {
            winston.error('Failed to fetch initial config')
            winston.error(err.stack)
            process.exit(1)
          } else {
            winston.info('Successfully registered mediator!')
            let app = setupApp();

          // Create and start HTTPS server
              var httpsServer = https.createServer({
                key: fs.readFileSync('./config/certificates/privkey.pem'),
                cert: fs.readFileSync('./config/certificates/cert.pem')
            }, app);  
            const server = httpsServer.listen(port, () => {
              if (apiConf.heartbeat) {
                let configEmitter = medUtils.activateHeartbeat(apiConf.api)
                configEmitter.on('config', (newConfig) => {
                  winston.info('Received updated config:')
                  winston.info(JSON.stringify(newConfig))
                  // set new config for mediator
                  config = newConfig
  
                  // we can act on the new config received from the OpenHIM here
                  winston.info(config)
                })
              }
              callback(server)
            })
          }
        })
      })
    } else {

      // default to config from mediator registration
      config = mediatorConfig.config;
      let app = setupApp();

      // Create and start HTTPS server
     var httpsServer = https.createServer({
        key: fs.readFileSync('./config/certificates/privkey.pem'),
        cert: fs.readFileSync('./config/certificates/cert.pem')
    }, app);
      const server = httpsServer.listen(port, () => callback(server));
  
    }
  }


  exports.start = start
  
  if (!module.parent) {
    // if this script is run directly, start the server
    start(() => winston.info(`Listening on ${port}...`));
  }
