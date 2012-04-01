var staticHandler = require('../index.js');
var assert = require('assert');

staticHandler.globalSettings({
	active : true,
	inmemory : true,
	pathJs : __dirname + '/data/js',
	pathCss : __dirname + '/data/css',
	locationCss : '/styles',
	locationJs : '/javascript',
	maxAgeCss : 3600,
	maxAgeJs : 3600
});

var cssManager = staticHandler.getCssManager();
cssManager.parseConfig({files : {
			'simple' : ['simple2.css'],
			'mobile' : ['mobile.css']
		}})

function test() {
	console.log('Start running the filename test ...');
	
	cssManager.renderTags('simple', function(err) {
		assert.ok(err instanceof Error && /Could not read data for file/.test(err));
	});
	
	console.log('filename test done!');
};

test();
