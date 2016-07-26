/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js    

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var schemasToDefinition = require('../src/wsdlutils.js').schemasToDefinition;
var getSchemaXML = require('../src/wsdlutils.js').getSchemaXML;
var wsdlToToDefinition = require('../src/wsdlutils.js').wsdlToDefinition;
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
            plain$type: "string",
            plain$namespace: "myns",
            simple$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            simple$type: "string",
            simple$namespace: "myns",
            complexAll$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            complexAll$namespace: "myns",
            complexAll: {
                tickerSymbola$type: "string",
                tickerSymbola$namespace: "myns",
                tickerSymbolb$type: "string",
                tickerSymbolb$namespace: "myns",
            },
            complexSequence$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            complexSequence$order: ["tickerSymbol1", "tickerSymbol2"],
            complexSequence$namespace: "myns",
            complexSequence: {
                tickerSymbol1$type: "string",
                tickerSymbol1$namespace: "myns",
                tickerSymbol2$type: "string",
                tickerSymbol2$namespace: "myns",
            },
            refrencedComplexSequence$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            refrencedComplexSequence$order: ["tickerSymbolx", "tickerSymboly"],
            refrencedComplexSequence$namespace: "myns",
            refrencedComplexSequence: {
                tickerSymbolx$type: "string",
                tickerSymbolx$namespace: "myns",
                tickerSymboly$type: "string",
                tickerSymboly$namespace: "myns",
            },
            refrencedSimpleRestriction$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            refrencedSimpleRestriction$type: "string",
            refrencedSimpleRestriction$namespace: "myns",
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
            MyElement$attributes: {
                "xmlns:xs":  "http://www.w3.org/2001/XMLSchema",
                "xmlns:myns": "http://tempuri.org"
            },
            MyElement$namespace: "myns",
            MyElement$type: "string",
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
                tickerSymbol1$namespace: "myns",
                tickerSymbol1$type: "string",
                tickerSymbol2$namespace: "myns",
                tickerSymbol2$type: "string",
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

        var expected_definition = {
            TradePrice$attributes: {
                "xmlns:soap": "http://schemas.xmlsoap.org/wsdl/soap/",
                "xmlns:tns": "http://example.com/stockquote.wsdl",
                "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                "xmlns:xsd1": "http://example.com/stockquote.xsd"
            },
            TradePrice$namespace: "xsd1",
            TradePrice: {
                price$type: "number"
            },
            TradePriceRequest$attributes: {
                "xmlns:soap": "http://schemas.xmlsoap.org/wsdl/soap/",
                "xmlns:tns": "http://example.com/stockquote.wsdl",
                "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                "xmlns:xsd1": "http://example.com/stockquote.xsd"
            },
            TradePriceRequest$namespace: "xsd1",
            TradePriceRequest: {
                tickerSymbol$type: "string"
            }
        };

        var definition = wsdlToToDefinition(wsdlXml);
        assert.deepEqual(expected_definition, definition);

        var sample_obj = {
            TradePriceRequest: {
                tickerSymbol: "GOOG"
            }
        };

        // Validate schema against generated XML
        var sample_xml = XMLUtils.toXML(sample_obj, definition, "TradePriceRequest");
        var schemaXML = getSchemaXML(wsdlXml);
        var schema = xsd.parse(schemaXML);
        var validationErrors = schema.validate(sample_xml);
        assert.equal(null, validationErrors);
    });
});










