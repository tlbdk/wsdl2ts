/*eslint-env node, mocha */

// https://github.com/holidayextras/wsdl2.js

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
var WSDLUtils = require('../src/wsdlutils.js');
var XMLUtils = require('../src/xmlutils');
var fs = require('fs');
var xsd = require('libxml-xsd');

//TODO: http://www.w3schools.com/xml/schema_facets.asp , support validations

describe('_schemasToDefinition', function () {
    it('Most used XSD types', function () {
        var wsdl_sample =
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<definitions xmlns:myns=\"http://tempuri.org\">\n" +
            "  <types>\n" +
            "    <schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" elementFormDefault=\"qualified\" targetNamespace=\"http://tempuri.org\">\n" +
            "      <element name=\"plain\" type=\"xs:string\">\n" +
            "      </element>\n" +
            "      <element name=\"simple\">\n" +
            "        <simpleType>\n" +
            "          <restriction base=\"xs:string\">\n" +
            "            <pattern>\n" +
            "              <value>[a-zA-Z0-9]{8}</value>\n" +
            "            </pattern>\n" +
            "          </restriction>\n" +
            "        </simpleType>\n" +
            "      </element>\n" +
            "      <element name=\"complexAll\">\n" +
            "        <complexType>\n" +
            "          <all>\n" +
            "            <element name=\"tickerSymbola\" type=\"xs:string\">\n" +
            "            </element>\n" +
            "            <element name=\"tickerSymbolb\" type=\"xs:string\">\n" +
            "            </element>\n" +
            "          </all>\n" +
            "        </complexType>\n" +
            "      </element>\n" +
            "      <element name=\"complexSequence\">\n" +
            "        <complexType>\n" +
            "          <sequence>\n" +
            "            <element name=\"tickerSymbol1\" type=\"xs:string\">\n" +
            "            </element>\n" +
            "            <element name=\"tickerSymbol2\" type=\"xs:string\">\n" +
            "            </element>\n" +
            "          </sequence>\n" +
            "        </complexType>\n" +
            "      </element>\n" +
            "      <element name=\"refrencedComplexSequence\" type=\"myns:tickerType\">\n" +
            "      </element>\n" +
            "      <element name=\"refrencedSimpleRestriction\" type=\"myns:verySimpleType\">\n" +
            "      </element>\n" +
            "      <element name=\"plainArray\" type=\"xs:string\" maxOccurs=\"2\">\n" +
            "        <minOccurs>0</minOccurs>\n" +
            "      </element>\n" +
            "      <complexType name=\"tickerType\">\n" +
            "        <sequence>\n" +
            "          <element name=\"tickerSymbolx\" type=\"xs:string\">\n" +
            "          </element>\n" +
            "          <element name=\"tickerSymboly\" type=\"xs:string\">\n" +
            "          </element>\n" +
            "        </sequence>\n" +
            "      </complexType>\n" +
            "      <simpleType name=\"verySimpleType\">\n" +
            "        <restriction base=\"xs:string\">\n" +
            "          <maxLength>3</maxLength>\n" +
            "        </restriction>\n" +
            "      </simpleType>\n" +
            "    </schema>\n" +
            "  </types>\n" +
            "</definitions>";

        var expected_definition = {
            plain$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            plain$type: "string",
            plain$namespace: "myns",
            plainArray$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            plainArray$type: ["string"],
            plainArray$namespace: "myns",
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

        var wsdlutils = new WSDLUtils(wsdl_sample);
        var definition = wsdlutils.getDefinition();
        assert.deepEqual(definition, expected_definition);
    });

});

describe('xsdToDefinition test', function () {
    it('xsd_simple with references', function () {
        var wsdl_sample =
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<definitions xmlns:myns=\"http://tempuri.org\">\n" +
            "  <types>\n" +
            "    <schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" elementFormDefault=\"qualified\" targetNamespace=\"http://tempuri.org\">\n" +
            "      <element name=\"MyElement\" type=\"myns:MyType\">\n" +
            "      </element>\n" +
            "      <simpleType name=\"MyType\">\n" +
            "        <restriction base=\"xs:string\">\n" +
            "          <maxLength value=\"8\">\n" +
            "          </maxLength>\n" +
            "        </restriction>\n" +
            "      </simpleType>\n" +
            "    </schema>\n" +
            "  </types>\n" +
            "</definitions>"

        var expected_definition = {
            MyElement$attributes: {
                "xmlns:xs":  "http://www.w3.org/2001/XMLSchema",
                "xmlns:myns": "http://tempuri.org"
            },
            MyElement$namespace: "myns",
            MyElement$type: "string",
        };

        var wsdlutils = new WSDLUtils(wsdl_sample);
        var definition = wsdlutils.getDefinition();
        assert.deepEqual(definition, expected_definition);
    });

    it('xsd_complexTypeSequence with references', function () {
        var wsdl_sample =
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<definitions xmlns:myns=\"http://tempuri.org\">\n" +
            "  <types>\n" +
            "    <schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" elementFormDefault=\"qualified\" targetNamespace=\"http://tempuri.org\">\n" +
            "      <element name=\"MyElement\" type=\"myns:TradePriceRequest\">\n" +
            "      </element>\n" +
            "      <complexType name=\"TradePriceRequest\">\n" +
            "        <sequence>\n" +
            "          <element name=\"tickerSymbol1\" type=\"xs:string\">\n" +
            "          </element>\n" +
            "          <element name=\"tickerSymbol2\" type=\"xs:string\">\n" +
            "          </element>\n" +
            "        </sequence>\n" +
            "      </complexType>\n" +
            "    </schema>\n" +
            "  </types>\n" +
            "</definitions>";

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

        var wsdlutils = new WSDLUtils(wsdl_sample);
        var definition = wsdlutils.getDefinition();
        assert.deepEqual(definition, expected_definition);
    });
});

describe("getSchemaXML", function() {
    it("extract XSD and validate request", function () {
        var wsdl_sample = fs.readFileSync(__dirname + "/../examples/StockQuote.wsdl", 'utf8');

        var expected_definition = {
            TradePrice$attributes: {
                "xmlns:soap": "http://schemas.xmlsoap.org/wsdl/soap/",
                "xmlns:tns": "http://example.com/stockquote.wsdl",
                "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                "xmlns:xsd1": "http://example.com/stockquote.xsd"
            },
            TradePrice$namespace: "xsd1",
            TradePrice: {
                price$type: "float"
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

        var wsdlutils = new WSDLUtils(wsdl_sample);
        var definition = wsdlutils.getDefinition();
        assert.deepEqual(definition, expected_definition);

        var sample_obj = {
            TradePriceRequest: {
                tickerSymbol: "GOOG"
            }
        };
        var xmlutils = new XMLUtils(definition);
        var sample_xml = xmlutils.toXML(sample_obj, "TradePriceRequest");

        // Validate schema against generated XML
        var schemaXML = wsdlutils.getSchemaXML();
        var schema = xsd.parse(schemaXML);
        var validationErrors = schema.validate(sample_xml);
        assert.equal(null, validationErrors);
    });
});










