'use strict';

var XMLUtils = require('../src/xmlutils.js');

var wsdlDefinition = {
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

function wsdlToDefinition(wsdlXml, originalNamespaces) {
    var wsdlObj = XMLUtils.fromXML(wsdlXml, wsdlDefinition, true);
    var namespaces = _extractAndAddNamespaces(wsdlObj.definitions, originalNamespaces);
    var definition = schemasToDefinition(wsdlObj.definitions.types.schema, namespaces);
    return definition;
}

function getSchemaXML(wsdlXml) {
    var wsdlObj = XMLUtils.fromXML(wsdlXml, wsdlDefinition, true);

    var namespaces = {};
    Object.keys(wsdlObj.definitions).forEach(function (key) {
        var ns = key.match(/^\$(xmlns:.+)$/);
        if (ns) {
            namespaces[ns[1]] = wsdlObj.definitions[key];
        }
    });

    /* Object.keys(wsdlObj.definitions.types.schema$attributes[0]).forEach(function (key) {
        namespaces[key] = wsdlObj.definitions.types.schema$attributes[0][key];
    }); */

    var schemaObj = {
        schema: wsdlObj.definitions.types.schema[0]
    };

    var schemaXml = XMLUtils.toXML(schemaObj, { schema$attributes: namespaces }, "schema");
    return schemaXml;
}

// http://www.w3schools.com/xml/schema_elements_ref.asp
function schemasToDefinition(schemas, namespaces) {
    // TODO: Read namespaces from all levels
    // Make reverse lookup posible
    var namespaceToAlias = {};
    Object.keys(namespaces).forEach(function(key) {
       namespaceToAlias[namespaces[key]] = key;
    });

    // Build type lookup cache
    var typeLookupMap = {};
    schemas.forEach(function (schema) {
        var targetNamespace = schema.$targetNamespace; // TODO: Default to value
        var targetNamespaceAlias = namespaceToAlias[targetNamespace] || ""; // TODO: Die if we can't find the namespace
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
            // TODO: Optimize namespaces so we include the needed ones
            result[element.$name + "$attributes"] = {};
            Object.keys(elementNamespaces).forEach(function (key) {
                result[element.$name + "$attributes"]["xmlns:" + key] = elementNamespaces[key];
            });

            // Generate definition for element and copy it to result
            var definition = _elementToDefinition("element", element, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, elementNamespaces);
            Object.keys(definition).forEach(function (key) {
                result[key] = definition[key];
                if(!elementFormQualified) {
                    // TODO: sent on root object so we can extract it later
                    // Set namespace on root elements if the elementForm == Unqualified
                    result[key + "$namespace"] = namespaceToAlias[targetNamespace];
                }
            });
        });
    });

    return result;
}

function _extractAndAddNamespaces(element, originalNamespaces) {
    var namespaces = originalNamespaces ? Object.assign({}, originalNamespaces) : {};
    Object.keys(element).forEach(function(key) {
        var ns = key.match(/^\$xmlns:(.+)$/);
        if (ns) {
            namespaces[ns[1]] = element[key];
        }
    });
    return namespaces;
}

function _elementToDefinition(xsdType, element, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, namespaces){
    var elementNamespaces = _extractAndAddNamespaces(element, namespaces);

    // Make reverse lookup possible
    var namespaceToAlias = {};
    Object.keys(elementNamespaces).forEach(function(key) {
       namespaceToAlias[elementNamespaces[key]] = key;
    });

    var result = {};
    var subResult;
    var type;

    if (xsdType === "element") {
        // Extract type
        if (element.$type) {
            type = element.$type;

        } else if (element.simpleType) {
            if (element.simpleType.restriction) {
                type = element.simpleType.restriction.$base;

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
                    // TODO: Save types for typescript interfaces
                    result[element.$name + "$type"] = _xsdTypeLookup(typeNamespace.name);
                    break;

                } else {
                    // Look up type if it's not a xsd native type
                    var subElement = typeLookupMap["#" + type];
                    var subXsdType = typeLookupMap["#" + type + "$xsdType"];
                    if (subElement) {
                        if (subXsdType === "complexType" || subXsdType === "element") {
                            subResult = _elementToDefinition(subXsdType, subElement, targetNamespace, elementFormQualified, attributeFormQualified, typeLookupMap, elementNamespaces);
                            break;

                        } else if (subXsdType === "simpleType") {
                            if (subElement.restriction) {
                                type = subElement.restriction.$base;

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
            result[element.$name + "$namespace"] = namespaceToAlias[targetNamespace];
        }

        // Check if this type is an array
        if ((element.$maxOccurs ===  "unbounded" ? Number.MAX_VALUE : (element.$maxOccurs || 0)) > 1) {
            result[element.$name + "$type"] = [result[element.$name + "$type"]];
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
        if (namespaces.hasOwnProperty(ns[0])) {
            result = { name: ns[1], ns: namespaces[ns[0]] };

        } else {
            throw new Error("Could not find namespace alias '" + name + "'");
        }

    } else {
        result = { name: name, ns: "" };
    }

    return result;
}

function _xsdTypeLookup(type) {
    // http://www.xml.dvint.com/docs/SchemaDataTypesQR-2.pdf
    switch(type) {
        case "boolean": return "boolean";
        case "base64Binary": return "string";
        case "hexBinary": return "string";
        case "anyURI": return "string";
        case "language": return "string";
        case "normalizedString": return "string";
        case "string": return "string";
        case "token": return "string";
        case "byte": return "number";
        case "decimal": return "number";
        case "double": return "number";
        case "float": return "number";
        case "int": return "number";
        case "integer": return "number";
        case "long": return "number";
        case "negativeInteger": return "number";
        case "nonNegativeInteger": return "number";
        case "nonPositiveInteger": return "number";
        case "short": return "number";
        case "unsignedByte": return "number";
        case "unsignedInt": return "number";
        case "unsignedLong": return "number";
        case "unsignedShort": return "number";
        default: throw new Error("Unknown XSD type " + type);
    }
}

function getServices(wsdlXml) {
    var wsdlobj = XMLUtils.fromXML(wsdlXml, wsdlDefinition, true);
    var definitions = wsdlobj.definitions;
    var result = {};
    // TODO: Support namespaces

    var schemas = {};
    definitions.types.schema.forEach(function (schema) {
        schema.element.forEach(function (element) {
            schemas[element.$name] = element;
        });
    });

    definitions.service.forEach(function(service){
        result[service.$name] = {};
        service.port.forEach(function(port){
            result[service.$name][port.$name] = {};
            var binding = definitions.binding.filter(function(binding) { return binding.$name === port.$binding.replace(/^[^:]+:/, ""); })[0];
            var portType = definitions.portType.filter(function(portType) { return portType.$name === binding.$type.replace(/^[^:]+:/, "") })[0];

            portType.operation.forEach(function(operation) {
                var inputMessage = definitions.message.filter(function(message) { return message.$name === operation.input.$message.replace(/^[^:]+:/, "") })[0];
                //var inputElement = schemasToDefinition(inputMessage.part[0].$element.replace(/^[^:]+:/, ""), )
                // TODO: Support more than one part
                var outputMessage = definitions.message.filter(function(message) { return message.$name === operation.output.$message.replace(/^[^:]+:/, "") })[0];
                //var outputElement = schemasToDefinition(outputMessage.part[0].$element.replace(/^[^:]+:/, ""), )

                result[service.$name][port.$name][operation.$name] = {
                    input: inputElement,
                    output: outputElement
                };
            });
        });
    });

    return result;
}

module.exports.schemasToDefinition = schemasToDefinition;
module.exports.getServices = getServices;
module.exports.wsdlToDefinition = wsdlToDefinition;
module.exports.getSchemaXML = getSchemaXML;
