var fs = require('fs');
var XMLUtils = require('./src/xmlutils');

var args = process.argv.slice(2);

var contents = fs.readFileSync(args[0], 'utf8');
var obj = XMLUtils.fromXML(contents, null, true);
console.log(JSON.stringify(obj, null, 2));
var schemasToDefinition = require('./src/wsdlutils.js').schemasToDefinition;

var definition = schemasToDefinition(obj.definitions.types.schema.element[2], "stuff", [obj.definitions.types.schema], null);



var xml = XMLUtils.toXML(request, definition, "KNSIP22_TI");
console.log(xml);