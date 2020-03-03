'use strict'
const URI = require('urijs');
const _ = require('underscore');
const moment = require('moment');
var request = require('request');
var formMapping = require("../lib/formMapping");
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

exports.getPatientMaritalStatusDhis2Id = function (patient) {
  if (exports.isFineValue(patient.person.attributes) == true) {
    var i;
    for (i = 0; i < patient.person.attributes.length; i++) {
      if (patient.person.attributes[i].value.uuid == "3cee0aca-26fe-102b-80cb-0017a47871b2") {
        return "fBMDDNWcRmw";
      } else if (patient.person.attributes[i].uui == "df488243-d1d5-4b50-ae04-40b4ffdcf934") {
        return "jREI0QafwGi"
      } else if (patient.person.attributes[i].uui == "3cd6e6f6-26fe-102b-80cb-0017a47871b2") {
        return "hnIhYohBRIY"
      } else if (patient.person.attributes[i].uui == "3cd6e96c-26fe-102b-80cb-0017a47871b2") {
        return "cifrFF43poD"
      }
    }
  }
  return "";
}

exports.getConceptValue = function (obs, uuid) {
  if (exports.isFineValue(obs) == true) {
    var i;
    for (i = 0; i < obs.length; i++) {
      if (obs[i].concept.uuid == uuid) {
        return obs[i].value;
      }
    }
    return "";
  } else {
    return "";
  }
}


exports.getDHIS2Occupation = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    if (uuid == "3cd6f600-26fe-102b-80cb-0017a47871b2") {
      return "gdiI0dcLkXv";
    } else
      return "JUyi47p8XCc";
  } else {
    return "";
  }
}


exports.getDHIS2RecencyAssayResult = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '819f5ebe-0b3e-44ba-b435-8f3d1b7bb130':
        return 'MCaRcKcQByZ';
        break;
      case '9340dede-5124-49cf-9b3c-5153cc0e537f':
        return 'Uz46DvWmRpz';
        break;
      default:
        return '';
    }
  } else {
    return "";
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



exports.getdhis2ProvinceDistrictIds = function (patient, ) {
  if (exports.isFineValue(patient) == true && exports.isFineValue(patient.person) == true && exports.isFineValue(patient.person.addresses) == true) {

    var province = _.find(formMapping.provinces, function (item) {
      return Object.keys(item) == patient.person.addresses[0].stateProvince;
    });

    var district = _.find(formMapping.districts, function (item) {
      return Object.keys(item) == patient.person.addresses[0].countyDistrict;
    });
    var FoundProvince = "";
    var FoundDistrict = "";

    
    if (exports.isFineValue(province) == true) {
      FoundProvince = Object.values(province)
    }

    if (exports.isFineValue(district) == true) {
      FoundDistrict = Object.values(district)
    }

    return {
      "dhis2ProvinceId": FoundProvince,
      "dhis2DistrictId": FoundDistrict
    };
  } else {
    return {
      "dhis2ProvinceId": "",
      "dhis2ProvinceId": ""
    };
  }




}


exports.getDhis2District = function (value, callback) {
  var options = {
    url: apiConf.api.dhis2.url + "/api/organisationUnits.json?filter=id:eq:" + value,
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
      if (exports.isFineValue(resp) == true && exports.isFineValue(resp.organisationUnits) == true) {
        callback(resp.organisationUnits[0].displayName);
      } else {
        callback("");
      }
    }
  });
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
