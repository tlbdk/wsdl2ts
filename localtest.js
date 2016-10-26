"use strict";

/// <reference path="typings/index.d.ts" />

let fs = require('fs');
var SoapClient = require('./src/soaputils.js');
var WSDLUtils = require('./src/wsdlutils.js');

var wsdlXml = fs.readFileSync("/Users/trbe/git/REST2SOAPTest/rest2soap-test-kotlin/src/main/resources/checkCustomer.wsdl", 'utf8');
var soapClient = new SoapClient(wsdlXml, "http://localhost:8088/mockKNSIP22_TI_V01Soap");
var services = soapClient.getServices();

var wsdlutils = new WSDLUtils(wsdlXml);
var definition = wsdlutils.getSchemaDefinition();

var request = soapClient.getSampleRequest("KNSIP22_TI_V01", "KNSIP22_TI_V01Soap", "KNSIP22_TI");
soapClient.invoke("KNSIP22_TI_V01", "KNSIP22_TI_V01Soap", "KNSIP22_TI", request)
    .then((response) => {
        console.info(response);
    });

console.info(services);
