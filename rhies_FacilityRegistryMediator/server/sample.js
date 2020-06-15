var http = require('http');
var response = null;
var server = http.createServer((req, rs) => {
  rs.setHeader('content-type', 'application/json+openhim');
  //res is an http.ServerResponse object
  showDetails(rs);

}).listen(9990);

http.request({url:'http://localhost',method:'',port:'9990'}, function(rq, rs){}).end();

showDetails = function(msg){
  console.log(typeof(msg));
  console.log(msg);
}