'use strict'
var URI = require('urijs');
var config = require('../config/config');
var mysql = require('mysql');
const { uuid } = require('uuidv4');
const winston = require('winston');
const mediatorConfig = require('../config/mediator');
var myConfig = require('../config/config')



var endpoint = myConfig.facilityregistry.server.url + ":" + myConfig.facilityregistry.server.port + myConfig.facilityregistry.server.urlPattern;

exports.getTodayDate = function() {
    
    let ts = Date.now();

    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let time = date_ob.getHours() + ":" + date_ob.getMinutes() + ":" + date_ob.getSeconds();

    // prints date & time in YYYY-MM-DD HH:MM:SS format
    return year + "-" + month + "-" + date + " " + time;
}


exports.updateOpenmrsFacilitiesList = function(hostUrl, port, hostPwd, facilityTab, callback){

    var sql = "";
    var transactionSuccess = true;
    var con = mysql.createConnection({
    host: hostUrl,
    user: "root",
    password: hostPwd,
    database: "openmrs",
    port: port
    });

    var messageBuffer = "";
    var count = 0;
    var e = 0;
    con.connect(function(err) {
        if (err) {
            
            messageBuffer = 'Error when connecting to the instance : ' + hostUrl +':' + port + '.  ' + '.  DETAILS: ' + err + '.  ';

        } else {
            let msg = 'Successfully Connected to the instance : ' + hostUrl +':' + port + '';
            winston.info(msg);
                     
            for(var i = 0; i < facilityTab.length; i++){
                
                let f = facilityTab[i]
                var lat = null;
                var long = null;
                if(f.coordinates!==null){
                    var t = f.coordinates.split(',')
                    long  = t[0].substr(1);
                    lat = t[1].slice(0, -1);
                }
                if(facilityTab[i].sector!==null && facilityTab[i].cellule!==null && facilityTab[i].province!==null && facilityTab[i].district!==null && lat!==null && long!==null){
                    sql = 'UPDATE openmrs.location SET name = "'+ facilityTab[i].name +'", changed_by = 1, date_changed = "' + facilityTab[i].extractDate + '", city_village = "'+ facilityTab[i].sector +'",  address3 = "'+facilityTab[i].cellule+'", state_province="'+ facilityTab[i].province +'", county_district="'+ facilityTab[i].district +'", latitude="'+ lat +'", longitude="'+long+'"  WHERE location.description LIKE "FOSAID: ' + facilityTab[i].fosaCode + ' TYPE%";';
                } else{
                    sql = 'UPDATE openmrs.location SET name = "'+ facilityTab[i].name +'", changed_by = 1, date_changed = "' + facilityTab[i].extractDate + '"  WHERE location.description LIKE "FOSAID: ' + facilityTab[i].fosaCode + ' TYPE%";';
                }

                con.query(sql, function (err, result) {
                    if (err) { 
                        let msg = 'Error when updating the location table for the instance ' + hostUrl +':' + port + '. SQL details : ' + sql;
                        messageBuffer = messageBuffer + msg + '.  DETAILS: ' + err + '.  ';
                    } else {
                        if (result.affectedRows==0){
                            exports.createNewOpenmrsLocation(con, f, hostUrl, port)
                        } 
                        if (result.affectedRows==1) {
                            let msg = f.name+ ' successfully updated on ' + hostUrl + ':' + port;
                            winston.info(msg);
                        }
                    }
                    
                });
                count = count + 1;
            }
            while(count < facilityTab.length){
                e++
            };
            messageBuffer = messageBuffer + ' ' +  'The list of the facilities (locations) has been succesfully updated on the openmrs instance ' + hostUrl + ':' + port;
            
        }
        callback(messageBuffer); 
    });
    
}


exports.createNewOpenmrsLocation = function(con, fc, host, port){
    var lat = null;
    var long = null
    var uuidVal = uuid();
    if(fc.coordinates!==null){
       var t = fc.coordinates.split(',')
       long  = t[0].substr(1);
       lat = t[1].slice(0, -1);
    }
    var sql = 'INSERT INTO openmrs.location (name, description, city_village, address3, state_province, country, latitude, longitude, date_created, county_district, retired, uuid, creator) \
               VALUES("' + fc.name + '", "' + fc.description + '", "' + fc.sector + '", "' + fc.cellule + '",  "' + fc.province + '", "Rwanda", "' + lat + '", "' + long + '", "' + fc.openingDate + '", "' + fc.district + '", 0, "' + uuidVal + '", 1);';
    con.query(sql, function (err, result) {
        if (err) {
            let msg = 'Error when inserting new facility in the location table for the instance ' + host +':' + port + '. SQL details : ' + sql;
            messageBuffer = messageBuffer + msg + '.  DETAILS: ' + err + '.  ';
        } else { 
            let msg = fc.name+ ' successfully created! on ' + host + ':' + port;
            winston.info(msg);

        }
    });

}


exports.reportEndOfProcess = function(reqForm, resForm, errorForm, statusCodeForm, messageForm) {
    resForm.set('Content-Type', 'application/json+openhim');
    var responseBody = messageForm;
    var stateLabel = "";
    let orchestrations = [];
    var headers = { 'content-type': 'application/json' }
    if (errorForm) {
      stateLabel = "Failed";
      winston.info(messageForm);
    } else {
      stateLabel = "Successful";
      winston.info(messageForm);
    }
    var orchestrationResponse = { statusCode: statusCodeForm, headers: headers }
    orchestrations.push(exports.buildOrchestration('Primary Route', new Date().getTime(), reqForm.method, reqForm.url, reqForm.headers, reqForm.body, orchestrationResponse, responseBody))
    resForm.send(exports.buildReturnObject(mediatorConfig.urn, stateLabel, statusCodeForm, headers, responseBody, orchestrations, { property: 'Primary Route' }));
}


exports.buildOrchestration = function (name, beforeTimestamp, method, url, requestHeaders, requestContent, resp, body) {
    var ur = new URI(url)
    return {
      name: name,
      request: {
        method: method,
        headers: requestHeaders,
        body: requestContent,
        timestamp: beforeTimestamp,
        path: ur.path(),
        querystring: ur.query()
      },
      response: {
        status: resp.statusCode,
        headers: resp.headers,
        body: body,
        timestamp: new Date()
      }
    }
}
  

exports.buildReturnObject = function(urn, status, statusCode, headers, responseBody, orchestrations, properties){
    var response = {
      status: statusCode,
      headers: headers,
      body: responseBody,
      timestamp: new Date().getTime()
    }
    return {
      'x-mediator-urn': urn,
      status: status,
      response: response,
      orchestrations: orchestrations,
      properties: properties
    }
}
  