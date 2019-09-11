'use strict'
const URI = require('urijs')
const _ = require('underscore');
const utils = require('./utils')


exports.getForm1Value = function (dhsi2Id, fields, isdate) {
  var match = [
    {},
    {}
  ]

  var foundUUID = _.find(match, function (item) {
    return item.dhsi2Id == dhsi2Id;
  });


  if (utils.isFineValue(foundUUID) == true) {
    var concept = _.find(fields.encounter.obs, function (item) {
      return item.uuid == foundUuid.openmrsUuid;
    });

    if (utils.isFineValue(concept) == true && tils.isFineValue(concept.display) == true) {
      if (concept.display.includes(":")) {
        var conceptValue = concept.display.trim().split(":")[1].trim();
        if (isNaN(conceptValue) == false) {


        } else {
          if (isdate == true) {

          } else {
  
          }
        }
        return
      } else {
        return null;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }

}
