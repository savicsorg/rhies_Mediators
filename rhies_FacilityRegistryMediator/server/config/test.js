const async = require('async');
async.parallel(
    [
        function(callback){
            setTimeout(function(){
                callback(null, 20*10);
            }, 10000);
        },
        function(callback){
            setTimeout(function(){
                callback(null, 20*20);
            }, 20000);
        },
        function(callback){
            setTimeout(function(){
                callback(null, 20*30);
            }, 30000);
        },
        function(callback){
            setTimeout(function(){
                callback(null, 20*40);
            }, 40000);
        }
    ], 
    function(err, allResults){
        if(err){
            console.log('error ' + err);
            var province = null;
            var district = null;
            var subdistrict = null;
            var sector = null;
        } else {
            var province = allResults[0];
            var district = allResults[1];
            var subdistrict = allResults[2];
            var sector = allResults[3];
        }
        
        console.log('Province : ' + province);
        console.log('district : ' + district);
        console.log('subdistrict : ' + subdistrict);
        console.log('sector : ' + sector);
    }
);