var requirejs = require("requirejs");
var expect = require("chai").expect;
var assert = require("chai").assert;

requirejs.config({
    baseUrl: 'js',
    nodeRequire: require
});

describe('Card Testing', function() {
  // Load modules with requirejs before tests
  before(function(done) {
      requirejs(['observerUtils'], function(ObserverUtils) {
          obsUtils = ObserverUtils;
          done();
      });
  });
});


describe("Basic Observer-Subject test", function () {
	it ("should return number of observers of a subject", function () {
		assert.equal(1, 1.0);
	});
});
