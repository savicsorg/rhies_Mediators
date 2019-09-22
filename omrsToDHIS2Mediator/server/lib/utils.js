'use strict'
const URI = require('urijs')
const moment = require('moment');
var request = require('request');
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')

exports.buildOrchestration = (name, beforeTimestamp, method, url, requestHeaders, requestContent, res, body) => {
  let uri = new URI(url)
  return {
    name: name,
    request: {
      method: method,
      headers: requestHeaders,
      body: requestContent,
      timestamp: beforeTimestamp,
      path: uri.path(),
      querystring: uri.query()
    },
    response: {
      status: res.statusCode,
      headers: res.headers,
      body: body,
      timestamp: new Date()
    }
  }
}

exports.isFineValue = function (value) {
  if (value === null) {
    return false;
  }
  else if (value === undefined) {
    return false;
  }
  else if (value.constructor === "none".constructor) {
    if (value.length > 0) {
      return true;
    } else {
      return false;
    }
  }
  else if (value.constructor === [].constructor) {
    if (value.length > 0) {
      return true;
    } else {
      return false;
    }
  }
  else if (value.constructor === ({}).constructor) {
    if (Object.keys(value).length > 0) {
      return true;
    } else {
      return false;
    }
  }
  else if ((typeof value) == "number") {
    return true;
  } else {
    return false;
  }
}

exports.getPatientGenderDhis2Id = function (patient) {
  if (patient.person.gender.toUpperCase() == "F" || patient.person.gender.toUpperCase() == "FEMAL") {
    return "dP9kDCGW6C1";
  } else {
    return "SdIpSKZhA6a";
  }
}

exports.isDate = function (value) {
  if (exports.isString(value) == true) {
    //2019-09-12T00:00:00.000+0100
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}\+\d{4}/.test(value) == true) {
      return true;
    } else {
      return false
    }
  } else {
    return false
  }
}

exports.isNumeric = function (value) {
  return ((typeof value) == "number");
}

exports.convertToBoolean = function (value) {
  if (exports.isString(value) == true) {
    if ("YES OUI  1".toUpperCase().includes(value.toUpperCase())) {
      return true;
    }
    return false
  } else {
    return false
  }
}

exports.isString = function (value) {
  return ((typeof value) == "string");
}

exports.isObject = function (value) {
  return ((typeof value) == "object");
}


exports.getNewDate = function () {
  return moment(new Date()).format('YYYY-MM-DD');
}

exports.convertToDate = function (value) {
  return moment(value).format('YYYY-MM-DD');
}

exports.convertToNumber = function (value) {
  return parseInt(value, 10);
}


exports.getDhis2DropdownValue = function (value, callback) {
  var options = {
    url: apiConf.api.dhis2.url + "/api/options.json?&filter=id:eq:" + value + "&fields=code",
    headers: {
      'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
      'Content-Type': 'application/json'
    }
  };

  request.get(options, function (error, response, body) {
    if (error) {
      callback("");
    } else {
      var resp = JSON.parse(body);
      if (exports.isFineValue(resp) == true && exports.isFineValue(resp.options) == true) {
        callback(resp.options[0].code);
      } else {
        callback("");
      }
    }
  });
}

exports.buildReturnObject = (urn, status, statusCode, headers, responseBody, orchestrations, properties) => {
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
