var mysql = require('mysql');
const { uuid } = require('uuidv4');
var config = require('../server/config/config');
var tools = require('../server/utils/tools');
var mongodbCon = require('../server/models/mongodbCon');
var winston = require('winston');
var myCron = require('node-cron');


exports.updateOpenmrsFacilitiesList = function(hostUrl, port, hostPwd, facilityTab){

    var sql = ""
    var con = mysql.createConnection({
    host: hostUrl,
    user: "root",
    password: hostPwd,
    database: "openmrs",
    port: port
    });

    con.connect(function(err) {
        if (err) {
            winston.info('Error when connecting to the instance : ' + hostUrl +':' + port + ' --->  ', err);
        } else {
            for(var i = 0; i < facilityTab.length; i++){
                
                let f = facilityTab[i]
                var lat = null;
                var long = null;
                if(f.coordinates!==null){
                    var t = f.coordinates.split(',')
                    long  = t[0].substr(1);
                    lat = t[1].slice(0, -1);
                }
                if(facilityTab[i].sector!==null && facilityTab[i].subdistrict!==null && facilityTab[i].province!==null && facilityTab[i].district!==null && lat!==null && long!==null){
                    sql = 'UPDATE openmrs.location SET name = "'+ facilityTab[i].name +'", city_village = "'+ facilityTab[i].sector +'",  address3 = "'+facilityTab[i].subdistrict+'", state_province="'+ facilityTab[i].province +'", county_district="'+ facilityTab[i].district +'", latitude="'+ lat +'", longitude="'+long+'"  WHERE location.description LIKE "FOSAID: ' + facilityTab[i].fosaCode + ' TYPE%";';
                } else{
                    sql = 'UPDATE openmrs.location SET name = "'+ facilityTab[i].name +'"  WHERE location.description LIKE "FOSAID: ' + facilityTab[i].fosaCode + ' TYPE%";';
                }

                con.query(sql, function (err, result) {
                    if (err) { 
                        winston.info(err);
                    } else {
                        if (result.affectedRows==0){
                            exports.createNewOpenmrsLocation(con, f, host)
                        } 
                        if (result.affectedRows==1) {
                            winston.info(f.name+ ' successfully updated on ' + hostUrl + '!');
                        }
                    }
                });
            }
        }
    });
}


exports.createNewOpenmrsLocation = function(con, fc, host){
    var lat = null;
    var long = null
    var uuidVal = uuid();
    if(fc.coordinates!==null){
       var t = fc.coordinates.split(',')
       long  = t[0].substr(1);
       lat = t[1].slice(0, -1);
    }
    var sql = 'INSERT INTO openmrs.location (name, description, city_village, state_province, country, latitude, longitude, date_created, county_district, retired, uuid, creator) \
               VALUES("' + fc.name + '", "' + fc.description + '", "' + fc.sector + '", "' + fc.province + '", "Rwanda", "' + lat + '", "' + long + '", "' + fc.openingDate + '", "' + fc.district + '", 0, "' + uuidVal + '", 0);';
    con.query(sql, function (err, result) {
        if (err) {
            winston.info(err)
        } else { winston.info(fc.name+ ' successfully created! on ' + host + '!'); }
    });

}

mongodbCon.connectToServer( function( err, client ) {
    var db = mongodbCon.getDb();
    if (err) winston.info("Database connection error : ", err);
    myCron.schedule(config.facilityregistry.pushingschedule, ()=>{
        var facTab = tools.getAllFacilities(db);
        var openmrsInstancesTab = config.facilityregistry.openmrsinstances
        for(var i=0; i<openmrsInstancesTab.length; i++){

            try{

                exports.updateOpenmrsFacilitiesList(openmrsInstancesTab[i].name, openmrsInstancesTab[i].port, openmrsInstancesTab[i].pwd, facTab);
            
            } catch(e){
                continue;

            } finally {
       
            }
            if (i == openmrsInstancesTab.length-1){
                winston.info('End of updating process for all the openmrs instances at ' + tools.getTodayDate());
            } 
        }
    });

});