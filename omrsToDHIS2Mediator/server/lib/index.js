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

  function reportEndOfProcess(req, res, error, statusCode, message) {
    res.set('Content-Type', 'application/json+openhim')
    var responseBody = message;
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

        winston.info('Encounter received ...')

        if (apiConf.verbose == true) {
          if (utils.isFineValue(fields) == true && utils.isFineValue(fields.encounter) == true && utils.isFineValue(fields.encounter.obs) == true) {
            console.log("--> Received encounter obs: ", JSON.stringify(fields.encounter.obs));
          } else {
            if (utils.isFineValue(fields) == true && utils.isFineValue(fields.encounter) == true) {
              console.log("--> Received encounter: ", JSON.stringify(fields.encounter));
            } else {
              console.log("--> Received data: ", JSON.stringify(fields));
            }
          }
        }

        if (apiConf.verbose == true) {
          console.log("--> Patient: ", JSON.stringify(fields.patient));
        }

        //get DHIS2 Lab id with FOSA code
        getOrganizationUnit(fields, function (error, organizationUnit) {
          if (error) {
            reportEndOfProcess(req, res, error, 500, 'error while retrieving for organization unit ...');
          } else {
            //Create or update entity instance
            upsertEntity(fields, organizationUnit, function (error, trackedEntityInstanceId) {
              if (error) {
                reportEndOfProcess(req, res, error, 500, 'error while upserting entity instance id ...');
              } else {
                //Enroll entity instance
                enrolleEntity(fields, organizationUnit, trackedEntityInstanceId, function (error, enrollmentId) {
                  if (error) {
                    reportEndOfProcess(req, res, error, 500, 'error while enrolling entity instance id ');
                  } else {
                    //send incoming form
                    if (utils.isFineValue(fields.encounter.form) == true && utils.isFineValue(fields.encounter.form.display) == true) {
                      winston.info('Adding a new ', fields.encounter.form.display.trim());
                      if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
                        addHivCaseBaseSurveillance(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            reportEndOfProcess(req, res, error, 500, 'error while adding ' + fields.encounter.form.display.trim());
                          } else {
                            reportEndOfProcess(req, res, null, 200, fields.encounter.form.display.trim() + ' added with success');
                          }
                        })
                      }

                      if (fields.encounter.form.display.trim().toUpperCase() == apiConf.enrollmentForm.trim().toUpperCase()) {
                        addHivCrfSection1(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            reportEndOfProcess(req, res, error, 500, 'error while adding ' + fields.encounter.form.display.trim());
                          } else {
                            reportEndOfProcess(req, res, null, 200, fields.encounter.form.display.trim() + ' added with success');
                          }
                        })
                      }

                      if (fields.encounter.form.display.trim().toUpperCase() == apiConf.followupForm.trim().toUpperCase()) {
                        addHivCrfSection2(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            reportEndOfProcess(req, res, error, 500, 'error while adding ' + fields.encounter.form.display.trim());
                          } else {
                            reportEndOfProcess(req, res, null, 200, fields.encounter.form.display.trim() + ' added with success');
                          }
                        })
                      }

                      if (fields.encounter.form.display.trim().toUpperCase() == apiConf.recencyVLForm.trim().toUpperCase()) {
                        addRecencyVL(fields, organizationUnit, trackedEntityInstanceId, enrollmentId, function (error, resp) {
                          if (error) {
                            reportEndOfProcess(req, res, error, 500, 'error while adding ' + fields.encounter.form.display.trim());
                          } else {
                            reportEndOfProcess(req, res, null, 200, fields.encounter.form.display.trim() + ' added with success');
                          }
                        })
                      }

                    } else {
                      reportEndOfProcess(req, res, " ", 500, 'It is not possible to get the incoming form with the data received from OpenMRS');
                    }
                  }
                })
              }
            });
          }
        });
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
                  formMapping.getValue(formMapping.form1MappingTable, fields, null, "ISfxedlVq7Y", function (result) {


                    if (utils.isFineValue(result) == true) {
                      patientInstance.attributes.ISfxedlVq7Y = result;
                    } else {
                      patientInstance.attributes.ISfxedlVq7Y = resp.attributes.ISfxedlVq7Y;
                    }

                    var options = {
                      url: apiConf.api.dhis2.url + "/api/trackedEntityInstances/" + resp.trackedEntityInstance,
                      headers: {
                        'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(patientInstance),
                    };

                    winston.info('1- Updating Entity instance ...')
                    request.put(options, function (error, response, body) {
                      if (error) {
                        callback(error);
                      } else {
                        var ResponseBody = JSON.parse(body);
                        if (utils.isFineValue(ResponseBody) == true) {
                          if (ResponseBody.httpStatusCode == 200) {
                            winston.info('1- Entity instance ', resp.trackedEntityInstance, ' updated with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                            callback(null, resp.trackedEntityInstance);
                          } else {
                            if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
                              callback("1- An error occured when trying to update an entity instance", ResponseBody.response.importSummaries[0].conflicts);
                            } else {
                              winston.error('1- An error occured when trying to update an entity instance ', ResponseBody.httpStatusCode, body.message)
                              callback('1- An error occured when trying to update an entity instance ' + ResponseBody.message);
                            }
                          }
                        } else {
                          callback('1- An error occured, the server returned an empty response when updating an entity instance');
                        }
                      }
                    });

                  });
                } else {

                  //update a patient without updating the date of ARV
                  patientInstance.attributes.ISfxedlVq7Y = resp.attributes.ISfxedlVq7Y;

                  var options = {
                    url: apiConf.api.dhis2.url + "/api/trackedEntityInstances/" + resp.trackedEntityInstance,
                    headers: {
                      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(patientInstance),
                  };

                  winston.info('2- Updating Entity instance ...')
                  request.put(options, function (error, response, body) {
                    if (error) {
                      callback(error);
                    } else {
                      var ResponseBody = JSON.parse(body);
                      if (utils.isFineValue(ResponseBody) == true) {
                        if (ResponseBody.httpStatusCode == 200) {
                          winston.info('2- Entity instance ', resp.trackedEntityInstance, ' updated with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                          callback(null, resp.trackedEntityInstance);
                        } else {
                          if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
                            callback("2- An error occured when trying to update an entity instance", ResponseBody.response.importSummaries[0].conflicts);
                          } else {
                            winston.error('2- An error occured when trying to update an entity instance ', ResponseBody.httpStatusCode, body.message)
                            callback('2- An error occured when trying to update an entity instance ' + ResponseBody.message);
                          }
                        }
                      } else {
                        callback('2- An error occured, the server returned an empty response when updating an entity instance');
                      }
                    }
                  });

                }

              } else {

                //No tracked entity instance found, creating...
                if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
                  // if received encounter have the right (start of ARV), we replace
                  // or we let like this
                  formMapping.getValue(formMapping.form1MappingTable, fields, null, "ISfxedlVq7Y", function (result) {
                    if (utils.isFineValue(result) == true) {
                      patientInstance.attributes.ISfxedlVq7Y = result;
                    }

                    var options = {
                      url: apiConf.api.dhis2.url + "/api/trackedEntityInstances",
                      headers: {
                        'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(patientInstance),
                    };

                    winston.info('1- Creating Entity instance ...')
                    request.post(options, function (error, response, body) {
                      if (error) {
                        callback(error);
                      } else {
                        var ResponseBody = JSON.parse(body);

                        if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
                          if (ResponseBody.httpStatusCode == 200) {
                            winston.info('1- Entity instance ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                            callback(null, ResponseBody.response.importSummaries[0].reference);
                          } else {
                            if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
                              callback("1- An error occured when trying to create an entity instance", ResponseBody.response.importSummaries[0].conflicts);
                            } else {
                              winston.error('An error occured when trying to create an entity instance ', ResponseBody.httpStatusCode, body.message)
                              callback('1- An error occured when trying to create an entity instance ' + ResponseBody.message);
                            }
                          }
                        } else {
                          callback('1- An error occured, the server returned an empty body when creating an entity instance');
                        }
                      }
                    });
                  });


                } else {


                  var options = {
                    url: apiConf.api.dhis2.url + "/api/trackedEntityInstances",
                    headers: {
                      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(patientInstance),
                  };

                  winston.info('2- Creating Entity instance ...')
                  request.post(options, function (error, response, body) {
                    if (error) {
                      callback(error);
                    } else {
                      var ResponseBody = JSON.parse(body);

                      if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
                        if (ResponseBody.httpStatusCode == 200) {
                          winston.info('2- Entity instance ', ResponseBody.response.importSummaries[0].reference, ' created with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                          callback(null, ResponseBody.response.importSummaries[0].reference);
                        } else {
                          if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
                            callback("2- An error occured when trying to create an entity instance", ResponseBody.response.importSummaries[0].conflicts);
                          } else {
                            winston.error('2- An error occured when trying to create an entity instance ', ResponseBody.httpStatusCode, body.message)
                            callback('2- An error occured when trying to create an entity instance ' + ResponseBody.message);
                          }
                        }
                      } else {
                        callback('2- An error occured, the server returned an empty body when creating an entity instance');
                      }
                    }
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
      console.log(fields.location.description);
      console.log(fields.location.description.split(":")[1].trim());
      console.log(fields.location.description.split(":")[1].trim().split(" ")[0].trim());
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
          // if received encounter have the right ijTurgFUOPq (start of ARV) , we replace
          // or we take what is on resp.trackedEntityInstance
          formMapping.getValue(formMapping.form1MappingTable, fields, null, "ijTurgFUOPq", function (result) {

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
                    if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
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
        } else {

          enrollementValue.enrollmentDate = resp.enrollmentDate;
          var options = {
            url: apiConf.api.dhis2.url + "/api/enrollments/" + resp.enrollment,
            headers: {
              'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(enrollementValue),
          };

          winston.info('1- Updating enrollment ...')
          request.put(options, function (error, response, body) {
            if (error) {
              callback(error);
            } else {
              var ResponseBody = JSON.parse(body);
              if (utils.isFineValue(ResponseBody) == true) {
                if (ResponseBody.httpStatusCode == 200) {
                  winston.info('1- Enrollment ', resp.enrollment, ' done with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                  callback(null, resp.enrollment);
                } else {
                  if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
                    callback("1- An error occured when trying to update an Enrollment", ResponseBody.response.importSummaries[0].conflicts);
                  } else {
                    winston.error('1- An error occured when trying to update an Enrollment ', ResponseBody.httpStatusCode, body.message)
                    callback('1- An error occured when trying to update an Enrollment ' + ResponseBody.message);
                  }
                }
              } else {
                callback('1- An error occured, the server returned an empty response when updating an Enrollment');
              }
            }
          });

        }
      } else {
        if (fields.encounter.form.display.trim().toUpperCase() == apiConf.CaseBaseForme.trim().toUpperCase()) {
          // if received encounter have the right enrollmentDate and incidentDate , we replace
          //or we let like this
          formMapping.getValue(formMapping.form1MappingTable, fields, null, "ijTurgFUOPq", function (result) {
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

                    if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
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
        } else {


          var options = {
            url: apiConf.api.dhis2.url + "/api/enrollments",
            headers: {
              'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(enrollementValue),
          };

          winston.info('2- Creating enrollment ...')
          request.post(options, function (error, response, body) {
            if (error) {
              callback(error);
            } else {

              var ResponseBody = JSON.parse(body);
              if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.httpStatusCode) == true) {
                if (ResponseBody.httpStatusCode == 200) {
                  winston.info('2- Enrollment ', ResponseBody.response.importSummaries[0].reference, ' done with success ', ResponseBody.httpStatusCode, ResponseBody.message)
                  callback(null, ResponseBody.response.importSummaries[0].reference);
                } else {
                  if (utils.isFineValue(ResponseBody) == true && utils.isFineValue(ResponseBody.response) == true && utils.isFineValue(ResponseBody.response.importSummaries) == true) {
                    callback("2- An error occured when trying to create an enrollment ", ResponseBody.response.importSummaries[0].conflicts);
                  } else {
                    winston.error('2- An error occured when trying to create an enrollment ', ResponseBody.httpStatusCode, body.message)
                    callback('2- An error occured when trying to create an enrollment ' + ResponseBody.message);
                  }
                }
              } else {
                callback('2- An error occured, the server returned an empty body when creating an enrollment');
              }
            }
          });



        }
      }
    }
  });
}


var addHivCaseBaseSurveillance = function (incomingEncounter, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //Declaration of all the variables for DHIS2 dropdown
  var omrsRecencyAssayResultValue = "";
  var omrsRelationOfContactValue = "";
  var omrsContactHivStatusValue = "";
  var omrsRiskOfViolenceValue = "";
  var omrsPlannedReferenceTypeValue = "";
  var omrsContactInvitedValue = "";
  var omrsContactReceivedValue = "";
  var omrsReasonContactNotReceivedValue = "";
  var omrsContactNotifierValue = "";
  var omrsNotificationApproachValue = "";
  var omrsContactTestedValue = "";
  var omrsReasonContactNotTestedValue = ""; //This one must be modified in OpenMRS to dropdown, because it's free text
  var omrsContactHivResultValue = "";
  var omrsUntestedContactGivenTestKitValue = "";


  //Retrieve the UUID for each dropdown concept from OpenMRS
  //Begining of UUID retrieving 
  var omrsRecencyAssayResult = utils.getConceptValue(incomingEncounter.encounter.obs, "b4b0e241-e41a-4d46-89dd-e531cf6d8202");
  if (utils.isFineValue(omrsRecencyAssayResult) == true && utils.isFineValue(omrsRecencyAssayResult.name) == true && utils.isFineValue(omrsRecencyAssayResult.name.name) == true) {
    omrsRecencyAssayResult = omrsRecencyAssayResult.uuid;
  } else {
    omrsRecencyAssayResult = "";
  }

  var omrsRelationOfContact = utils.getConceptValue(incomingEncounter.encounter.obs, "d4a45c62-5d82-43a2-856d-6c75db9fe842");
  if (utils.isFineValue(omrsRelationOfContact) == true && utils.isFineValue(omrsRelationOfContact.name) == true && utils.isFineValue(omrsRelationOfContact.name.name) == true) {
    omrsRelationOfContact = omrsRelationOfContact.uuid;
  } else {
    omrsRelationOfContact = "";
  }

  var omrsContactHivStatus = utils.getConceptValue(incomingEncounter.encounter.obs, "438e1ee2-5642-4868-867d-960eca6e6451");
  if (utils.isFineValue(omrsContactHivStatus) == true && utils.isFineValue(omrsContactHivStatus.name) == true && utils.isFineValue(omrsContactHivStatus.name.name) == true) {
    omrsContactHivStatus = omrsContactHivStatus.uuid;
  } else {
    omrsContactHivStatus = "";
  }

  var omrsRiskOfViolence = utils.getConceptValue(incomingEncounter.encounter.obs, "5d90078d-43d5-4ea1-9bf6-cda5398d1d67");
  if (utils.isFineValue(omrsRiskOfViolence) == true && utils.isFineValue(omrsRiskOfViolence.name) == true && utils.isFineValue(omrsRiskOfViolence.name.name) == true) {
    omrsRiskOfViolence = omrsRiskOfViolence.uuid;
  } else {
    omrsRiskOfViolence = "";
  }

  var omrsPlannedReferenceType = utils.getConceptValue(incomingEncounter.encounter.obs, "d300cfbb-c771-44db-8272-7065efc88242");
  if (utils.isFineValue(omrsPlannedReferenceType) == true && utils.isFineValue(omrsPlannedReferenceType.name) == true && utils.isFineValue(omrsPlannedReferenceType.name.name) == true) {
    omrsPlannedReferenceType = omrsPlannedReferenceType.uuid;
  } else {
    omrsPlannedReferenceType = "";
  }

  var omrsContactInvited = utils.getConceptValue(incomingEncounter.encounter.obs, "0b888b3c-df20-467c-9be9-0e68b779a97d");
  if (utils.isFineValue(omrsContactInvited) == true && utils.isFineValue(omrsContactInvited.name) == true && utils.isFineValue(omrsContactInvited.name.name) == true) {
    omrsContactInvited = omrsContactInvited.uuid;
  } else {
    omrsContactInvited = "";
  }

  var omrsContactReceived = utils.getConceptValue(incomingEncounter.encounter.obs, "cceda879-286d-4dca-8ea8-1168f217fd1c");
  if (utils.isFineValue(omrsContactReceived) == true && utils.isFineValue(omrsContactReceived.name) == true && utils.isFineValue(omrsContactReceived.name.name) == true) {
    omrsContactReceived = omrsContactReceived.uuid;
  } else {
    omrsContactReceived = "";
  }

  var omrsReasonContactNotReceived = utils.getConceptValue(incomingEncounter.encounter.obs, "0d52c378-adeb-4c89-a977-1f6cc4a7e9e4");
  if (utils.isFineValue(omrsReasonContactNotReceived) == true && utils.isFineValue(omrsReasonContactNotReceived.name) == true && utils.isFineValue(omrsReasonContactNotReceived.name.name) == true) {
    omrsReasonContactNotReceived = omrsReasonContactNotReceived.uuid;
  } else {
    omrsReasonContactNotReceived = "";
  }

  var omrsContactNotifier = utils.getConceptValue(incomingEncounter.encounter.obs, "e7664ff5-a8ab-47a2-bc29-4470636a5634");
  if (utils.isFineValue(omrsContactNotifier) == true && utils.isFineValue(omrsContactNotifier.name) == true && utils.isFineValue(omrsContactNotifier.name.name) == true) {
    omrsContactNotifier = omrsContactNotifier.uuid;
  } else {
    omrsContactNotifier = "";
  }

  var omrsNotificationApproach = utils.getConceptValue(incomingEncounter.encounter.obs, "80530ec0-b820-4fe8-9d12-9d1f6476b0bf");
  if (utils.isFineValue(omrsNotificationApproach) == true && utils.isFineValue(omrsNotificationApproach.name) == true && utils.isFineValue(omrsNotificationApproach.name.name) == true) {
    omrsNotificationApproach = omrsNotificationApproach.uuid;
  } else {
    omrsNotificationApproach = "";
  }

  var omrsContactTested = utils.getConceptValue(incomingEncounter.encounter.obs, "5ba1d72e-8a77-4ad3-824e-19006bbf05e7");
  if (utils.isFineValue(omrsContactTested) == true && utils.isFineValue(omrsContactTested.name) == true && utils.isFineValue(omrsContactTested.name.name) == true) {
    omrsContactTested = omrsContactTested.uuid;
  } else {
    omrsContactTested = "";
  }

  var omrsReasonContactNotTested = utils.getConceptValue(incomingEncounter.encounter.obs, "bd3649bd-8c55-4671-a9d1-d1515ca2877f");
  if (utils.isFineValue(omrsReasonContactNotTested) == true && utils.isFineValue(omrsReasonContactNotTested.name) == true && utils.isFineValue(omrsReasonContactNotTested.name.name) == true) {
    omrsReasonContactNotTested = omrsReasonContactNotTested.uuid;
  } else {
    omrsReasonContactNotTested = "";
  }

  var omrsContactHivResult = utils.getConceptValue(incomingEncounter.encounter.obs, "c86a2bcc-638b-4696-a2ac-1a74a1781745");
  if (utils.isFineValue(omrsContactHivResult) == true && utils.isFineValue(omrsContactHivResult.name) == true && utils.isFineValue(omrsContactHivResult.name.name) == true) {
    omrsContactHivResult = omrsContactHivResult.uuid;
  } else {
    omrsContactHivResult = "";
  }

  var omrsUntestedContactGivenTestKit = utils.getConceptValue(incomingEncounter.encounter.obs, "7bfac55f-4ae4-4f4a-a597-5584e8be6020");
  if (utils.isFineValue(omrsUntestedContactGivenTestKit) == true && utils.isFineValue(omrsUntestedContactGivenTestKit.name) == true && utils.isFineValue(omrsUntestedContactGivenTestKit.name.name) == true) {
    omrsUntestedContactGivenTestKit = omrsUntestedContactGivenTestKit.uuid;
  } else {
    omrsUntestedContactGivenTestKit = "";
  }
  //End of UUID retrieving
  
  
  //Retrieving the matching value of the concept from DHIS2 for each dropdown
  //Biginning of the retrieving
  utils.getDhis2DropdownValue(utils.getDHIS2RecencyAssayResult(omrsRecencyAssayResult), function (result) {
    omrsRecencyAssayResultValue = result;
    utils.getDhis2DropdownValue(utils.getDHIS2RelationOfContact(omrsRelationOfContact), function (result) {
      omrsRelationOfContactValue = result;
      utils.getDhis2DropdownValue(utils.getDHIS2ContactHivStatus(omrsContactHivStatus), function (result) {
        omrsContactHivStatusValue = result;
        utils.getDhis2DropdownValue(utils.getDHIS2OuiNonResponse(omrsRiskOfViolence), function (result) {
          omrsRiskOfViolenceValue = result;
          utils.getDhis2DropdownValue(utils.getDHIS2PlannedReferenceType(omrsPlannedReferenceType), function (result) {
            omrsPlannedReferenceTypeValue = result;

            //1- sending createNewEventStageInfoRecencyContact
            var dhsi2RecencyStructure = {
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
                  "value": omrsRecencyAssayResultValue
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
            var dhsi2ContactStructure =
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
            var dhsi2NotifStructure =
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
            formMapping.pushFormToDhis2(formMapping.form1MappingTable, incomingEncounter, dhsi2RecencyStructure, 1, formMapping.form1MappingBooleanTable, function (error, result) {
              if (error) {
                winston.error('An error occured when trying to add a recency contact information ', error);
                callback('An error occured when trying to add a recency contact information');
              } else {
                winston.info('Recency contact information added with success ', result);
                callback(null, 'Recency contact information added with success');


                winston.info('Now, adding contacts information...');
                formMapping.pushFormToDhis2(formMapping.form1MappingTable, incomingEncounter, dhsi2ContactStructure, 2, formMapping.form1MappingBooleanTable, function (error, result) {
                  if (error) {
                    winston.error('An error occured when trying to add a contacts information ', error);
                    callback('An error occured when trying to add a contacts information ');
                  } else {
                    winston.info('Contacts information added with success ', result);

                    winston.info('Now, adding results of contacts notifications...');
                    formMapping.pushFormToDhis2(formMapping.form1MappingTable, incomingEncounter, dhsi2NotifStructure, 3, formMapping.form1MappingBooleanTable, function (error, result) {
                      if (error) {
                        winston.error('An error occured when trying to add a results of contacts notifications', error);
                        callback('An error occured when trying to add a results of contacts notifications');
                      } else {
                        winston.info('Results of contacts notifications added with success', result);
                        callback(null, 'Results of contacts notifications added with success');
                      }
                    })
                  }
                })
              }
            });

          });
        });  
      });
    });
  });

};

var addHivCrfSection1 = function (incomingEncounter, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //createNewEventStageEnrollmentInfo.json  
  var patientBirhDate = "";
  var patientGender = "";
  var patientMaritalStatus = "";
  var patientOccupation = "";
  var patientAddressObject = "";
  var patientProvince = "";
  var patientDistrict = "";

  if (utils.isFineValue(incomingEncounter.patient.person.birthdate) == true) {
    patientBirhDate = utils.convertToDate(incomingEncounter.patient.person.birthdate);
  }

  patientAddressObject = utils.getdhis2ProvinceDistrictIds(incomingEncounter.patient);

  //getting distict from DHIS2
  utils.getDhis2District(patientAddressObject.dhis2DistrictId, function (result) {
    patientDistrict=result;
    console.log("district to push to dhis2==============>>>", result)

    //getting gender from DHIS2
    utils.getDhis2DropdownValue(utils.getPatientGenderDhis2Id(incomingEncounter.patient), function (result) {
      patientGender = result;
      var omrsOccupationValue = utils.getConceptValue(incomingEncounter.encounter.obs, "4587542b-f1aa-47ad-8bed-75a705433950");
      if (utils.isFineValue(omrsOccupationValue) == true && utils.isFineValue(omrsOccupationValue.name) == true && utils.isFineValue(omrsOccupationValue.name.name) == true) {
        omrsOccupationValue = omrsOccupationValue.uuid;
      } else {
        omrsOccupationValue = "";
      }

      //getting occupation from DHIS2
      utils.getDhis2DropdownValue(utils.getDHIS2Occupation(omrsOccupationValue), function (result) {
        patientOccupation = result;
        utils.getDhis2DropdownValue(utils.getPatientMaritalStatusDhis2Id(incomingEncounter.patient), function (result) {
          patientMaritalStatus = result;
          var dhis2EnrollementStructure =
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
                "value": patientBirhDate
              },
              {
                "dataElement": "c4KsTiEImGx",
                "value": patientGender
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
                "value": patientDistrict
              },
              {
                "dataElement": "PZo2sP0TOb6",
                "value": patientMaritalStatus
              },
              {
                "dataElement": "NrWXvZg3WtW",
                "value": patientOccupation
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
              },
              {
                "dataElement": "gJ58M7ClaMm",
                "value": ""
              },
              {
                "dataElement": "yGhEu1ntCaf",
                "value": ""
              },
              {
                "dataElement": "eQFf5SRscrT",
                "value": ""
              },
              {
                "dataElement": "fB1hxxwcdye",
                "value": ""
              },
              {
                "dataElement": "ZfoeEa3kNYe",
                "value": ""
              },
              {
                "dataElement": "fHHFiV0HP0V",
                "value": ""
              },
            ]
          }

          formMapping.pushFormToDhis2(formMapping.form2MappingTable, incomingEncounter, dhis2EnrollementStructure, 4, formMapping.form2MappingBooleanTable, function (error, result) {
            if (error) {
              winston.error('An error occured when trying to add an enrollment information', error);
              callback('An error occured when trying to add an enrollment information');
            } else {
              winston.info('Enrollment data added with success', result);
              callback(null, 'Enrollment dataadded with success');
            }
          });
        });
      });
    });
  });
};

var addHivCrfSection2 = function (incomingEncounter, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  //createNewEventStageFollowUpInfo.json 
  var dhis2FollowupStructure =
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
  formMapping.pushFormToDhis2(formMapping.form3MappingTable, incomingEncounter, dhis2FollowupStructure, 5, null, function (error, result) {
    if (error) {
      winston.error('An error occured when trying to add a follow up information', error);
      callback('An error occured when trying to add a follow up information');
    } else {
      winston.info('Follow up information added with success', result);
      callback(null, 'Follow up information added with success');
    }
  })
};


var addRecencyVL = function (incomingEncounter, organizationUnit, trackedEntityInstanceId, enrollmentId, callback) {
  var dhis2FollowupStructure =
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

  formMapping.pushFormToDhis2(formMapping.form4MappingTable, incomingEncounter, dhis2FollowupStructure, 6, null, function (error, result) {
    if (error) {
      winston.error('An error occured when trying to add a recency VL information', error);
      callback('An error occured when trying to add a recency VL information');
    } else {
      winston.info('Recency VL information added with success', result);
      callback(null, 'Recency VL information added with success');
    }
  })
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
