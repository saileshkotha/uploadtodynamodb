
var AWS = require('aws-sdk');
var express = require('express');
var https = require('https');
var fs = require('fs');
var path = require('path');

var request = require("request");

var parser = require('parse-address');
var PythonShell = require('python-shell');
var zipcodes = require('zipcodes');


var app = express();
/* Prevent scraper from exiting on exception */
/*
 process.on('uncaughtException', function (err) {
 console.error(err);
 console.log("Node NOT Exiting...");
 });
 */
AWS.config.update({
    region: "us-west-1",
    accessKeyId: "x",
    secretAccessKey: "x/x"
});


var replaceHtmlEntites = (function() {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp": " ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return function(s) {
        return ( s.replace(translate_re, function(match, entity) {
            return translate[entity];
        }) );
    }
})();


function cleanArray(actual) {
    if (actual instanceof Array) {
        var newArray = new Array();
        for (var i = 0; i < actual.length; i++) {
            if (actual[i]) {
                newArray.push(actual[i]);
            }
        }
        return newArray;
    }else{
        return actual;
    }
}



var docClient = new AWS.DynamoDB.DocumentClient();


/*
 docClient.scan(params, function (err, data) {
 if (err) console.log(err);
 else {
 var items = data.Items;
 for(var i = 0; i< items.length ; i++){

 break;
 }

 }
 });*/


function uploadData(items, lastKey) {
    var item = items[0];
    item = JSON.parse(JSON.stringify(item).replace(/"\s+|\s+"/g,'"'));
    var record = {};
    record.id = item.id;
    try {
        if(item.fullname){
            record.host = item.fullname;
        }
    } catch (e) {
    }
    try {
        if (item.groups) {
            record.name = replaceHtmlEntites(item.groups);
        }
    } catch (e) {
    }
    try {
        if(item.imagepathons3){
            record["photo.s3path"] = item.imagepathons3;
        }

    } catch (e) {
    }
    try {
        if (item.phone) {
            record.phone = item.phone;
        }
    } catch (e) {
    }
    try {
        if (item.groupmeets) {
            record.schedule = item.groupmeets;
        }
    } catch (e) {

    }

    try {
        record.website = item.url;
    } catch (e) {
    }
    try {
        if (item.profiletitle) {
            record.host_title = replaceHtmlEntites(item.profiletitle);
        }
    } catch (e) {
    }

    try {
        record.finance = {}
        record.finance.fee = {}
        var fin = item.sessioncost.match(/([0-9]*[.])?[0-9]+/g);
        if (fin.length>0) {
            record.finance.fee.min = Math.min.apply(Math, fin);
            record.finance.fee.max = Math.max.apply(Math, fin);
        }
    } catch (e) {
    }
    record.works_with = {}
    try {
        if (item.Issues) {
            record.works_with.concerns = cleanArray(item.Issues);
        }
    } catch (e) {
        console.log(e);
    }
    try {
        if (item.Age) {
            record.works_with.ages = cleanArray(item.Age);
        }
    } catch (e) {
    }
    try {
        if(item["Mental Health"]){
            record.works_with.mental_health = cleanArray(item["Mental Health"]);
        }

    } catch (e) {
    }


    try {
        var address = item.address;
        address = address.split("").reverse().join("");
        var temp = address.match(/[0-9]{5}/)[0];
        address = address.split(/[0-9]{5}/)[1];
        address = address.split("").reverse().join("").trim();
        address = replaceHtmlEntites(address) + " " + temp.split("").reverse().join("");
        var options = {
            mode: 'text',
            args: [address]
        };
    } catch (e) {
        //console.log(e);
        //console.log("Address Unchanged");
        address = item.address;
        options = {
            mode: 'text',
            args: [address]
        };
    }
    //console.log(i);
    PythonShell.run('address.py', options, function (err, results) {
        if (err) throw err;
        //console.log(address)
        if (results[0] != "false") {
            var parsedAddress = JSON.parse(results[0]);
            //console.log(parsedAddress);
            record.address = {}
            record.address.line1 = " ";
            try {
                if (parsedAddress.AddressNumber) {
                    record.address.line1 = record.address.line1 + " " + parsedAddress.AddressNumber;
                }
            } catch (e) {
            }
            try {
                if (parsedAddress.StreetName) {
                    record.address.line1 = record.address.line1 + " " + parsedAddress.StreetName;
                }
            } catch (e) {
            }
            try {
                if (parsedAddress.StreetNamePostType) {
                    record.address.line1 = record.address.line1 + " " + parsedAddress.StreetNamePostType;
                }
            } catch (e) {
            }
            record.address.line2 = " ";
            try {
                if (parsedAddress.OccupancyType) {
                    record.address.line2 = record.address.line2 + " " + parsedAddress.OccupancyType;
                }
            } catch (e) {
            }
            try {
                if (parsedAddress.OccupancyIdentifier) {
                    record.address.line2 = record.address.line2 + " " + parsedAddress.OccupancyIdentifier;
                }
            } catch (e) {
            }
            try {
                if (parsedAddress.PlaceName) {
                    record.address.city = parsedAddress.PlaceName;
                }
            } catch (e) {
            }
            try {
                if (parsedAddress.StateName) {
                    record.address.state = parsedAddress.StateName;
                }
            } catch (e) {
            }
            try {
                if (parsedAddress.ZipCode) {
                    record.address.zip = parsedAddress.ZipCode;
                }
            } catch (e) {
            }

            try{

                if (parsedAddress.ZipCode) {
                    var hills = zipcodes.lookup(parseInt(parsedAddress.ZipCode));
                    record.address.city = hills.city;
                }
            }catch(e){

            }
            record.address.country = "US";

        }
        else{
            if (item.address) {
                record.address = replaceHtmlEntites(item.address);
            }
        }

        function walkclean(x) {
            var type = typeof x;
            if (x instanceof Array) {
                type = 'array';
            }
            if ((type == 'array') || (type == 'object')) {
                for (k in x) {
                    var v = x[k];
                    if ((v === '') && (type == 'object')) {
                        delete x[k];
                    } else {
                        walkclean(v);
                    }
                }
            }
        }
        walkclean(record);
        //console.log(record);
        //console.log(item);
        items.shift();

        var putParams = {
            TableName: "SupportGroup",
            Item: record
        };
        docClient.put(putParams, function(err, data) {
            if(err){
                console.log(JSON.stringify(record));
                console.log(err);
            }else{
                curr_batch = []
                if (items.length == 0) {
                    var params = {
                        TableName: 'psytodgroups',
                        ExclusiveStartKey: lastKey
                    };
                    console.log("Inserted")
                    console.log("Last Key");
                    console.log(lastKey)
                    if(lastKey){
                        scanAll(params);
                    }
                    else{
                        console.log("No Last key")
                    }
                } else {
                    uploadData(items, lastKey);
                }
            }
        });
    });

}



var params = {
    TableName : 'psytodgroups'
};


scanAll(params);

function scanAll(params) {

    docClient.scan(params, function (err, data) {
        if (err) console.log(err);
        else {
            console.log("Current batch");
            console.log(data.LastEvaluatedKey);
            var lastKey = data.LastEvaluatedKey;
            var items = data.Items;
            uploadData(items, lastKey);
        }
    });
}

var server = app.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)

});
