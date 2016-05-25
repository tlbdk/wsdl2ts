/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js    

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var schemasToDefinition = require('../src/wsdlutils.js').schemasToDefinition;
var XMLUtils = require('../src/xmlutils');
var fs = require('fs');

//TODO: http://www.w3schools.com/xml/schema_facets.asp , support validations

describe('xsdToDefinition simple', function () {
    it('xsd_simple', function () {
        var xsd_simple = {
            "$name": "simple1",
            "$type": "xs:string"
        };
        
        var expected_definition = {
            simple1: ""
        };
        
        var definition = schemasToDefinition(xsd_simple);
        assert.deepEqual(definition, expected_definition);
    });
    
    it('xsd_simpleType_restriction', function () {
        var xsd_simpleType_restriction = {
            "$name": "simple1",
            "simpleType": {
                "restriction": {
                    "$base": "xs:string",
                    "pattern": {
                        "value": "[a-zA-Z0-9]{8}"
                    }
                }
            },
        };

        var expected_definition = {
            simple1: ""
        };

        var definition = schemasToDefinition(xsd_simpleType_restriction);
        assert.deepEqual(definition, expected_definition);
    });

    it('xsd_simpleType_list', function () {
        var xsd_simpleType_list = {
            "$name": "simple1",
            "simpleType": {
                "list": {
                    "$itemType": "xs:string"
                }
            },
        };

        var expected_definition = {
            simple1: ""
        };

        var definition = schemasToDefinition(xsd_simpleType_list);
        assert.deepEqual(definition, expected_definition);
    });

    it('xsd_complexTypeAll', function () {
        var xsd_complexTypeAll = {
            "$name": "TradePriceRequest",
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
        };

        var expected_definition = {
            TradePriceRequest: {
                tickerSymbola: "",
                tickerSymbolb: ""
            }
        };

        var definition = schemasToDefinition(xsd_complexTypeAll);
        assert.deepEqual(definition, expected_definition);
    });
    
    it('xsd_complexTypeSequence', function () {
        var xsd_complexTypeSequence = {
            "$name": "TradePriceRequest",
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
        };
        
        var expected_definition = {
            TradePriceRequest$order: ["tickerSymbol1", "tickerSymbol2"],
            TradePriceRequest: {
                tickerSymbol1: "",
                tickerSymbol2: ""
            }
        };

        var definition = schemasToDefinition(xsd_complexTypeSequence);
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










