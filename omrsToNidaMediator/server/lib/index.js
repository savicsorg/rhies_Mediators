#!/usr/bin/env node
'use strict'

const formidable = require('formidable');
const express = require('express')
const medUtils = require('openhim-mediator-utils')
const winston = require('winston')
const moment = require('moment');
var needle = require('needle');
var request = require('request');

const utils = require('./utils')

// Logging setup
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, { level: 'info', timestamp: true, colorize: true })

// Config
var config = {} // this will vary depending on whats set in openhim-core
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')
var nconf = require('nconf');
process.env.NODE_ENV === 'test' ? nconf.file('../config/test.json') : nconf.file('../config/config.json');


const mediatorConfig = require('../config/mediator')

var port = process.env.NODE_ENV === 'test' ? 7001 : mediatorConfig.endpoints[0].port

var nida ={
    token:undefined,
    lastUpdate: undefined
};

var ENV = "prod";

/**
 * setupApp - configures the http server for this mediator
 *
 * @return {express.App}  the configured http server
 */
function setupApp() {
  const app = express()


  var CronJob = require('cron').CronJob;
  new CronJob('00 00 */2 * * *', function () {
    /*
     * Runs every day, every 02 hours
     */

    console.log(new Date(), 'Setting Cron for token claiming....');
    exports.getNewNidaToken(function (error, token) {
      if (error) {
        console.log('error while claiming for token...',error);
      } else {
        console.log(new Date(), 'Token retrieved with success');
      }
    });
  }, null, true);


  app.all('*', (req, res) => {
    winston.info(`Processing ${req.method} request on ${req.url}`)
   
    
    function reportEndOfProcess(req, res, error, statusCode, message) {
      res.set('Content-Type', 'application/json+openhim')
      var responseBody = "[-] " + message;
      var stateLabel = "";
      let orchestrations = [];

      var headers = { 'content-type': 'application/json' }
      if (error) {
          stateLabel = "Failed";
          winston.error(message, error);
      } else {
          stateLabel = "Successful";
          winston.info(message);
      }

      var orchestrationResponse = { statusCode: statusCode, headers: headers }
      orchestrations.push(utils.buildOrchestration('Primary Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
      res.send(utils.buildReturnObject(mediatorConfig.urn, stateLabel, statusCode, headers, responseBody, orchestrations, { property: 'Primary Route' }));
  }



    if (req.method == 'GET' && req.url.includes(apiConf.api.urlPattern) == true) {

      getNidaToken(function (err, token) {
        if (err) {
          reportEndOfProcess(req, res, err, 500, err);
        } else {
          nconf.load();
          var options = {
            url: apiConf.api.nida[ENV].getcitizenUrl,
            body: JSON.stringify(
              {
                documentNumber: req.query.id,
                keyPhrase: apiConf.api.nida[ENV].keyPhrase
              }),
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            }
          };

          request.post(options, function (error, response, body) {
            if (error) {
              responseBody = error;
              orchestrationResponse = error
              orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
              res.send(utils.buildReturnObject(mediatorConfig.urn, 'Internal Server Error', 500, headers, responseBody, orchestrations, properties))
            } else {
              if (body != null && body != undefined && body != '') {
                reportEndOfProcess(req, res, null, 200, body);
              } else {
                reportEndOfProcess(req, res, null, 200, 'Server sent an empty response.');
              }
            }
          });
        }
      });
    }


  })
  return app
}


function getNidaToken(callback) {
  var shouldGetNewToken = false;

  if (nida.token == undefined || nida.token == "" || nida.lastUpdate == undefined || nida.lastUpdate == "") {

    shouldGetNewToken = true;
    console.log(new Date(), 'first run, getting new token...');
  } else {
    var currentTokenDate = moment(new Date(nida.lastUpdate));
    var currentDate = moment();

    if (currentDate.isSameOrAfter(currentTokenDate.add(1, 'days')) == true) {
      shouldGetNewToken = true;
      console.log(new Date(), 'different day, getting new token...');
    } else {
      console.log(new Date(), 'Same day, leading to query...');
      shouldGetNewToken = false;
    }

  }

  if (shouldGetNewToken == true) {
    exports.getNewNidaToken(function (error, tokenInfo) {
      callback(error, tokenInfo);
    });
  } else {
    callback(null, nida.token);
  }
}




exports.getNewNidaToken = function (callback) {
  //Query for Token
  var options = {
    url: apiConf.api.nida[ENV].claimtokenUrl,
    body: JSON.stringify(
      {
        username: apiConf.api.nida[ENV].user.name,
        password: apiConf.api.nida[ENV].user.pwd
      }),
    headers: {
      'Content-Type': 'application/json',
    }
  };
  request.post(options, function (error, response, body) {
    if (error) {
      callback(error);
    } else {
      if (body != null && body != undefined && body != '' && body.includes(' ') == true) {
        var tokenInfo = body;
        //save token infos on config
        var currentDate = moment()
        nconf.set("api:nida:token:updateDate", currentDate);
        nconf.set("api:nida:token:value", tokenInfo);
        console.log(tokenInfo);
        nida.token = tokenInfo;
        nida.lastUpdate = currentDate;
        callback(null, tokenInfo);
      } else {
        callback('Server returned an empty or wrong token...');
      }
    }
  });
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
    
    exports.getNewNidaToken(function (error, tokenInfo) {
      console.log('Initialize the NIDA token...');
    });
  }
}
exports.start = start


if (!module.parent) {
  // if this script is run directly, start the server
  start(() => winston.info(`Listening on ${port}...`))
}
