'use strict';
var XMLUtils = require('./src/xmlutils.js');
var http = require('http');
var pd = require('pretty-data2').pd;
var fs = require('fs');



// Sample wsdl
// http://demo-queensland-sl.bentley.com/sldtransservice.svc?singleWsdl
// http://xmltest.vanillatours.com/Wcf.svc?wsdl




// https://github.com/buglabs/node-xml2json
// https://github.com/vpulim/node-soap
// TODO: Sanitize XML output

var sample = {
    "Envelope": {
        "Header": {
            "$myObjectAttib": "aValue1",
            "arrays": {
                "array$attributes": [
                    { "myArrayAttrib": "aValue2" },
                    { "myArrayAttrib": "aValue3" },
                    { "myArrayAttrib": "aValue4" }
                ], // TODO: support this
                "array":[
                    {
                        "key": "value1"
                    },
                    {
                        "key": "value2"
                    },
                    {
                        "key": "value3"
                    }
                ]
            }
        },
        "Body": {
            "value": "stuff",
            "values": {
                "value": ["a", "b", "c"]
            },
            "Fault": {
            },
        },
        "soap:SameName": "name1", // TODO: Support this
        "soap2:SameName": "name2",
        "isArray" : ["Stuff"],
    }
};

var definition = {
    "Envelope$namespace": "soap",
    "Envelope$attributes": {
        "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope/",
        "xmlns:soap2": "http://www.w3.org/2003/05/soap-envelope/",
        "soap:encodingStyle": "http://www.w3.org/2003/05/soap-encoding",
    },
    "Envelope$order": ["Header", "Body"],
    "Envelope": {
        "Header$namespace": "soap",
        "Header": {
            "arrays$type": [],
            "arrays": {
                "array": ""   
            }
        },
        "Body$namespace": "soap",
        "Body": {
            "value": "string",
            "values$attributes": {
                "xmlns:stuff": "http://www.w3.org/2003/05/soap-encoding"
            },
            "values": {
                "value$namespace": "stuff",
                "value$type": [],
                "value": ""
            },
            "Fault": {
            }
        },
        "isArray$type": [],
    }
};

//console.log(JSON.stringify(result, null, 2));
var xml = XMLUtils.toXML(sample, definition, "Envelope");
//console.log("'"+ xml + "'");
var obj = XMLUtils.fromXML(xml, definition);
//console.log(JSON.stringify(obj, null, 2));


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

var wsdlXml = fs.readFileSync(__dirname + "/examples/StockQuote.wsdl");


var xsd_simple = { 
    "$name:": "simple1", 
    "type": "xs:string" 
};

//TODO: http://www.w3schools.com/xml/schema_facets.asp , support validations
var xsd_simpleType_restriction = {
    "$name:": "simple1",
    "simpleType": {
        "restriction": {
            "$base": "xs:string",
            "pattern": {
                "value": "[a-zA-Z0-9]{8}"
            }
        }
    },
};

var xsd_simpleType_list = {
    "$name:": "simple1",
    "simpleType": {
        "list": {
            "$itemType": "xs:string"
        }
    },
};

var xsd_complexTypeAll = {
    "$name": "TradePriceRequest",
    "complexType": {
        "all": {
            "element": {
                "$name": "tickerSymbol",
                "$type": "string"
            }
        }
    }
};

var xsd_complexTypeSequence = {
    "$name": "TradePriceRequest",
    "complexType": {
        "all": {
            "element": {
                "$name": "tickerSymbol",
                "$type": "string"
            }
        }
    }
};

var xsd_simple_definition = xsdToDefinition(xsd_simple, "stuff");

// http://www.w3schools.com/xml/schema_elements_ref.asp
function xsdToDefinition(element, targetNamespace) {
    var result = {};
    
    if(element.$type) {
        result[element.$name] = "";
        
    } else if (element.simpleType) {
        if(element.simpleType.restriction) {
            result[element.$name] = "";
            
        } else if(element.simpleType.list) {
            result[element.$name] = [];
        }
            
    } else if (element.complexType) {
        if(element.complexType.sequence) {
            result[element.$name + "$order"] = [];
        }
    }
    
    
   
    result[element.$name] = xsdToDefinition;
    
    return result;
}


function getServices(wsdlXml) {
    var wsdlobj = XMLUtils.fromXML(wsdlXml, wsdlDefinition, true);
    var definitions = wsdlobj.definitions;
    var result = {};
    // TODO: Support namespaces
    
    definitions.service.forEach(function(service){
        result[service.$name] = {};
        service.port.forEach(function(port){
            result[service.$name][port.$name] = {};
            var binding = definitions.binding.filter(function(binding) { return binding.$name === port.$binding.replace(/^[^:]+:/, ""); })[0];
            var portType = definitions.portType.filter(function(portType) { return portType.$name === binding.$type.replace(/^[^:]+:/, "") })[0];
            portType.operation.forEach(function(operation) {
                var inputMessage = definitions.message.filter(function(message) { return message.$name === operation.input.$message.replace(/^[^:]+:/, "") })[0];
                var inputElement = {};
                definitions.types.schema.forEach(function(schema) {
                    schema.element.forEach(function(element) {
                        // TODO: Support more than one part
                        if(element.$name === inputMessage.part[0].$element.replace(/^[^:]+:/, "")) {
                            inputElement = xsdToDefinition(element, schema.$targetNamespace);
                        }
                    });
                });
                
                var outputMessage = definitions.message.filter(function(message) { return message.$name === operation.output.$message.replace(/^[^:]+:/, "") })[0];
                var outputElement = {};
                definitions.types.schema.forEach(function(schema) {
                    schema.element.forEach(function(element) {
                        // TODO: Support more than one part
                        if(element.$name === outputMessage.part[0].$element.replace(/^[^:]+:/, "")) {
                            outputElement = xsdToDefinition(element, schema.$targetNamespace);
                        }
                    });
                });
                                
                result[service.$name][port.$name][operation.$name] = {
                    input: inputElement,
                    output: outputElement
                };
            });
        });
    });
    
    return result;
}









var services = getServices(wsdlXml);





console.log(JSON.stringify(services, null, 2));


/* http.get("http://demo-queensland-sl.bentley.com/sldtransservice.svc?singleWsdl", function(res) {
    var data = "";
    res.on('data', function(chunk) {
       data += chunk;
     });
    res.on('end', function() {
        var wsdlxml = pd.xml(data);
        var wsdlobj = XMLUtils.fromXML(data);
        
        var service = wsdlobj["definitions"]["service"]["port$attributes"];
        
        console.log(wsdlxml);
        //console.log(JSON.stringify(wsdlObj, null, 2));
    });
}); */
