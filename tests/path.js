var staticHandler = require('../index.js');
var assert = require('assert');

staticHandler.globalSettings({
	active : true,
	inmemory : true,
	path : {
		js : __dirname + '/data/jss',
		css : __dirname + '/data/cs'
	},
	location : {
		css : '/styles',
		js : '/javascript'
	},
	maxAge : {
		css : 3600,
		js : 3600
	}
});

var jsManager = staticHandler.getJsManager();
var cssManager = staticHandler.getCssManager();


function test() {
	console.log('Start running the path test ...');
	
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
	
	console.log('path test done!');
};

test();
