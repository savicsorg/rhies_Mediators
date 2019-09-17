#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express');
const medUtils = require('openhim-mediator-utils');
const winston = require('winston');
const _ = require('underscore');



var request = require('request');

const utils = require('./utils');
const formMapping = require('./formMapping');

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
                      if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
                        addHivCaseBaseSurveillance(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            winston.error('error while adding ', fields.encounter.form.display.trim, ', error : ', error);
                          } else {
                            winston.info(fields.encounter.form.display.trim(), ' added with success');
                          }
                        })
                      }

                      if (fields.encounter.form.display.trim().toUpperCase() == apiConf.enrollmentForm.trim().toUpperCase()) {
                        addHivCrfSection1(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            winston.error('error while adding ', fields.encounter.form.display.trim, ', error : ', error);
                          } else {
                            winston.info(fields.encounter.form.display.trim(), ' added with success');
                          }
                        })
                      }

                      if (fields.encounter.form.display.trim().toUpperCase() == apiConf.followupForm.trim().toUpperCase()) {
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

                if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
                  // if received encounter have the right ISfxedlVq7Y (start of ARV) , we replace
                  // or we take what is on resp.trackedEntityInstance
                  formMapping.getValue(formMapping.form1MappingTable, fields, "ISfxedlVq7Y", function (result) {
                    if (utils.isFineValue(result) == true) {
                      patientInstance.attributes[1].value = result;
                    } else {
                      patientInstance.attributes[1].value = resp.attributes[1].value;
                    }

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
                        var ResponseBody = JSON.parse(body);
                        if (utils.isFineValue(ResponseBody) == true) {
                          if (ResponseBody.httpStatusCode == 200) {
                            winston.info('Entity instance ', resp.trackedEntityInstance, ' updated with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                            callback(null, resp.trackedEntityInstance);
                          } else {
                            if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true) {
                              callback("An error occured when trying to update an entity instance", ResponseBody.response.importSummaries[0].conflicts);
                            } else {
                              winston.error('An error occured when trying to update an entity instance ', ResponseBody.httpStatusCode, body.message)
                              callback('An error occured when trying to update an entity instance ' + ResponseBody.message);
                            }
                          }
                        } else {
                          callback('An error occured, the server returned an empty response when updating an entity instance');
                        }
                      }
                    });

                  });
                }
              } else {
                //No tracked entity instance found, creating...

                if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
                  // if received encounter have the right (start of ARV), we replace
                  // or we let like this
                  formMapping.getValue(formMapping.form1MappingTable, fields, "ISfxedlVq7Y", function (result) {
                    if (utils.isFineValue(result) == true) {
                      patientInstance.attributes[1].value = result;
                    }

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
                        var ResponseBody = JSON.parse(body);

                        if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
                          if (ResponseBody.httpStatusCode == 200) {
                            winston.info('Entity instance ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                            callback(null, ResponseBody.response.importSummaries[0].reference);
                          } else {
                            if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true) {
                              callback("An error occured when trying to create an entity instance", ResponseBody.response.importSummaries[0].conflicts);
                            } else {
                              winston.error('An error occured when trying to create an entity instance ', ResponseBody.httpStatusCode, body.message)
                              callback('An error occured when trying to create an entity instance ' + ResponseBody.message);
                            }
                          }
                        } else {
                          callback('An error occured, the server returned an empty body when creating an entity instance');
                        }
                      }
                    });
                  });
                }
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

        if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
          // if received encounter have the right ISfxedlVq7Y (start of ARV) , we replace
          // or we take what is on resp.trackedEntityInstance
          formMapping.getValue(formMapping.form1MappingTable, fields, "ijTurgFUOPq", function (result) {

            if (utils.isFineValue(result) == true) {
              enrollementValue.enrollmentDate = result;
            } else {
              enrollementValue.enrollmentDate = resp.enrollmentDate;
            }


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
                    if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true) {
                      callback("An error occured when trying to update an Enrollment", ResponseBody.response.importSummaries[0].conflicts);
                    } else {
                      winston.error('An error occured when trying to update an Enrollment ', ResponseBody.httpStatusCode, body.message)
                      callback('An error occured when trying to update an Enrollment ' + ResponseBody.message);
                    }
                  }
                } else {
                  callback('An error occured, the server returned an empty response when updating an Enrollment');
                }
              }
            });
          });
        }
      } else {
        if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
          // if received encounter have the right enrollmentDate and incidentDate , we replace
          //or we let like this
          formMapping.getValue(formMapping.form1MappingTable, fields, "ijTurgFUOPq", function (result) {
            if (utils.isFineValue(result) == true) {
              enrollementValue.enrollmentDate = result;
            }

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
                    
                    if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true) {
                      callback("An error occured when trying to create an enrollment ", ResponseBody.response.importSummaries[0].conflicts);
                    } else {
                      winston.error('An error occured when trying to create an enrollment ', ResponseBody.httpStatusCode, body.message)
                      callback('An error occured when trying to create an enrollment ' + ResponseBody.message);
                    }
                  }
                } else {
                  callback('An error occured, the server returned an empty body when creating an enrollment');
                }
              }
            });
          });
        }
      }
    }
  });
}


var addHivCaseBaseSurveillance = function (incomingEncounter, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //1- sending createNewEventStageInfoRecencyContact
  var dhsi2RecencyData = {
    "program": "CYyICYiO5zo",
    "orgUnit": organizationUnit,
    "eventDate": utils.getNewDate(),
    "status": "COMPLETED",
    "storedBy": "Savics",
    "programStage": "r45yv7rwDEO",
    "trackedEntityInstance": trackedEntityInstanceId,
    "enrollment": enrollmentId,
    "dataValues": [
      {
        "dataElement": "SNcELOKJCTs",
        "value": ""
      },
      {
        "dataElement": "K4l00GKVInN",
        "value": ""
      },
      {
        "dataElement": "W58gazENRqS",
        "value": ""
      },
      {
        "dataElement": "xHo7COhyMKM",
        "value": ""
      },
      {
        "dataElement": "KX4MrpcRuAb",
        "value": ""
      },
      {
        "dataElement": "GyqLOJRotuL",
        "value": ""
      },
      {
        "dataElement": "FsbargPR5hR",
        "value": ""
      },
      {
        "dataElement": "buRJTweOy6h",
        "value": ""
      }
    ]
  }



  //2- sending createNewEventStageInfoContacts
  var dhsi2ContactData =
  {
    "program": "CYyICYiO5zo",
    "orgUnit": organizationUnit,
    "eventDate": utils.getNewDate(),
    "status": "COMPLETED",
    "storedBy": "amza",
    "programStage": "RtQV53iuq7z",
    "trackedEntityInstance": trackedEntityInstanceId,
    "enrollment": enrollmentId,
    "dataValues": [
      {
        "dataElement": "CIh22FjXvOR",
        "value": ""
      },
      {
        "dataElement": "m3pQUNk6AeL",
        "value": ""
      },
      {
        "dataElement": "Zxkghqkbn7p",
        "value": ""
      },
      {
        "dataElement": "scledbnTVVK",
        "value": ""
      },
      {
        "dataElement": "mfAyPSJA74t",
        "value": ""
      },
      {
        "dataElement": "iz0c8aW79QH",
        "value": ""
      },
      {
        "dataElement": "MgkDDuHQHeN",
        "value": ""
      }
    ]
  }



  //3- sending createNewEventStageResultContactNotif
  var dhsi2NotifData =
  {
    "program": "CYyICYiO5zo",
    "orgUnit": organizationUnit,
    "eventDate": utils.getNewDate(),
    "status": "COMPLETED",
    "storedBy": "Savics",
    "programStage": "b9rxVAiJaxA",
    "trackedEntityInstance": trackedEntityInstanceId,
    "enrollment": enrollmentId,
    "dataValues": [
      {
        "dataElement": "VsEnL2R7crc",
        "value": ""
      },
      {
        "dataElement": "VuZnWho10cr",
        "value": ""
      },
      {
        "dataElement": "SUL0FdHdNyq",
        "value": ""
      },
      {
        "dataElement": "y0Z5EVxKowc",
        "value": ""
      },
      {
        "dataElement": "iTx0txf0FVj",
        "value": ""
      },
      {
        "dataElement": "jJxPUCWKW1K",
        "value": ""
      },
      {
        "dataElement": "i5f4SA6TGRt",
        "value": ""
      },
      {
        "dataElement": "Y7RU4f1g49C",
        "value": ""
      },
      {
        "dataElement": "GE0hAdM6xMg",
        "value": ""
      },
      {
        "dataElement": "r3DvI1uxJM0",
        "value": ""
      },
      {
        "dataElement": "UXx7mkioReb",
        "value": ""
      },
      {
        "dataElement": "kVoTnMfXnyt",
        "value": ""
      },
      {
        "dataElement": "sCvxPIDQ66r",
        "value": ""
      },
      {
        "dataElement": "r1PVDg5nIGZ",
        "value": ""
      },
      {
        "dataElement": "OsZRlnXq7Qk",
        "value": ""
      },
      {
        "dataElement": "yRpn8oL0vxv",
        "value": ""
      }
    ]
  }


  winston.info('Adding recency contact information ...');
  formMapping.pushFormToDhis2(formMapping.form1MappingTable, incomingEncounter, dhsi2RecencyData, function (error, result) {
    if (error) {
      winston.error('An error occured when trying to add a recency contact information ', error);
    } else {
      winston.info('Recency contact information added with success ', result);
    }
  })

  winston.info('Adding contacts information...');
  formMapping.pushFormToDhis2(formMapping.form1MappingTable, incomingEncounter, dhsi2ContactData, function (error, result) {
    if (error) {
      winston.error('An error occured when trying to add a contacts information ', error);
    } else {
      winston.info('Contacts information added with success ', result);
    }
  })

  winston.info('Adding results of contacts notifications...');
  formMapping.pushFormToDhis2(formMapping.form1MappingTable, incomingEncounter, dhsi2NotifData, function (error, result) {
    if (error) {
      winston.error('An error occured when trying to add a results of contacts notifications ', error);
    } else {
      winston.info('Results of contacts notifications added with success ', result);
    }
  })

};

var addHivCrfSection1 = function (fields, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //createNewEventStageEnrollmentInfo.json  
  var enrollementData =
  {
    "program": "CYyICYiO5zo",
    "orgUnit": organizationUnit,
    "eventDate": utils.getNewDate(),
    "status": "COMPLETED",
    "storedBy": "Savics",
    "programStage": "pBAeqPjnhdF",
    "trackedEntityInstance": trackedEntityInstanceId,
    "enrollment": enrollmentId,
    "dataValues": [
      {
        "dataElement": "pbeBAIly2GT",
        "value": ""
      },
      {
        "dataElement": "qycXEyMMFMb",
        "value": ""
      },
      {
        "dataElement": "txsxKp2l6y9",
        "value": ""
      },
      {
        "dataElement": "oLqMrGMI4Uf",
        "value": ""
      },
      {
        "dataElement": "I809QdRlgCb",
        "value": ""
      },
      {
        "dataElement": "tnMNaBmQaIy",
        "value": ""
      },
      {
        "dataElement": "wXcnNSYryUd",
        "value": ""
      },
      {
        "dataElement": "aYhoeOchJYM",
        "value": ""
      },
      {
        "dataElement": "GwCiJLY0of4",
        "value": ""
      },
      {
        "dataElement": "c4KsTiEImGx",
        "value": ""
      },
      {
        "dataElement": "qsCPZIJLpYo",
        "value": ""
      },
      {
        "dataElement": "ZvH6DY75uR1",
        "value": ""
      },
      {
        "dataElement": "p5U0vUS0Q3V",
        "value": ""
      },
      {
        "dataElement": "I79uRgVEyUc",
        "value": ""
      },
      {
        "dataElement": "UaCDJMTQRLz",
        "value": ""
      },
      {
        "dataElement": "kPkjR4qEhhn",
        "value": ""
      },
      {
        "dataElement": "PZo2sP0TOb6",
        "value": ""
      },
      {
        "dataElement": "NrWXvZg3WtW",
        "value": ""
      },
      {
        "dataElement": "Cgt39EInKQV",
        "value": ""
      },
      {
        "dataElement": "SzvTcCTNlGo",
        "value": ""
      },
      {
        "dataElement": "G0Jq8kyaJCD",
        "value": ""
      },
      {
        "dataElement": "xHo7COhyMKM",
        "value": ""
      },
      {
        "dataElement": "MyMV3TTWYmW",
        "value": ""
      },
      {
        "dataElement": "SNAaIVKCh78",
        "value": ""
      },
      {
        "dataElement": "eUVdYRa8qUo",
        "value": ""
      },
      {
        "dataElement": "KY4a5xCSKgT",
        "value": ""
      },
      {
        "dataElement": "VQPCeakHIpV",
        "value": ""
      },
      {
        "dataElement": "NFOu3OCGMKl",
        "value": ""
      },
      {
        "dataElement": "NZe43UAOGmt",
        "value": ""
      },
      {
        "dataElement": "ccYYcYf78sz",
        "value": ""
      },
      {
        "dataElement": "Ba8VCAO9Nqi",
        "value": ""
      },
      {
        "dataElement": "yu2bxd3xVIg",
        "value": ""
      },
      {
        "dataElement": "ptZMCKSxvU8",
        "value": ""
      },
      {
        "dataElement": "qBYsHDuUBIv",
        "value": ""
      },
      {
        "dataElement": "nMJKcTFHGj0",
        "value": ""
      },
      {
        "dataElement": "qBYsHDuUBIv",
        "value": ""
      },
      {
        "dataElement": "DDHl9CtiqaC",
        "value": ""
      },
      {
        "dataElement": "RDQB5Zx8hMH",
        "value": ""
      },
      {
        "dataElement": "ocgzZ6BdT8W",
        "value": ""
      },
      {
        "dataElement": "ZodoxM8PakE",
        "value": ""
      },
      {
        "dataElement": "ERqqYuUtigv",
        "value": ""
      },
      {
        "dataElement": "kJIuYQpa9Lc",
        "value": ""
      },
      {
        "dataElement": "ivqLch0DMXv",
        "value": ""
      },
      {
        "dataElement": "gNjou1Bq6dz",
        "value": ""
      },
      {
        "dataElement": "jYMNto3ELj5",
        "value": ""
      },
      {
        "dataElement": "mKVpD68KeIO",
        "value": ""
      },
      {
        "dataElement": "ISfxedlVq7Y",
        "value": ""
      },
      {
        "dataElement": "jmwJSKQthb7",
        "value": ""
      },
      {
        "dataElement": "UYuVIHot43a",
        "value": ""
      },
      {
        "dataElement": "cE0JLRDspz9",
        "value": ""
      },
      {
        "dataElement": "MWnDK640C17",
        "value": ""
      },
      {
        "dataElement": "MG6I5RT8YsE",
        "value": ""
      },
      {
        "dataElement": "Qx0v2TzHlS0",
        "value": ""
      },
      {
        "dataElement": "qywtB6np899",
        "value": ""
      },
      {
        "dataElement": "nkRWZpUQ55g",
        "value": ""
      },
      {
        "dataElement": "Tgt3yKYd2oD",
        "value": ""
      },
      {
        "dataElement": "LovSZ5zd8YL",
        "value": ""
      },
      {
        "dataElement": "ePONK5dlCAl",
        "value": ""
      },
      {
        "dataElement": "G3dUs7PuDqx",
        "value": ""
      },
      {
        "dataElement": "OKemd50jbHG",
        "value": ""
      }
    ]
  }


  var options = {
    url: apiConf.api.dhis2.url + "/api/events",
    headers: {
      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(enrollementData),
  };

  winston.info('Adding enrollment data event...');
  request.post(options, function (error, response, body) {
    if (error) {
      callback(error);
    } else {
      var ResponseBody = JSON.parse(body);
      if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
        if (ResponseBody.httpStatusCode == 200) {
          winston.info('enrollment data event ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
          callback(null, 'enrollment data event ', ResponseBody.response.importSummaries[0].reference, ' created with success ')
        } else {
          winston.error('An error occured when trying to create enrollment data event ', ResponseBody.httpStatusCode, body.message)
          callback('An error occured when trying to create enrollment data event ' + ResponseBody.message);
        }
      } else {
        callback('An error occured, the server returned an empty body when creating enrollment data event');
      }
    }
  });

};

var addHivCrfSection2 = function (fields, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //createNewEventStageFollowUpInfo.json 
  var followupData =
  {
    "program": "CYyICYiO5zo",
    "orgUnit": organizationUnit,
    "eventDate": utils.getNewDate(),
    "status": "COMPLETED",
    "storedBy": "Savics",
    "programStage": "Em0sRsnHjoR",
    "trackedEntityInstance": trackedEntityInstanceId,
    "enrollment": enrollmentId,
    "dataValues": [
      {
        "dataElement": "pbeBAIly2GT",
        "value": ""
      },
      {
        "dataElement": "txsxKp2l6y9",
        "value": ""
      },
      {
        "dataElement": "oLqMrGMI4Uf",
        "value": ""
      },
      {
        "dataElement": "I809QdRlgCb",
        "value": ""
      },
      {
        "dataElement": "tnMNaBmQaIy",
        "value": ""
      },
      {
        "dataElement": "wXcnNSYryUd",
        "value": ""
      },
      {
        "dataElement": "OCZt4UJitnh",
        "value": ""
      },
      {
        "dataElement": "yu67Iiw64UQ",
        "value": ""
      },
      {
        "dataElement": "p5U0vUS0Q3V",
        "value": ""
      },
      {
        "dataElement": "I79uRgVEyUc",
        "value": ""
      },
      {
        "dataElement": "UaCDJMTQRLz",
        "value": ""
      },
      {
        "dataElement": "kPkjR4qEhhn",
        "value": ""
      },
      {
        "dataElement": "OTAM6B4xZwf",
        "value": ""
      },
      {
        "dataElement": "Cgt39EInKQV",
        "value": ""
      },
      {
        "dataElement": "KrYJW9kvJS2",
        "value": ""
      },
      {
        "dataElement": "Nld1zMZwPxK",
        "value": ""
      },
      {
        "dataElement": "jYMNto3ELj5",
        "value": ""
      },
      {
        "dataElement": "jmwJSKQthb7",
        "value": ""
      },
      {
        "dataElement": "xMLGFpVb0Kh",
        "value": ""
      },
      {
        "dataElement": "KRTWX8CatfN",
        "value": ""
      },
      {
        "dataElement": "Nxu3IZxrngL",
        "value": ""
      },
      {
        "dataElement": "gZLYfulH1cx",
        "value": ""
      },
      {
        "dataElement": "dlbRyDDWVdz",
        "value": ""
      },
      {
        "dataElement": "MWnDK640C17",
        "value": ""
      },
      {
        "dataElement": "MG6I5RT8YsE",
        "value": ""
      },
      {
        "dataElement": "Tgt3yKYd2oD",
        "value": ""
      },
      {
        "dataElement": "LovSZ5zd8YL",
        "value": ""
      },
      {
        "dataElement": "ePONK5dlCAl",
        "value": ""
      },
      {
        "dataElement": "G3dUs7PuDqx",
        "value": ""
      },
      {
        "dataElement": "OKemd50jbHG",
        "value": ""
      },
      {
        "dataElement": "lrM4jhiDogd",
        "value": ""
      },
      {
        "dataElement": "kmA8X0Qwjor",
        "value": ""
      },
      {
        "dataElement": "L9lcjEkxHBv",
        "value": ""
      },
      {
        "dataElement": "eCbwnVkQ8Rt",
        "value": ""
      },
      {
        "dataElement": "OO8wNkgpAwK",
        "value": ""
      },
      {
        "dataElement": "BMf4geBAMFU",
        "value": ""
      },
      {
        "dataElement": "LpDBQwhUZ4U",
        "value": ""
      },
      {
        "dataElement": "yH3otrjN0qZ",
        "value": ""
      },
      {
        "dataElement": "EBAuC7pMu4O",
        "value": ""
      },
      {
        "dataElement": "nQGHwHA3ayC",
        "value": ""
      }

    ]
  }



  var options = {
    url: apiConf.api.dhis2.url + "/api/events",
    headers: {
      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(followupData),
  };

  winston.info('Adding followup data event...');
  request.post(options, function (error, response, body) {
    if (error) {
      callback(error);
    } else {
      var ResponseBody = JSON.parse(body);
      if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
        if (ResponseBody.httpStatusCode == 200) {
          winston.info('followup data event ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
          callback(null, 'followup data event ', ResponseBody.response.importSummaries[0].reference, ' created with success ')
        } else {
          winston.error('An error occured when trying to create followup data event ', ResponseBody.httpStatusCode, body.message)
          callback('An error occured when trying to create followup data event ' + ResponseBody.message);
        }
      } else {
        callback('An error occured, the server returned an empty body when creating followup data event');
      }
    }
  });

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
