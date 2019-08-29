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
winston.add(winston.transports.Console, {level: 'info', timestamp: true, colorize: true})

// Config
var config = {} // this will vary depending on whats set in openhim-core
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')
const mediatorConfig = require('../config/mediator')

var port = process.env.NODE_ENV === 'test' ? 7001 : mediatorConfig.endpoints[0].port

var tests = {
    viral_load_2: {
        form: "Adult HIV Flowsheet - New Lab",
        encounterType: "HIV VISIT",
        parentConcept: "LABORATORY EXAMINATIONS CONSTRUCT",
        concept: "HIV VIRAL LOAD",
    },
    recency_vl: {
        form: "Confidential HIV CRF - SECTION 1: Enrollment Information",
        encounterType: "HIV VISIT",
        parentConcept: "RECENCY ASSAY RESULTS",
        valueConcept: "FULLY_SPECIFIED",
        concept: "XXXX",
    },
    hiv_recency: {
        form: "XXXXX",
        concept: "XXXXX",
        parentConcept: "LABORATORY EXAMINATIONS CONSTRUCT", //Check this,
        encounterType: "HIV VISIT"//Check this,
    },
}


var locations = {
    l_448: "ec098275-651d-4852-9603-aa0e1d88297f"
}



function _getTheGoodResult(results, fieldCompare, value) {
    var result = undefined;
    if (results && results.length > 1) {
        var n;
        for (n = 0; n < results.length; n++) {
            if (results[n][fieldCompare] && results[n][fieldCompare] == value) {
                return results[n];
            }
        }
    } else if (results) {
        return results[0];
    }
    return undefined;
}

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
        var headers = {'content-type': 'application/json'}

        // add logic to alter the request here

        // capture orchestration data
        var orchestrationResponse = {statusCode: 200, headers: headers}
        let orchestrations = []
        orchestrations.push(utils.buildOrchestration('Primary Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))

        // set content type header so that OpenHIM knows how to handle the response
        res.set('Content-Type', 'application/json+openhim')


        // construct return object
        var properties = {property: 'Primary Route'}

        if (req.method == 'POST' && req.url == apiConf.api.urlPattern) {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                var data = fields;
                console.log('Got data', data);

//        needle
//          .post(apiConf.api.openMrsUrl , data, {})
//          .on('readable', function () {
//
//          })
//          .on('done', function (err, resp) {
//            console.log('Posted data',  data,  "to", apiConf.api.openMrsUrl );
//          })

                var options = {
                    url: "http://172.16.170.134:8080/openmrs/ws/rest/v1/patient?q=" + data.PatientID + "&v=full",
                    headers: {
                        'Authorization': 'Basic ' + new Buffer("geoffrey:Ganyugxy1").toString('base64'),
                        'Content-Type': 'application/json'
                    }
                }
                //// 1. Patient
                request.get(options, function (error, response, body) {
                    if (error) {
                        console.log(error);
                        res.sendStatus(500)
                    } else {
                        if (response.statusCode == "200") {
                            var results = JSON.parse(body).results;
                            var patient = undefined;
                            if (results && results.length > 0) {
                                patient = results[0];
                            }
                            console.log(patient);
                            options = {
                                url: "http://172.16.170.134:8080/openmrs/ws/rest/v1/form?q=" + tests.viral_load_2.form + "&v=full",
                                headers: {
                                    'Authorization': 'Basic ' + new Buffer("geoffrey:Ganyugxy1").toString('base64'),
                                    'Content-Type': 'application/json'
                                }
                            }

                            //// 2. Form 
                            request.get(options, function (error, response, body) {
                                if (error) {
                                    console.log(error);
                                    res.sendStatus(500)
                                } else {
                                    var form = JSON.parse(body).results;
                                    if (form && form.length > 0) {
                                        form = _getTheGoodResult(form, "display", tests.viral_load_2.form)
                                        options = {
                                            url: "http://172.16.170.134:8080/openmrs/ws/rest/v1/concept?q=" + tests.viral_load_2.parentConcept + "&v=full",
                                            headers: {
                                                'Authorization': 'Basic ' + new Buffer("geoffrey:Ganyugxy1").toString('base64'),
                                                'Content-Type': 'application/json'
                                            }
                                        }

                                        //// 3. Parent concept
                                        request.get(options, function (error, response, body) {
                                            if (error) {
                                                console.log(error);
                                                res.sendStatus(500)
                                            } else {
                                                var parentConcept = JSON.parse(body).results;
                                                if (parentConcept && parentConcept.length > 0) {
                                                    parentConcept = _getTheGoodResult(parentConcept, "display", tests.viral_load_2.parentConcept)

                                                    options = {
                                                        url: "http://172.16.170.134:8080/openmrs/ws/rest/v1/concept?q=" + tests.viral_load_2.concept,
                                                        headers: {
                                                            'Authorization': 'Basic ' + new Buffer("geoffrey:Ganyugxy1").toString('base64'),
                                                            'Content-Type': 'application/json'
                                                        }
                                                    }

//// 3.                                             //// 4. Concept
                                                    request.get(options, function (error, response, body) {
                                                        if (error) {
                                                            console.log(error);
                                                            res.sendStatus(500)
                                                        } else {
                                                            var concept = JSON.parse(body).results;
                                                            if (concept && concept.length > 0) {
                                                                concept = _getTheGoodResult(concept, "display", tests.viral_load_2.concept)

                                                                var encounterOptions = {
                                                                    url: "http://172.16.170.134:8080/openmrs/ws/rest/v1/encounter",
                                                                    body: JSON.stringify(
                                                                            {
                                                                                "patient": patient.uuid,
                                                                                "form": form.uuid, //uuid of the concerned form in openmrs
                                                                                "encounterType": form.encounterType.uuid, //uuid of encounterType
                                                                                "location": locations.l_448, //uuid of localtion
                                                                                "encounterDatetime": "2019-08-26T00:00:00.000-0800",
                                                                                "obs": [
                                                                                    {
                                                                                        "display": tests.viral_load_2.parentConcept + ": " + data.Result.copies,
                                                                                        "concept": parentConcept.uuid, //uuid of perent concept
                                                                                        "person": patient.uuid, //uuid of patient
                                                                                        "obsDatetime": "2019-08-26T00:00:00.000-0800",
                                                                                        "groupMembers": [
                                                                                            {
                                                                                                "display": tests.viral_load_2.concept + ": " + data.Result.copies,
                                                                                                "concept": concept.uuid, //uuid of concept
                                                                                                "person": patient.uuid, //uuid of patient
                                                                                                "location": locations.l_448, //uuid of location
                                                                                                "obsDatetime": "2019-08-26T00:00:00.000-0800",
                                                                                                "voided": false,
                                                                                                "value": data.Result.copies, //hiv concentration value (copie/ml) comming from labware
                                                                                                "resourceVersion": "1.8"//OpenMRS version
                                                                                            }
                                                                                        ],
                                                                                        "location": locations.l_448//uuid of location
                                                                                    }
                                                                                ],
                                                                                "encounterProviders": [{
                                                                                        "encounterRole": "a0b03050-c99b-11e0-9572-0800200c9a66",
                                                                                        "provider": "prov9b01-f749-4b3f-b8fe-8f6d460003bb",
                                                                                        "resourceVersion": "1.9"//OpenMRS version
                                                                                    }]
                                                                            }
                                                                    ),
                                                                    headers: {
                                                                        'Authorization': 'Basic ' + new Buffer("geoffrey:Ganyugxy1").toString('base64'),
                                                                        'Content-Type': 'application/json'
                                                                    }
                                                                };

                                                                request.post(encounterOptions, function (error, response, body) {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        res.sendStatus(500)
                                                                    } else {
                                                                        res.sendStatus(200)
                                                                    }
                                                                });

                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }//TODO Manage the case no form found here
                                }
                            });

                        }else if (response.statusCode == "403") {
                            console.log("FORBIDEN statusCode: ", response.statusCode)
                            //Reload here
                        } else {
                            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                            console.log('body:', body); // Print the HTML for the Google homepage.
                        }
                    }
                });



            });
            //res.send(utils.buildReturnObject(mediatorConfig.urn, 'Successful', 200, headers, responseBody, orchestrations, properties))
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
    if (apiConf.api.trustSelfSigned) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

//  if (apiConf.register) {
    if (false) {
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
