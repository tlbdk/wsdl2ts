//wsdlutils -l es6client -i sample.wsdl -n RemoteClient -o remoteclient.js -s sample.js

var program = require('commander');
program
    .version('0.0.1')
    .option('-l, --language [language]', 'Language to generate [es6client]', 'es6client')
    .option('-i, --input <wsdl file>', 'Path to wsdl file')
    .option('-o, --output <generated client>', 'Path to generated client')
    .option('-s, --sample <generated sample>', 'Path to generated sample consumer')
    .parse(process.argv);


console.log(program.language);
