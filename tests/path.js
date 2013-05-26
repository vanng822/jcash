var staticHandler = require('../index.js');
var assert = require('assert');
var vows = require('vows');

staticHandler.globalSettings({
	active : true,
	inmemory : true,
	pathJs : __dirname + '/data/jss',
	pathCss : __dirname + '/data/cs',
	locationCss : '/styles',
	locationJs : '/javascript',
	maxAgeCss : 3600,
	maxAgeJs : 3600
});

var jsManager = staticHandler.getJsManager();
var cssManager = staticHandler.getCssManager();

vows.describe('Test suite for none-exist path').addBatch({
	'When provide a none-exist path the manager should throw an error' : function() {
		assert.throws(function() {
			jsManager.checkPath();
		}, function(err) {
			if(( err instanceof Error) && /Path does not exist/.test(err)) {
				return true;
			}
		}, "Expected an error due to path doesn't exist");

		assert.throws(function() {
			cssManager.checkPath();
		}, function(err) {
			if(( err instanceof Error) && /Path does not exist/.test(err)) {
				return true;
			}
		}, "Expected an error due to path doesn't exist");
	}
}).export(module);
