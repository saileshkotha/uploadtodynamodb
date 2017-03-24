
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
/* Prevent scraper from exiting on exception */
/*
 process.on('uncaughtException', function (err) {
 console.error(err);
 console.log("Node NOT Exiting...");
 });
 */
AWS.config.update({
    region: "us-west-1",
    accessKeyId: "AKIAJSXUQYSY6AJPIEAA",
    secretAccessKey: "AkL8r4VKD/HzLiKYQ5u5hPhpWIJGpJWKUEe9Mony"
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


function uploadData(items, lastKey, curr_batch) {
    var item = items[0];
    item = JSON.parse(JSON.stringify(item).replace(/"\s+|\s+"/g,'"'));
    var record = {};
    record.id = item.id;

    try {
        if (item.fullname) {
            var parsed = humanname.parseName(replaceHtmlEntites(item.fullname));
            record.name = {};
            if (parsed.salutation) {
                record.name.prefix = parsed.salutation;
            }
            if (parsed.firstName) {
                record.name.first = parsed.firstName;
            }
            if (parsed.middleName) {
                record.name.middle = parsed.middleName;
            }

            if (parsed.lastName) {
                record.name.last = parsed.lastName
            }
            if (parsed.suffix) {
                record.name.suffix = parsed.suffix
            }
            record.name.full = replaceHtmlEntites(item.fullname)
        }
    } catch (e) {
        record.name = replaceHtmlEntites(item.fullname)
    }
    try {
        record.photo = {}
        if(item.imagepathons3){
            record.photo.s3path = item.imagepathons3;
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
        if (item.Specialities) {
            record.specialty = cleanArray(item.Specialities);
        }
    } catch (e) {
    }

    try {
        if (item["Treatment Orientation"]) {
            record.types_of_therapy = cleanArray(item["Treatment Orientation"]);
        }
    } catch (e) {
    }


    try {
        qualif = {};
        qualifitems = item.Qualifications;
        for (j = 0; j < qualifitems.length; j++) {
            qualif[(qualifitems[j].split(":")[0]).trim()] = (qualifitems[j].split(":")[1]).trim()
        }
        record.qualifications = {}

        if (qualif["Years in Practice"]) {
            record.qualifications.experience = qualif["Years in Practice"]
        }
        if (qualif["School"]) {
            record.qualifications.school = qualif["School"]
        }
        if (qualif["Year Graduated"]) {
            record.qualifications.graduation_year = qualif["Year Graduated"]
        }
        try {
            if (qualif["License No. and State"]) {
                record.qualifications.license_num = qualif["License No. and State"].split(" ")[0]
                record.qualifications.license_state = qualif["License No. and State"].split(" ")[1]
            }
        } catch (e) {
        }
    }catch(e){
        if (item.Qualifications) {
            record.qualifications = item.Qualifications;
        }
    }


    try {
        qualif = {};

        qualifitems = item.Finances;
        for (j = 0; j < qualifitems.length; j++) {
            if(qualifitems[j].split(":").length > 1){
                qualif[(qualifitems[j].split(":")[0]).trim()] = (qualifitems[j].split(":")[1]).trim()
            }

        }
        record.finance = {}


        if (qualif["Sliding Scale"]) {
            if(qualif["Sliding Scale"] == "Yes")
                record.finance.sliding_scale = true;
            else
                record.finance.sliding_scale = false;
        }
        if (qualif["Accepts Insurance"]) {
            if(qualif["Accepts Insurance"] == "Yes")
                record.finance.accepts_insurance = true;
            else
                record.finance.accepts_insurance = false;
        }
        if (qualif["Accepted Payment Methods"]) {
            record.finance.payment_method = cleanArray(qualif["Accepted Payment Methods"].split(","))
        }
        record.finance.fee = {}
        if (qualif["Avg Cost (per session)"]) {
            var fin = qualif["Avg Cost (per session)"].match(/([0-9]*[.])?[0-9]+/g);
            if (fin.length > 0) {
                record.finance.fee.min = Math.min.apply(Math, fin);
                record.finance.fee.max = Math.max.apply(Math, fin);
            }
        }

    }catch(e){
        if (item.Finances) {
            record.finance = item.Finances;
        }
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
            record.title = replaceHtmlEntites(item.profiletitle);
        }
    } catch (e) {
    }
    try {
        var fin = item.sessioncost.match(/([0-9]*[.])?[0-9]+/g);
        if (fin.length>0) {
            record.finance["fee.min"] = Math.min.apply(Math, fin);
            record.finance["fee.max"] = Math.max.apply(Math, fin);
        }
    } catch (e) {
    }

    record.works_with = {};

    try {
        if (item.Issues) {
            record.works_with.concerns = cleanArray(item.Issues);
        }
    } catch (e) {
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
        if(item["Modality"]){
            record.works_with.groups = cleanArray(item["Modality"]);
        }
    } catch (e) {
    }

    try {
        if(item["Sexuality"]){
            record.works_with.sexuality = cleanArray(item["Sexuality"]);
        }
    } catch (e) {
    }

    try {
        if(item["Religious Orientation"]){
            record.works_with.religion = item["Religious Orientation"];
        }
    } catch (e) {
    }
    try {
        if(item["description"]){
            record.bio = item["description"];
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
            //console.log("---------------Error------------------");

        }
        //console.log(record.id);
        //console.log(record);
        //console.log("Done---------------------------------------------------------------");

        //console.log(items.length);

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
        items.shift();

        var putParams = {
            TableName: "Therapists",
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
                        TableName: 'psytodtherapists',
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
    TableName : 'psytodtherapists',
    ExclusiveStartKey: {id: "1489991030307"}
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
