var fs      = require('fs');
var bristol=require('bristol');;
var moment  = require('moment');
var archiver = require('archiver');
var rimraf = require('rimraf');
var lastInitializeLogsDate;
var path = require("path");
const nconf = process.env.NODE_ENV === 'test' ? require('../config/test') : require('../config/config')

var logPath = nconf.system.logPath;


var initialize =function() {
    if (lastInitializeLogsDate == null || lastInitializeLogsDate != moment(new Date()).format("YYYYMMDD")) {
        //This set the last initialiZe date
       lastInitializeLogsDate = moment(new Date()).format("YYYYMMDD");

        console.log("Logs initialization...");
        // configure bristol
        // List in order from MOST to LEAST severe:
        bristol.setSeverities(['fatal', 'error', 'warn', 'info', 'debug']);

        // check whether we are in debugging context
        var debug = false;
        process.execArgv.forEach(function(arg) {
            if ((arg === '--debug') || (arg === '--debug-brk')) debug = true;
        });

        bristol._targets=[];

        var currentYear=moment(new Date()).format("YYYY");
        var currentMonth=moment(new Date()).format("MM");
        var previousMonth=moment(new Date()).subtract(1, 'months').format("MM")
        var previousYear=moment(new Date()).subtract(1, 'years').format("YYYY")

        var previousMonsthName =moment(new Date()).subtract(1, 'months').format("MMMM")
        var logYearPath = logPath + currentYear + "/";
        var logMonthPath = logYearPath + currentYear + "-" + currentMonth + "/"; 
        var logPreviousMonthPath = logYearPath + currentYear + "-" + previousMonth + "/"; 
        var logPreviousYearPath = logPath + previousYear + "/"; 


     
    
        //If previous month folder exist, zip it and delete it
        var dirToZip;
        var zipDirName;
        var zipFilePath;
        if (previousMonth != 12){
            dirToZip=logPreviousMonthPath;
            zipDirName= currentYear + '-'+ previousMonth;
            zipFilePath=logYearPath +'/' + currentYear + '-'+ previousMonth + '_'+  moment(new Date()).format("YYYYMMDDhhmmss")  + '.zip';
        } else {
            dirToZip=logPath + previousYear + "/" + previousYear + "-" + previousMonth + "/";
            zipDirName= previousYear + '-'+ previousMonth;
            zipFilePath= logPath + previousYear + "/" +'/' + previousYear + '-'+ previousMonth + '_'+  moment(new Date()).format("YYYYMMDDhhmmss")  + '.zip';
        }

        if (fs.existsSync(dirToZip)) {
            var archive = archiver('zip', {});
            var output = fs.createWriteStream(zipFilePath); 
            archive.directory(dirToZip , zipDirName);
            archive.pipe(output);
            archive.finalize();

            //delete folder when finished
            output.on('close', function() {
                rimraf(dirToZip, function () {});
            })   
        }


        // create the logfiles dir
        if (! fs.existsSync(logPath)) {
            fs.mkdirSync(logPath, '0750');
        }

        // create the logfiles year dir
        if (! fs.existsSync(logYearPath)) {
            fs.mkdirSync(logYearPath, '0750');
        }

        // create the logfiles month dir
        if (! fs.existsSync(logMonthPath)) {
            fs.mkdirSync(logMonthPath, '0750');
        }

    

        // ISO-8601 date format in momentjs syntax: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
        // Add targets
        // console
        bristol.addTarget('console')
            .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
            .withLowestSeverity('debug');

        var fileNamePrefix =  moment(new Date()).format("YYYYMMDD") + '_';

        // a file for all
       bristol.addTarget('file', {file: logMonthPath + fileNamePrefix + 'rhies-labwaretoopenmrs-mediator.log'} )
            .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
            .withLowestSeverity('info')

        // and a file for each level
        bristol.addTarget('file', {file: logMonthPath + fileNamePrefix + 'rhies-labwaretoopenmrs-mediator.fatal'})
            .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
            .withLowestSeverity('fatal')
            .withHighestSeverity('fatal');

        bristol.addTarget('file', {file: logMonthPath + fileNamePrefix + 'rhies-labwaretoopenmrs-mediator.error'})
            .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
            .withLowestSeverity('error')
            .withHighestSeverity('error');

        bristol.addTarget('file', {file: logMonthPath + fileNamePrefix + 'rhies-labwaretoopenmrs-mediator.warn'})
            .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
            .withLowestSeverity('warn')
            .withHighestSeverity('warn');

       bristol.addTarget('file', {file: logMonthPath+  fileNamePrefix + 'rhies-labwaretoopenmrs-mediator.info'})
            .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
            .withLowestSeverity('info')
            .withHighestSeverity('info');

        if (debug) {
            bristol.addTarget('file', {file: logMonthPath + fileNamePrefix + 'rhies-labwaretoopenmrs-mediator.debug'})
                .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
                .withLowestSeverity('debug')
                .withHighestSeverity('debug');
       }


     //delete this year aged logs  
     var deleteLogsAfter =nconf.system.deleteLogsAfter;
    if (deleteLogsAfter == null || deleteLogsAfter == "" || deleteLogsAfter=="-1"){
        deleteLogsAfter="0";
    }

    if (deleteLogsAfter !="0"){
        fs.readdir(logYearPath, function(err, files){
       files.forEach(function(file){
         if (path.extname(file)== ".zip"){
            try {
                var currentFileMonth= path.basename(file).split("_")[0].split("-")[1];
                var currentFileYear= path.basename(file).split("_")[0].split("-")[0];
                var currentFileDate=new Date(currentFileYear,(parseInt(currentFileMonth,10)-1) , 1); //begin of month  
                currentFileDate=moment(currentFileDate).endOf('month');
                var deletionDate=moment(new Date()).add(-1 * parseInt(deleteLogsAfter), "month");
        
                if (moment(currentFileDate).isBefore(deletionDate)){
                    try {
                       fs.unlinkSync(logYearPath  + file);
                    } catch (err) {
                        console.log(__filename + ': failed to delete : ' + file);
                    }
                }
            } catch (err) {
                console.log(err);
            }
         }
       });
     })
    }
     
       console.log("Logs initialized");
    }
}



exports.log = function(message) {
    initialize();
    bristol.log(message);
}

exports.info = function(message) {
    initialize();
    bristol.info(message);
}

exports.warn = function(message) {
    initialize();
    bristol.warn(message);
}

exports.error = function(message) {
    initialize();
    bristol.error(message);
}

exports.debug = function(message) {
    initialize();
    bristol.debug(message);
}


