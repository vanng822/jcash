var staticHandler = require('../index.js');
var assert = require('assert');
var vows = require('vows');

var config = {
	js : {
		files : {
			'3rthwrapper' : ['gplusone.js', 'fbshare.js', 'geolocation.js', 'loading.js', 'gatracking.js'],
			'jhistory' : ['jhistory.js'],
			'jQuery' : ['jhistory.js']
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

var cssManager = staticHandler.getCssManager();
cssManager.parseConfig(config.css);

vows.describe('Test suite for none-exist dist path').addBatch({
	'when render css with none-exist dist path' : {
		topic : function() {
			var self = this;
			cssManager.renderTags('simple', function(err) {
				self.callback(err instanceof Error && /ENOENT/.test(err));
			});
		},
		'it should callback with an error ENOENT' : function(is_err) {
			assert.ok(is_err);
		}
	}
}).export(module);
