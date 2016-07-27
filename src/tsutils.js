'use strict';

function definitionToInterface(rootName, definitions, indentation = 4) {
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
                let type = definition[key];
                if(Array.isArray(type)) {
                    type = type[0] + "[]";
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

module.exports.definitionToInterface = definitionToInterface;
