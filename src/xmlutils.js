var expat = require('node-expat');

function toXML (obj, definition, parentName, indentation, level) {
    // TODO: Support inlineAttibutes
    // TODO: Support definition on obj
    definition = definition ? definition : {};
    level = level ? level : 0;
    indentation = indentation ? indentation : 2;
    
    var result = "";
    var namespace = definition[parentName + "$namespace"] ? definition[parentName + "$namespace"] + ":" : "";
    var attributes = definition[parentName + "$attributes"] || obj[parentName + "$attributes"] || {};
    
    if(level === 0) {
        // Go into first level
        obj = obj[parentName];
    }
    
    var startElement = "<" + namespace +  parentName;
    Object.getOwnPropertyNames(attributes).forEach(function(key){
        startElement += " " + key + '="' + attributes[key] + '"';
    });
    startElement += ">";
    
    var endElement = "</" + namespace + parentName + ">";
    
    if(typeof obj === undefined || obj === null) {
        // TODO: Handle null types
        
    } else if(Array.isArray(obj)) {
        obj.forEach(function(value) {
            result += toXML(value, definition, parentName, indentation, level);
        });
        
    } else if(typeof obj === "object") {
        var keys = Object.getOwnPropertyNames(obj);
        var orders = definition[parentName + "$order"];
        if(orders) {
            keys = keys.sort(function(a, b) {
                orders.indexOf(a) - orders.indexOf(b);
            });
        }
        
        result += " ".repeat(level * indentation) + startElement + "\n";
        keys.forEach(function(key) {
            if(key.indexOf("$") > -1) return; // Skip all definition information
            result += toXML(obj[key], definition[parentName], key, indentation, level + 1);    
        }); 
        result += " ".repeat(level * indentation) + endElement + (level > 0 ? "\n" : "");    
        
    } else {
        result += " ".repeat(level * indentation) + startElement + obj + endElement + "\n";
    }
    
    return result;
}

function fromXML (xml, objectDefinition, inlineAttibutes) {
    var definitions = [objectDefinition || {}];
    
    var parser = new expat.Parser('UTF-8'); // TODO: move to contructur
    var result = {};
    var currentValue = "";
    var currentObject = result;
    var objects = [];
    var names = [];
    
    //TODO: Save element orders
    var orders = [];
    
    parser.on('startElement', function(name, attributes) {
        // Parse namespace
        var ns = name.split(":");
        if(ns.length > 1) {
            name = ns[1];
            ns = ns[0];
        }
        
        var definition = definitions[definitions.length - 1];
        var type = definition[name + "$type"];
        var nextObject = {};
        currentValue = ""; // TODO: Create $t value on object if this has data
        
        // Handle attributes
        if(Object.getOwnPropertyNames(attributes).length > 0) {
            if(inlineAttibutes) {
                Object.keys(attributes).forEach(function(key){
                    nextObject["$" + key] = attributes[key];
                });

            } else {     
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
        }
        
        // Handle tag
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
        
        // Save order     
        if(orders.length <= names.length) {
           orders.push([name]);
            
        } else if(!Array.isArray(currentObject[name])) {
           orders[names.length].push(name);
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
            currentObject = objects.pop();
            definitions.pop();
            
            if(names.length < orders.length) {
                var order = orders.pop();
                if(order.length > 1) {
                    currentObject[name + "$order"] = order;    
                }
            }
            names.pop();
            
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
        } else {
            console.log("No objects in objects");
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