'use strict'
const URI = require('urijs');
const _ = require('underscore');
const moment = require('moment');
var request = require('request');
var OpenMRSPatientConcepts = require('../lib/OpenMRSPatientConcepts');
const apiConf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')
var newLine = "\r\n";


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

exports.getValueFromArray = function (table, targetObject, valueToSearch, valueToReturn) {
  if (table == null || table == undefined) {
    return "";
  } else {
    var i;
    for (i = 0; i < table.length; i++) {
      if (table[i][targetObject]["uuid"] == OpenMRSPatientConcepts.value[valueToSearch].uuid) {
        return table[i][valueToReturn];
      }
    }
  }
  return "";
}

exports.getValueFromArrayList = function (table, targetObject, valueToSearch, valueToReturn) {
  if (table == null || table == undefined) {
    return "";
  } else {
    var i;
    for (i = 0; i < table.length; i++) {
      if (table[i][targetObject]["uuid"] == OpenMRSPatientConcepts.value[valueToSearch].uuid) {
        var valueList = OpenMRSPatientConcepts.value[valueToSearch].list
        var j;
        for (j = 0; j < table.length; j++) {
          if (table[i]["value"]["uuid"] == valueList[j]["uuid"]) {
            return valueList[j]["value"];
          }
        }
      }
    }
  }
  return "";
}


exports.getDateValue = function (data) {
  if (data == null || data == undefined) {
    return "";
  } else {
    return exports.convertToDate(data);
  }
}

exports.getValue = function (data) {
  if (data == null || data == undefined) {
    return "";
  } else {
    return data;
  }
}

exports.getGender = function (data) {
  if (data == null || data == undefined) {
    return "";
  } else {
    if (data.toUpperCase().startsWith("F")) {
      return "female";
    }
    if (data.toUpperCase().startsWith("M")) {
      return "male";
    }
    return "";
  }
}


exports.getNewDate = function () {
  return moment(new Date()).format('YYYY-MM-DD');
}

exports.getLastError = function (ResponseBody) {
  var body = null;
  if (exports.isObject(ResponseBody)) {
    body = ResponseBody;
  } else {
    body = JSON.parse(ResponseBody);
  }

  if (exports.isFineValue(body) == false) {
    return ""
  } else {
    var error = "";
    if (exports.isFineValue(body.issue)) {
      var i = 0;
      for (i = 0; i < body.issue.length; i++) {
        error = error + body.issue[i].details.text + newLine;
      }
    }
    return error;
  }
}

exports.convertToDate = function (value) {
  return moment(value).format('YYYY-MM-DD');
}

exports.convertToNumber = function (value) {
  return parseInt(value, 10);
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
