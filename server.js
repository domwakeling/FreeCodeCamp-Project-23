var express = require('express');
var portToUse = process.env.PORT || 8080;

var app = express();

app.all('*', function(req,res) {
    
    var header = req.headers;
    var url = header['x-forwarded-for'];
    var lang = header['accept-language'].split(',')[0];
    var sys = header['user-agent'];
    sys = sys.substring(sys.indexOf("(") + 1, sys.indexOf(")"));
    
    var ret = {
        'ipaddress' : url,
        'language' : lang,
        'software' : sys
    }
    
    res.json(ret);
});

app.listen(portToUse, function() {
    console.log("Server started, listening on port", portToUse);
});