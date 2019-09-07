#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express')
const medUtils = require('openhim-mediator-utils')
const winston = require('winston')
var request = require('request');

const utils = require('./utils')

// Logging setup
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, { level: 'info', timestamp: true, colorize: true })

// Config
var config = {} // this will vary depending on whats set in openhim-core
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')
const mediatorConfig = require('../config/mediator')

var port = process.env.NODE_ENV === 'test' ? 7001 : mediatorConfig.endpoints[0].port

/**
 * setupApp - configures the http server for this mediator
 *
 * @return {express.App}  the configured http server
 */
function setupApp() {
  const app = express();

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
        console.log('Got data');









        res.send(utils.buildReturnObject(mediatorConfig.urn, 'Successful', 200, headers, responseBody, orchestrations, properties))

      })
    }
  });


  return app
}


exports.pushSetp1 = function (callback) {
  console.log('[Step 1--------------------------------------]');
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
      responseBody = error;
      orchestrationResponse = error
      orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
      res.send(utils.buildReturnObject(mediatorConfig.urn, 'Failed', 500, headers, responseBody, orchestrations, properties))
    } else {
      if (body != null && body != undefined && body != '') {
        responseBody = body
        orchestrationResponse = body;
        orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
        res.send(utils.buildReturnObject(mediatorConfig.urn, 'Successful', 200, headers, responseBody, orchestrations, properties))
      } else {
        responseBody = 'Server sent an empty response.';
        orchestrationResponse = responseBody;
        orchestrations.push(utils.buildOrchestration('Return to openHim Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
        res.send(utils.buildReturnObject(mediatorConfig.urn, 'Failed', 500, headers, responseBody, orchestrations, properties))
      }
    }
  });

};

exports.pushSetp2 = function (callback) {
  console.log('[Step 2--------------------------------------]');
  if (error) {

  } else {

  }
}

exports.pushSetp3 = function (callback) {
  console.log('[Step 3--------------------------------------]');
  if (error) {
    
  } else {

  }
}

exports.pushSetp4 = function (callback) {
  console.log('[Step 4--------------------------------------]');
  if (error) {
    
  } else {

  }
}

exports.pushSetp5 = function (callback) {
  console.log('[Step 5--------------------------------------]');
  if (error) {
    
  } else {

  }
}

exports.pushSetp6 = function (callback) {
  console.log('[Step 6--------------------------------------]');
  if (error) {
    
  } else {

  }
}


exports.pushSetp7 = function (callback) {
  console.log('[Step 7--------------------------------------]');
  if (error) {
    
  } else {

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
