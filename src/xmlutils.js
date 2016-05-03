var expat = require('node-expat');

function toXML (obj, definition, parentName, level, indentation) {
    definition = definition ? definition : {};
    level = level ? level : 0;
    indentation = indentation ? indentation : 2;
    
    if(level === 0) {
        // Go into first level
        obj = obj[parentName];
    }
    
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

var test = {
    "first": {
        "firstNested": {
            
        },
        "secondNested": {
            
        }
    },
    "second": {
        "firstNested": {
            
        },
        "secondNested": {
            
        }
    }
}

var order = [["first"], ["firstNested", "secondNested"]]


function fromXML (xml, objectDefinition, inlineAttibutes, level) {
    var parser = new expat.Parser('UTF-8'); // TODO: move to contructur
    var result = {};
    var currentValue = "";
    var currentObject = result;
    
    var objects = [];
    var names = [];
    var definitions = [objectDefinition || {}];
    
    //TODO: Save element order
    var order = [];
    
    parser.on('startElement', function(name, attributes) {
        var ns = name.split(":");
        if(ns.length > 1) {
            name = ns[1];
            ns = ns[0];
        }
        var definition = definitions[definitions.length - 1];
        var type = definition[name + "$type"];
        currentValue = ""; // TODO: Create $t value on object if this has data
        
        // Handle attributes
        if(!inlineAttibutes && Object.getOwnPropertyNames(attributes).length) {
            if(currentObject.hasOwnProperty(name + "$attributes")) {
                if(Array.isArray(currentObject[name + "$attributes"])) {
                    currentObject[name + "$attributes"].push(attributes);
                    
                } else {
                    // Convert to array
                    currentObject[name + "$attributes"] = [currentObject[name + "$attributes"], attributes];
                }
                
            } else {
                if(Array.isArray(type)) {
                    currentObject[name + "$attributes"] = [attributes];
                        
                } else {
                    currentObject[name + "$attributes"] = attributes;    
                }
            }
        }
        
        // Handle tag
        var nextObject = {};
        if(inlineAttibutes) {
            Object.keys(attributes).forEach(function(key){
                nextObject["$" + key] = attributes[key];
            });
        }
        if(currentObject.hasOwnProperty(name)) {
            if(Array.isArray(currentObject[name])) {
                currentObject[name].push(nextObject);
                
            } else {
                // Convert to array
                currentObject[name] = [currentObject[name], nextObject];
            }
            
        } else {
            // Check definition to see if we have a type defined
            if(Array.isArray(type)) {
                currentObject[name] = [nextObject];
            
            } else {
                currentObject[name] = nextObject;
            }
        }
        
        names.push(name);
        objects.push(currentObject);
        definitions.push(definition[name] || {});
        currentObject = nextObject;
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
            definitions.pop();
            currentObject = objects.pop();
                 
            if(Array.isArray(currentObject[name])) {
                if(Object.getOwnPropertyNames(currentObject[name][currentObject[name].length -1]).length === 0) {
                    currentObject[name][currentObject[name].length -1] = currentValue;
                
                } else {
                    // TODO: Save "<tag>text<subtag>" type text
                }
                
            } else if(typeof currentObject[name] === "object") {
                if(Object.getOwnPropertyNames(currentObject[name]).length === 0) { // Move to utility function
                    currentObject[name] = currentValue; // TODO: Handle inline attributes
                
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
    
    return result;
}

module.exports.toXML = toXML;
module.exports.fromXML = fromXML;