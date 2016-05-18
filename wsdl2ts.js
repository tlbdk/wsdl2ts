'use strict';

var http = require('http');
var pd = require('pretty-data2').pd;
var fs = require('fs');
var WSDLUtils = require('WSDLUtils');

// TODO: Look into using other XML parsers
// https://github.com/node-xmpp/ltx
// https://github.com/polotek/libxmljs - https://gist.github.com/polotek/484083

// TODO: Implement support for XSD validation of XML messages after generation: https://www.npmjs.com/package/libxml-xsd


// Sample wsdl
// http://demo-queensland-sl.bentley.com/sldtransservice.svc?singleWsdl
// http://xmltest.vanillatours.com/Wcf.svc?wsdl




// https://github.com/buglabs/node-xml2json
// https://github.com/vpulim/node-soap
// TODO: Sanitize XML output



process.exit();



var wsdlXml = fs.readFileSync(__dirname + "/examples/StockQuote.wsdl");
var services = WSDLUtils.getServices(wsdlXml);

console.log(JSON.stringify(services, null, 2));


/* http.get("http://demo-queensland-sl.bentley.com/sldtransservice.svc?singleWsdl", function(res) {
    var data = "";
    res.on('data', function(chunk) {
       data += chunk;
     });
    res.on('end', function() {
        var wsdlxml = pd.xml(data);
        var wsdlobj = XMLUtils.fromXML(data);
        
        var service = wsdlobj["definitions"]["service"]["port$attributes"];
        
        console.log(wsdlxml);
        //console.log(JSON.stringify(wsdlObj, null, 2));
    });
}); */
