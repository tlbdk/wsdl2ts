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

    getSampleRequest(service, binding, operation) {
        let typeName = this.services[service][binding][operation].input.replace(/^[^:]+:/, "");
        return this.schemaParser.generateSample(typeName);
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

function _extractServices(wsdlRoot) {
    var result = {};
    if(!wsdlRoot.service) return;
    wsdlRoot.service.forEach(function(service){
        result[service.$name] = {};
        service.port.forEach(function(port){
            var bindingName = port.$binding.replace(/^[^:]+:/, ""); // Remove namespace
            if(result[service.$name][bindingName]) return; // Skip if we already have this binding

            var binding = wsdlRoot.binding
                .filter(function(binding) { return binding.$name === bindingName;})[0];

            var portTypeName = binding.$type.replace(/^[^:]+:/, ""); // Remove namespace
            var portType = wsdlRoot.portType
                .filter(function(portType) { return portType.$name === portTypeName; })[0];

            result[service.$name][bindingName] = {};
            portType.operation.forEach(function(portTypeOperation) {
                result[service.$name][bindingName][portTypeOperation.$name] = {};

                var bindingOperation = binding.operation
                    .filter(function(operation) { return operation.$name === portTypeOperation.$name;})[0];

                result[service.$name][bindingName][portTypeOperation.$name]['action'] = bindingOperation.operation.$soapAction;

                var inputMessageName = portTypeOperation.input.$message.replace(/^[^:]+:/, ""); // Remove namespace
                var inputMessage = wsdlRoot.message.filter(function(message) {
                    return message.$name === inputMessageName;
                })[0];
                result[service.$name][bindingName][portTypeOperation.$name]['input'] = inputMessage.part[0].$element;

                var outputMessageName = portTypeOperation.output.$message.replace(/^[^:]+:/, ""); // Remove namespace
                var outputMessage = wsdlRoot.message.filter(function(message) {
                    return message.$name === outputMessageName;
                })[0];
                result[service.$name][bindingName][portTypeOperation.$name]['output'] = outputMessage.part[0].$element;;
            });
        });
    });
    return result;
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


// http://www.w3schools.com/xml/schema_elements_ref.asp
function _xsdSchemasToDefinition(schemas, namespaces) {
    // TODO: Read namespaces from all levels
    // Make reverse lookup possible
    var namespaceToAlias = {};
    Object.keys(namespaces).forEach(function(key) {
       namespaceToAlias[namespaces[key]] = key;
    });

    // Build type lookup cache
    var typeLookupMap = {};
    schemas.forEach(function (schema) {
        var targetNamespace = schema.$targetNamespace; // TODO: Default to value
        var targetNamespaceAlias = namespaceToAlias[targetNamespace];
        if(!targetNamespaceAlias) {
            throw new Error("Unable to find alias for target namespace");
        }
        ['simpleType', 'complexType', 'element'].forEach(function (xsdType) {
           (schema[xsdType] || []).forEach(function (type) {
               var name = type.$name;
               // types and elements don't share symbol spaces
               typeLookupMap[(xsdType === "element" ? "" : "#") + targetNamespaceAlias + ":" + name] = type;
               typeLookupMap[(xsdType === "element" ? "" : "#") + targetNamespaceAlias + ":" + name + "$xsdType"] = xsdType;
           });
        });
    });

    // Get definitions for all the elements
    var result = {};
    schemas.forEach(function (schema) {
        var elementFormQualified = schema.$elementFormDefault === "qualified";
        var attributeFormQualified = schema.attributeFormDefault === "qualified"; // TODO: implement
        var targetNamespace = schema.$targetNamespace; // TODO: Default to value
        var schemaNamespaces = _extractAndAddNamespaces(schema, namespaces);
        schema.element.forEach(function (element) {
            var elementNamespaces = _extractAndAddNamespaces(schema, schemaNamespaces);

            // Save namespaces
            result[element.$name + "$attributes"] = {};
            Object.keys(elementNamespaces).forEach(function (key) {
                if(!["xmlns:tns", "xmlns:soap", "xmlns:xs"].includes(key)) {
                    result[element.$name + "$attributes"][key] = elementNamespaces[key];
                }
            });

            if(Object.keys(result[element.$name + "$attributes"]).length == 0) {
                delete result[element.$name + "$attributes"];
            }

            // Generate definition for element and copy it to result
            var definition = _elementToDefinition("element", element, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, elementNamespaces);
            Object.keys(definition).forEach(function (key) {
                result[key] = definition[key];
                if(!elementFormQualified) {
                    // TODO: sent on root object so we can extract it later
                    // Set namespace on root elements if the elementForm == Unqualified
                    result[key + "$namespace"] = namespaceToAlias[targetNamespace].replace(/^xmlns:/, '');
                }
            });

            /// TODO: Optimize namespaces so we only include the needed ones, by look at the returned definition
        });
    });

    return result;
}

function _extractAndAddNamespaces(element, originalNamespaces) {
    var namespaces = originalNamespaces ? Object.assign({}, originalNamespaces) : {};
    Object.keys(element).forEach(function(key) {
        var ns = key.match(/^\$(xmlns:.+)$/);
        if (ns) {
            namespaces[ns[1]] = element[key];
        }
    });
    return namespaces;
}

function _elementToDefinition(xsdType, element, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, namespaces){
    // TODO: Find out if a namespace shadows another one higher up
    var elementNamespaces = _extractAndAddNamespaces(element, namespaces);

    // Make reverse lookup possible
    var namespaceToAlias = {};
    Object.keys(elementNamespaces).forEach(function(key) {
       namespaceToAlias[elementNamespaces[key]] = key;
    });

    var result = {};
    var subResult;
    var type;
    var maxLength = 0;
    var minLength = 0;

    if (xsdType === "element") {
        // Extract type
        if (element.$type) {
            type = element.$type;

        } else if (element.simpleType) {
            if (element.simpleType.restriction) {
                type = element.simpleType.restriction.$base;

                if(element.simpleType.restriction.length) {
                    maxLength = element.simpleType.restriction.length.$value;
                    minLength = element.simpleType.restriction.length.$value;

                } else {
                    if(element.simpleType.restriction.maxLength) {
                        maxLength = element.simpleType.restriction.maxLength.$value;
                    }
                    if(element.simpleType.restriction.minLength) {
                        minLength = element.simpleType.restriction.minLength.$value;
                    }
                }

            } else if (element.simpleType.list) {
                type = element.simpleType.list.$itemType;

            } else {
                throw new Error("Unknown simpleType structure");
            }

        } else if (element.complexType && (element.complexType.all || element.complexType.sequence)) {
            type = "object";
            subResult = _elementToDefinition("complexType", element.complexType, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, elementNamespaces);

        } else if (element.hasOwnProperty("complexType")) {
            type = "object"; // Handle <xs:element name="myEmptyElement"><xs:complexType/>...
            result[element.$name + "$type"] = "empty";

        } else if (Object.keys(element).length === 0) {
            type = "object"; // Handle <xs:element name="myEmptyElement"/>
            result[element.$name + "$type"] = "any";

        } else {
            throw new Error("Unknown element structure");
        }

        if(!['object', "any", "empty"].includes(type)) {
            for(let i= 0; i <= 3; i++) {
                if(i === 3) {
                    throw new Error("Type reference nested more than 3 levels");
                }

                // Resolve type namespace
                let typeNamespace = _namespaceLookup(type, elementNamespaces);

                if (typeNamespace.ns === "http://www.w3.org/2001/XMLSchema") {
                    result[element.$name + "$type"] = typeNamespace.name;
                    break;

                } else {
                    // Look up type if it's not a xsd native type
                    var subElement = typeLookupMap["#" + "xmlns:"+ type];
                    var subXsdType = typeLookupMap["#" + "xmlns:" + type + "$xsdType"];
                    if (subElement) {
                        if (subXsdType === "complexType" || subXsdType === "element") {
                            subResult = _elementToDefinition(subXsdType, subElement, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, elementNamespaces);
                            break;

                        } else if (subXsdType === "simpleType") {
                            if (subElement.restriction) {
                                type = subElement.restriction.$base;

                                if(subElement.restriction.length) {
                                    maxLength = parseInt(subElement.restriction.length.$value);
                                    minLength = maxLength;

                                } else {
                                    if(subElement.restriction.maxLength) {
                                        maxLength = parseInt(subElement.restriction.maxLength.$value);
                                    }
                                    if(subElement.restriction.minLength) {
                                        minLength = parseInt(subElement.restriction.minLength.$value);
                                    }
                                }

                            } else if (subElement.list) {
                                type = subElement.list.$itemType;

                            } else {
                                throw new Error("Unknown simpleType structure");
                            }

                        } else {
                            throw new Error("Unknown XSD type '" + subXsdType);
                        }

                    } else {
                        console.log(JSON.stringify(element, null, 2));
                        throw new Error("Could not find type '" + typeNamespace.name + "' in namespace '" + typeNamespace.ns + "'");
                    }
                }
            }
        }

        if(subResult) {
            if(subResult.$type) {
                result[element.$name + "$type"] = subResult.$type;

            } else {
                result[element.$name] = {};
                Object.keys(subResult).forEach(function (key) {
                    if(key.startsWith("$")) {
                        result[element.$name + key] = subResult[key];
                    } else {
                        result[element.$name][key] = subResult[key];
                    }
                });
            }

        } else {
            //result[element.$name] = "";
        }

        if(elementFormQualified) {
            // Save namespace
            result[element.$name + "$namespace"] = namespaceToAlias[targetNamespace].replace(/^xmlns:/, '');
        }

        var maxOccurs = parseInt(element.$maxOccurs ===  "unbounded" ? Number.MAX_VALUE : (element.$maxOccurs || 0));
        var minOccurs = parseInt(element.$minOccurs || 0);

        // Check if this type is an array
        if (maxOccurs > 1) {
            result[element.$name + "$type"] = [result[element.$name + "$type"], minOccurs, maxOccurs];
        }

        if(maxLength > 0) {
            result[element.$name + "$length"] = [minLength, maxLength];
        }

    } else if(xsdType === "complexType") {
        var elements;
        if(element.all) {
            elements = element.all.element;

        } else if (element.sequence) {
            if(element.sequence.element) {
                elements = element.sequence.element;

            } else if(element.sequence.hasOwnProperty("any")) {
                elements = [];
                result["$type"] = "any";

            } else {
                throw new Error("Unknown complexType sequence structure");
            }

            result["$order"] = [];

        } else {
            return; // TODO: Handle this a bit better
            //throw new Error("Unknown complexType structure");
        }

        elements = Array.isArray(elements) ? elements : [elements];
        elements.forEach(function(subElement) {
            var subResult = _elementToDefinition("element", subElement, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, namespaces);
            Object.keys(subResult).forEach(function (key) {
                result[key] = subResult[key];
            });
            if(result.hasOwnProperty("$order")) {
                result["$order"].push(subElement.$name);
            }
        });

    }

    return result;
}

function _namespaceLookup(name, namespaces) {
    var result;
    var ns = name.split(":");
    if (ns.length > 1) {
        if (namespaces.hasOwnProperty("xmlns:" + ns[0])) {
            result = { name: ns[1], ns: namespaces["xmlns:" + ns[0]] };

        } else {
            throw new Error("Could not find namespace alias '" + name + "'");
        }

    } else {
        result = { name: name, ns: "" };
    }

    return result;
}

module.exports = WSDLUtils;
