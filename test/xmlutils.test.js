/*eslint-env node, mocha */

var chai = require('chai');
var assert = chai.assert;

var XMLUtils = require('../src/xmlutils');

describe('XMLUtils#toXML/fromXML mixed inline and definition', function () {
    it('sample should convert to XML that looks the same as sample_xml', function () {
        var sample_definition = {
            "root$attributes": {"xmlns:myns": "http://tempuri.org"},
            "root": {
                "list$namespace": "myns",
                "list$attributes": {"outer": "hello"},
                "list": {
                    "item$namespace": "myns"
                }
            }
        };

        var sample_obj = {
            "root": {
                "$xmlns:xs": "http://www.w3.org/2001/XMLSchema", // Define a new namespace inline
                "list": {
                    "xs:item": [
                        {
                            "$inline": "first",
                            "$": "value1"
                        },
                        {
                            "namespace$": "myns",
                            "$inline": "second",
                            "$": "value2"
                        },
                        "value3"
                    ],
                    "item": "after"
                }
            }
        };

        var sample_xml = [
            '<root xmlns:myns="http://tempuri.org" xmlns:xs="http://www.w3.org/2001/XMLSchema">',
            '  <myns:list outer="hello">',
            '    <xs:item inline="first">value1</xs:item>',
            '    <myns:item inline="second">value2</myns:item>',
            '    <xs:item>value3</xs:item>',
            '    <myns:item>after</myns:item>',
            '  </myns:list>',
            '</root>'
        ].join("\n");

        var xmlutils = new XMLUtils(sample_definition);
        var generated_xml = xmlutils.toXML(sample_obj, "root");
        assert.strictEqual(generated_xml, sample_xml);
    });
});


describe('XMLUtils#toXML/fromXML simple', function () {
  var sample_obj = {
    "root": {
      "first": {
        "firstNested": "",
        "secondNested": ""
      },
      "second": "",
      "last": {
        "stuff": "",
      }
    }
  };

  var sample_xml = [
    "<root>",
    "  <first>",
    "    <firstNested></firstNested>",
    "    <secondNested></secondNested>",
    "  </first>",
    "  <second></second>",
    "  <last>",
    "    <stuff></stuff>",
    "  </last>",
    "</root>"
  ].join("\n");

  var xmlutils = new XMLUtils(null); // TODO: Order is not guarantied with null

  it('sample should convert to XML that looks the same as sample_xml', function () {
    var generated_xml = xmlutils.toXML(sample_obj, "root");
    assert.strictEqual(sample_xml, generated_xml);
  });

  it('should return the order of the elements and convert back to the same sample_xml', function () {
    var generated_obj = xmlutils.fromXML(sample_xml);
    assert.deepEqual(generated_obj["root$order"], ["first", "second", "last"]);
    assert.deepEqual(generated_obj["root"]["first$order"], ["firstNested", "secondNested"]);

    var generated_xml = xmlutils.toXML(generated_obj, "root");
    assert.strictEqual(generated_xml, sample_xml);
  });

});

describe('XMLUtils#toXML/fromXML complex object', function () {
  var sample_obj = {
    "Envelope": {
      "Header": {
        "$myObjectAttib": "aValue1",
        "arrays": {
          "array": [
            {
              "$mySingleArrayAttrib": "test",
              "key": "value1"
            },
            {
              "key": "value2"
            },
            {
              "key": "value3"
            }
          ]
        }
      },
      "Body": {
        "value": "stuff",
        "values": {
          "value": ["a", "b", "c"]
        },
        "Fault": ""
      },
      "soap:SameName": "name1",
      "soap2:SameName": "name2",
      "isArray": ["Stuff"],
    }
  };

  var sample_definition = {
    "Envelope$namespace": "soap",
    "Envelope$attributes": {
      "xmlns:myns1": "http://myns1",
      "xmlns:myns2": "http://myns1",
      "xmlns:soap": "http://www.w3.org/2003/05/soap-envelope/",
      "xmlns:soap2": "http://www.w3.org/2003/05/soap-envelope/",
      "soap:encodingStyle": "http://www.w3.org/2003/05/soap-encoding",
    },
    "Envelope$order": ["Header", "Body"],
    "Envelope": {
      "Header$namespace": "soap",
      "Header": {
        "arrays": {
          "array$type": [],
          "array$attributes": {
            "SameOnAll": "same"
          },
        }
      },
      "Body$namespace": "soap",
      "Body": {
        "value": "string",
        "values$attributes": {
          "xmlns:stuff": "http://www.w3.org/2003/05/soap-encoding"
        },
        "values": {
          "value$namespace": "stuff",
          "value$type": [],
        },
      },
      "isArray$type": [],
      "myns1:overlaps$type": [], // TODO: implement
      "myns2:overlaps$type": []
    }
  };

  var xmlutils = new XMLUtils(sample_definition);

  //console.log(JSON.stringify(result, null, 2));
  it('should convert to XML and back to js again', function () {
    var xml = xmlutils.toXML(sample_obj, "Envelope");
    //console.log(xml);
    assert.isTrue(xml.startsWith("<soap:Envelope"));
    var obj = xmlutils.fromXML(xml);
    //console.log(JSON.stringify(obj, null, 2));
    assert.deepEqual(obj.Envelope.Body.values.value, sample_obj.Envelope.Body.values.value);
    //assert.deepEqual(obj, merge(sample_definition, sample_obj));
  });
});


describe('XMLUtils#toXML/fromXML simple', function () {
    var sample_obj = {
        "root": {
            "first": {
                "firstNested": "",
                "secondNested": ""
            },
            "second": "",
            "last": {
                "stuff": "test",
            }
        }
    };

    var sample_xml = [
        "<root>",
        "  <first>",
        "    <firstNested />",
        "    <secondNested />",
        "  </first>",
        "  <second />",
        "  <last>",
        "    <stuff>test</stuff>",
        "  </last>",
        "</root>"
    ].join("\n");

    var xmlutils = new XMLUtils(null);

    it('sample should convert to XML that looks the same as sample_xml', function () {
        var generated_xml = xmlutils.toXML(sample_obj, "root", 2, true);
        assert.strictEqual(sample_xml, generated_xml);
    });
});

describe('Binary encoding', function () {
    var definition = {
        complexAll: {
            tickerSymbola$type: "base64Binary",
            tickerSymbolb$type: "hexBinary",
        }
    };

    var obj = {
        complexAll: {
            tickerSymbola: Buffer.from("ÆØÅ"),
            tickerSymbolb: Buffer.from("ÅØÆ")
        },
        complexAll$order: [
            "tickerSymbola",
            "tickerSymbolb"
        ]
    };

    var xml = [
        "<complexAll>",
        "  <tickerSymbola>w4bDmMOF</tickerSymbola>",
        "  <tickerSymbolb>c385c398c386</tickerSymbolb>",
        "</complexAll>",
    ].join("\n");

    it('Base64/Hex Encode', function () {
        var xmlutils = new XMLUtils(definition);
        var generatedXml = xmlutils.toXML(obj, "complexAll");
        assert.strictEqual(generatedXml, xml);
    });
    it('Base64/Hex Decode', function () {
        var xmlutils = new XMLUtils(definition);
        var generatedObj = xmlutils.fromXML(xml);
        assert.deepEqual(generatedObj, obj);
    });
});

describe('Types', function () {
    var definition = {
        complexAll: {
            boolean1$type: "boolean",
            boolean2$type: "boolean",
            float$type: "float",
            int$type: "int",
        },
    };
    var obj = {
        complexAll: {
            boolean1: true,
            boolean2: false,
            float: 1.1,
            int: 1,
        },
        complexAll$order: [
            "boolean1",
            "boolean2",
            "float",
            "int"
        ]
    };

    var xml = [
        "<complexAll>",
        "  <boolean1>true</boolean1>",
        "  <boolean2>false</boolean2>",
        "  <float>1.1</float>",
        "  <int>1</int>",
        "</complexAll>",
    ].join("\n");

    it('to', function () {
        var xmlutils = new XMLUtils(definition);
        var generatedXml = xmlutils.toXML(obj, "complexAll");
        assert.strictEqual(generatedXml, xml);
    });

    it('from', function () {
        var xmlutils = new XMLUtils(definition);
        var generatedObj = xmlutils.fromXML(xml, "complexAll");
        assert.deepEqual(generatedObj, obj);
    });
});

describe('Escaping', function () {
    var obj = {
        complexAll: {
            nestedXml: "<xml>...</xml>",
            charsXml: "%<>\"'",
            charsRaw: "&gt;&lt;&amp;",
            cdata: "<![CDATA['><]]>",
            comment: "<!-- my comment -->",
        }
    };
    var objParsed = {
        complexAll: {
            nestedXml: "<xml>...</xml>",
            charsXml: "%<>\"'",
            charsRaw: "><&",
            cdata: "'><",
            comment: '<!-- my comment -->',
        },
        complexAll$order: [
            "nestedXml",
            "charsXml",
            "charsRaw",
            "cdata",
            "comment"
        ]
    };

    var xml = [
        "<complexAll>",
        "  <nestedXml>&lt;xml&gt;...&lt;/xml&gt;</nestedXml>",
        "  <charsXml>%&lt;&gt;&quot;&apos;</charsXml>",
        "  <charsRaw>&gt;&lt;&amp;</charsRaw>",
        "  <cdata><![CDATA['><]]></cdata>",
        "  <comment>&lt;!-- my comment --&gt;</comment>",
        "</complexAll>",
    ].join("\n");

    it('to', function () {
        var xmlutils = new XMLUtils();
        var generatedXml = xmlutils.toXML(obj, "complexAll");
        assert.strictEqual(generatedXml, xml);
    });

    it('from', function () {
        var xmlutils = new XMLUtils();
        var generatedObj = xmlutils.fromXML(xml, "complexAll");
        assert.deepEqual(generatedObj, objParsed);
    });
});

describe('Sample generation', function () {
    it('Simple', function () {
        var definition = {
            complexAll$attributes: {"xmlns:myns": "http://tempuri.org", "xmlns:xs": "http://www.w3.org/2001/XMLSchema"},
            complexAll$namespace: "myns",
            complexAll: {
                tickerSymbola$type: "string",
                tickerSymbola$namespace: "myns",
                tickerSymbolb$type: "string",
                tickerSymbolb$namespace: "myns",
            },
        };

        var expected = {
            complexAll: {
                tickerSymbola: " ",
                tickerSymbolb: " "
            }
        };

        var xmlutils = new XMLUtils(definition);
        var sample = xmlutils.generateSample("complexAll");
        assert.deepEqual(sample, expected);
    });

    it('Length and Array', function () {
        var definition = {
            complexAllLength$attributes: {
                "xmlns:myns": "http://tempuri.org",
                "xmlns:xs": "http://www.w3.org/2001/XMLSchema"
            },
            complexAllLength$namespace: "myns",
            complexAllLength: {
                tickerSymbola$type: "string",
                tickerSymbola$length: [10, 10],
                tickerSymbola$namespace: "myns",
                tickerSymbolb$type: ["string", 2, 2],
                tickerSymbolb$length: [1, 1],
                tickerSymbolb$namespace: "myns",
            }
        };

        var expected = {
            complexAllLength: {
                tickerSymbola: "          ",
                tickerSymbolb: [" ", " "]
            }
        };

        var xmlutils = new XMLUtils(definition);
        var sample = xmlutils.generateSample("complexAllLength");
        assert.deepEqual(sample, expected);
    });
});

describe('Test soap envelope', function () {
    const definition = {
        complexAll: {
            xmlBlob$type: "xml",
        }
    };

    var expectedXml = [
        '<complexAll>',
        '  <xmlBlob>',
        '    <myxml>stuff</myxml>',
        '  </xmlBlob>',
        '</complexAll>',
    ].join("\n");

    var obj = {
        complexAll: {
            xmlBlob: "<myxml>stuff</myxml>"
        }
    };

    it('to', function () {
        var xmlUtils = new XMLUtils(definition);
        var generatedXml = xmlUtils.toXML(obj, "complexAll");
        assert.strictEqual(generatedXml, expectedXml);
    });
});
