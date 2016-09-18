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
            "    <xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" elementFormDefault=\"qualified\" targetNamespace=\"http://tempuri.org\">\n" +
            "      <xs:element name=\"plain\" type=\"xs:string\">\n" +
            "      </xs:element>\n" +
            "      <xs:element name=\"simple\">\n" +
            "        <xs:simpleType>\n" +
            "          <xs:restriction base=\"xs:string\">\n" +
            "            <xs:pattern>\n" +
            "              <xs:value>[a-zA-Z0-9]{8}</xs:value>\n" +
            "            </xs:pattern>\n" +
            "          </xs:restriction>\n" +
            "        </xs:simpleType>\n" +
            "      </xs:element>\n" +
            "      <xs:element name=\"complexAll\">\n" +
            "        <xs:complexType>\n" +
            "          <xs:all>\n" +
            "            <xs:element name=\"tickerSymbola\" type=\"xs:string\">\n" +
            "            </xs:element>\n" +
            "            <xs:element name=\"tickerSymbolb\" type=\"xs:string\">\n" +
            "            </xs:element>\n" +
            "          </xs:all>\n" +
            "        </xs:complexType>\n" +
            "      </xs:element>\n" +
            "      <xs:element name=\"complexSequence\">\n" +
            "        <xs:complexType>\n" +
            "          <xs:sequence>\n" +
            "            <xs:element name=\"tickerSymbol1\" type=\"xs:string\">\n" +
            "            </xs:element>\n" +
            "            <xs:element name=\"tickerSymbol2\" type=\"xs:string\">\n" +
            "            </xs:element>\n" +
            "          </xs:sequence>\n" +
            "        </xs:complexType>\n" +
            "      </xs:element>\n" +
            "      <xs:element name=\"refrencedComplexSequence\" type=\"myns:tickerType\">\n" +
            "      </xs:element>\n" +
            "      <xs:element name=\"refrencedSimpleRestriction\" type=\"myns:verySimpleType\">\n" +
            "      </xs:element>\n" +
            "      <xs:element name=\"plainArray\" type=\"xs:string\" minOccurs=\"0\" maxOccurs=\"2\">\n" +
            "      </xs:element>\n" +
            "      <xs:complexType name=\"tickerType\">\n" +
            "        <xs:sequence>\n" +
            "          <xs:element name=\"tickerSymbolx\" type=\"xs:string\">\n" +
            "          </xs:element>\n" +
            "          <xs:element name=\"tickerSymboly\" type=\"xs:string\">\n" +
            "          </xs:element>\n" +
            "        </xs:sequence>\n" +
            "      </xs:complexType>\n" +
            "      <xs:simpleType name=\"verySimpleType\">\n" +
            "        <xs:restriction base=\"xs:string\">\n" +
            "          <xs:maxLength value=\"3\" />\n" +
            "        </xs:restriction>\n" +
            "      </xs:simpleType>\n" +
            "    </xs:schema>\n" +
            "  </types>\n" +
            "</definitions>";

        var expected_definition = {
            plain$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            plain$type: "string",
            plain$namespace: "myns",
            plainArray$attributes: { "xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema" },
            plainArray$type: ["string", 0, 2],
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
            refrencedSimpleRestriction$length: [0,3],
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
            "    <xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" elementFormDefault=\"qualified\" targetNamespace=\"http://tempuri.org\">\n" +
            "      <xs:element name=\"MyElement\" type=\"myns:MyType\">\n" +
            "      </xs:element>\n" +
            "      <xs:simpleType name=\"MyType\">\n" +
            "        <xs:restriction base=\"xs:string\">\n" +
            "          <xs:maxLength value=\"8\" />\n" +
            "        </xs:restriction>\n" +
            "      </xs:simpleType>\n" +
            "    </xs:schema>\n" +
            "  </types>\n" +
            "</definitions>"

        var expected_definition = {
            MyElement$attributes: {
                "xmlns:xs":  "http://www.w3.org/2001/XMLSchema",
                "xmlns:myns": "http://tempuri.org"
            },
            MyElement$namespace: "myns",
            MyElement$type: "string",
            MyElement$length: [0, 8],
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
            "    <xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" elementFormDefault=\"qualified\" targetNamespace=\"http://tempuri.org\">\n" +
            "      <xs:element name=\"MyElement\" type=\"myns:TradePriceRequest\">\n" +
            "      </xs:element>\n" +
            "      <xs:complexType name=\"TradePriceRequest\">\n" +
            "        <xs:sequence>\n" +
            "          <xs:element name=\"tickerSymbol1\" type=\"xs:string\">\n" +
            "          </xs:element>\n" +
            "          <xs:element name=\"tickerSymbol2\" type=\"xs:string\">\n" +
            "          </xs:element>\n" +
            "        </xs:sequence>\n" +
            "      </xs:complexType>\n" +
            "    </xs:schema>\n" +
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










