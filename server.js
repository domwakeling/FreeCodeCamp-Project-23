var express = require('express');
var path = require('path');
var sassMiddleware = require('node-sass-middleware');
// var url = require('url');
var portToUse = process.env.PORT || 8080;
var mongoURL = process.env.MONGO_URL || require('./keys.js').mongoURL;

var months = ['January', 'February', 'March', 'April',
              'May', 'June', 'July', 'August', 'September',
              'October', 'November', 'December'];

var app = express();

function naturalDate(date) {
    return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

app.use(sassMiddleware(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'views')));

app.get('*', function(req,res) {
    
    if(req.url.length > 1) {
        // set up an empty return object "in case"
        var ret = {
            'unix': null,
            'natural' : null
        };
        // get the potential date info
        var potDate = req.url.substr(1).replace(/%20/g, " ");
        // check whether a number, in which case timestamp
        if (!/\D/.test(potDate)) {
            var myDate = new Date(parseInt(potDate) * 1000)
            ret.unix = parseInt(potDate);
            ret.natural = naturalDate(myDate);
        }
        // create a date; may be invalid ...
        var myDate = new Date(potDate);
        // if valid, do thing
        if(!isNaN(myDate.getHours())) {
            ret.natural = naturalDate(myDate);
            ret.unix = Math.floor(myDate.getTime() / 1000);
        }
        res.json(ret);
    }
});

app.listen(portToUse, function() {
    console.log("Server started, listening on port", portToUse);
});