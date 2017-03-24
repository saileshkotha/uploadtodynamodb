
var AWS = require('aws-sdk');
var express = require('express');
var https = require('https');
var fs = require('fs');
var path = require('path');

var request = require("request");

var parser = require('parse-address');
var PythonShell = require('python-shell');
var zipcodes = require('zipcodes');
var humanname = require('humanparser');
var app = express();
var async = require('async');


AWS.config.update({
    region: "us-west-1",
    accessKeyId: "x",
    secretAccessKey: "AkL8r4VKD/x"
});

var svc = new AWS.DynamoDB();

var scanComplete = false,
    itemCountTotal = 0,
    consumedCapacityUnitsTotal = 0;

var scanParams = { TableName : 'Therapists',
    Select : 'COUNT' };

// scan is called iteratively until all rows have been scanned
//  this uses the asyc module to wait for each call to complete
//  before issuing the next.
async.until( function() { return scanComplete; },
    function (callback) {
        svc.scan(scanParams, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log(result);
                if (typeof (result.LastEvaluatedKey) === 'undefined' ) {
                    scanComplete = true;
                } else {
                    // set the start key for the next scan to our last key
                    scanParams.ExclusiveStartKey = result.LastEvaluatedKey;
                }
                itemCountTotal += result.Count;
                consumedCapacityUnitsTotal += result.ConsumedCapacityUnits;
                if (!scanComplete) {
                    console.log("cumulative itemCount " + itemCountTotal);
                    console.log("cumulative capacity units " + consumedCapacityUnitsTotal);
                }
            }
            callback(err);
        });
    },
    // this runs when the loop is complete or returns an error
    function (err) {
        if (err) {
            console.log('error in processing scan ');
            console.log(err);
        } else {
            console.log('scan complete')
            console.log('Total items: ' + itemCountTotal);
            console.log('Total capacity units consumed: ' + consumedCapacityUnitsTotal);
        }
    }
);













var server = app.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)

});
