wsdl2client -l es6 -i sample.wsdl -n RemoteClient -o remoteclient.js

xmlutils.js:
class XMLUtils {
    constructor (definition) {

    }
}

wsdlutils.js:
const WSDLDefinition = ...;
class WSDLUtils {
    constuctor(wsdlString) {
        this.wsdlParser = new XMLUtils(WSDLDefinition);
        this.wsdlObj = wsdlParser.fromXML(wsdlString, true);
    }
    getDefinition() {

    }
    getOperations() {

    }
    getEndpoints() {

    }
    validateMessage(elementName, message) {

    }
}


soapclient.js:
class SoapClient {
    constructor(wsdlFile) {
    }
    // { type:, username:, password }
    setAuthentication(authentication) {
    }
    invoke(service, binding, operation) {
    }
    getSample(elementName) {
    }
    validateMessage(elementName, message) {
    }
    // [ { service: , port:, operation: } ]
    getOperations() {
    }
    // [ "http://..", "http://" ]
    getEndpoints() {
    }
}

remoteclient.js:
let SoapClient = require("soapclient");

class RemoteClient {
    constructor(url, authentication) {
        this.client = new SoapClient("sample.wsdl");
        this.client.setEndpoint("http://...");
        this.client.setAuthentication(authentication);
    }
    execute(request, validateRequest, validateResponse) {
        var errors = validateRequest ? this.client.validateMessage("executeRequest", request) : false;
        if (errors) {
            throw new Error("Requeat validation errors:\n" +  errors.join("\n");
        }
        return this.client.invoke("service", "binding", "executeRemote", request)
            .when(response => {
                var errors = validateResponse ? this.client.validateMessage("executeResponse",response) : false;
                if (errors) {
                    throw new Error("Response validation errors:\n" +  errors.join("\n"));
                }
                return response;
            });
    }
    getSampleExecuteRequest() {
        return this.client.getSampleRequest("service", "binding", "executeRemote", {
            cmd: "ps aux"
        });
    }
    getSampleExecuteResponse() {
        return this.client.getSampleReaponse({
            stdout: "...",
            stderr: "..."
        });
    }
}

sample.js:
let RemoteClient = require("remoteclient");

const client = RemoteClient("http://...", {
    type: ntlm, username: "test", password: "test"
});

let executeRequest = {
    id: 0,
    cmd: ""
};

client.execute(executeRequest, true, true)
    .when((response) => {
        // { stdout: "", stderr: "" }
    })
    .catch((error) => {
        console.log(error);
    });
