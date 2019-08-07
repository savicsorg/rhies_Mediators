#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express')
const medUtils = require('openhim-mediator-utils')
const winston = require('winston')
const moment = require('moment');



const utils = require('./utils')

// Logging setup
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, { level: 'info', timestamp: true, colorize: true })

// Config
var config = {} // this will vary depending on whats set in openhim-core
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')
var nconf = require('nconf');
process.env.NODE_ENV === 'test' ? nconf.file('../config/test') : nconf.file('../config/config');


const mediatorConfig = require('../config/mediator')

var port = process.env.NODE_ENV === 'test' ? 7001 : mediatorConfig.endpoints[0].port

/**
 * setupApp - configures the http server for this mediator
 *
 * @return {express.App}  the configured http server
 */
function setupApp() {
  const app = express()
  var needle = require('needle');


  app.all('*', (req, res) => {
    winston.info(`Processing ${req.method} request on ${req.url}`)
    var responseBody = 'Primary Route Reached'
    var headers = { 'content-type': 'application/json' }

    // add logic to alter the request here

    // capture orchestration data
    var orchestrationResponse = { statusCode: 200, headers: headers }
    let orchestrations = []
    orchestrations.push(utils.buildOrchestration('Primary Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))

    // set content type header so that OpenHIM knows how to handle the response
    res.set('Content-Type', 'application/json+openhim')


    // construct return object
    var properties = { property: 'Primary Route' }

    if (req.method == 'POST' && req.url == apiConf.api.urlPattern) {
      var form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
        var data = fields;
        console.log('Got data', data);

        //Query for Token
        var options = {
          username: apiConf.api.nida.user.name,
          password: apiConf.api.nida.user.pwd.        :
        }


        needle
          .post(apiConf.api.nida.Url + "/onlineauthentication/claimtoken", options)
          .on('done', function (err, resp) {

          })
      });





      res.send(utils.buildReturnObject(mediatorConfig.urn, 'Successful', 200, headers, responseBody, orchestrations, properties))
    }


  })
  return app
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
          let app = setupApp()
          const server = app.listen(port, () => {
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
    config = mediatorConfig.config
    let app = setupApp()
    const server = app.listen(port, () => callback(server))

  }
}
exports.start = start



function getNidaToken(callback) {
  var needle = require('needle');
  var shouldGetNewToken = false;


  if (apiConf.api.nida.token && apiConf.api.nida.token.value
    && apiConf.api.nida.token.value != "" && apiConf.api.nida.date
    && apiConf.api.nida.token.date != "") {
    shouldGetNewToken = true;
  } else {
    var currentTockerDate = moment(new Date(apiConf.api.nida.token.date));
    var currentDate = moment();

    if (currentTockerDate.add(1, 'days').isSameOrAfter(currentDate) == true) {
      shouldGetNewToken = true;
    } else {
      shouldGetNewToken = false;
    }

  }


  if (shouldGetNewToken == true){
    //Query for Token
    var options = {
      username: apiConf.api.nida.user.name,
      password: apiConf.api.nida.user.pwd        :
    }
    needle
      .post(apiConf.api.nida.Url + "/onlineauthentication/claimtoken", options)
      .on('done', function (err, resp) {
        if (err){
          callback(err);
        } else {
          console.log("=============================",resp);


          //save token infos on config
          nconf.set("api:nida:token:updateDate", moment());
          nconf.set("api:nida:token:value","===================" );
          nconf.save(function (err) {
              if (err) {
                callback(err);
              } else {
                callback(null,apiConf.api.nida.token.value);
              }
          });
        }
      })
  } else {
    callback(null,apiConf.api.nida.token.value);
  }
    

  }





  if (!module.parent) {
    // if this script is run directly, start the server
    start(() => winston.info(`Listening on ${port}...`))
  }
