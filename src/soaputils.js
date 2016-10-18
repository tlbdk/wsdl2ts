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
        this.endpoint = ""; // TODO
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

    invoke (service, port, operation) {

    }

    getSampleRequest(service, binding, operation) {
        return this.wsdlutils.getSampleRequest(service, binding, operation);
    }

    getSampleResponse(service, binding, operation) {
        return this.wsdlutils.getSampleResponse(service, binding, operation);
    }


    // [ { service: , port:, operation: , input:, output: } ]
    getOperations() {

    }

    // [ "http://..", "http://" ]
    getEndpoints() {

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
