var assert = require('assert');
var chai = require('chai');

var xmlutils = require('../src/xmlutils');

describe('String#split', function(){
  it('should return an array', function(){
    assert(Array.isArray('a,b,c'.split(',')));
  });
})