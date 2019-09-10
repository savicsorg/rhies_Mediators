#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express');
const medUtils = require('openhim-mediator-utils');
const winston = require('winston');
const _ = require('underscore');



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
        winston.info('Encounter received ...')

        //get DHIS2 Lab id with FOSA code
        getOrganizationUnit(fields, function (error, organizationUnit) {
          if (error) {
            winston.error('error while retrieving for organization unit ...', error);
          } else {
            //Create or update entity instance
            upsertEntityInstanceId(fields, organizationUnit, function (error, trackedEntityInstanceId) {
              if (error) {
                winston.error('error while upserting entity instance id ...', error);
              } else {

                //Enroll entity instance
                enrolleTrackedEntityInstance(organizationUnit, trackedEntityInstanceId, function (error, enrollment) {
                  if (error) {
                    winston.error('error while enrolling entity instance id ...', error);
                  } else {


                    //Saving Stage (Encounters)


                  }
                })
              }
            });
          }
        });
        res.send(utils.buildReturnObject(mediatorConfig.urn, 'Successful', 200, headers, responseBody, orchestrations, properties))

      })
    }
  });


  return app
}





var upsertEntityInstanceId = function (fields, organizationUnit, callback) {

  if (utils.isFineValue(fields) == true && utils.isFineValue(fields.patient) == true) {

    var patient = fields.patient;

    if (utils.isFineValue(patient) == true && utils.isFineValue(patient.identifiers) == true) {

      //getting openmrs patient TRACNetId and  UPId
      getOpenmrsPatientIDs(fields, function (UPId, TRACNetId) {
        if (utils.isFineValue(TRACNetId) == true && utils.isFineValue(UPId) == true) {

          //Create patient existance
          var patientInstance = {
            "trackedEntity": "fHNKuROvJEc",
            "orgUnit": organizationUnit,
            "attributes": [
              {
                "attribute": "QdxWgPBlRxt",
                "value": UPId
              },
              {
                "attribute": "ISfxedlVq7Y",
                "value": "1900-01-01"
              },
              {
                "attribute": "zxrhIBj6H5K",
                "value": TRACNetId
              }
            ]
          }


          //Query with UPID or TRACNetId 
          getdhsi2Patient(organizationUnit, UPId, TRACNetId, function (error, resp) {
            if (error) {
              callback(error);
            } else {

              if (utils.isFineValue(resp) == true) {
                //A tracked entity instance found, updating ...
                var options = {
                  url: apiConf.api.dhis2.url + "/api/trackedEntityInstances/" + resp.trackedEntityInstance,
                  headers: {
                    'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(patientInstance),
                };

                winston.info('Updating Entity instance ...')               
                 request.put(options, function (error, response, body) {
                  if (error) {
                    callback(error);
                  } else {
                    if (utils.isFineValue(body) == true) {
                      if (body.httpStatusCode == 200) {
                        winston.info('Entity instance updated with success ', body.httpStatusCode, body.message)
                         callback(null, resp.trackedEntityInstance);
                      } else {
                        winston.error('An error occured when trying to update an entity instance ', body, )
                        callback('An error occured when trying to update an entity instance ' + body.message);
                      }
                    } else {
                      callback('An error occured, the server returned an empty response when updating an entity instance');
                    }
                  }
                }); 

              } else {
                //No tracked entity instance found, creating...
                var options = {
                  url: apiConf.api.dhis2.url + "/api/trackedEntityInstances",
                  headers: {
                    'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(patientInstance),
                };

                winston.info('Creating Entity instance ...')     
                request.post(options, function (error, response, body) {
                  if (error) {
                    callback(error);
                  } else {
                    if (utils.isFineValue(body) == true && utils.isFineValue(body.httpStatusCode) == true) {
                      if (body.httpStatusCode == 200) {
                        winston.info('Entity instance created with success ', body.httpStatusCode, body.message)
                        callback(null, resp.trackedEntityInstance);
                      } else {
                        winston.error('An error occured when trying to create an entity instance ', body.httpStatusCode, body.message)
                        callback('An error occured when trying to create an entity instance ' + body.message);
                      }
                    } else {
                      callback('An error occured, the server returned an empty when creation an entity instance');
                    }
                  }
                });
              }
            }
          });
        } else {
          winston.error('Patient with no UPID and no TRACNet Id received from openmrs.')
          callback('Patient with no UPID and no TRACNet Id received from openmrs.');
        }
      });

    } else {
      winston.error('Empty patient information received from openmrs.')
      callback('Empty patient information received from openmrs.');
    }
  }
}


var getOpenmrsPatientIDs = function (fields, callback) {
  if (utils.isFineValue(fields) == true && utils.isFineValue(fields.patient) == true) {
    var patient = fields.patient;
    if (utils.isFineValue(patient) == true && utils.isFineValue(patient.identifiers) == true) {
      var identifiers = patient.identifiers;
      var TRACNetId = null;
      var UPId = null;
      for (var i = 0; i < patient.identifiers.length; i++) {
        if (utils.isFineValue(patient.identifiers[i]) == true && utils.isFineValue(patient.identifiers[i].display) == true) {
          if (patient.identifiers[i].display.toUpperCase().includes("UPID =".toUpperCase()) == true) {
            UPId = patient.identifiers[i].display.split("=")[1].trim();
          }
          if (patient.identifiers[i].display.toUpperCase().includes("TRACNet ID =".toUpperCase()) == true) {
            TRACNetId = patient.identifiers[i].display.split("=")[1].trim();
          }
        }
      }
      callback(UPId, TRACNetId);
    } else {
      callback(null, null);
    }
  } else {
    callback(null, null);
  }
}



var getdhsi2Patient = function (organizationUnit, UPId, TRACNetId, callback) {
  var UPIdOptions = {};
  var TRACNetIdOptions = {};

  if (utils.isFineValue(UPId) == true && utils.isFineValue(organizationUnit) == true) {
    UPIdOptions = {
      url: apiConf.api.dhis2.url + "/api/trackedEntityInstances.json?filter=QdxWgPBlRxt:EQ:" + UPId + "&ou=" + organizationUnit,
      headers: {
        'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
        'Content-Type': 'application/json'
      }
    };
  }

  if (utils.isFineValue(TRACNetId) == true && utils.isFineValue(organizationUnit) == true) {
    TRACNetIdOptions = {
      url: apiConf.api.dhis2.url + "/api/trackedEntityInstances.json?filter=zxrhIBj6H5K:EQ:" + TRACNetId + "&ou=" + organizationUnit,
      headers: {
        'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
        'Content-Type': 'application/json'
      }
    };
  }

  if (utils.isFineValue(UPIdOptions) == true) {
    winston.info('Checking tracked entity instance with UPID ', UPId);
    request.get(UPIdOptions, function (error, response, body) {
      if (error) {
        callback(error);
      } else {
        var resp = JSON.parse(body);
        if (utils.isFineValue(resp.trackedEntityInstances) == true) {
          winston.info('Tracked entity instance retrieved with success');
          callback(null, resp.trackedEntityInstances[0]);
        } else {
          winston.info('No tracked entity instance found with UPID ', UPId);
          if (utils.isFineValue(TRACNetIdOptions) == true) {
            winston.info('Checking tracked entity instance with TRACNet id ', TRACNetId);
            request.get(TRACNetIdOptions, function (error, response, body) {
              if (error) {
                callback(error);
              } else {
                var resp = JSON.parse(body);
                if (utils.isFineValue(resp.trackedEntityInstances) == true) {
                  callback(null, resp.trackedEntityInstances[0]);
                } else {
                  winston.info('No tracked entity instance found with TRACNet ID ', TRACNetId);
                  callback(null, null);
                }
              }
            });
          } else {
            winston.info('No TRACNetId available.');
            callback(null, null);
          }
        }
      }
    });
  } else {
    winston.info('No UPID available.');
    if (utils.isFineValue(TRACNetIdOptions) == true) {
      winston.info('Checking tracked entity instance with TRACNet id ', TRACNetId);
      request.get(TRACNetIdOptions, function (error, response, body) {
        if (error) {
          callback(error);
        } else {
          var resp = JSON.parse(body);
          if (utils.isFineValue(resp.trackedEntityInstances) == true) {
            winston.info('Tracked entity instance retrieved with success');
            callback(null, resp.trackedEntityInstances[0]);
          } else {
            winston.info('No tracked entity instance found with TRACNet ID ', TRACNetId);
            callback(null, null);
          }
        }
      });
    } else {
      winston.info('No TRACNet id available.');
      callback(null, null);
    }
  }
}


var getOrganizationUnit = function (fields, callback) {
  if (utils.isFineValue(fields) == true && utils.isFineValue(fields.location) == true && utils.isFineValue(fields.location.description) == true) {
    if (utils.isFineValue(fields.location.description) == true && fields.location.description.includes(":") == true) {

      //FOSAID: 448 TYPE: CS
      var labFosaId = fields.location.description.split(":")[1].trim().split(" ")[0].trim();
      winston.info('Getting DHIS2 organizationUnit with location fosa id ', labFosaId)
      var options = {
        url: apiConf.api.dhis2.url + "/api/organisationUnits.json?fields=id&&filter=code:eq:" + labFosaId,
        headers: {
          'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
          'Content-Type': 'application/json'
        }
      };

      request.get(options, function (error, response, body) {
        if (error) {
          callback(error);
        } else {
          var organizationUnit = JSON.parse(body);
          if (utils.isFineValue(organizationUnit) == true && utils.isFineValue(organizationUnit.organisationUnits) == true) {
            callback(null, organizationUnit.organisationUnits[0].id);
          } else {
            callback('Server returned an empty response when retrieving organization unit ', labFosaId);
          }
        }
      });

    } else {
      winston.error('Wrong fosa code provided for the location ' + fields.location.display)
      callback('Wrong fosa code provided for the location ' + fields.location.display)
    }
  } else {
    winston.error('Empty location information received from openmrs.')
    callback('Empty location information received from openmrs.');
  }
}


var getEnrolleTrackedEntityInstance = function (organizationUnit, trackedEntityInstanceId, callback) {
 var Options = {
    url: apiConf.api.dhis2.url + "/api/enrollments.json?ou=" + organizationUnit + "&trackedEntityInstance=" + trackedEntityInstanceId,
    headers: {
      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
      'Content-Type': 'application/json'
    }
  };
  if (utils.isFineValue(organizationUnit) == true && utils.isFineValue(trackedEntityInstanceId) == true) {

    winston.info('Checking for enrollemenet with organizationUnit ', organizationUnit, 'and trackedEntityInstance ', trackedEntityInstanceId);
    request.get(Options, function (error, response, body) {
      if (error) {
        callback(error);
      } else {
        var resp = JSON.parse(body);
        if (utils.isFineValue(resp) == true) {
          //callback(null, resp.trackedEntityInstances[0]);
        } else {
          winston.info('No enrollment found found for tracked entity Instance Id ', trackedEntityInstanceId);
          callback(null, null);
        }
      }
    });
  } else {
    winston.info('Organization unit or tracked entity instance not provided.');
    callback(null, null);
  }
}




var enrolleTrackedEntityInstance = function (organizationUnit, trackedEntityInstanceId, callback) {
  getEnrolleTrackedEntityInstance(organizationUnit, trackedEntityInstanceId, function (error, resu) {
    if (error) {
      winston.error('error while enrolling entity instance id ...', error);
    } else {
      //Saving Stage (Encounters)
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

  }
}
exports.start = start

if (!module.parent) {
  // if this script is run directly, start the server
  start(() => winston.info(`Listening on ${port}...`))
}
