#!/usr/bin/env node
'use strict'


const formidable = require('formidable');
const express = require('express')
const medUtils = require('openhim-mediator-utils')
const winston = require('winston')
const moment = require('moment');
var request = require('request');
var nconf = require('nconf');
nconf.file('../config/config.json');
var log = require('./log');

const utils = require('./utils')
const fs = require('fs');
const https = require('https');
const http = require('http');

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
        form: "3cfa4d45-7556-4c59-abdc-836452a36714", //Adult HIV Flowsheet - New Lab,
        visitType: "3515b588-b1df-4110-991b-0d603686d8e6", //"Primary Care Outpatient",
        encounterType: "2dc31190-cf0e-4ab0-a5a1-6ad601d6ecc0", //HIV VISIT",
        parentConcept: "3cd9b05c-26fe-102b-80cb-0017a47871b2", //LABORATORY EXAMINATIONS CONSTRUCT
        concept: "3cd4a882-26fe-102b-80cb-0017a47871b2", //HIV VIRAL LOAD
    },
    recency_vl: {
        q: "RECEN", //the key word to research the recencies concepts list
        form: "cad4fef7-d937-478b-802d-6dfb8976dc8f", //CBS Recency VL
        visitType: "3515b588-b1df-4110-991b-0d603686d8e6", //"Primary Care Outpatient",
        encounterType: "2dc31190-cf0e-4ab0-a5a1-6ad601d6ecc0", //HIV VISIT",
        recencyAssayTestConcept: "b4b0e241-e41a-4d46-89dd-e531cf6d8202",//
        recencyAssayResultConcept: "a2053e28-9ce9-4647-8a96-6f1b7c62f429",//CBS FINAL RITA RECENCY RESULT
        recencyViralLoadConcept: "c59b6935-3838-4198-8909-75f08d47ff2b",
        recencyViralLoadTestDateConcept: "fa87bb43-ebcc-4919-96f8-c5013ce1bbca",
        recencyViralLoadResultConcept: "aae8d7fe-8bbc-4d2e-926c-0e28b4d0e046",
        recencyViralLoadResultDateConcept: "f4e3f60a-2f62-47bc-b968-156b3df91067",

        yesConceptValue: "3cd6f600-26fe-102b-80cb-0017a47871b2", //YES
        recentConceptValue: "fb3b2a61-4f4b-46b2-9187-9ec769349a44", //RECENT
        longTermeConceptValue: "819f5ebe-0b3e-44ba-b435-8f3d1b7bb130", //LONG-TERM
        invalideConceptValue: "9340dede-5124-49cf-9b3c-5153cc0e537f", //INVALID
        negativeConceptValue: "3cd28732-26fe-102b-80cb-0017a47871b2" //NEGATIVE"
    },
    hiv_recency: {

    }
}

function reportEndOfProcess(req, res, error, statusCode, message) {
    res.set('Content-Type', 'application/json+openhim')
    var responseBody = message;
    var stateLabel = "";
    let orchestrations = [];

    var headers = {'content-type': 'application/json'}
    if (error) {
        stateLabel = "Failed";
        winston.error(message, error);
    } else {
        stateLabel = "Successful";
        winston.info(message);
    }
    var orchestrationResponse = {statusCode: statusCode, headers: headers}
    orchestrations.push(utils.buildOrchestration('Primary Route', new Date().getTime(), req.method, req.url, req.headers, req.body, orchestrationResponse, responseBody))
    res.send(utils.buildReturnObject(mediatorConfig.urn, stateLabel, statusCode, headers, responseBody, orchestrations, {property: 'Primary Route'}));
}



var locations = apiConf.locations;

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

        if (req.method == 'POST' && req.url == apiConf.api.urlPattern) {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                var data = fields;
                
                if (locations["l_" + data.facilityCode]){
                
                var transactionLocation = locations["l_" + data.facilityCode]["hfname"];
                log.info('New data received', data, transactionLocation);

                var nd_of_research = 0;
                var forbidenRepeatTime = 0;

                function LoopA(q) {
                    nd_of_research = nd_of_research + 1;
                    var openmrsIPAddress = locations["l_" + data.facilityCode];
                    if (q && q != "" && openmrsIPAddress) {
                        var options = {
                            url: openmrsIPAddress.ip + apiConf.api.openmrs.rest_api + "/patient?q=" + q,
                            headers: {
                                'Authorization': 'Basic ' + Buffer.from(locations["l_" + data.facilityCode]["username"] + ":" + locations["l_" + data.facilityCode]["password"]).toString('base64'),
                                'Content-Type': 'application/json'
                            }
                        }

                        var testType = data.TestId.toLowerCase();

                        //// 1. Patient
                        log.info("Search for the patient " + q, locations["l_" + data.facilityCode]["hfname"]);
                        request.get(options, function (error, response, body) {
                            if (error) {
                                log.error("Error on patient research. Encounter creation aborted for " + data.SampleID + ".");
                                log.error(error);
                                reportEndOfProcess(req, res, error, 500, "Error on patient research. Encounter creation aborted for " + data.SampleID + ".");
                            } else {
                                if (response.statusCode == "200") {
                                    
                                    var results = JSON.parse(body).results;
                                    var patient = undefined;
                                    if (results && results.length == 1) {
                                        log.info("Patient ", q, "found.");
                                        patient = results[0];

                                        var location = locations["l_" + data.facilityCode];
                                        switch (testType) {
                                            case 'viral_load_2':
                                                log.info("New HIV VIRAL LOAD 2 test from Labware. SampleID: '" + data.SampleID + "'", data);
                                                console.log("New HIV VIRAL LOAD 2 test from Labware. SampleID: '" + data.SampleID + "'", data);

                                                
                                                var encounterOptions = {
                                                    url: openmrsIPAddress.ip + apiConf.api.openmrs.rest_api + "/encounter",
                                                    body: JSON.stringify(
                                                            {
                                                                "patient": patient.uuid,
                                                                "form": tests.viral_load_2.form, //uuid of the concerned form in openmrs
                                                                "encounterType": tests.viral_load_2.encounterType, //uuid of encounterType
                                                                "location": location.uuid, //uuid of localtion
                                                                "encounterDatetime": (new Date(data.SampleDate)).toISOString(),
                                                                "obs": [
                                                                    {
                                                                        "concept": tests.viral_load_2.parentConcept, //uuid of perent concept
                                                                        "person": patient.uuid, //uuid of patient
                                                                        "obsDatetime": (new Date(data.DateReleased)).toISOString(),
                                                                        "groupMembers": [
                                                                            {
                                                                                "concept": tests.viral_load_2.concept, //uuid of concept
                                                                                "person": patient.uuid, //uuid of patient
                                                                                "location": location.uuid, //uuid of location
                                                                                "obsDatetime": (new Date(data.DateReleased)).toISOString(),
                                                                                "value": data.Result.copies, //hiv concentration value (copie/ml) comming from labware
                                                                                "resourceVersion": "1.8"//OpenMRS version
                                                                            }
                                                                        ],
                                                                        "location": location.uuid//uuid of location
                                                                    }
                                                                ],
                                                                "encounterProviders": [{
                                                                        "encounterRole": apiConf.api.openmrs.encounterRole,
                                                                        "provider": apiConf.api.openmrs.provider, //Labware
                                                                        "resourceVersion": "1.8"//OpenMRS version
                                                                    }]
                                                            }
                                                    ),
                                                    headers: {
                                                        'Authorization': 'Basic ' + Buffer.from(locations["l_" + data.facilityCode]["username"] + ":" + locations["l_" + data.facilityCode]["password"]).toString('base64'),
                                                        'Content-Type': 'application/json'
                                                    }
                                                };

                                                request.post(encounterOptions, function (error, response, body) {
                                                    if (error) {
                                                        log.error("Encounter creation aborted for " + data.SampleID + ".");
                                                        log.error(error);
                                                        log.error(response.body);
                                                        reportEndOfProcess(req, res, error, 500, "Encounter creation aborted for " + data.SampleID + ".");
                                                    } else {
                                                        needle.post(apiConf.api.openMrsUrl, data, {})
                                                                .on('readable', function () {

                                                                })
                                                                .on('done', function (err, resp) {
                                                                    if (response.statusCode == "201" || response.statusCode == "200") {
                                                                        log.info("Encounter created sucessfully for '" + locations["l_" + data.facilityCode]["hfname"] + "'.", "Sample ID: ", data.SampleID);
                                                                        reportEndOfProcess(req, res, null, 200, "Encounter created sucessfully for '" + locations["l_" + data.facilityCode]["hfname"] + "'." + "Sample ID: " + data.SampleID);
                                                                    } else {
                                                                        log.error("Encounter creation aborted for " + data.SampleID + ".", "Cause:");
                                                                        log.error(response);
                                                                        reportEndOfProcess(req, res, err, 500, "Encounter creation aborted for " + data.SampleID);
                                                                    }
                                                                })
                                                    }
                                                });

                                                break;
                                            case 'recency_vl':
                                                log.info("New Recency VL test from Labware. SampleID: '" + data.SampleID + "'", data);
                                                console.log("New Recency VL test from Labware. SampleID: '" + data.SampleID + "'", data);
                                                if (data.Result && data.Result.copies) {

                                                    var ritaConcept = tests.recency_vl.recentConceptValue;//"RECENT";
                                                    if (data.Result.copies == "NEGATIVE") {
                                                        ritaConcept = tests.recency_vl.invalideConceptValue; //"INVALID";

                                                    } else {
                                                        var copiesml = parseInt(data.Result.copies, 10);
                                                        if (copiesml > 1000) {
                                                            ritaConcept = tests.recency_vl.recentConceptValue;//"RECENT";
                                                        } else {
                                                            ritaConcept = tests.recency_vl.longTermeConceptValue;//"LONG-TERM";
                                                        }
                                                    }
                                                                
                                                    var encounterOptions = {
                                                        url: openmrsIPAddress.ip + apiConf.api.openmrs.rest_api + "/encounter",
                                                        body: JSON.stringify(
                                                                {
                                                                    "encounterDatetime": (new Date(data.SampleDate)).toISOString(),
                                                                    "patient": patient.uuid,
                                                                    "location": location.uuid,
                                                                    "form": tests.recency_vl.form,
                                                                    "encounterType": tests.recency_vl.encounterType,
                                                                    "obs": [
                                                                        {
                                                                            "concept": tests.recency_vl.recencyAssayTestConcept,
                                                                            "person": patient.uuid,
                                                                            "obsDatetime": (new Date()).toISOString(),
                                                                            "location": location.uuid,
                                                                            "voided": false,
                                                                            "value": {
                                                                                "uuid": tests.recency_vl.yesConceptValue //ALWAYS YES concept
                                                                            },
                                                                            "resourceVersion": "1.8"
                                                                        },
                                                                        {
                                                                            "concept": tests.recency_vl.recencyViralLoadConcept, //RECENCY VIRAL LOAD: YES
                                                                            "person": patient.uuid,
                                                                            "obsDatetime": (new Date()).toISOString(),
                                                                            "location": location.uuid,
                                                                            "voided": false,
                                                                            "value": {
                                                                                "uuid": tests.recency_vl.yesConceptValue //ALWAYS YES concept
                                                                            }
                                                                        },
                                                                        {
                                                                            "concept": tests.recency_vl.recencyViralLoadResultConcept,
                                                                            "person": patient.uuid,
                                                                            "obsDatetime": (new Date()).toISOString(),
                                                                            "location": location.uuid,
                                                                            "voided": false,
                                                                            "value": data.Result.copies,
                                                                            "resourceVersion": "1.8"
                                                                        },
                                                                        {
                                                                            "concept": tests.recency_vl.recencyViralLoadResultDateConcept,
                                                                            "person": patient.uuid,
                                                                            "obsDatetime": (new Date()).toISOString(),
                                                                            "location": location.uuid,
                                                                            "voided": false,
                                                                            "value": (new Date(data.DateReleased.trim())).toISOString(),
                                                                            "resourceVersion": "1.8"
                                                                        },
                                                                        {
                                                                            "concept": tests.recency_vl.recencyViralLoadTestDateConcept,
                                                                            "person": patient.uuid,
                                                                            "obsDatetime": (new Date()).toISOString(),
                                                                            "location": location.uuid,
                                                                            "voided": false,
                                                                            "value": (new Date(data.DateReleased.trim())).toISOString()
                                                                        }, {
                                                                            "concept": tests.recency_vl.recencyAssayResultConcept, //RITA RESULT
                                                                            "person": patient.uuid,
                                                                            "obsDatetime": (new Date()).toISOString(),
                                                                            "location": location.uuid,
                                                                            "voided": false,
                                                                            "value": {
                                                                                "uuid": ritaConcept // RECENT, LONG-TERM or INVALID
                                                                            }
                                                                        }
                                                                    ],
                                                                    "encounterProviders": [{
                                                                            "encounterRole": apiConf.api.openmrs.encounterRole,
                                                                            "provider": apiConf.api.openmrs.provider, //Labware
                                                                            "resourceVersion": "1.8"
                                                                        }],
                                                                    "resourceVersion": "1.9"
                                                                }
                                                        ),
                                                        headers: {
                                                            'Authorization': 'Basic ' + Buffer.from(locations["l_" + data.facilityCode]["username"] + ":" + locations["l_" + data.facilityCode]["password"]).toString('base64'),
                                                            'Content-Type': 'application/json'
                                                        }
                                                    };

                                                    //res.sendStatus(200);
                                                    request.post(encounterOptions, function (error, response, body) {
                                                        if (error) {
                                                            log.warn("Encounter creation aborted for " + data.SampleID + ".");
                                                            log.error(error);
                                                            log.error(response.body);
                                                            reportEndOfProcess(req, res, error, 500, "Encounter creation aborted for " + data.SampleID + ", " + error);
                                                        } else {
                                                            needle
                                                                    .post(apiConf.api.openMrsUrl, data, {})
                                                                    .on('readable', function () {

                                                                    })
                                                                    .on('done', function (err, resp) {
                                                                        if (response.statusCode == "201" || response.statusCode == "200") {
                                                                            log.info("Encounter created sucessfully for '" + locations["l_" + data.facilityCode]["hfname"] + "'.", "Sample ID: ", data.SampleID);
                                                                            reportEndOfProcess(req, res, null, 200, "Encounter created sucessfully for '" + locations["l_" + data.facilityCode]["hfname"] + "'." + "Sample ID: " + data.SampleID);
                                                                        } else {
                                                                            log.warn("Encounter creation aborted for " + data.SampleID + ".", "Cause:");
                                                                            log.error(response);
                                                                            reportEndOfProcess(req, res, err, 500, "Encounter creation aborted for " + data.SampleID + ".");
                                                                        }

                                                                    })
                                                        }
                                                    });
                                                } else {
                                                    log.warn("Data with empty result received!");
                                                    log.error("Encounter creation aborted for " + data.SampleID + ".");
                                                    reportEndOfProcess(req, res, "Encounter creation aborted for " + data.SampleID + ".", 500, "Encounter creation aborted for " + data.SampleID + "," + "Data with empty result received!");
                                                }

                                                break;
                                            case 'hiv_recency':
                                                //TODO
                                                log.info("New HIV recency result from Labware. SampleID: '" + data.SampleID + "'", data);
                                                reportEndOfProcess(req, res, null, 200, "New HIV recency result from Labware. SampleID: '" + data.SampleID + "'");
                                                break;
                                        }//END Switch

                                    } else if (results && results.length == 0) {//No result found
                                        if (nd_of_research < 2) {//Second research possible by name 
                                            log.warn("No patient found, searching by name: " + data.firstName + " " + data.lastName);
                                            LoopA(data.firstName + " " + data.lastName);
                                        } else {
                                            log.warn("No patient found in " + locations["l_" + data.facilityCode]["hfname"], "Name: " + data.firstName + " " + data.lastName);
                                            log.error("Encounter creation aborted for " + data.SampleID + ".");

                                            reportEndOfProcess(req, res, "No patient found in " + locations["l_" + data.facilityCode]["hfname"] + "Name: " + data.firstName + " " + data.lastName, 500, "Encounter creation aborted for " + data.SampleID + ", No patient found in " + locations["l_" + data.facilityCode]["hfname"] + "Name: ");
                                        }
                                    } else {
                                        log.warn("Oups, it looks like we found many patients corresponding with the input data, we are not able to take decision.");
                                        log.error("Encounter creation aborted for " + data.SampleID + " in " + locations["l_" + data.facilityCode]["hfname"] +".");

                                        reportEndOfProcess(req, res, "Oups, it looks like we have we found many patients corresponding with the input data, we are not able to take decision.", 500, "Oups, it looks like we have we found many patients corresponding with the input data, we are not able to take decision. Encounter creation aborted for " + data.SampleID + ".");
                                    }
                                } else if (response.statusCode == "403") {
                                    log.error("FORBIDEN statusCode: ", response.statusCode);
                                    if (forbidenRepeatTime < 1) {
                                        LoopA(data.tracnetID);//Search by TracknetID Firts
                                    } else {
                                        log.error("ACCESS FORBIDEN: Encounter creation aborted for " + data.SampleID + "in " + locations["l_" + data.facilityCode]["hfname"] +".");
                                        reportEndOfProcess(req, res, "ACCESS FORBIDEN", 500, "Encounter creation aborted for " + data.SampleID + ". ACCESS FORBIDEN");
                                    }
                                } else {
                                    log.error("Encounter creation aborted for unkown reason. Attempting to research Patient in " + locations["l_" + data.facilityCode]["hfname"] +".", "Status Code " + response.statusCode);
                                    reportEndOfProcess(req, res, "Encounter creation aborted for unkown reason. Status Code " + response.statusCode, 500, "Encounter creation aborted for unkown reason. Status Code " + response.statusCode);
                                }
                            }
                        });
                    } else {
                        if (nd_of_research < 2) {//Second research possible by name 
                            log.warn("No patient found, searching by name : " + data.firstName + " " + data.lastName +" in " + locations["l_" + data.facilityCode]["hfname"] +".");
                            LoopA(data.firstName + " " + data.lastName);
                        } else if (!openmrsIPAddress) {
                            log.warn("Unknown health facility ", data.facilityCode, "Operation aborted");
                            reportEndOfProcess(req, res, "Unknown health facility " + data.facilityCode + " Operation aborted", 501, "Unknown health facility " + data.facilityCode + " Operation aborted");
                        } else {
                            log.warn("No patient found. Operation aborted in " + locations["l_" + data.facilityCode]["hfname"] +".");
                            reportEndOfProcess(req, res, "No patient found. Operation aborted", 500, "No patient found. Operation aborted");
                        }
                    }
                }
                log.info("Searching patient by tracnetID: " + data.tracnetID +"in " + locations["l_" + data.facilityCode]["hfname"] +".");
                LoopA(data.tracnetID);//Search by TracknetID Firts
                }else{
                    log.error("ACCESS FORBIDEN - Please use POST method", "Status Code 403"  );
                    reportEndOfProcess(req, res, "ACCESS FORBIDEN - Please use POST method", 403, "ACCESS FORBIDEN - Please use POST method");
                }
            });

        }else{
            log.error("ACCESS FORBIDEN - Please use POST method or Check the URL Route", "Status Code 403"  );
            reportEndOfProcess(req, res, "ACCESS FORBIDEN - Please use POST method or Check the URL Route", 403);
        }
        if (req.protocol === 'http'){
            res.redirect(301, `https://${req.headers.post}${req.url}`);
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

    if (apiConf.register) {
        //if (false) {
        medUtils.registerMediator(apiConf.api, mediatorConfig, (err) => {
            if (err) {
                winston.error('Failed to register this mediator, check your config')
                console.log('Failed to register this mediator, check your config');
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
                    console.log('Failed to fetch initial config');
                    winston.error(err.stack)
                    process.exit(1)
                } else {
                    winston.info('Successfully registered mediator!')
                    console.log('Successfully registered mediator!');
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
            cert: fs.readFileSync('./config/certificates/cert.pem')
        }, app);
        const server = httpsServer.listen(port, () => callback(server))
        log.info('Labware OpenMRS mediator started on port ' + port);
    }
}
exports.start = start

if (!module.parent) {
    // if this script is run directly, start the server
    start(() => winston.info(`Listening on ${port}...`))
}
