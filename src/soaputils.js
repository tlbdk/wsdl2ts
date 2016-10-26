'use strict';

// SPNEGO linux: https://gist.github.com/dmansfield/c75817dcacc2393da0a7

let urlParser = require('url');
let http = require('http');
let WSDLUtils = require('../src/wsdlutils.js');

// TODO: Kerberos authentication

class SoapClient {
    constructor(wsdlString, endPointUrl) {
        this.wsdlutils = new WSDLUtils(wsdlString);
        this.endpoint = endPointUrl;
    }

    static fromUrl(wsdlUrl) {
        return this._httpGetString(wsdlUrl)
            .then((wsdlString) => {
                return new SoapClient(wsdlString);
            });
    }

    // { type:, username:, password }
    setAuthentication(authentication) {

    }

    setEndpoint(url) {

    }


    invoke(serviceName, binding, operation, message) {
        var services = this.wsdlutils.getServices();
        var soapAction = services[serviceName][binding][operation].action;
        var soapRequest = this.wsdlutils.generateSoapMessage(message);

        var headers = {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'Content-Length': Buffer.byteLength(soapRequest),
            'Accept': 'text/xml',
            'SOAPAction': soapAction,
        };

        return this._httpPostString(this.endpoint, soapRequest, headers)
            .then((soapResponse) => {
                var response = this.wsdlutils.parseSoapMessage(soapResponse);
                return response.Envelope.Body;
            })
            .catch((error) => {
               console.info(error);
            });
    }

    getSampleRequest(service, binding, operation) {
        return this.wsdlutils.getSampleRequest(service, binding, operation);
    }

    getSampleResponse(service, binding, operation) {
        return this.wsdlutils.getSampleResponse(service, binding, operation);
    }

    // { serviceName: { binding: { operation: { input: "messageName", output: "messageName" )
    getServices() {
        this.wsdlutils.getServices();
    }


    _httpPostString(url, data, headers = null) {
        return new Promise(function(resolve, reject) {
            var curl = urlParser.parse(url);
            var requestOptions = {
                host: curl.hostname,
                port: curl.port,
                path: curl.path,
                method: "POST",
                withCredentials: false,
                headers: headers
            };
            var req = http.request(requestOptions, (res) => {
                var responseContent = "";
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    responseContent += chunk;
                });
                res.on('end', function() {
                    if(res.statusCode === 200) {
                        resolve(responseContent);
                    } else {
                        reject({ error: `POST request '${url}' returned status code ${res.statusCode}`, data: responseContent });
                    }
                });
            });
            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            req.write(data);
            req.end();
        });
    }

    static _httpGetString(url) {
        var curl = urlParser.parse(url);
        return new Promise(function(resolve, reject) {
            var req = http.request({
                host: curl.hostname,
                port: curl.port,
                path: curl.path,
                method: "GET",
                withCredentials: false // this is the important part
            }, (res) => {
                var responseContent = "";
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    responseContent += chunk;
                });
                res.on('end', function() {
                    if(res.statusCode === 200) {
                        resolve(responseContent);
                    } else {
                        reject({ error: `GET request '${url}' returned status code ${res.statusCode}`, data: responseContent });
                    }
                });
            });

            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });

            req.end();
        });
    }


}

module.exports = SoapClient;
