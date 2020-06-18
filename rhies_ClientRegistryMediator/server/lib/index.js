#!/usr/bin/env node
'use strict'

const needle = require('needle');
const formidable = require('formidable');
const express = require('express');
const medUtils = require('openhim-mediator-utils');
const winston = require('winston');
const _ = require('underscore');
const Fhir = require('fhir').Fhir;
var request = require('request');
const fs = require('fs');
var https = require('https');
var http = require('http');
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
    if (req.url.startsWith(apiConf.api.urlPattern)) {
      switch (req.method) {
        case 'GET':

          var options = {
            url: apiConf.api.clientRegistry.url,
            headers: {
              'Connection': 'keep-alive',
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + new Buffer(apiConf.api.clientRegistry.user.name + ":" + apiConf.api.clientRegistry.user.pwd).toString('base64'),
            },
            qs: req.query
          };


          winston.info('Requesting data from  client registry ...')
          request.get(options, function (error, response, body) {
            if (error) {
              reportEndOfProcess(req, res, error, 500, "An error occured when trying to retrieve data from the client registry");
            } else {
              var resp = JSON.parse(body);
              reportEndOfProcess(req, res, null, 200, resp);
            }

          });

          break;
        case 'POST':
          var form = new formidable.IncomingForm();
          form.parse(req, function (err, fields, files) {
            var data = fields;

            if (apiConf.verbose == true) { winston.info('data received ...'); }

            var nida = null;
            var PCID = null;
            var FOSAID = null;

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
            var religion = null;


            if (utils.isFineValue(data) == true && utils.isFineValue(data.patient) && utils.isFineValue(data.patient.person)) {

              if (utils.isFineValue(data.location) == true) {
                //FOSAID: 7 TYPE: CS
                if (data.location.includes(":")) {
                  var fosaTab = data.location.split(":");
                  if (fosaTab[1].trim().includes(" ")) {
                    var fosaTab2 = fosaTab[1].trim().split(" ");
                    FOSAID = fosaTab2[0]
                  }
                }
              }


              if (utils.isFineValue(data.patient.identifiers) == true) {
                nida = utils.getValueFromArray(data.patient.identifiers, "identifierType", "NIDA", "identifier")
                PCID = utils.getValueFromArray(data.patient.identifiers, "identifierType", "PCID", "identifier")
              }


              birthDate = utils.getDateValue(data.patient.person.birthdate);
              gender = utils.getGender(data.patient.person.gender);



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
                civilStatus = utils.getValueFromArrayList(data.patient.person.attributes, "attributeType", "civilStatus", "value");
                educationLevel = utils.getValueFromArrayList(data.patient.person.attributes, "attributeType", "educationLevel", "value");
                mainActivity = utils.getValueFromArrayList(data.patient.person.attributes, "attributeType", "mainActivity", "value");
              }
            }


            var patientObject = {
              resourceType: "Patient",
              "id": PCID,
              "identifier": [
                {
                  "system": "NIDA",
                  "value": nida
                },
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
              "active": active,
              "birthDate": birthDate,
              "gender": gender,
              "address": [
                {
                  "extension": [
                    {
                      "url": "umudugudu",
                      "valueString": umudugudu
                    },
                    {
                      "url": "cell",
                      "valueString": cell
                    },
                    {
                      "url": "sector",
                      "valueString": sector
                    }
                  ],
                  "district": district,
                  "state": state,
                  "country": country
                }
              ],
              "extension": [
                {
                  "url": "fosaId",
                  "valueString": FOSAID
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
                },
                {
                  "url": "religion",
                  "valueString": religion
                }
              ],
              "contact": [
                {
                  "extension": [
                    {
                      "url": "fatherName",
                      "valueString": fatherName
                    },
                    {
                      "url": "motherName",
                      "valueString": motherName
                    }
                  ],
                  "telecom": [
                    {
                      "value": telecom
                    }
                  ]
                }
              ]
            }
            var options = {
              url: apiConf.api.clientRegistry.url,
              headers: {
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + new Buffer(apiConf.api.clientRegistry.user.name + ":" + apiConf.api.clientRegistry.user.pwd).toString('base64')
              },
              body: JSON.stringify(patientObject)
            };

            winston.info('Pushing resource to client registry ...')
            request.post(options, function (error, response, body) {
              if (error) {
                reportEndOfProcess(req, res, error, 500, "An error occured when trying to push data to the client registry");
              } else {
                var responseBody = body;
                var wholeResponse = response;
                if (wholeResponse.statusCode == 200 || wholeResponse.statusCode == 201) {
                  reportEndOfProcess(req, res, null, wholeResponse.statusCode, 'Data pushed with success');
                } else {
                  var errorReturned=utils.getLastError(responseBody);
                  reportEndOfProcess(req, res, errorReturned, wholeResponse.statusCode, "An error occured when trying to push data to the client registry. " + errorReturned);
                }
              }
            });


          })
          break;
        case 'DELETE':
          var options = {
            url: apiConf.api.clientRegistry.url + "/" + req.query.nida,
            headers: {
              'Connection': 'keep-alive',
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + new Buffer(apiConf.api.clientRegistry.user.name + ":" + apiConf.api.clientRegistry.user.pwd).toString('base64'),
            },
            qs: req.query
          };

          winston.info('Deleting data from  client registry ...')
          request.delete(options, function (error, response, body) {
            if (error) {
              reportEndOfProcess(req, res, error, 500, "An error occured when trying to delete data from the client registry");
            } else {
              reportEndOfProcess(req, res, null, 200, "Data deleted with sucess");
            }
          });

          break;
      }

    }
    if (req.protocol === 'http'){
      res.redirect(301, `https://${req.headers.post}${req.url}`);
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

  // if (false) {
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
    config = mediatorConfig.config
    let app = setupApp()

    // Create and start HTTPS server
    var httpsServer = https.createServer({
      key: fs.readFileSync('./config/certificates/privkey.pem'),
      cert: fs.readFileSync('./config/certificates/cert.pem'),
  }, app);
    const server = httpsServer.listen(port, () => callback(server))

  }
}
exports.start = start

if (!module.parent) {
  // if this script is run directly, start the server
  start(() => winston.info(`Listening on ${port}...`))
}
