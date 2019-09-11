#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express');
const medUtils = require('openhim-mediator-utils');
const winston = require('winston');
const _ = require('underscore');



var request = require('request');

const utils = require('./utils');
const formMatch = require('./FormMatch');

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
            upsertEntity(fields, organizationUnit, function (error, trackedEntityInstanceId) {
              if (error) {
                winston.error('error while upserting entity instance id ...', error);
              } else {


                //Enroll entity instance
                enrolleEntity(fields, organizationUnit, trackedEntityInstanceId, function (error, enrollmentId) {
                  if (error) {
                    winston.error('error while enrolling entity instance id ', error);
                  } else {
                    //send incoming form
                    if (utils.isFineValue(fields.encounter.form) == true && utils.isFineValue(fields.encounter.form.display) == true) {
                      winston.info('Adding a new ', fields.encounter.form.display.trim());

                      if (fields.encounter.form.display.trim().toUpperCase() == "HIV CASE-BASED SURVEILLANCE Form - Index testing, partner notification, recency testing information".toUpperCase) {
                        addHivCaseBaseSurveillance(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            winston.error('error while adding ', fields.encounter.form.display.trim, ', error : ', error);
                          } else {
                            winston.info(fields.encounter.form.display.trim(), ' added with success');
                          }
                        })
                      }

                      if (fields.encounter.form.display.trim().toUpperCase() == "Confidential HIV CRF - SECTION 1: Enrollment Information".toUpperCase) {
                        addHivCrfSection1(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            winston.error('error while adding ', fields.encounter.form.display.trim, ', error : ', error);
                          } else {
                            winston.info(fields.encounter.form.display.trim(), ' added with success');
                          }
                        })
                      }

                      if (fields.encounter.form.display.trim().toUpperCase() == "Confidential HIV CRF - SECTION II: Follow up Information".toUpperCase) {
                        addHivCrfSection2(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            winston.error('error while adding ', fields.encounter.form.display.trim, ', error : ', error);
                          } else {
                            winston.info(fields.encounter.form.display.trim(), ' added with success');
                          }
                        })
                      }
                    } else {
                      winston.error('It is not possible to get the incoming form with the data received from OpenMRS');
                    }
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





var upsertEntity = function (fields, organizationUnit, callback) {

  if (utils.isFineValue(fields) == true && utils.isFineValue(fields.patient) == true) {

    var patient = fields.patient;

    if (utils.isFineValue(patient) == true && utils.isFineValue(patient.identifiers) == true) {

      //getting OpenMRS patient TRACNetId and  UPId
      getOpenMRSPatientIDs(fields, function (UPId, TRACNetId) {
        if (utils.isFineValue(TRACNetId) == true || utils.isFineValue(UPId) == true) {

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
          getTrackedEntity(organizationUnit, UPId, TRACNetId, function (error, resp) {
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
                // if received encounter have the right ISfxedlVq7Y (start of ARV) , we replace
                // or we take what is on resp.trackedEntityInstance

                request.put(options, function (error, response, body) {
                  if (error) {
                    callback(error);
                  } else {
                    var ResponseBody = JSON.parse(body);
                    if (utils.isFineValue(ResponseBody) == true) {
                      if (ResponseBody.httpStatusCode == 200) {
                        winston.info('Entity instance ', resp.trackedEntityInstance, ' updated with success ', ResponseBody.httpStatusCode, ResponseBody.message)

                        callback(null, resp.trackedEntityInstance);
                      } else {
                        winston.error('An error occured when trying to update an entity instance ', ResponseBody.httpStatusCode, body.message)
                        callback('An error occured when trying to update an entity instance ' + ResponseBody.message);
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
                  // if received encounter have the right ISfxedlVq7Y (start of ARV) , we replace
                  // or we let like this
                  if (error) {
                    callback(error);
                  } else {
                    var ResponseBody = JSON.parse(body);

                    if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
                      if (ResponseBody.httpStatusCode == 200) {
                        winston.info('Entity instance ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                        callback(null, ResponseBody.response.importSummaries[0].reference);
                      } else {
                        winston.error('An error occured when trying to create an entity instance ', ResponseBody.httpStatusCode, body.message)
                        callback('An error occured when trying to create an entity instance ' + ResponseBody.message);
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
          winston.error('Patient with no UPID and no TRACNet Id received from OpenMRS.')
          callback('Patient with no UPID and no TRACNet Id received from OpenMRS.');
        }
      });

    } else {
      winston.error('Empty patient information received from OpenMRS.')
      callback('Empty patient information received from OpenMRS.');
    }
  }
}

var getOpenMRSPatientIDs = function (fields, callback) {
  if (utils.isFineValue(fields) == true && utils.isFineValue(fields.patient) == true) {
    var patient = fields.patient;
    if (utils.isFineValue(patient) == true && utils.isFineValue(patient.identifiers) == true) {
      var identifiers = patient.identifiers;
      var TRACNetId = null;
      var UPId = null;

      for (var i = 0; i < patient.identifiers.length; i++) {
        if (utils.isFineValue(patient.identifiers[i]) == true && utils.isFineValue(patient.identifiers[i].display) == true) {
          if (patient.identifiers[i].display.toUpperCase().includes("UPID".toUpperCase()) == true) {
            UPId = patient.identifiers[i].display.split("=")[1].trim();
          }
          if (patient.identifiers[i].display.toUpperCase().includes("TRACNet".toUpperCase()) == true) {
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

var getTrackedEntity = function (organizationUnit, UPId, TRACNetId, callback) {
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
    winston.error('Empty location information received from OpenMRS.')
    callback('Empty location information received from OpenMRS.');
  }
}

var getEnrollment = function (organizationUnit, trackedEntityInstanceId, callback) {
  var Options = {
    url: apiConf.api.dhis2.url + "/api/enrollments.json?ou=" + organizationUnit + "&trackedEntityInstance=" + trackedEntityInstanceId,
    headers: {
      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
      'Content-Type': 'application/json'
    }
  };
  if (utils.isFineValue(organizationUnit) == true && utils.isFineValue(trackedEntityInstanceId) == true) {
    winston.info('Checking for enrollment with organizationUnit ', organizationUnit, 'and trackedEntityInstance ', trackedEntityInstanceId);
    request.get(Options, function (error, response, body) {
      if (error) {
        callback(error);
      } else {
        var resp = JSON.parse(body);
        if (utils.isFineValue(resp) == true) {
          if (utils.isFineValue(resp.enrollments) == true) {
            winston.info('Enrollment retrieved with success');
            callback(null, resp.enrollments[0]);
          } else {
            winston.info('No enrollment found for this tracked instance id.');
            callback(null, null);
          }
        } else {
          winston.info('No enrollment found found for tracked entity Instance Id ', trackedEntityInstanceId);
          callback('No enrollment found found for tracked entity Instance Id ', trackedEntityInstanceId, null);
        }
      }
    });
  } else {
    winston.info('Organization unit or tracked entity instance not provided.');
    callback('Organization unit or tracked entity instance not provided.', null);
  }
}

var enrolleEntity = function (fields, organizationUnit, trackedEntityInstanceId, callback) {
  getEnrollment(organizationUnit, trackedEntityInstanceId, function (error, resp) {
    if (error) {
      winston.error('error while enrolling entity instance id ...', error);
    } else {
      var enrollementValue = {
        "trackedEntityInstance": trackedEntityInstanceId,
        "orgUnit": organizationUnit,
        "program": "CYyICYiO5zo",
        "enrollmentDate": "1900-01-01",
        "incidentDate": "1900-01-01"
      }

      if (utils.isFineValue(resp) == true) {
        // if received encounter have the right enrollmentDate and incidentDate , we replace
        // or we take what is on enrollment

        var options = {
          url: apiConf.api.dhis2.url + "/api/enrollments/" + resp.enrollment,
          headers: {
            'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(enrollementValue),
        };

        winston.info('Updating enrollment ...')
        request.put(options, function (error, response, body) {
          if (error) {
            callback(error);
          } else {
            var ResponseBody = JSON.parse(body);
            if (utils.isFineValue(ResponseBody) == true) {
              if (ResponseBody.httpStatusCode == 200) {
                winston.info('Enrollment ', resp.enrollment, ' done with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                callback(null, resp.enrollment);
              } else {
                winston.error('An error occured when trying to update an Enrollment', ResponseBody.httpStatusCode, body.message)
                callback('An error occured when trying to update an Enrollment' + ResponseBody.message);
              }
            } else {
              callback('An error occured, the server returned an empty response when updating an Enrollment');
            }
          }
        });


      } else {
        // if received encounter have the right enrollmentDate and incidentDate , we replace
        //or we let like this

        var options = {
          url: apiConf.api.dhis2.url + "/api/enrollments",
          headers: {
            'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(enrollementValue),
        };

        winston.info('Creating enrollment ...')
        request.post(options, function (error, response, body) {
          if (error) {
            callback(error);
          } else {

            var ResponseBody = JSON.parse(body);
            if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
              if (ResponseBody.httpStatusCode == 200) {
                winston.info('Enrollment ', ResponseBody.response.importSummaries[0].reference, ' done with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                callback(null, ResponseBody.response.importSummaries[0].reference);
              } else {
                winston.error('An error occured when trying to create an enrollment ', ResponseBody.httpStatusCode, body.message)
                callback('An error occured when trying to create an enrollment ' + ResponseBody.message);

              }
            } else {
              callback('An error occured, the server returned an empty when creation an enrollment');
            }
          }
        });

      }


    }
  });
}


var addHivCaseBaseSurveillance = function (fields, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {

  //1- sending createNewEventStageInfoRecencyContact
  var recencyData = {
    "events": [
      {
        "program": "CYyICYiO5zo", 
        "orgUnit": organizationUnit,
        "eventDate": "yyyy-mm-dd", //Put the completion date of this form
        "status": "COMPLETED",
        "storedBy": "amza",
        "programStage": "r45yv7rwDEO",
        "enrollment": enrollmentId,
        "dataValues": [
          {
            "dataElement": formMatch.getForm1Value("SNcELOKJCTs",fields),
            "value": "" 
          },
          {
            "dataElement": formMatch.getForm1Value("K4l00GKVInN",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("W58gazENRqS",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("xHo7COhyMKM",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("KX4MrpcRuAb",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("GyqLOJRotuL",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("FsbargPR5hR",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("buRJTweOy6h",fields),
            "value": ""
          }
        ]
      }
    ]
  }


  //2- sending createNewEventStageInfoContacts
  winston.info('Adding contacts information...');


  var contactData = {
    "events": [
      {
        "program": "CYyICYiO5zo", 
        "orgUnit": organizationUnit,
        "eventDate": "yyyy-mm-dd", 
        "status": "COMPLETED",
        "storedBy": "amza",
        "programStage": "RtQV53iuq7z", 
        "enrollment": enrollmentId,
        "dataValues": [
          {
            "dataElement": formMatch.getForm1Value("CIh22FjXvOR",fields),
            "value": "" 
          },
          {
            "dataElement": formMatch.getForm1Value("m3pQUNk6AeL",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("Zxkghqkbn7p",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("scledbnTVVK",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("mfAyPSJA74t",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("iz0c8aW79QH",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("MgkDDuHQHeN",fields),
            "value": ""
          }
        ]
      }
    ]
  }

  //3- sending createNewEventStageResultContactNotif
  winston.info('Adding results of contacts notifications...');
  var notifData = {
    "events": [
      {
        "program": "CYyICYiO5zo", 
        "orgUnit": organizationUnit,
        "eventDate": "yyyy-mm-dd", 
        "status": "COMPLETED", 
        "storedBy": "amza",
        "programStage": "b9rxVAiJaxA",
        "enrollment": enrollmentId,
        "dataValues": [
          {
            "dataElement": formMatch.getForm1Value("VsEnL2R7crc",fields),
            "value": "" 
          },
          {
            "dataElement": formMatch.getForm1Value("VuZnWho10cr",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("SUL0FdHdNyq",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("y0Z5EVxKowc",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("iTx0txf0FVj",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("jJxPUCWKW1K",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("i5f4SA6TGRt",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("Y7RU4f1g49C",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("GE0hAdM6xMg",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("r3DvI1uxJM0",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("UXx7mkioReb",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("kVoTnMfXnyt",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("sCvxPIDQ66r",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("r1PVDg5nIGZ",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("OsZRlnXq7Qk",fields),
            "value": ""
          },
          {
            "dataElement": formMatch.getForm1Value("yRpn8oL0vxv",fields),
            "value": ""
          }
        ]
      }
    ]
  }




  var options = {
    url: apiConf.api.dhis2.url + "/api/events",
    headers: {
      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(recencyData),
  };

  winston.info('Adding Recency information and contact data event...');
  request.post(options, function (error, response, body) {
    if (error) {
      callback(error);
    } else {
      var ResponseBody = JSON.parse(body);



      if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
        if (ResponseBody.httpStatusCode == 200) {
          winston.info('Recency data event ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
          
          var options = {
            url: apiConf.api.dhis2.url + "/api/events",
            headers: {
              'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData),
          };

          winston.info('Adding Contacts data event...');
          request.post(options, function (error, response, body) {
            if (error) {
              callback(error);
            } else {
              var ResponseBody = JSON.parse(body);
        
              if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
                if (ResponseBody.httpStatusCode == 200) {
                  winston.info('Contacts data event ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                  
                  
                  
                  

               
                } else {
                  winston.error('An error occured when trying to create Contacts data event ', ResponseBody.httpStatusCode, body.message)
                  callback('An error occured when trying to create Contacts data event ' + ResponseBody.message);
                }
              } else {
                callback('An error occured, the server returned an empty when creation Contacts data event');
              }
            }
          });
          








        
        } else {
          winston.error('An error occured when trying to create recency data event ', ResponseBody.httpStatusCode, body.message)
          callback('An error occured when trying to create recency data event ' + ResponseBody.message);
        }
      } else {
        callback('An error occured, the server returned an empty when creation recency data event');
      }
    }
  });
};

var addHivCrfSection1 = function (fields, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //createNewEventStageEnrollmentInfo.json  


  callback(null, null);
};

var addHivCrfSection2 = function (fields, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //createNewEventStageFollowUpInfo.json 

  callback(null, null);
};


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
