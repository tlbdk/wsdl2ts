'use strict';
require('es6-shim');
var expat = require('node-expat');

// https://github.com/buglabs/node-xml2json
// https://github.com/vpulim/node-soap

var sample = {
    "Header": {
        "$myObjectAttib": "aValue1",
        "arrays": {
            "array$attributes": { "myArrayAttrib": "aValue2" },
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
    "soap:SameName": "name1",
    "soap2:SameName": "name2"
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
        "Header": {},
        "Body$namespace": "soap",
        "Body": {
            "value": "string",
            "values$attributes": {
                "xmlns:stuff": "http://www.w3.org/2003/05/soap-encoding"
            },
            "values": {
                "value$namespace": "stuff",
                "value": [""]
            },
            "Fault": { 
            }    
        }
    }
};


var xml = toXML(sample, definition, "Envelope");
console.log("'"+ xml + "'");
var obj = fromXML(xml, definition);

function toXML(obj, definition, parentName, level, indentation) {
    definition = definition ? definition : {};
    level = level ? level : 0;
    indentation = indentation ? indentation : 2;
    
    var result = "";
    var namespace = definition[parentName + "$namespace"] ? definition[parentName + "$namespace"] + ":" : "";
    var attributes = definition[parentName + "$attributes"] || {};
    
    var startElement = "<" + namespace +  parentName;
    Object.getOwnPropertyNames(attributes).forEach(function(key, index){
        startElement += " " + key + '="' + attributes[key] + '"';
    });
    startElement += ">";
    
    var endElement = "</" + namespace + parentName + ">";
    
    if(typeof obj === undefined || obj === null) {
        // TODO: Handle null types
        
    } else if(Array.isArray(obj)) {
        obj.forEach(function(value, index) {
            result += toXML(value, definition, parentName, level);
        });
        
    } else if(typeof obj === "object") {
        var keys = Object.getOwnPropertyNames(obj);
        var order = definition[parentName + "$order"];
        if(order) {
            keys = keys.sort(function(a, b) {
                order.indexOf(a) - order.indexOf(b)
            });
        }
     
        result += " ".repeat(level * indentation) + startElement + "\n";
        keys.forEach(function(key, index) {
            if(key.indexOf("$") > -1) return; // Skip all definition information
            result += toXML(obj[key], definition[parentName], key, level + 1);    
        });
        result += " ".repeat(level * indentation) + endElement + (level > 0 ? "\n" : "");
        
    } else {
        result += " ".repeat(level * indentation) + startElement + obj + endElement + "\n";
    }
    
    return result;
}

function fromXML(xml, definition) {
    var parser = new expat.Parser('UTF-8'); // TODO: move to contructur
    var result = {};
    var currentValue = "";
    var currentObject = result;
    
    var objects = [];
    var names = [];
    
    parser.on('startElement', function(name, attributes) {
        var ns = name.split(":");
        if(ns.length > 1) {
            name = ns[1];
            ns = ns[0];
        }
        
        if(names.length > 0) {
            objects.push(currentObject);
            var nextObject = {};
            currentValue = ""; // TODO: Create $t value on object if this has data
             
            if(currentObject.hasOwnProperty(name)) {
                if(Array.isArray(currentObject[name])) {
                    currentObject[name].push(nextObject);
                    
                } else {
                   // Convert to array
                    currentObject[name] = [currentObject[name], nextObject];
                }
                 
            } else {
                currentObject[name] = nextObject;    
            }
            
            currentObject = nextObject;
        }
        
        names.push(name);
    });

    parser.on('text', function(data) {
        currentValue += data.trim();
    });
    
    parser.on('endElement', function(name){
        var ns = name.split(":");
        if(ns.length > 1) {
            name = ns[1];
            ns = ns[0];
        }
        
        if(objects.length > 0) {
            names.pop(); // TODO: Validate that poped value matches name
            currentObject = objects.pop();
                 
            if(Array.isArray(currentObject[name])) {
                if(Object.getOwnPropertyNames(currentObject[name][currentObject[name].length -1]).length === 0) {
                    currentObject[name][currentObject[name].length -1] = currentValue;
                
                } else {
                    // TODO: Save "<tag>text<subtag>" type text
                }
                
            } else if(typeof currentObject[name] === "object") {
                if(Object.getOwnPropertyNames(currentObject[name]).length === 0) {
                    currentObject[name] = currentValue;
                
                } else {
                    // TODO: Save "<tag>text<subtag>" type text
                }
            }
        }
        currentValue = "";
    });
    
    if (!parser.parse(xml)) {
        throw new Error('There are errors in your xml file: ' + parser.getError());
    }
    
    console.log(JSON.stringify(result, null, 2));
}