/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var WSDLUtils = require('../src/wsdlutils.js');
var XMLUtils = require('../src/xmlutils');
var fs = require('fs');
var xsd = require('libxml-xsd');

//TODO: http://www.w3schools.com/xml/schema_facets.asp , support validations

// WSDL Samples: http://www.visualwebservice.com/examples.html

describe("xml validation", function() {
    var wsdl_sample = fs.readFileSync(__dirname + "/../examples/StockQuote.wsdl", 'utf8');





});











