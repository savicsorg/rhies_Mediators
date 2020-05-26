//In the case of ConvSet
if (utils.isAnArray(obs.groupMembers) === true) {
    // Initialize variables
    var e = 0;
    var datItems = [];
    var dhis2NewId = "";

    //Loop obs.groupMembers Table to find the right dhis2 Id and obs value
    for (e = 0; e < obs.groupMembers.length; e++){
       var mappingItem = _.find(mappingTable, function (item) {
         return Object.keys(item) == obs.groupMembers[e].concept.uuid;
       });

       //With the good matching on mappingItem call recursivelly getValue obs.groupMembers and dhis2NewId
       //And save the result in the datItems table
       if(utils.isFineValue(mappingItem) === true){
         dhis2NewId = Object.values(mappingItem);
         getValue (mappingTable, obs.groupMembers, booleanMappingTable, dhsi2Json, dhis2NewId, function (resultat) {
           datItems.push({ "dataElement": dhis2NewId, "value": resultat });
         });
       }
    }
    //Return the result as a datItems table
    callback(datItems);
}