/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js    

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var schemasToDefinition = require('../src/wsdlutils.js').schemasToDefinition;
var getSchemaXML = require('../src/wsdlutils.js').getSchemaXML;
var wsdlToToDefinition = require('../src/wsdlutils.js').wsdlToToDefinition;
var XMLUtils = require('../src/xmlutils');
var fs = require('fs');
var xsd = require('libxml-xsd');

//TODO: http://www.w3schools.com/xml/schema_facets.asp , support validations

describe('schemasToDefinition', function () {
    it('Most used XSD types', function () {
        var xsd_simple = {
            "schema": [
                {
                    "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                    "$elementFormDefault": "qualified",
                    "$targetNamespace": "http://tempuri.org",
                    "element": [
                        {
                            "$name": "plain",
                            "$type": "xs:string"
                        },
                        {
                            "$name": "simple",
                            "simpleType": {
                                "restriction": {
                                    "$base": "xs:string",
                                    "pattern": {
                                        "value": "[a-zA-Z0-9]{8}"
                                    }
                                }
                            },
                        },
                        {
                            "$name": "complexAll",
                            "complexType": {
                                "all": {
                                    "element": [
                                        {
                                            "$name": "tickerSymbola",
                                            "$type": "xs:string"
                                        },
                                        {
                                            "$name": "tickerSymbolb",
                                            "$type": "xs:string"
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "$name": "complexSequence",
                            "complexType": {
                                "sequence": {
                                    "element": [
                                        {
                                            "$name": "tickerSymbol1",
                                            "$type": "xs:string"
                                        },
                                        {
                                            "$name": "tickerSymbol2",
                                            "$type": "xs:string"
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "$name": "refrencedComplexSequence",
                            "$type": "myns:tickerType"
                        },
                        {
                            "$name": "refrencedSimpleRestriction",
                            "$type": "myns:verySimpleType"
                        }
                    ],
                    "complexType": [
                        {
                            "$name": "tickerType",
                            "sequence": {
                                "element": [
                                    {
                                        "$name": "tickerSymbolx",
                                        "$type": "xs:string"
                                    },
                                    {
                                        "$name": "tickerSymboly",
                                        "$type": "xs:string"
                                    }
                                ]
                            }
                        }
                    ],
                    "simpleType": [
                        {
                            "$name": "verySimpleType",
                            "restriction": {
                                "$base": "xs:string",
                                "maxLength": 3
                            }
                        }
                    ]
                }
            ]
        };
        
         var namespaces = {
          "myns": "http://tempuri.org",
          "xs": "http://www.w3.org/2001/XMLSchema"
        };
        
        var expected_definition = {
            plain$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            plain$type: "",
            plain$namespace: "myns",
            plain: "",
            simple$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            simple$type: "",
            simple$namespace: "myns",
            simple: "",
            complexAll$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            complexAll$namespace: "myns",
            complexAll: {
                tickerSymbola: "",
                tickerSymbola$type: "",
                tickerSymbola$namespace: "myns",
                tickerSymbolb: "",
                tickerSymbolb$type: "",
                tickerSymbolb$namespace: "myns",
            },
            complexSequence$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            complexSequence$order: ["tickerSymbol1", "tickerSymbol2"],
            complexSequence$namespace: "myns",
            complexSequence: {
                tickerSymbol1: "",
                tickerSymbol1$type: "",
                tickerSymbol1$namespace: "myns",
                tickerSymbol2: "",
                tickerSymbol2$type: "",
                tickerSymbol2$namespace: "myns",
            },
            refrencedComplexSequence$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            refrencedComplexSequence$order: ["tickerSymbolx", "tickerSymboly"],
            refrencedComplexSequence$namespace: "myns",
            refrencedComplexSequence: {
                tickerSymbolx: "",
                tickerSymbolx$type: "",
                tickerSymbolx$namespace: "myns",
                tickerSymboly: "",
                tickerSymboly$type: "",
                tickerSymboly$namespace: "myns",
            },
            refrencedSimpleRestriction$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            refrencedSimpleRestriction$type: "",
            refrencedSimpleRestriction$namespace: "myns",
            refrencedSimpleRestriction: "",
        };
        
        var definition = schemasToDefinition(xsd_simple.schema, namespaces);
        //console.log(JSON.stringify(definition, null, 2));
        
        assert.deepEqual(definition, expected_definition);
    });
    
});

describe('xsdToDefinition test', function () {
    it('xsd_simple with references', function () {
        var xsd_schema_simple = {
            schema: [
                {
                    "$elementFormDefault": "qualified",
                    "$targetNamespace": "http://tempuri.org",
                    "element": [
                        {
                            "$name": "MyElement",
                            "$type": "myns:MyType",
                        },
                    ],
                    "simpleType": [
                        {
                            "$name": "MyType",
                            "restriction": {
                                "$base": "xs:string",
                                "maxLength": {
                                    "$value": "8"
                                }
                            }
                        }
                    ],
                }
            ]
        };
        
        var namespaces = {
          "myns": "http://tempuri.org",
          "xs": "http://www.w3.org/2001/XMLSchema"
        };
        
        var expected_definition = {
            MyElement: "",
            MyElement$attributes: {
                "xmlns:xs":  "http://www.w3.org/2001/XMLSchema",
                "xmlns:myns": "http://tempuri.org"
            },
            MyElement$namespace: "myns",
            MyElement$type: "",
        };
        
        var definition = schemasToDefinition(xsd_schema_simple.schema, namespaces);
        assert.deepEqual(definition, expected_definition);
    });
    
    it('xsd_complexTypeSequence with references', function () {
        var xsd_schema_simple = {
            schema: [
                {
                    "$elementFormDefault": "qualified",
                    "$targetNamespace": "http://tempuri.org",
                    "element": [
                        {
                            "$name": "MyElement",
                            "$type": "myns:TradePriceRequest",
                        },
                    ],
                    "complexType": [
                        {
                            "$name": "TradePriceRequest",
                            "sequence": {
                                "element": [
                                    {
                                        "$name": "tickerSymbol1",
                                        "$type": "xs:string"
                                    },
                                    {
                                        "$name": "tickerSymbol2",
                                        "$type": "xs:string"
                                    }
                                ]
                            }
                        }
                    ],
                }
            ]
        };

        var namespaces = {
          "myns": "http://tempuri.org",
          "xs": "http://www.w3.org/2001/XMLSchema"
        };
        
        var expected_definition = {
            MyElement: {
                tickerSymbol1: "",
                tickerSymbol1$namespace: "myns",
                tickerSymbol1$type: "",
                tickerSymbol2: "",
                tickerSymbol2$namespace: "myns",
                tickerSymbol2$type: "",
            },
            MyElement$attributes: {
                "xmlns:myns": "http://tempuri.org",
                "xmlns:xs": "http://www.w3.org/2001/XMLSchema"
            },
            MyElement$namespace: "myns",
            MyElement$order: ["tickerSymbol1", "tickerSymbol2"]
        };
        
        var definition = schemasToDefinition(xsd_schema_simple.schema, namespaces);
        assert.deepEqual(definition, expected_definition);
    });
});

describe("getSchemaXML", function() {
    it("extract XSD and validate request", function () {
        var wsdlXml = fs.readFileSync(__dirname + "/../examples/StockQuote.wsdl", 'utf8');
        var schemaXML = getSchemaXML(wsdlXml);
        var definition = wsdlToToDefinition(wsdlXml);

        var sample = {
            "test": ""
        };

        XMLUtils.toXML(sample, definition, "test");


        var schema = xsd.parse(schemaXML);
    });
});










