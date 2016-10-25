"use strict";

var expat = require('node-expat');

class XMLUtils {
    constructor(definition) {
        this._definition = definition;
    }

    toXML(obj, rootName, indentation, optimizeEmpty = false, convertTypes = true) {
        return _toXML(obj, this._definition, rootName, indentation, optimizeEmpty, convertTypes);
    }

    fromXML(xml, inlineAttributes, convertTypes = true) {
        return _fromXML(xml, this._definition, inlineAttributes, convertTypes);
    }

    generateSample(rootName) {
        var result = {};
        result[rootName] =_generateSample(this._definition[rootName], rootName);
        return result;
    }
}

function _toXML (obj, definition, parentName, indentation, optimizeEmpty, convertTypes, level) {
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
    var attributes = Object.assign({}, definition[parentName + "$attributes"] || {});
    var order = obj[parentName + "$order"] || definition[parentName + "$order"];
    var type = obj[parentName + "$type"] || definition[parentName + "$type"];

    var whitespace = " ".repeat(level * indentation);

    if(level === 0) {
        // Go into first level
        obj = obj[parentName];
    }

    if(typeof obj === undefined || obj === null) {
        // TODO: Handle null types
        return result;
    }

    if(convertTypes) {
        if(type === "base64Binary") {
            obj = Buffer.from(obj).toString('base64');

        } else if(type === "hexBinary") {
            obj = Buffer.from(obj).toString('hex');
        }
    }

    if(Array.isArray(obj)) {
        obj.forEach(function(value) {
            result += _toXML(value, definition, namespace + parentName, indentation, optimizeEmpty, convertTypes, level);
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
            if(key === "$") { // TODO: Support data before and after
                subResult += obj[key];

            } else if(key === "namespace$") {
                namespace = obj[key] + ":";

            } else if(key.indexOf("$") == 0) {
                attributes[key.substr(1)] = obj[key];

            } else if(key.indexOf("$") > 0) {
                // Skip definition information such as order

            } else {
                subResult += _toXML(obj[key], definition[parentName], key, indentation, optimizeEmpty, convertTypes, level + 1);
            }
        });

        // Generate start and end tag
        result += whitespace + "<" + namespace +  parentName;
        Object.getOwnPropertyNames(attributes).forEach(function(key){
            result += " " + key + '="' + attributes[key] + '"';
        });

        if(!obj["$"] && subResult === "" && optimizeEmpty) {
            result += " />\n";

        } else {
            result += obj["$"] ? (">" + subResult) : (">\n" + subResult + whitespace);
            result += "</" + namespace + parentName + ">" + (level > 0 ? "\n" : "");
        }

    } else {
        result += whitespace + "<" + namespace +  parentName;
        Object.getOwnPropertyNames(attributes).forEach(function(key){
            result += " " + key + '="' + attributes[key] + '"';
        });

        if(obj === "" && optimizeEmpty) {
            result += " />\n";

       } else if(convertTypes && type === 'xml') {
            result += ">\n"
                + whitespace.repeat(2) + obj.replace(/\n/g, "\n" + whitespace.repeat(2)) + "\n"
                + whitespace + "</" + namespace + parentName + ">\n";

        } else {
            result += ">" + escapeValue(obj) + "</" + namespace + parentName + ">\n";
        }
    }

    return result;
}

function escapeValue(value) {
    // https://stackoverflow.com/questions/1091945/what-characters-do-i-need-to-escape-in-xml-documents/1091953
    if(typeof value === 'string'){
        return value.replace(/((?:&(?!(?:apos|quot|[gl]t|amp);))|(?:^<!\[CDATA\[.+?]]>)|[<>'"])/g, function(match, p1) {
            switch(p1) {
                case '>': return '&gt;';
                case '<': return '&lt;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                case '&': return '&amp;';
                default: return p1;
            }
        });

    } else {
        return value;
    }
}

function _fromXML (xml, objectDefinition, inlineAttributes, convertTypes) {
    var definitions = [objectDefinition || {}];

    var parser = new expat.Parser('UTF-8');
    var result = {};
    var currentValue = "";
    var currentObject = result;
    var currentType = "";
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
        currentType = definition[name + "$type"];
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
                    if(Array.isArray(currentType)) { // TODO: Migrate to using string formatted definitions, fx. number[]
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
            if(Array.isArray(currentType)) {
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
                    if(convertTypes) {
                        if(currentType === "boolean") {
                            currentObject[name] = currentValue === 'true';

                        } else if(['decimal', 'double', 'float'].indexOf(currentType) > -1) {
                            currentObject[name] = parseFloat(currentValue);

                        } else if(['byte', 'int', 'integer', 'long', 'negativeInteger', 'nonNegativeInteger',
                                'nonPositiveInteger', 'short', 'unsignedByte', 'unsignedInt', 'unsignedLong',
                                'unsignedShort'].indexOf(currentType) > -1) {
                            currentObject[name] = parseInt(currentValue);

                        } else if(currentType === "base64Binary") {
                            currentObject[name] = Buffer.from(currentValue, 'base64');

                        } else if(currentType === "hexBinary") {
                            currentObject[name] = Buffer.from(currentValue, 'hex');

                        } else {
                            currentObject[name] = currentValue;
                        }

                    } else {
                        currentObject[name] = currentValue; // TODO: Handle inline attributes
                    }

                } else if(currentValue != '') {
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

function _generateSample(definition, level = 0) {
    let result = {};

    Object.keys(definition).forEach(function (key) {
        if(key.endsWith("$type")) {
            let keyName = key.replace(/\$type$/, '');
            let length = definition[keyName + "$length"] || [1, 1];

            if(Array.isArray(definition[key])) {
                let value = _xsdTypeLookup(definition[key][0], length[1]);
                result[keyName] = new Array(definition[key][2]).fill(value);

            } else {
                result[keyName] = _xsdTypeLookup(definition[key], length[1]);
            }

        } else if(key.indexOf("$") === -1 && typeof definition[key] === 'object') {
            result[key] = _generateSample(definition[key], key, level + 1);
        }
    });

    return result;
}

function _xsdTypeLookup(type, length) {
    // http://www.xml.dvint.com/docs/SchemaDataTypesQR-2.pdf
    switch(type) {
        case "boolean": return true;
        case "base64Binary": return " ".repeat(length);
        case "hexBinary": return " ".repeat(length);
        case "anyURI": return "http://sample.com";
        case "language": return "en";
        case "normalizedString": return " ".repeat(length);
        case "string": return " ".repeat(length);
        case "token": return " ".repeat(length);
        case "byte": return 0;
        case "decimal": return 0.0;
        case "double": return 0.0;
        case "float": return 0.0;
        case "int": return 0;
        case "integer": return 0;
        case "long": return 0;
        case "negativeInteger": return -1;
        case "nonNegativeInteger": return 1;
        case "nonPositiveInteger": return -1;
        case "short": return 0;
        case "unsignedByte": return 0;
        case "unsignedInt": return 0;
        case "unsignedLong": return 0;
        case "unsignedShort": return 0;
        case "empty": return "";
        case "any": return {};
        default: throw new Error("Unknown XSD type '" + type + "'");
    }
}

module.exports = XMLUtils;
