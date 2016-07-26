/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var SoapClient = require('../src/soaputils.js').SoapClient;

describe('SOAPClient', function () {
   it('Create new SOAPCLient', function (done) {
       SoapClient.createClient("http://www.webservicex.com/globalweather.asmx?wsdl").then(function(wsdlxml) {
            console.log(wsdlxml);
            done();
        }).catch(function (err) {
           console.log(err);
           done();
       });
  });
});
