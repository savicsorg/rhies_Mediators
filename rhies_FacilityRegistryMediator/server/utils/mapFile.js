var request = require('request');
var config = require('../config/config');
var deasync = require('deasync');
const mongodb = require('mongodb');
const winston = require('winston');
const MongoClient = mongodb.MongoClient;
var apiConfig = config;

exports.getProvinceName = function(myDB, idDHIS2, callback){
    
    /*switch(idDHIS2){

        case 'jUMVwrUlNqG':
            return 'East';
        case 'nBLRIqKNNOu':
            return 'Kigali City';
        case 'tuaLIYpCQzv':
            return 'North';
        case 'qICVQ5VD0Y7':
            return 'South';
        case 'psfB4ksRKp2':
            return 'West';
        default:
            return idDHIS2;

    }*/

    var pro = null;
    var idValue = idDHIS2;
    myDB.collection("provinces").find({id: idValue}, { projection: { _id: 0, id: 1, displayName: 1 } }).toArray( function(err, result) {
        if (err) {
            winston.info("Error while retrieving PROVINCE name from the database: ", err);
                      
        } else {
            pro =  result[0].displayName;
            callback(pro);
                      
        };
    });
};


exports.getDistrictName = function(myDB, idDHIS2, callback){

  /*  switch(idDHIS2){

        case 'XxBlJkEmJGQ':
            return 'Bugesera District';
        case 'bFXwg69YOeD':
            return 'Burera District';
        case 'pXalpffB0lo':
            return 'Gakenke District';
        case 'fSyvbMUZWqJ':
            return 'Gasabo District';
        case 'WOjncnBz0hi':
            return 'Gatsibo District';
        case 'o5Gxx8zOilJ':
            return 'Gicumbi District';
        case 'N9pKxz10nwa':
            return 'Gisagara District';
        case 'MEqs8VG1Rx3':
            return 'Huye District';
        case 'vb9Wtsjv0OS':
            return 'Kamonyi District';
        case 'DJKWdcLdPOI':
            return 'Karongi District';
        case 'fcW5X82FfpG':
            return 'Kayonza District';
        case 'rEmeA5Z7HcP':
            return 'Kicukiro District';
        case 'VqMwIodXtFZ':
            return 'Kirehe District';
        case 'zuLjFsLTx2m':
            return 'Muhanga District';
        case 'rNmqHqUm4Cf':
            return 'Musanze District';
        case 'ERRCgvW7La1':
            return 'Ngoma District';
        case 'urGSAaskBqL':
            return 'Ngororero District';
        case 'ARCA1tta4rF':
            return 'Nyabihu District';
        case 'QMTKhz1j2mA':
            return 'Nyagatare District';
        case 'jy5judMZtzS':
            return 'Nyamagabe District';
        case 'PBHtCUM6nkg':
            return 'Nyamasheke District';
        case 'MJ0JLxsTP70':
            return 'Nyanza District';
        case 'jqrJGsWovJs':
            return 'Nyarugenge District';
        case 'lU5vBlNgAW5':
            return 'Nyaruguru District';
        case 'yqapGWqiEra':
            return 'Rubavu District';
        case 'n95lDV3pgL5':
            return 'Ruhango District';
        case 'BtzzCdcgFli':
            return 'Rulindo District';
        case 'M6o8DrKq6P3':
            return 'Rusizi District';
        case 'DG8h5ijGxgO':
            return 'Rutsiro District';
        case 'PnnZRLwoD66':
            return 'Rwamagana District';
        default:
            return idDHIS2;

    }*/
    var dis = null
    var idValue = idDHIS2;
    myDB.collection("districts").find({id: idValue}, { projection: { _id: 0, id: 1, displayName: 1 } }).toArray( function(err, result) {
        if (err) {
            winston.info("Error while retrieving DISTRICT name from the database: ", err);
                      
        } else {
            dis =  result[0].displayName;
            callback(dis);
                      
        };
    });
     
};


exports.getSubDistrictName = function(myDB, idDHIS2, callback){

   /* switch(idDHIS2){

        case 'TiRTUBf0XSn':
            return 'Bushenge Sub District';
        case 'ncVHO9PKoOh':
            return 'Butaro Sub District';
        case 'uhjJRQ5PIKE':
            return 'Byumba Sub District';
        case 'b06Nmatvw3f':
            return 'Gahini Sub District';
        case 'OS0re4Y5ZwA':
            return 'Gakoma Sub District';
        case 'YoFjBm3qOTx':
            return 'Gihundwe Sub District';
        case 'KMmYr3zS8A6':
            return 'Gisenyi Sub District';
        case 'A0xbotZxXnk':
            return 'Gitwe Sub District';
        case 'OFUSA2nbeXd':
            return 'Kabaya Sub District';
        case 'MhdyPFz3alM':
            return 'Kabgayi Sub District';
        case 'WZwmUL5MmQR':
            return 'Kabutare Sub District';
        case 'NZxGSK1rg1c':
            return 'Kacyiru Sub District';
        case 'NbiuPoMmEoZ':
            return 'Kaduha Sub District';
        case 'GGehit0WNxN':
            return 'Kibagabaga Sub District';
        case 'mJRl6j7RPUp':
            return 'Kibilizi Sub District';
        case 'o1WEnRMOFGo':
            return 'Kibogora Sub District';
        case 'CotNU8eAEZD':
            return 'Kibungo Sub District';
        case 'YqoKpToX2RK':
            return 'Kibuye Sub District';
        case 'P4eFgU1Ono1':
            return 'Kigeme Sub District';
        case 'Uzty5ba4fGx':
            return 'Kinihira Sub District';
        case 'XA36D16QMFo':
            return 'Kirehe Sub District';
        case 'zbvFqVMWgzq':
            return 'Kirinda Sub District';
        case 'zzX5TYBI1ON':
            return 'Kiziguro Sub District';
        case 'KQWAFrokM3M':
            return 'Masaka Sub District';
        case 'PE2MxtJPBEX':
            return 'Mibilizi Sub District';
        case 'WjkCV9L9ecK':
            return 'Mugonero Sub District';
        case 'OoEtwLxlIHt':
            return 'Muhima Sub District';
        case 'CmrpITNSnZH':
            return 'Muhororo Sub District';
        case 'w85yxpS1DaV':
            return 'Munini Sub District';
        case 'sFGfRP4wPqe':
            return 'Murunda Sub District';
        case 'hgg0EGoK6s1':
            return 'Nemba Sub District';
        case 'nr6F3HKvHu5':
            return 'Ngarama Sub District';
        case 'x3lkZeS1aqt':
            return 'Nyagatare Sub District';
        case 'hDsNksdRjyK':
            return 'Nyamata Sub District';
        case 'hP84KHLWTST':
            return 'Nyanza Sub District';
        case 'vYchbWPRyrs':
            return 'Remera Rukoma Sub District';
        case 'p3YyC2h94pE':
            return 'Ruhango Sub District';
        case 'Gthhpk9cTe5':
            return 'Ruhengeri Sub District';
        case 'CtLpMRzBrwD':
            return 'Ruli Sub District';
        case 'vJqfrzsJe3D':
            return 'Rutongo Sub District';
        case 'TJDjWvjv7Eq':
            return 'Rwamagana Sub District';
        case 'OmudJVpFUAM':
            return 'Rwinkwavu Sub District';
        case 'jlu5IXTU2Pg':
            return 'Shyira Sub District';
        default:
            return idDHIS2;

    }*/

    var sub = null
    var idValue = idDHIS2;
    myDB.collection("subdistricts").find({id: idValue}, { projection: { _id: 0, id: 1, displayName: 1 } }).toArray( function(err, result) {
        if (err) {
            winston.info("Error while retrieving SUB DISTRICT name from the database: ", err);
                      
        } else {
            sub =  result[0].displayName;
            callback(sub);
                      
        };
    });
     

};


exports.getSectorName = function(myDB,idDHIS2, callback){
          
    var sec = null
    var idValue = idDHIS2;
    myDB.collection("sectors").find({id: idValue}, { projection: { _id: 0, id: 1, displayName: 1 } }).toArray( function(err, result) {
        if (err) {
            winston.info("Error while retrieving SECTOR name from the database: ", err);
                      
        } else {
            sec =  result[0].displayName;
            callback(sec);
                      
        };
    });

};
