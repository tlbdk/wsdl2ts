'use strict';
var CodeGenUtils = require('./codegenutils');

class TypeScriptCodeGen extends CodeGenUtils {
    generateClient() {
        // TODO: Find all operations and make then unique across service/binding
        // TODO: Foreach operation lookup message
    }
}


function _definitionToInterface(rootName, definitions, indentation = 4) {
    var types = [[rootName, definitions]];
    var whitespace = " ".repeat(indentation);
    var results = [];
    while(types.length > 0) {
        let type = types.shift();
        let result = [];
        let [name, definition] = type;
        result.push("export interface " + name + " {")
        Object.keys(definition).forEach(function (key) {
            if(key.endsWith("$type")) {
                let type;
                if(Array.isArray(definition[key])) {
                    type = _xsdTypeLookup(definition[key][0]) + "[]";
                } else {
                    type = _xsdTypeLookup(definition[key]);
                }
                if(type.startsWith("empty")) { // TODO: Support empty by defining an empty interface
                    type = "any";
                }
                result.push(whitespace + key.replace(/\$type$/, '') + (rootName === name ? "?" : "") +  ": " + type + ";");

            } else if(key.indexOf("$") === -1 && typeof definition[key] === 'object') {
                types.push([key, definition[key]]);
                result.push(whitespace + key + (rootName === name ? "?" : "") + ": " + key + ";");
            }
        });
        result.push("}");
        results.push(result.join("\n"));
    };
    return results;
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
        case "empty": return "empty";
        case "any": return "any";
        default: throw new Error("Unknown XSD type '" + type + "'");
    }
}

module.exports.definitionToInterface = _definitionToInterface;
