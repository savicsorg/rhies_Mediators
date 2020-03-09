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
      } else if (patient.person.attributes[i].uui == "3cd6e246-26fe-102b-80cb-0017a47871b2") {
        return "GglecqlxEWq"
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


exports.getDHIS2RelationOfContact = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '78240034-73f3-46d8-b688-81fb99f27056':
        return 'mzWU3p77ybU';
        break;
      case 'a71fff61-4db8-43ce-98f8-5de7f689f560':
        return 'ABFDAJwKeRZ';
        break;
      case 'e42027db-5008-4cb0-8131-af2d84f59734':
        return 'C58YCNuA64x';
        break;
      case 'ca27eadb-c14d-414e-8db9-694b3831e719':
        return 'zDFb1kASBZ8';
        break;
      case 'a8415b6a-065d-4cd6-9c70-4cdcec7bf8ef':
        return 'gTyCR0HFnjp';
        break;
      case 'f95bdebd-c174-4eaa-86cf-067f78db5364':
        return 'c6lPSpoY2T5';
        break;
      case '825ee96c-5277-4b29-bece-7d94e654da34':
        return 'LUcOAQklmNQ';
        break;
      case '7f0dd8e6-f0c3-4cb1-a81e-24391fc7200b':
        return 'S9NJxxEdqyk';
        break;
      case '98463468-4bc0-4df0-8b78-ad5e208c5d2a':
        return 'BRDfNrkhRRW';
        break;
      case '1394d37f-38ca-4f8a-a486-ac46e0ed7523':
        return 'XJERkeIHfcE';
        break;
      case 'd0385b0e-c9ac-4f63-ab8d-b6273c029f9d':
        return 'iKzBZiMwvGw';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ContactHivStatus = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd3a7a2-26fe-102b-80cb-0017a47871b2':
        return 'ITvtdUBslbU';
        break;
      case '3cd28732-26fe-102b-80cb-0017a47871b2':
        return 'Pey8Tb56rwN';
        break;
      case '3cd6fac4-26fe-102b-80cb-0017a47871b2':
        return 'kNRJ08nuqpC';
        break;           
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2PlannedReferenceType = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'c1ef1230-a9f7-4593-bdc8-1e9a08d45968':
        return 'AbJydX5nX3k';
        break;
      case '5e053da8-f8ac-4f4d-902f-dba756a312a5':
        return 'IV8M4e6l5oI';
        break;
      case 'e7fbe2c7-b9c4-4caa-83f3-3fc327a225c4':
        return 'Fl4NhPnptVk';
        break;
      case '35de662a-63de-4dbc-92c4-2b08165406ab':
        return 'loFQ4dZf0eq';
        break;
      case 'd195e749-fa4a-43e3-8ceb-a72f25fb2be4':
        return 'MCTcHYKya23';
        break;
      case '6c93ead4-d189-4476-a81d-1bef16bda6a4':
        return 'PVLjZ2ZWQVS';
        break;
      case '8919a43c-fdee-4861-9fd8-ff068d4d740c':
        return 'Sr5tjR2oQHf';
        break;            
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ReasonContactNotReceived = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'e5dbe475-9116-4ed6-9349-6ab652bf9b13':
        return 'aALfEtMhQbD';
        break;
      case '535dcc8a-71fb-47a1-89c6-1e0247ac4b6b':
        return 'KoBWJrNz0wM';
        break;
      case '4db56fa7-e8cc-4ab4-b1bb-22a603dfdb35':
        return 'vYReWqiCniP';
        break;
      case '5a3402d4-983b-4015-b673-5d76b6a7beef':
        return 'TyZkSOjZczV';
        break;
      case '55bf58e2-48ff-41cf-a4a4-4b4feba2a140':
        return 'YRAKNkQqLE0';
        break;
      case '12beb608-5f22-43d1-afc0-f7aef355051d':
        return 'XrI9DVozzi8';
        break;
      case '2138c5f5-ce1d-4e96-9b9b-c1ca6fc21510':
        return 'TJ4eVIVbxgL';
        break;           
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ContactNotifier = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'd12bec46-f525-41b2-99c6-bd51bda4046c':
        return 'gD4MJ7POPEz';
        break;
      case 'f7908667-e296-4be4-b41e-26bc4b5ceccb':
        return 'OG01ZScE7Xb';
        break;
      case 'ab6fcd11-6531-4fcf-bfb2-a214b88c0d29':
        return 'zwjBu20ltE5';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2NotificationApproach = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'c1ef1230-a9f7-4593-bdc8-1e9a08d45968':
        return 'ld7eCEmHmL0';
        break;
      case '5e053da8-f8ac-4f4d-902f-dba756a312a5':
        return 'V85Z8rIMnOO';
        break;
      case 'e7fbe2c7-b9c4-4caa-83f3-3fc327a225c4':
        return 'RwjddwTRVM4';
        break;
      case '35de662a-63de-4dbc-92c4-2b08165406ab':
        return 'IuNYK8OIZYq';
        break;
      case 'd195e749-fa4a-43e3-8ceb-a72f25fb2be4':
        return 'jdo1YiXyfKn';
        break;
      case '6c93ead4-d189-4476-a81d-1bef16bda6a4':
        return 'PCJldbuZKlB';
        break;
      case '8919a43c-fdee-4861-9fd8-ff068d4d740c':
        return 'BN8qSnZM57k';
        break;              
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ReasonContactNotTested = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '':
        return '';
        break;
      case '':
        return '';
        break;
      case '':
        return '';
        break;              
      default:
        return '';
    }
  } else {
    return "";
  }
}



exports.getDHIS2ContactHivResult = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd3a7a2-26fe-102b-80cb-0017a47871b2':
        return 'HgLe4Xenycn';
        break;
      case '3cd28732-26fe-102b-80cb-0017a47871b2':
        return 'YEOVngsByWK';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2OuiNonResponse = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd6f600-26fe-102b-80cb-0017a47871b2':
        return 'C2BW6i7KIr9';
        break;
      case '3cd6f86c-26fe-102b-80cb-0017a47871b2':
        return 'R4fVlOAVmEw';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}



//Form 2 DHIS2 Dropdown retrieving function
exports.getDHIS2IndexCaseType = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '87842c52-dc3d-41d7-9baa-9c0da45c5df4':
        return 'EWjLBp7rpZf';
        break;
      case 'c7df527f-eef0-4cdc-b142-c5a387b4c363':
        return 'rFmwPYhSTmm';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ARTStartLocation = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'e4a2d73e-fa66-42cf-b9e4-c61da0fb041a':
        return 'ZcjMMzq1Dcv';
        break;
      case '8fa7c91c-5865-4216-bc10-f8857f116556':
        return 'Uuj3Wc8u7Az';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ResidencyType = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '054266d6-b451-496a-892e-9249d52a0d44':
        return 'dIAODvHtlhX';
        break;
      case '48a489e3-37f1-40df-8e7b-a2e7ba2371ec':
        return 'vT0iGs8IW51';
        break;
      case '6e7401f4-ed93-4c3f-a208-73ec7a1a9126':
        return 'z9gpetn6EdK';
        break;
      case '48a489e3-37f1-40df-8e7b-a2e7ba2371ec':
        return 'NmD5WModmzT';
        break;
      case '43021ec7-dea2-48c9-aea2-fce89d6bcd8d':
        return 'Frig0xURxjh';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2OccupationType = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd9757e-26fe-102b-80cb-0017a47871b2':
        return 'W5jXNN7ugjW';
        break;
      case '3cd976f0-26fe-102b-80cb-0017a47871b2':
        return 'FB6f2GGlkuB';
        break;                 
      default:
        return 'CAbIozgNu5L'; //Other occupation, because of unmatching data between OpenMRS and DHIS2
    }
  } else {
    return "";
  }
}


exports.getDHIS2YesNoRefuseUnknown = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd6f600-26fe-102b-80cb-0017a47871b2':
        return 'SjvT6az0YMa';
        break;
      case '3cd6f86c-26fe-102b-80cb-0017a47871b2':
        return 'AHH8ZhIlQ9z';
        break;
      case 'efab937b-853e-47da-b97e-220f1bdff97d':
        return 'MABnwD1nt3B';
        break; 
      case '3cd6fac4-26fe-102b-80cb-0017a47871b2':
        return 'oZhzCABE3Pr';
        break;                
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2HivTestingClinic = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cdc8426-26fe-102b-80cb-0017a47871b2':
        return 'wxGTnGvzPcf';
        break;
      case '0a48138e-f478-4ad7-bb10-d9efdbf9fe27':
        return 'LOYaimPK3ky';
        break;
      case '2b9fd535-2222-4418-9249-ddb851362424':
        return 'u6TRk2Z7yws';
        break; 
      case '8fa7c91c-5865-4216-bc10-f8857f116556':
        return 'hWsM7iCZ2Na';
        break;
      case 'd261f305-93ee-47ef-a327-0243783637e0':
        return 'EurkobCvjG4';
        break;
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2YesNoResponse = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd6f600-26fe-102b-80cb-0017a47871b2':
        return 'I7B4r9m1iIZ';
        break;
      case '3cd6f86c-26fe-102b-80cb-0017a47871b2':
        return 'g9WSz3pDHf1';
        break;                 
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2Form2RecencyAssayResult = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'fb3b2a61-4f4b-46b2-9187-9ec769349a44':
        return 'DlNtNOCwYMB';
        break;
      case '819f5ebe-0b3e-44ba-b435-8f3d1b7bb130':
        return 'J9MtIYciHSh';
        break;
      case '3cd28732-26fe-102b-80cb-0017a47871b2':
        return 'FPSW8E0pHU9';
        break;
      case '9340dede-5124-49cf-9b3c-5153cc0e537f':
        return 'mdAUkRi9txc';
        break;                
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ReasonNotInitiatedOnTPT = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'bf6340df-3048-497b-9afe-3c574db3b362':
        return 'xODDyc7G5bz';
        break;
      case '58e3707d-3310-4560-b7a8-ad963ad302cb':
        return 'c5v4ICtJ3wn';
        break;
      case '8f77f097-f2d4-4c26-97c6-a32863dd2dec':
        return 'NWhBWwl7RqM';
        break;
      case '39cecd62-41b5-4673-a6aa-54cb5fd1246b':
        return 'NUbmYicRCUp';
        break;
      case '3c4ef122-ce21-4b2f-b9e7-65f5d84a7758':
        return 'nOenSUVffWd';
        break;               
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2FinalRitaRecencyResult = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'fb3b2a61-4f4b-46b2-9187-9ec769349a44':
        return 'zauCXHkR38N';
        break;
      case '819f5ebe-0b3e-44ba-b435-8f3d1b7bb130':
        return 'znjxam2pcAs';
        break;
      case '9340dede-5124-49cf-9b3c-5153cc0e537f':
        return 'XIr1rKSNWmR';
        break;     
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2Boolean = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd6f600-26fe-102b-80cb-0017a47871b2':
        return true;
        break;
      case '3cd6f86c-26fe-102b-80cb-0017a47871b2':
        return false;
        break;  
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ReasonARTChangedOrStopped = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd49432-26fe-102b-80cb-0017a47871b2':
        return 'MvibOcy7W7e';
        break;
      case 'e9f7f336-1b02-4734-99bd-3cb15fa4a2b6':
        return 'NlC64TrTfJ8';
        break;
      case '3cde143a-26fe-102b-80cb-0017a47871b2':
        return 'lMWlaQJHTru';
        break;
      case '3cdd8132-26fe-102b-80cb-0017a47871b2':
        return 'sxPyoZKD95U';
        break;
      case '3cccecdc-26fe-102b-80cb-0017a47871b2':
        return 'ADFsRPLCDTt';
        break;
      case '3cee7fb4-26fe-102b-80cb-0017a47871b2':
        return 'QIu05NTRtG4';
        break;  
      default:
        return 'QIu05NTRtG4';  // Will be Other for all the unmatched data from OpenMRS
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
