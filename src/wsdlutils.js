
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

function wsdlToToDefinition(wsdlXml) {
    var wsdlObj = XMLUtils.fromXML(wsdlXml, wsdlDefinition, true);

    var namespaces = {};
    Object.keys(wsdlObj.definitions).forEach(function (key) {
        var ns = key.match(/^\$xmlns:(.+)$/);
        if (ns) {
            namespaces[ns[1]] = wsdlObj.definitions[key];
        }
    });
    
    var definition = schemasToDefinition2(wsdlObj.definitions.types.schema, namespaces);
    return definition;
}

function getSchemaXML(wsdlXml) {
    var wsdlObj = XMLUtils.fromXML(wsdlXml, wsdlDefinition);
    
    var namespaces = {};
    // TODO: Fix 
    Object.keys(wsdlObj.definitions).forEach(function (key) {
        var ns = key.match(/^\$xmlns:(.+)$/);
        if (ns) {
            namespaces[ns[1]] = wsdlObj.definitions[key];
        }
    });
    
    Object.keys(wsdlObj.definitions.types.schema$attributes[0]).forEach(function (key) {
        namespaces[key] = wsdlObj.definitions.types.schema$attributes[0][key];
    });
    
    var schemaObj = {
        schema$attributes: namespaces,
        schema: wsdlObj.definitions.types.schema[0]   
    };
    
    var obj = XMLUtils.toXML(schemaObj, {}, "schema");
    
    return obj;
}


// http://www.w3schools.com/xml/schema_elements_ref.asp

function schemasToDefinition2(schemas, namespaces) {
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
        var targetNamespace = schema.$targetNamespace; // TODO: Default to value
        schema.element.forEach(function (element) {
            // Save namespaces
            result[element.$name + "$attributes"] = {};
            Object.keys(namespaces).forEach(function (key) {
                result[element.$name + "$attributes"]["xmlns:" + key] = namespaces[key];    
            });

            // Generate definition for element and copy it to result
            var definition = _elementToDefinition("element", element, targetNamespace, typeLookupMap, namespaces);
            Object.keys(definition).forEach(function (key) {
                result[key] = definition[key];    
            });
        });
    });
    
    return result;
}

function _elementToDefinition(xsdType, element, targetNamespace, typeLookupMap, namespaces){
    // Make reverse lookup posible
    var namespaceToAlias = {};
    Object.keys(namespaces).forEach(function(key) {
       namespaceToAlias[namespaces[key]] = key; 
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
            
        } else if (element.complexType) {
            type = "object";
            subResult = _elementToDefinition("complexType", element.complexType, targetNamespace, typeLookupMap, namespaces);
        
        } else if (element.hasOwnProperty("complexType")) {
            type = "object"; // Handle <xs:element name="myEmptyElement"><xs:complexType/>...
            
        } else if (Object.keys(element).length === 0) {
            type = "object"; // Handle <xs:element name="myEmptyElement"/>
            
        } else {
            throw new Error("Unknown element structure");
        }
        
        if(type !== "object") {
            // Resolve type namespace
            var typeNamespace = _namespaceLookup(type, namespaces);

            if (typeNamespace.ns === "http://www.w3.org/2001/XMLSchema") {
                // TODO: Save types for typescript intefaces
                _xsdTypeLookup(typeNamespace.name);
                result[element.$name + "$type"] = "";
            
            } else {
                // Look up type if it's not a xsd native type
                var subElement = typeLookupMap["#" + type];
                var subXsdType = typeLookupMap["#" + type + "$xsdType"];
                if (subElement) {
                    if (subXsdType === "complexType" || subXsdType === "element") {
                        subResult = _elementToDefinition(subXsdType, subElement, targetNamespace, typeLookupMap, namespaces);

                    } else if (subXsdType === "simpleType") {
                        result[element.$name + "$type"] = "";

                    } else {
                        throw new Error("Unknown XSD type '" + subXsdType);
                    }

                } else {
                    console.log(JSON.stringify(element, null, 2));
                    throw new Error("Could not find type '" + typeNamespace.name + "' in namespace '" + typeNamespace.ns + "'");
                }
            }    
        } 
        
        if(subResult) {
            result[element.$name] = {};
            Object.keys(subResult).forEach(function (key) {
                if(key.startsWith("$")) {
                    result[element.$name + key] = subResult[key];
                } else {
                    result[element.$name][key] = subResult[key];    
                }
            });
            
        } else {
            result[element.$name] = "";
        }
        
        // Save namespace
        result[element.$name + "$namespace"] = namespaceToAlias[targetNamespace];
        
        // Check if this type is an array
        if ((element.$maxOccurs || 0) > 1) {
            result[element.$name + "$type"] = [];
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
            
            } else {
                throw new Error("Unknown complexType sequence structure");    
            }
            
            result["$order"] = [];
        
        } else {
            throw new Error("Unknown complexType structure");
        }
        
        elements = Array.isArray(elements) ? elements : [elements];
        elements.forEach(function(subElement) {
            var subResult = _elementToDefinition("element", subElement, targetNamespace, typeLookupMap, namespaces);
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
            throw new Error("Could not find namespace alias '" + ns + "'");
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
        case "base64Binary": return "ArrayBuffer";
        case "hexBinary": return "ArrayBuffer";
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


function schemasToDefinition(element, targetNamespace, schemas, namespaces) {
    var elementLookup = {};
    schemas.forEach(function (schema) {
        ['simpleType', 'complexType', 'element'].forEach(function (xsdType) {
           (schema[xsdType] || []).forEach(function (type) {
               var name = type.$name;
               // TODO : Support namespaces
               var ns = name.split(":");
               if (ns.length > 1) {
                   name = ns[1];
                   ns = ns[0];
               }
               
               if(xsdType === 'element') {
                   elementLookup[name] = type;

               } else {
                   // Convert all types to elements
                   elementLookup[name] = { $name: name };
                   elementLookup[name][xsdType] = type;
               }
           });
        });
    });
    
    return _schemasToDefinition(element, targetNamespace, elementLookup, namespaces);
}

function _schemasToDefinition(element, targetNamespace, typeLookup, namespaces) {
    var result = {};
    if (element.$type || element.simpleType) {
        var type;
        if(element.$type) {
            type = element.$type;
              
        } else if(element.simpleType.restriction) {
            type = element.simpleType.restriction.$base;
            
        } else if(element.simpleType.list) {
            type = element.simpleType.list.$itemType;
        
        } else {
            throw new Error("Unknown simpleType type");
        }
        
        // TODO: Support namespaces
        var ns = type.split(":");
        if (ns.length > 1) {
            type = ns[1];
            ns = ns[0];
        } else {
            ns = "";
        }
        
        if((element.$maxOccurs || 0) > 1) {
            result[element.$name + "$type"] = [];
        }
        
        // TODO: look up type to see if we need to dive into another object
        switch(type) {
            case "string": {
                result[element.$name] = ""; 
                break;
            }
            case "short": {
                result[element.$name] = ""; 
                break;
            }
            case "int": {
                result[element.$name] = ""; 
                break;
            }
            case "decimal": {
                result[element.$name] = ""; 
                break;
            }
            case "base64Binary": {
                result[element.$name] = ""; 
                break;
            }
            default: {
                var subElement = typeLookup[type];
                if(subElement){
                    var subResult = _schemasToDefinition(subElement, targetNamespace, typeLookup, namespaces);
                    result[element.$name] = subResult[subElement.$name];
                    
                } else {
                    console.log(JSON.stringify(element, null, 2));
                    throw new Error("Unknown type");
                }
            }
        }
        
            
    } else if (element.complexType) {
        var elements;
        result[element.$name] = {};
        if(element.complexType.all) { 
            elements = element.complexType.all.element;  
             
        } else if(element.complexType.sequence) {
            elements = element.complexType.sequence.element;
            result[element.$name + "$order"] = [];
        
        } else {
            throw new Error("Unknown complexType type");
        }
        
        elements = Array.isArray(elements) ? elements : [elements];
        elements.forEach(function(subElement) {
            var subResult = _schemasToDefinition(subElement, targetNamespace, typeLookup, namespaces);
            Object.keys(subResult).forEach(function (key) {
                result[element.$name][key] = subResult[key];
            });
            if(result.hasOwnProperty(element.$name + "$order")) {
                result[element.$name + "$order"].push(subElement.$name);    
            }
        });
    }
    
    return result;
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
module.exports.schemasToDefinition2 = schemasToDefinition2;
module.exports.getServices = getServices;
module.exports.wsdlToToDefinition = wsdlToToDefinition;
module.exports.getSchemaXML = getSchemaXML;