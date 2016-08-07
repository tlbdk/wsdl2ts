/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var SoapClient = require('../src/soaputils.js').SoapClient;

describe('SOAPClient', function () {
    it('Create new client and class service', function (done) {
        var client = new SoapClient("");
        var request = {};
        var errors = client.validate("TradePriceRequest", request);
        if(errors) {
            throw new Error("Failed to validate request");
        }
        client.invoke("StockQuoteService", "StockQuotePort", "GetLastTradePrice", request)
            .when(response => {
                var errors = client.validate("TradePrice", response);
                if(errors) {
                    throw new Error("Failed to validate response");
                }
                done();
            });

    });

    it('Create new SOAPCLient', function (done) {
       SoapClient.fromUrl("http://www.webservicex.com/globalweather.asmx?wsdl").then(function(wsdlxml) {
            console.log(wsdlxml);
            done();
        }).catch(function (err) {
           console.log(err);
           done();
       });
    });
});
