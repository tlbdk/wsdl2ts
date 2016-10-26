/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js

//var assert = require('assert');
var chai = require('chai');
var fs = require('fs');
var assert = chai.assert;
var SoapClient = require('../src/soaputils.js');
var http = require('http');

describe('SOAPClient', function () {
    var sampleWSDL = fs.readFileSync(__dirname + "/../examples/StockQuote.wsdl");
    var httpServer = http.createServer((req, res) => {
        res.end([
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:stoc="http://example.com/stockquote.xsd">',
            '    <soapenv:Header/>',
            '    <soapenv:Body>',
            '        <stoc:TradePrice>',
            '            <price>10</price>',
            '        </stoc:TradePrice>',
            '    </soapenv:Body>',
            '</soapenv:Envelope>'
        ].join("\n"));
    });

    var port = 0;
    before((done) => {
        httpServer.listen(0, () => {
            port = httpServer.address().port;
            done();
        });
    });

    //"http://localhost:8088/mockStockQuoteSoapBinding"
    it('Create new client and class service', function (done) {
        var client = new SoapClient(sampleWSDL, "http://localhost:" + port + "/");
        var requestSample = client.getSampleRequest("StockQuoteService", "StockQuoteBinding", "GetLastTradePrice");
        requestSample.TradePriceRequest.tickerSymbol = "GOOG";
        client.invoke("StockQuoteService", "StockQuoteBinding", "GetLastTradePrice", requestSample)
            .then(response => {
                assert.deepEqual(response, { TradePrice: { price: 10 }, TradePrice$namespace: "stoc" });
                done();
            })
            .catch((error) => {
                done(error);
            });
    });

    it('Create new SOAPCLient', function (done) {
       SoapClient.fromUrl("http://www.webservicex.com/globalweather.asmx?wsdl").then((soapClient) => {
            assert.isTrue(soapClient instanceof SoapClient);
            done();
        }).catch(function (err) {
           console.log(err);
           done();
       });
    });
});
