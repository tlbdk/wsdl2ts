'use strict';

var url = require('url');
var http = require('http');

const soap_definition = {
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
        this.definition = wsdlToDefinition(wsdlString);
        console.log(JSON.stringify(this.definition, null, 2));
    }

    static createClient(wsdlUrl) {
        return this._httpGetString(wsdlUrl)
            .then((wsdlString) => {
                return new SoapClient(wsdlString);
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

    _invoke (service, port, operation) {

    }
}

module.exports.SoapClient = SoapClient;