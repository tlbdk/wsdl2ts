/*eslint-env node, mocha */

//var assert = require('assert');
var chai = require('chai');
var assert = chai.assert;
//var merge = require('deepmerge');

var XMLUtils = require('../src/xmlutils');

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
    assert.strictEqual(sample_xml, XMLUtils.toXML(sample_obj, null, "root"));
  });

  it('should return the order of the elements and convert back to the same sample_xml', function () {
    var obj = XMLUtils.fromXML(sample_xml);
    assert.strictEqual(sample_xml, XMLUtils.toXML(obj, null, "root"));
    assert.deepEqual(obj["root$order"], ["first", "second", "last"]);
    assert.deepEqual(obj["root"]["first$order"], ["firstNested", "secondNested"]);
  });
  
});

describe('XMLUtils#toXML/fromXML complex object', function () {
  var sample_obj = {
    "Envelope": {
      "Header": {
        "$myObjectAttib": "aValue1", // TODO: support this
        "arrays": {
          "array": [
            {
              "$mySingleArrayAttrib": "test", // TODO: support this
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
      "soap:SameName": "name1", // TODO: Support this
      "soap2:SameName": "name2",
      "isArray": ["Stuff"],
    }
  };

  var sample_definition = {
    "Envelope$namespace": "soap",
    "Envelope$attributes": {
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
          "array": ""
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
          "value": ""
        },
        "Fault": {
        }
      },
      "isArray$type": [],
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