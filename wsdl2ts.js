'use strict';

// Links:
// https://github.com/buglabs/node-xml2json
// https://github.com/vpulim/node-soap
// Sample wsdl
// http://demo-queensland-sl.bentley.com/sldtransservice.svc?singleWsdl
// http://xmltest.vanillatours.com/Wcf.svc?wsdl
// TODO: Look into using other XML parsers
// https://github.com/node-xmpp/ltx
// https://github.com/polotek/libxmljs - https://gist.github.com/polotek/484083
// TODO: Implement support for XSD validation of XML messages after generation: https://www.npmjs.com/package/libxml-xsd
// TODO: Look into making the windows installation a bit easier: https://cylonjs.com/blog/2014/11/19/creating-multiplatform-precompiled-binaries-for-node-modules/


var program = require('commander');
program
    .version('0.0.1')
    .option('-i, --input <wsdl file>', "Name of output file")
    .option('-o, --output <typescript interface file>', "Name of output file")
    .parse(process.argv);

var fs = require('fs');
var wsdlToDefinition = require('./src/wsdlutils.js').wsdlToDefinition;
var definitionToInterface = require('./src/tsutils.js').definitionToInterface;

var wsdlXml = fs.readFileSync("/Users/trbe/git/REST2SOAPTest/rest2soap-test-kotlin/src/main/resources/checkCustomer.wsdl", 'utf8');
var definition = wsdlToDefinition(wsdlXml);

var tsIntefaces = definitionToInterface("CheckCustomer", definition).join("\n\n");
fs.writeFileSync("CheckCustomer.ts", tsIntefaces);

process.exit(0);
