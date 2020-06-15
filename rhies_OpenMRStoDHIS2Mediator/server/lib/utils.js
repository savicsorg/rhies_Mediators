'use strict'
const URI = require('urijs');
const _ = require('underscore');
const moment = require('moment');
var request = require('request');
var deasync = require('deasync');
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
    var y;
    var itemFound = false;

    for (i = 0; i < patient.person.attributes.length; i++) {
      if (patient.person.attributes[i].attributeType.display == "Civil Status") {
        y = i;
        itemFound = true;
        break;
      }
    }

    if (itemFound){
      var uuidStatus = patient.person.attributes[y].value.uuid;
      switch(uuidStatus){
        case '60eca8ce-777b-4556-8ea3-f7fa5a439ab2' :
          return "jREI0QafwGi";
          break;
        case '3cee0aca-26fe-102b-80cb-0017a47871b2' :
          return "fBMDDNWcRmw";
          break;
        case '3cd6e96c-26fe-102b-80cb-0017a47871b2' :
          return "cifrFF43poD";
          break;
        case '3cd6e6f6-26fe-102b-80cb-0017a47871b2' :
          return "hnIhYohBRIY";
          break;
        case '3cd6e55c-26fe-102b-80cb-0017a47871b2' :
          return "GglecqlxEWq";
          break;
        case '3cd6e246-26fe-102b-80cb-0017a47871b2' :
          return "GglecqlxEWq";
          break;
        default :
          return "";
      }
    } else {
      return "";
    }
    
  }
  return "";
}


exports.getConceptValue = function (obs, uuid) {
  if (exports.isFineValue(obs) == true) {
    var i;
    var yesFound = false;
    for (i = 0; i < obs.length; i++) {
      if (obs[i].concept.uuid == uuid) {
        yesFound = true;
        return obs[i].value;
        
      }
    }
    if (yesFound === false){
      return "";
    }
  } else {
    return "";
  }
}


exports.getContactGroupConceptValue = function (obs, uuid) {
  if (exports.isFineValue(obs) == true) {
    var i;
    var myIndex;
    var yesFound = false;
    for (i = 0; i < obs.length; i++) {
      if (obs[i].concept.uuid == "95b7a6fc-57b1-45b9-a595-467f6118b51e") {
        myIndex = i;
        yesFound = true;
        //Stop looping when the value is found
        break;
      }
    }
    if (yesFound) {
      if(exports.isAnArray(obs[myIndex].groupMembers)){
        return (exports.getConceptValue(obs[myIndex].groupMembers,uuid));
      } else {
        return ("");
      }
    } else {
      return "";
    }
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


exports.getDHIS2ContactGender = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3ce84c8e-26fe-102b-80cb-0017a47871b2':
        return 'dP9kDCGW6C1';
        break;
      case '3ce84b1c-26fe-102b-80cb-0017a47871b2':
        return 'SdIpSKZhA6a';
        break;
      default:
        return '';
    }
  } else {
    return '';
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


exports.getOccupationTypeConcept = function(patient){
  if (exports.isFineValue(patient.person.attributes) == true) {
    let i = 0;
    let y = 0;
    let tab = patient.person.attributes;
    for (i=0; i<tab.length; i++){
      if(tab[i].attributeType.display == 'Main Activity'){
        y = i;
        break;
      }
    }
    return tab[y].value;
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


exports.getDHIS2YesNoUnknown = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd6f600-26fe-102b-80cb-0017a47871b2':
        return 'Yes';
        break;
      case '3cd6f86c-26fe-102b-80cb-0017a47871b2':
        return 'No';
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
        return "true";
        break;
      case '3cd6f86c-26fe-102b-80cb-0017a47871b2':
        return "false";
        break;  
      default:
        return '';
        break;
    }
  } else {
    return '';
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


exports.getDHIS2DrugToxicityType = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case 'cf6b3ef3-d38a-11e8-b6e2-0c5b8f279a64':
        return 'IpoRdq5ZtH6';
        break;
      case '918b11a8-bbd8-44d5-9ba5-24bfac4b6a3d':
        return 'PJKFHFjoLcW';
        break;
      case '3ce5c888-26fe-102b-80cb-0017a47871b2':
        return 'fXUEeymr6Sb';
        break;
      case '47f1a68d-6b39-4101-95f0-ae0339a8c0ba':
        return 'EwvsL6PlHfD';
        break;
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2CBSClientOutcome = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '9034caa2-843e-4124-b64d-71b1fffd9ff0':
        return 'yzNVLmfly35';
        break;
      case '3cdc0d7a-26fe-102b-80cb-0017a47871b2':
        return 'gH0EgH6sS1Z';
        break;
      case '3ceb0ed8-26fe-102b-80cb-0017a47871b2':
        return 'UKKOKMZFOx0';
        break;
      case '5269c451-2a5a-4a54-ac8b-bae388e58a82':
        return 'hwYeeeJWm3T';
        break;
      case '08176d5d-3cbe-4c40-8436-26b2e26a1acf':
        return 'weBH1mytURu';
        break;
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2OverAllTreatmentAdherence = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cdef6c0-26fe-102b-80cb-0017a47871b2':
        return 'DftFE82Ae65';
        break;
      case '3cdef3d2-26fe-102b-80cb-0017a47871b2':
        return 'MBJmU3rhpPm';
        break;
      case '3cdef54e-26fe-102b-80cb-0017a47871b2':
        return 'nek4WjtVfoT';
        break;
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2ClientTPTOutcome = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '1e20e234-51d0-47a9-89b2-b359d8520481':
        return 'ldCad6nQhDx';
        break;
      case '35b9992e-c5e4-464c-b800-969adcfee12c':
        return 'NJPbN9YatIa';
        break;
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2TPTTherapyInProgress = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cdbfbc8-26fe-102b-80cb-0017a47871b2':
        return 'Gcj9CC1xD4e';
        break;
      case '3cd96052-26fe-102b-80cb-0017a47871b2':
        return 'ZZzqnrkube2';
        break;
      case '3ccca7cc-26fe-102b-80cb-0017a47871b2':
        return 'ChxoqpOQnwh';
        break;
      case 'ebc286a5-5b09-4960-b1c0-cf76108b70da':
        return 'ROD5srkOABi';
        break;
      case 'cf6b2d18-d38a-11e8-b6e2-0c5b8f279a64':
        return 'h5HoO3NbRSw';
        break;
      case '08176d5d-3cbe-4c40-8436-26b2e26a1acf':
        return 'wjqRdfo6VRP';
        break;
      default:
        return '';
    }
  } else {
    return "";
  }
}


exports.getDHIS2WHOStage = function (uuid) {
  if (exports.isFineValue(uuid) == true) {
    switch(uuid){
      case '3cd7ee16-26fe-102b-80cb-0017a47871b2':
        return 'svKQ8CX1NG1';
        break;
      case '3cd7ef9c-26fe-102b-80cb-0017a47871b2':
        return 'k5rhaBb4Vxl';
        break;
      case '3cd7f118-26fe-102b-80cb-0017a47871b2':
        return 'i8AQ5keQ28R';
        break;
      case '3cd7f294-26fe-102b-80cb-0017a47871b2':
        return 'oEspstl5HfP';
        break;
      default:
        return '';
    }
  } else {
    return ''
  }

}


exports.getOINameConceptValue = function(obs, uuid) {
  if (exports.isFineValue(obs) == true) {
    var i;
    var yesFound = false;
    for (i = 0; i < obs.length; i++) {
      if (obs[i].concept.uuid == uuid) {
        yesFound = true;
        return obs[i].value.display;
        
      }
    }
    if (yesFound === false){
      return "";
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


exports.isAnArray = function (value) {
  return Array.isArray(value);
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


exports.getdhis2ProvinceDistrictIds = function (patient) {
  if (exports.isFineValue(patient) == true && exports.isFineValue(patient.person) == true && exports.isFineValue(patient.person.preferredAddress) == true) {

    var FoundProvince = "";
    var FoundDistrict = "";

    var province = _.find(formMapping.provinces, function (item) {
      return Object.keys(item) == patient.person.preferredAddress.stateProvince;
    });

    var district = _.find(formMapping.districts, function (item) {
      return Object.keys(item) == patient.person.preferredAddress.countyDistrict;
    });
    
    if (exports.isFineValue(province) == true) {
      FoundProvince = Object.values(province);
    }

    if (exports.isFineValue(district) == true) {
      FoundDistrict = Object.values(district);
    }

    return {
      "dhis2ProvinceId": FoundProvince,
      "dhis2DistrictId": FoundDistrict,
      "village" : patient.person.preferredAddress.address1,
      "cellule" : patient.person.preferredAddress.address3
    };
  } else {
    return {
      "dhis2ProvinceId": "",
      "dhis2ProvinceId": "",
      "village" : "",
      "cellule" : ""
    };
  }




}


exports.getDhis2District = function (value, callback) {
  var options = {
    url: apiConf.api.dhis2.url + '/api/organisationUnits.json?filter=id:eq:' + value ,
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
        callback(resp.organisationUnits[0].id);
      } else {
        callback("");
      }
    }
  });
}


exports.getDHIS2PatientAddress = function(value, callback){
  
  if (exports.isFineValue(value) == true) {
    /* var toReturn = null;
    var options = {
      url: apiConf.api.dhis2.url + 'api/organisationUnits.json?filter=displayName:eq:' +  value + '&fields=path',
      headers: {
        'Authorization': 'Basic ' + new Buffer(apiConf.api.dhis2.user.name + ":" + apiConf.api.dhis2.user.pwd).toString('base64'),
        'Content-Type': 'application/json'
      }
    };

    request.get(options, function (error, response, body) {
      if (error) {
        console.log("Error : " + error);
        callback("")
      } else {
        var resp = JSON.parse(body);
        if (exports.isFineValue(resp) == true && exports.isFineValue(resp.organisationUnits) == true) {
          
          callback(resp.organisationUnits[0].path);
          
        } else {
          callback("");
        }
      }
    }); */

    callback("");

  } else {
    callback("");
  }
  
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
