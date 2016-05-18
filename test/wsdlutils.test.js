/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js    

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var schemasToDefinition = require('../src/wsdlutils.js').schemasToDefinition;

//TODO: http://www.w3schools.com/xml/schema_facets.asp , support validations

describe('xsdToDefinition', function () {
    it('xsd_simple', function () {
        var xsd_simple = {
            "$name": "simple1",
            "$type": "xs:string"
        };
        
        var expected_definition = {
            simple1: ""
        };
        
        var definition = schemasToDefinition(xsd_simple, {}, "stuff");
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

        var definition = schemasToDefinition(xsd_simpleType_restriction, {}, "stuff");
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

        var definition = schemasToDefinition(xsd_simpleType_list, {}, "stuff");
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

        var definition = schemasToDefinition(xsd_complexTypeAll, {}, "stuff");
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

        var definition = schemasToDefinition(xsd_complexTypeSequence, {}, "stuff");
        assert.deepEqual(definition, expected_definition);
    });

});












