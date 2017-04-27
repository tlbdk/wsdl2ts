'use strict';

var XMLUtils = require('../src/xmlutils.js');
var xsd = require('libxml-xsd');

const wsdlDefinition = {
   "definitions": {
       "types": {
           "schema$type": [],
           "schema": {
               "element$type": [],
               "simpleType$type": [],
               "complexType$type": [],
            }
       },
       "message$type": [],
       "message": {
           "part$type": []
       },
       "portType$type": [],
       "portType": {
           "operation$type": [],
           "fault$type": [],
       },
       "binding$type": [],
       "binding": {
           "operation$type": [],
       },
       "service$type": [],
       "service": {
           "port$type": [],
       }
   }
};

class WSDLUtils {
    constructor(wsdlString, validatedXsd = true) {
        var soapDefinition = {
            "Envelope$namespace": "soap",
            "Envelope$attributes": {
                "xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/"
            },
            "Envelope$order": ["Header", "Body"],
            "Envelope": {
                "Header$namespace": "soap",
                "Body$namespace": "soap"
            }
        };

        this.wsdlParser = new XMLUtils(wsdlDefinition);
        this.wsdlObj = this.wsdlParser.fromXML(wsdlString, true);
        this.services = _extractServices(this.wsdlObj.definitions);
        // Extract XSD schemas
        var rootNamespaces = _extractAndAddNamespaces(this.wsdlObj.definitions);
        var typesNamespaces = _extractAndAddNamespaces(this.wsdlObj.definitions.types, rootNamespaces);
        this.schemaDefinition = _xsdSchemasToDefinition(this.wsdlObj.definitions.types.schema, typesNamespaces);
        this.schemaParser = new XMLUtils(this.schemaDefinition);

        // Inject schemaDefinition so we can decode a SOAP message directly
        soapDefinition.Envelope.Body = this.schemaDefinition;
        this.soapParser = new XMLUtils(soapDefinition);


        this.schemaXML = _generateXsdSchemaXML(this.wsdlObj, typesNamespaces);
        if(validatedXsd) {
            this.xsdValidator = xsd.parse(this.schemaXML);
        }
    }

    getSchemaDefinition() {
        return this.schemaDefinition;
    }

    getSchemaXML() {
        return this.schemaXML;
    }



    getSampleResponse(service, binding, operation) {
        let typeName = this.services[service][binding][operation].output.replace(/^[^:]+:/, "");
        return this.schemaParser.generateSample(typeName);
    }

    generateSoapMessage(message) {
        return this.soapParser.toXML({
            Envelope: {
                Header: "",
                Body: message
            }
        }, "Envelope", 2, true);
    }

    parseSoapMessage(xmlMessage) {
        return this.soapParser.fromXML(xmlMessage);
    }

    // { serviceName: { binding: { operation: { input: "messageName", output: "messageName" )
    getServices() {
        return this.services;
    }

    getOperations() {

    }

    getEndpoints() {

    }

    validateMessage(xmlMessage) {
        if(!this.xsdValidator)  {
            throw new Error("XSD Validation has been disabled");
        }
        if(typeof xmlMessage !== "string") {
            throw new Error("XML text needs to come as a string");
        }

        var validationErrors = this.xsdValidator.validate(xmlMessage);
        var errors = [];
        if(validationErrors) {
            var xmlLines = xmlMessage.split(/\r?\n/);
            validationErrors.forEach(function(error) {
                var level = "";
                if(error.level === 1) {
                    level = "warning";

                } else if(error.level === 2) {
                    level = "error";

                } else if(error.level === 3) {
                    level = "fatal";
                }

                errors.push({ message: error.message, level: level, line: error.line, column: error.column });

                // TODO: Implement error context
                /* console.log(status + "(" + error.line + ":" + error.column + "): " + error.message);
                var line_start = error.line > 2 ? error.line - 2 : 0;
                var line_end = error.line < xmlLines.length - 3 ? error.line + 3 : xmlLines.length;

                var lines = xmlLines.slice(line_start, error.line - 1)
                    .concat(">>" + xmlLines.slice(error.line - 1, error.line)[0].replace(/^\s\s/, ''))
                    .concat(xmlLines.slice(error.line + 1, line_end));

                console.log(lines.join("\n")); */
            });

            return errors;

        } else {
            return undefined;
        }
    }
}


function _generateXsdSchemaXML(wsdlObj, schemaNamespaces, index = 0) {
    var schemaObj = {
        schema: wsdlObj.definitions.types.schema[index]
    };

    // Add all names to all schema elements
    var xmlutils2 = new XMLUtils({ schema$attributes: schemaNamespaces });
    var schemaXml = xmlutils2.toXML(schemaObj, "schema", 2, true, false, true);
    return schemaXml;
}




module.exports = WSDLUtils;
