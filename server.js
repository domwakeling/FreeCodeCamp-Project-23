var express = require('express');
var path = require('path');
var sassMiddleware = require('node-sass-middleware');
var mongo = require('mongodb').MongoClient;

// var url = require('url');
var herokuURL = 'https://doms-url.herokuapp.com/'
var portToUse = process.env.PORT || 8080;
var mongoURL = process.env.MONGO_URL || require('./keys.js').mongoURL;

var app = express();

app.use(sassMiddleware(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'views')));

app.get('*', function(req,res) {
    
    var reqURL = req.url;
    
    if (reqURL.length > 5 && reqURL.substr(0,5) == "/new/") {
        processNewRequest(res, reqURL.substr(5));
    } else {
        processLookup(res, reqURL.substr(1));
    }
});

function processNewRequest(res,reqURL) {
    // this is a very basic URL test and could be improved (but it's a very hard problem)
    if(!/^https?:\/\/[\S]+\.\S*$/.test(reqURL)) {
        var ret = {
            'error': 'URL provided is invalid'
        }
        res.json(ret);
    } else {
       lookupURL(res,reqURL);
    }
}

function processLookup(res, reqURL) {
    var cand = parseInt(reqURL);    // get the reqURL, which has leading / stripped already, as number
    if (isNaN(cand)) {
        res.redirect('/');          // deal with non-numerics by sending back to the instructions
    } else {
        lookupNumber(res, cand);    // it's a number, pass it on
    }
}

function lookupNumber(res, cand) {
    
    mongo.connect(mongoURL, function(err, db) {
        
        if(err) console.log(err);
        
        var collection = db.collection('urls');
        
        var results = collection.find({
            shortCode: cand
        }).toArray( function(err, docs) {
            
            if(err) console.log(err);
            
            if(docs.length > 0) {   // if we've found at least one entry, use the first one to redirect
                res.redirect(docs[0]['fullURL']);
            } else {                // put up a message
                var ret = {
                    'error' : 'That short URL is not recognised'
                }
                res.json(ret);
            }
            db.close();             // all done so we can close the database
        });
    });
}

function lookupURL(res, reqURL) {
    
    mongo.connect(mongoURL, function(err, db) {
        
        if(err) console.log(err);
        
        var collection = db.collection('urls');
        
        var results = collection.find({
            fullURL: reqURL
        }).toArray( function(err, docs) {
            
            if(err) console.log(err);
            
            if (docs.length > 0) {  // there's a match, packagae it up and return it
                var ret = {
                    'long_URL': docs[0]['fullURL'],
                    'short_URL': herokuURL + docs[0]['shortCode']
                }
                res.json(ret);
                db.close();
            } else {                // no match, we need to make a new entry
                storeNewURL(res, reqURL, db, collection);
            }
            
        })
        
    });
}

function storeNewURL(res, reqURL, db, collection) {
    
    var numCollection = db.collection('controls');  // get the controls collection ...
    var nextNum = 0;
    
    numCollection.find({
        'function' : 'nextNumber'
    }).toArray(function(err, docs) {
        
        if(err) console.log(err);                   // ... and in this async callback ...
        
        nextNum = docs[0]['nextNumber'];            // ... store nextNumber ...
        numCollection.update({                      // ... and update the database version ...
            'function' : 'nextNumber'
        }, {
            $inc: {'nextNumber' : 1}                // ... by incrementing it
        }, function(err) {
            
            if(err) throw err;                      // Now we have a number, so again with async ...
            
            var newDoc = {                          // ... make a new document to store ...
                'fullURL': reqURL,
                'shortCode': nextNum
            }
            
            collection.insert(newDoc, function(err, data) {

                if(err) throw err;
                
                var ret = {
                    'long_URL': reqURL,
                    'short_URL': herokuURL + nextNum
                }
          
                res.json(newDoc);                   // ... and once stored, finally return the
                db.close();                         //     doc to browser and close the database
                
            })
            
        });
        
    });
}

app.listen(portToUse, function() {
    console.log("Server started, listening on port", portToUse);
});