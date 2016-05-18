
var XMLUtils = require('../src/xmlutils.js');

var wsdlDefinition = {
   "definitions": {
       "types": {
           "schema$type": [],
           "schema": {
               "element$type": []
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

// http://www.w3schools.com/xml/schema_elements_ref.asp
function schemasToDefinition(element, schemas, targetNamespace) {
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
        
        // TODO: look up type to see if we need to dive into another object
        switch(type) {
            case "xs:string": {
                result[element.$name] = ""; 
                break;
            }
            default: {
                // TODO: Try to look up type in schemas and recurse on the type
                throw new Error("Unknown type");
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
            var subResult = schemasToDefinition(subElement, schemas, targetNamespace);
            result[element.$name][subElement.$name] = subResult[subElement.$name];
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
module.exports.getServices = getServices;