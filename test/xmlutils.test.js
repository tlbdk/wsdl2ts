/*eslint-env node, mocha */

var chai = require('chai');
var assert = chai.assert;

var XMLUtils = require('../src/xmlutils');

describe('XMLUtils#toXML/fromXML mixed inline and definition', function () {
  var sample_definition = {
    "root$attributes": { "xmlns:myns": "http://tempuri.org" },
    "root": {
      "list$namespace": "myns",
      "list$attributes": { "outer": "hello" },
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

  var generated_xml = XMLUtils.toXML(sample_obj, sample_definition, "root");

  it('sample should convert to XML that looks the same as sample_xml', function () {
    assert.strictEqual(sample_xml, generated_xml);
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

  it('sample should convert to XML that looks the same as sample_xml', function () {
    var generated_xml = XMLUtils.toXML(sample_obj, null, "root");
    assert.strictEqual(sample_xml, generated_xml);
  });

  it('should return the order of the elements and convert back to the same sample_xml', function () {
    var generated_obj = XMLUtils.fromXML(sample_xml);
    assert.deepEqual(generated_obj["root$order"], ["first", "second", "last"]);
    assert.deepEqual(generated_obj["root"]["first$order"], ["firstNested", "secondNested"]);

    var generated_xml = XMLUtils.toXML(generated_obj, null, "root");
    assert.strictEqual(sample_xml, generated_xml);
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

  //console.log(JSON.stringify(result, null, 2));
  it('should convert to XML and back to js again', function () {
    var xml = XMLUtils.toXML(sample_obj, sample_definition, "Envelope");
    //console.log(xml);
    assert.isTrue(xml.startsWith("<soap:Envelope"));
    var obj = XMLUtils.fromXML(xml, sample_definition);
    //console.log(JSON.stringify(obj, null, 2));
    assert.deepEqual(obj.Envelope.Body.values.value, sample_obj.Envelope.Body.values.value);
    //assert.deepEqual(obj, merge(sample_definition, sample_obj));
  });
});