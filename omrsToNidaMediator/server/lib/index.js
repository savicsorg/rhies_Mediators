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

/**
 * setupApp - configures the http server for this mediator
 *
 * @return {express.App}  the configured http server
 */
function setupApp() {
  const app = express()


  app.all('*', (req, res) => {
    winston.info(`Processing ${req.method} request on ${req.url}`)
    var responseBody = 'Return Route Reached'
    var headers = { 'content-type': 'application/json' }

    // add logic to alter the request here

    // capture orchestration data
    var orchestrationResponse = { statusCode: 200, headers: headers }
    let orchestrations = []
  
    // set content type header so that OpenHIM knows how to handle the response
    res.set('Content-Type', 'application/json+openhim')


    // construct return object
    var properties = { property: 'Return to openHim Route' }

    if (req.method == 'GET' && req.url.includes(apiConf.api.urlPattern) == true) {

      getNidaToken(function (err, token) {
        if (err) {
          orchestrationResponse=err;
          responseBody=err;
          orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
          res.send(utils.buildReturnObject(mediatorConfig.urn, 'Failed', 500, headers, error, orchestrations, properties))
        } else {
          nconf.load();
          var options = {
            url: apiConf.api.nida.getcitizenUrl,
            body: JSON.stringify(
              {
                documentNumber: req.query.id,
                keyPhrase: apiConf.api.nida.keyPhrase
              }),
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            }
          };

          request.post(options, function (error, response, body) {
            if (error) {
              responseBody=error;
              orchestrationResponse=error
              orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
              res.send(utils.buildReturnObject(mediatorConfig.urn, 'Failed', 500, headers, responseBody, orchestrations, properties))
            } else {
              if (body != null && body != undefined && body != '') {
                responseBody= body
                orchestrationResponse=body;
                orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
                res.send(utils.buildReturnObject(mediatorConfig.urn, 'Successful', 200, headers, responseBody, orchestrations, properties))
              } else {
                responseBody='Server sent an empty response.';
                orchestrationResponse=responseBody;
                orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
                res.send(utils.buildReturnObject(mediatorConfig.urn, 'Failed', 500, headers, responseBody, orchestrations, properties))
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

  if (apiConf.api.nida.token == undefined
    || apiConf.api.nida.token.value == undefined || apiConf.api.nida.token.value == ""
    || apiConf.api.nida.token.updateDate == undefined || apiConf.api.nida.token.updateDate == "") {

    shouldGetNewToken = true;
    console.log('first run, getting new token...');
  } else {
    var currentTokenDate = moment(new Date(apiConf.api.nida.token.updateDate));
    var currentDate = moment();

    if (currentDate.isSameOrAfter(currentTokenDate.add(1, 'days')) == true) {
      shouldGetNewToken = true;
      console.log('different day, getting new token...');
    } else {
      console.log('Same day, leading to query...');
      shouldGetNewToken = false;
    }

  }

  if (shouldGetNewToken == true) {
    //Query for Token
    var options = {
      url: apiConf.api.nida.claimtokenUrl,
      body: JSON.stringify(
        {
          username: apiConf.api.nida.user.name,
          password: apiConf.api.nida.user.pwd,
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
          var currentDate=moment()
          nconf.set("api:nida:token:updateDate",  currentDate);
          nconf.set("api:nida:token:value", tokenInfo);
          apiConf.api.nida.token.value=tokenInfo;
          apiConf.api.nida.token.updateDate=currentDate;

          nconf.save(function (err) {
            if (err) {
              callback(err);
            } else {

              callback(null, tokenInfo);
            }
          });
        } else {
          callback('Server returned an empty or wrong token...');
        }
      }
    });
  } else {
    callback(null, apiConf.api.nida.token.value);
  }

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


if (!module.parent) {
  // if this script is run directly, start the server
  start(() => winston.info(`Listening on ${port}...`))
}
