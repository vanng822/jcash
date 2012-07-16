var staticHandler = require('../index.js');
var assert = require('assert');

var config = {
	js : {
		files : {
			'3rthwrapper' : [
				'gplusone.js',
				'fbshare.js', 
				'geolocation.js',
				'loading.js', 
				'gatracking.js'
				],
			'jhistory' : [
				'jhistory.js'
			],
			'jQuery' : [
				'jhistory.js'
			]
		},
		urls : {
			'jQuery' : ['http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'],
			'googleMap' : ['http://maps.google.com/maps/api/js?sensor=false']
		},
		locationMap : {
			'/' : ['jQuery', 'jshistory', '3rthwrapper', 'googleMap'],
			'/note' : ['jQuery', 'jhistory'],
			'/city/map' : ['jQuery', 'jhistory', 'googleMap']
		}
	},
	css : {
		files : {
			'simple' : ['simple.css'],
			'mobile' : ['mobile.css']
		},
		urls : {

		},
		locationMap : {
			'*' : ['simple']
		}
	}
};

staticHandler.globalSettings({
	active : true,
	inmemory : false,
	pathJs : __dirname + '/data/js',
	pathCss : __dirname + '/data/css',
	locationCss : '/styles',
	locationJs : '/javascript',
	distCss : 'disst',
	distJs : 'disst',
	maxAgeCss : 3600,
	maxAgeJs : 3600
});

var jsManager = staticHandler.getJsManager();
var cssManager = staticHandler.getCssManager();

jsManager.parseConfig(config.js);
cssManager.parseConfig(config.css);

function test() {
	console.log('Start running the write error test ...');
	cssManager.renderTags('simple', function(err) {/*TODO: better way to assert */
		assert.ok(err instanceof Error && /ENOENT/.test(err));
		console.log('write error test done!');
	});
};

test();
