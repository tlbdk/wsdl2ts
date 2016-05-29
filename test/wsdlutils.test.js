/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js    

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var schemasToDefinition = require('../src/wsdlutils.js').schemasToDefinition;
var schemasToDefinition2 = require('../src/wsdlutils.js').schemasToDefinition2;
var XMLUtils = require('../src/xmlutils');
var fs = require('fs');

//TODO: http://www.w3schools.com/xml/schema_facets.asp , support validations

describe('schemasToDefinition2', function () {
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
          "xmlns:myns": "http://tempuri.org",
          "xmlns:xs": "http://www.w3.org/2001/XMLSchema"
        };
        
        var expected_definition = {
            plain$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            plain$type: "",
            plain: "",
            simple$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            simple$type: "",
            simple: "",
            complexAll$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            complexAll: {
                tickerSymbola: "",
                tickerSymbola$type: "",
                tickerSymbolb: "",
                tickerSymbolb$type: "",
            },
            complexSequence$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            complexSequence$order: ["tickerSymbol1", "tickerSymbol2"],
            complexSequence: {
                tickerSymbol1: "",
                tickerSymbol1$type: "",
                tickerSymbol2: "",
                tickerSymbol2$type: "",
            },
            refrencedComplexSequence$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            refrencedComplexSequence$order: ["tickerSymbolx", "tickerSymboly"],
            refrencedComplexSequence: {
                tickerSymbolx: "",
                tickerSymbolx$type: "",
                tickerSymboly: "",
                tickerSymboly$type: "",
            },
            refrencedSimpleRestriction$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            refrencedSimpleRestriction: "",
            refrencedSimpleRestriction$type: ""               
        };
        
        var definition = schemasToDefinition2(xsd_simple.schema, namespaces);    
        //console.log(JSON.stringify(definition, null, 2));
        
        assert.deepEqual(definition, expected_definition);
    });
    
});

describe('xsdToDefinition test', function () {
    it('xsd_simple with refrences', function () {
        var xsd_schema_simple = [{
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
        }];
        
        var namespaces = {
          "xmlns:myns": "http://tempuri.org",
          "xmlns:xs": "http://www.w3.org/2001/XMLSchema"
        };
        
        var expected_definition = {
            MyElement: ""
        };
        
        var definition = schemasToDefinition(xsd_schema_simple[0].element[0], xsd_schema_simple[0].$targetNamespace, xsd_schema_simple, namespaces);
        assert.deepEqual(definition, expected_definition);
    });
    
    it('xsd_complexTypeSequence with refrences', function () {
        var xsd_schema_simple = [{
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
        }];

        var namespaces = {
          "xmlns:myns": "http://tempuri.org",
          "xmlns:xs": "http://www.w3.org/2001/XMLSchema"
        };
        
        var expected_definition = {
            MyElement: {
                tickerSymbol1: "",
                tickerSymbol2: ""
            }
        };
        
        var definition = schemasToDefinition(xsd_schema_simple[0].element[0], xsd_schema_simple[0].$targetNamespace, xsd_schema_simple, namespaces);
        assert.deepEqual(definition, expected_definition);
    });
    

    it('xml_xsd_test', function () {
        var contents = fs.readFileSync("../REST2SOAPTest/rest2soap-test-kotlin/src/main/resources/checkCustomer.wsdl", 'utf8');
        var obj = XMLUtils.fromXML(contents, null, true);
        
        var out = schemasToDefinition(obj.definitions.types.schema.element[2], "stuff", [obj.definitions.types.schema], null);
        console.log(JSON.stringify(out, null, 2));
    });
});










