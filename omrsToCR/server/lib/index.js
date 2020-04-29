#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express');
const medUtils = require('openhim-mediator-utils');
const winston = require('winston');
const _ = require('underscore');
const Fhir = require('fhir').Fhir;
var request = require('request');

const utils = require('./utils');

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

  var currenteLocation = "";
  function reportEndOfProcess(req, res, error, statusCode, message) {
    res.set('Content-Type', 'application/json+openhim')
    var responseBody = "[" + currenteLocation + "] " + message;
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





  app.all('*', (req, res) => {
    winston.info(`Processing ${req.method} request on ${req.url}`)

    if (req.method == 'POST' && req.url == apiConf.api.urlPattern) {
      var form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
        var data = fields;

        winston.info('data received ...')

        if (apiConf.verbose == true) {

          var nida = null;
          var PCID = null;

          var birthDate = null;
          var gender = null;
          var active = true;

          var familyName = null;
          var givenName1 = null;
          var givenName2 = null;

          var city = null;
          var district = null;
          var state = null;
          var country = null;
          var cell = null;
          var sector = null;
          var umudugudu = null;

          var telecom = null;
          var fatherName = null;
          var motherName = null;
          var civilStatus = null;
          var educationLevel = null;
          var mainActivity = null;

          if (utils.isFineValue(data) == true && utils.isFineValue(data.patient) && utils.isFineValue(data.patient.person)) {

            if (utils.isFineValue(data.patient.identifiers) == true) {
              nida = utils.getValueFromArray(data.patient.identifiers, "identifierType", "NIDA", "identifier")
              PCID = utils.getValueFromArray(data.patient.identifiers, "identifierType", "PCID", "identifier")
            }


            birthDate = utils.getDateValue(data.patient.person.birthdate);
            gender = utils.getValue(data.patient.person.gender);



            if (utils.isFineValue(data.patient.person.preferredName) == true) {
              familyName = utils.getValue(data.patient.person.preferredName.familyName);
              givenName1 = utils.getValue(data.patient.person.preferredName.givenName);
              givenName2 = utils.getValue(data.patient.person.preferredName.middleName);
            }

            if (utils.isFineValue(data.patient.person.preferredAddress) == true) {
              country = utils.getValue(data.patient.person.preferredAddress.country);
              state = utils.getValue(data.patient.person.preferredAddress.stateProvince);
              district = utils.getValue(data.patient.person.preferredAddress.countyDistrict);
              cell = utils.getValue(data.patient.person.preferredAddress.address3);
              sector = utils.getValue(data.patient.person.preferredAddress.cityVillage);
              umudugudu = utils.getValue(data.patient.person.preferredAddress.address1);
            }

            if (utils.isFineValue(data.patient.person.attributes) == true) {
              telecom = utils.getValueFromArray(data.patient.person.attributes, "attributeType", "PhoneNumber", "value");
              fatherName = utils.getValueFromArray(data.patient.person.attributes, "attributeType", "fatherName", "value");
              motherName = utils.getValueFromArray(data.patient.person.attributes, "attributeType", "motherName", "value");

              /* civilStatus = utils.getValueFromArray(data.patient.person.attributes, "attributeType", "PhoneNumber", "value");
              educationLevel = utils.getValueFromArray(data.patient.person.attributes, "attributeType", "PhoneNumber", "value");
              mainActivity = utils.getValueFromArray(data.patient.person.attributes, "attributeType", "PhoneNumber", "value"); */
            }
          } else {

          }



          var patientObject = {
            "resourceType": "Patient",
            "id": nida,
            "active": active,
            "extension": [
              {
                "url": "sector",
                "valueString": sector
              },
              {
                "url": "cell",
                "valueString": cell
              },
              {
                "url": "umudugudu",
                "valueString": umudugudu
              },
              {
                "url": "fatherName",
                "valueString": fatherName
              },
              {
                "url": "motherName",
                "valueString": motherName
              },
              {
                "url": "civilStatus",
                "valueString": civilStatus
              },
              {
                "url": "educationLevel",
                "valueString": educationLevel
              },
              {
                "url": "mainActivity",
                "valueString": mainActivity
              }
            ],
            "identifier": [
              {
                "system": "PCID",
                "value": PCID
              }
            ],
            "name": [
              {
                "family": familyName,
                "given": [
                  givenName1,
                  givenName2
                ]
              }
            ],
            "gender": gender,
            "birthDate": birthDate,
            "address": [
              {
                "district": district,
                "state": state,
                "country": country
              }
            ],
            "contact": [
              {
                "telecom": [
                  {
                    "value": telecom
                  }
                ]
              }
            ]
          }
console.log('---------------->>>', patientObject)

          var options = {
            url: apiConf.api.clientRegistry.url,
            headers: {
              'Authorization': 'Basic ' + new Buffer(apiConf.api.clientRegistry.user.name + ":" + apiConf.api.clientRegistry.user.pwd).toString('base64'),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientObject),
          };

          winston.info('Push resource to client registry ...')
          request.post(options, function (error, response, body) {
            if (error) {
              winston.error("An error occured when trying to push data to the client registry", ResponseBody.response);
            } else {
              var ResponseBody = JSON.parse(body);

              if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
                if (ResponseBody.httpStatusCode == 200) {
                  winston.info('Entity instance ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                } else {
                  winston.error("An error occured when trying to push data to the client registry", ResponseBody.response);
                }
              } else {
                winston.error("An error occured when trying to push data to the client registry", ResponseBody.response);
              }
            }
          });
        }


      })
    }
  });
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

  if (false) {
    //if (apiConf.register) {
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
