'use strict';

// SPNEGO linux: https://gist.github.com/dmansfield/c75817dcacc2393da0a7

let url = require('url');
let http = require('http');
let WSDLUtils = require('../src/wsdlutils.js');

const soapDefinition = {
    "Envelope$namespace": "soap",
    "Envelope$attributes": {
        "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope/",
        "soap:encodingStyle": "http://www.w3.org/2003/05/soap-encoding"
    },
    "Envelope$order": ["Header", "Body"],
    "Envelope": {
        "Header$namespace": "soap",
        "Body$namespace": "soap"
    }
};


// TODO: Kerberos authentication

class SoapClient {
    constructor(wsdlString) {
        this.wsdlutils = new WSDLUtils(wsdlString);
        this.endpoint = "http://localhost:8080/"; // TODO
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


    invoke (serviceName, binding, operation) {
        var services = this.wsdlutils.getServices();
        var soapAction = services[serviceName][binding][operation].action;
        var headers = {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'Content-Length': Buffer.byteLength(data),
            'Accept': 'text/xml',
            'SOAPAction': soapAction,
        };

        var data = ""; // TODO
        this._httpPostString(this.endpoint, data, headers)
            .then((response) => {
                console.info(response);
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


    static _httpPostString(uri, data, headers = null) {
        return new Promise(function(resolve, reject) {
            var curl = url.parse(uri);
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
                    resolve(responseContent);
                });

                if(res.statusCode === 200) {
                    resolve(data);

                } else {
                    reject({ error: `POST request '${url}' returned status code ${res.statusCode}`, data: responseContent });
                }
            });
            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            req.write(data);
            req.end();
        });
    }

    static _httpGetString(uri) {
        var curl = url.parse(uri);
        return new Promise(function(resolve, reject) {
            var req = http.request({
                host: curl.hostname,
                port: curl.port,
                path: curl.path,
                method: "GET",
                withCredentials: false // this is the important part
            }, (res) => {
                if(res.statusCode === 200) {
                    var result = "";
                    res.setEncoding('utf8');
                    res.on('data', function(chunk) {
                        result += chunk;
                    });
                    res.on('end', function() {
                        resolve(result);
                    });
                    req.on('error', (e) => {
                        reject(`GET request ${url} failed: ${e.message}`);
                    });

                } else {
                    reject(`GET request '${url}' returned status code ${res.statusCode}`);
                }
            });

            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });

            req.end();
        });
    }


}

module.exports = SoapClient;
