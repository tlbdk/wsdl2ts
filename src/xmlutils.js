"use strict";

var expat = require('node-expat');

class XMLUtils {
    constructor(definition) {
        this._definition = definition;
    }

    toXML(obj, parentName, indentation, optimizeEmpty) {
        return _toXML(obj, this._definition, parentName, indentation, optimizeEmpty);
    }

    fromXML(xml, inlineAttributes) {
        return _fromXML(xml, this._definition, inlineAttributes);
    }
}

// TODO: Handle simple type conversions, fx. int types to number
// TODO: Handle more complex conversions: fx. Buffer/Uint8Array to XML Base64 types
// TODO: Sanitize XML output
function _toXML (obj, definition, parentName, indentation, optimizeEmpty, level) {
    definition = definition ? definition : {};
    level = level ? level : 0;
    indentation = indentation ? indentation : 2;
    optimizeEmpty = optimizeEmpty ? true : false;

    var result = "";
    var namespace = "";
    var nsOffset = parentName.indexOf(':');
    if(nsOffset > - 1) {
        namespace = parentName.substr(0, nsOffset) + ":";
        parentName = parentName.substr(nsOffset + 1);

    } else if(definition[parentName + "$namespace"]) {
        namespace = definition[parentName + "$namespace"] + ":";
    }
    var attributes = definition[parentName + "$attributes"] || {};
    var order = obj[parentName + "$order"] || definition[parentName + "$order"];

    if(level === 0) {
        // Go into first level
        obj = obj[parentName];
    }

    var whitespace = " ".repeat(level * indentation);

    if(typeof obj === undefined || obj === null) {
        // TODO: Handle null types

    } else if(Array.isArray(obj)) {
        obj.forEach(function(value) {
            result += _toXML(value, definition, namespace + parentName, indentation, optimizeEmpty, level);
        });

    } else if(typeof obj === "object") {
        var keys = Object.getOwnPropertyNames(obj);
        if(order) {
            keys = keys.sort(function(a, b) {
                return order.indexOf(a) - order.indexOf(b);
            });
        }

        let subResult = "";
        keys.forEach(function(key) {
            if(key === "$") {
                subResult += obj[key];

            } else if(key === "namespace$") {
                namespace = obj[key] + ":";

            } else if(key.indexOf("$") == 0) {
                attributes[key.substr(1)] = obj[key];

            } else if(key.indexOf("$") > 0) {
                // Skip definition information such as order

            } else {
                subResult += _toXML(obj[key], definition[parentName], key, indentation, optimizeEmpty, level + 1);
            }
        });

        // Generate start and end tag
        result += whitespace + "<" + namespace +  parentName;
        Object.getOwnPropertyNames(attributes).forEach(function(key){
            result += " " + key + '="' + attributes[key] + '"';
        });
        result += obj["$"] ? ">" + subResult : ">\n" + subResult + whitespace;
        result += "</" + namespace + parentName + ">" + (level > 0 ? "\n" : "");

    } else {
        result += whitespace + "<" + namespace +  parentName;
        Object.getOwnPropertyNames(attributes).forEach(function(key){
            result += " " + key + '="' + attributes[key] + '"';
        });

        if(obj === "" && optimizeEmpty) {
            result += " />\n";

        } else {
            result += ">" + obj + "</" + namespace + parentName + ">\n";
        }
    }

    return result;
}

function _fromXML (xml, objectDefinition, inlineAttributes) {
    var definitions = [objectDefinition || {}];

    var parser = new expat.Parser('UTF-8'); // TODO: move to contructur
    var result = {};
    var currentValue = "";
    var currentObject = result;
    var objects = [];
    var names = [];

    var orders = [];

    parser.on('startElement', function(name, attributes) {
        // TODO: Handle namespaces in a nice way
        // Parse namespace
        var ns = name.split(":");
        if(ns.length > 1) {
            name = ns[1];
            ns = ns[0];
        } else {
            ns = undefined;
        }

        var definition = definitions[definitions.length - 1];
        var type = definition[name + "$type"];
        var nextObject = {};
        currentValue = ""; // TODO: Create $t value on object if this has data

        if(ns) {
            if(inlineAttributes) {
                nextObject["namespace" + "$"] = ns;

            } else {
                currentObject[name + "$namespace"] = ns;
            }
        }

        // Handle attributes
        if(Object.getOwnPropertyNames(attributes).length > 0) {
            if(inlineAttributes) {
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
                    if(Array.isArray(type)) { // TODO: Migrate to using string formatted definitions, fx. number[]
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
                    currentObject[name][currentObject[name].length -1].$ = currentValue;
                    // TODO: Save "<tag>text<subtag>" type text
                }

            } else if(typeof currentObject[name] === "object") {
                if(Object.getOwnPropertyNames(currentObject[name]).length === 0) { // Move to utility function
                    currentObject[name] = currentValue; // TODO: Handle inline attributes

                } else {
                    currentObject[name].$ = currentValue;
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

module.exports = XMLUtils;
