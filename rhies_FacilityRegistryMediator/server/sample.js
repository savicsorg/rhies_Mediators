var request = require('request');
var config = require('../server/config/config');

exports.reportEndOfProcess = function(req, res, error, statusCode, message) {
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

let endpoint = config.facilityregistry.server.url + ":" + config.facilityregistry.server.port + config.facilityregistry.server.urlPattern;
request(endpoint, function(err, res, body) {
    if(err){

    } else {
        let facilityTab = JSON.parse(body).allFacilityList
        console.log(facilityTab);
    }
   
});