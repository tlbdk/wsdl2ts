"use strict";

/// <reference path="typings/index.d.ts" />

let fs = require('fs');
let XMLUtils = require('./src/xmlutils.js');
let wsdlToDefinition = require('./src/wsdlutils.js').wsdlToDefinition;
let getSchemaXML = require('./src/wsdlutils.js').getSchemaXML;
let xsd = require('libxml-xsd');

var wsdlXml = fs.readFileSync("/Users/trbe/git/REST2SOAPTest/rest2soap-test-kotlin/src/main/resources/checkCustomer.wsdl", 'utf8');
var definition = wsdlToDefinition(wsdlXml);

var request = {
    "test": "",
    "KNSIP22_TI": {
        "KKS_FASI_V22": {
            "DYNCALL_PGMNR": "",
            "VER_I": 1,
            "VER_O": 1,
            "TRACE_KD": 1,
            "FUNCTION": 1,
            "CNT_ROWS_I": 1,
            "CNT_ROWS_O": 1,
            "LNG_INPUT": 1,
            "LNG_OUTPUT": 1,
            "FRA_TS": "",
            "TIL_TS": "",
            "FRA_DT": "",
            "FORCER": "",
            "SBSYST": "",
            "PROGRAM_ID": "",
            "DAGS_DT": "",
            "KONCERN_ID": "",
            "OE_ENHEDS_GR": "",
            "IP_DATA_GR": "",
            "KONTOLAND_KD": "",
            "USER_INV_ID": "",
            "SPKD": "",
            "BRID": "",
            "SBIT": "",
            "SBID": "MTIzNDU2Nzg5MA==",
            "SBRN": "",
            "VER_II": 1,
            "VER_OO": 1,
            "VER_RR": 1,
            "FYLD": ""
        },
        "KALD_TP": "",
        "INV_ID": "",
        "FELT_TXNR": [1.0, 1.0, 1.0, 1.0, 1.0]
    }
};

var schemaXML = getSchemaXML(wsdlXml);
var schema = xsd.parse(schemaXML);

var requestXML = XMLUtils.toXML(request, definition, "KNSIP22_TI");
console.log(requestXML);
var validationErrors = schema.validate(requestXML);
if(validationErrors) {
  var xmlLines = requestXML.split(/\r?\n/);
  validationErrors.forEach(function(error) {
    console.log(JSON.stringify(error, null, 2));
    var status = "";
    if(error.level === 1) {
      status = "warning";

    } else if(error.level === 2) {
      status = "error";

    } else if(error.level === 3) {
      status = "fatal";
    }
    console.log(status + "(" + error.line + ":" + error.column + "): " + error.message);
    var line_start = error.line > 2 ? error.line - 2 : 0;
    var line_end = error.line < xmlLines.length - 3 ? error.line + 3 : xmlLines.length;

    var lines = xmlLines.slice(line_start, error.line - 1)
        .concat(">>" + xmlLines.slice(error.line - 1, error.line)[0].replace(/^\s\s/, ''))
        .concat(xmlLines.slice(error.line + 1, line_end));

    console.log(lines.join("\n"));
  });


} else {
  console.log("Message validated");
}


