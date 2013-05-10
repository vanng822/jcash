var staticHandler = require('../index.js');
var assert = require('assert');


var config = {
	js : {
		files : {
			'3rthwrapper' : ['gplusone.js', 'fbshare.js'],
			'jhistory' : ['jhistory.js']
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
	active : false,
	inmemory : true,
	pathJs : __dirname + '/data/js',
	pathCss : __dirname + '/data/css',
	locationCss : '/css',
	locationJs : '/js',
	maxAgeCss : 3600,
	maxAgeJs : 3600,
	baseurlCss : 'http://igeonotecss.com',
	baseurlJs : ''
});

var jsManager = staticHandler.getJsManager();
var cssManager = staticHandler.getCssManager();

jsManager.parseConfig(config.js);
cssManager.parseConfig(config.css);

cssManager.preRenderAll();
jsManager.preRenderAll();

function test() {
	if(!jsManager.isDone() || !cssManager.isDone()) {
		setImmediate(test);
		return;
	}
	console.log('Start running the inactive test ...');
	assert.equal(cssManager.renderTags('simple', function(err) {
		assert.fail(err,null,'Should not call error cb');
	}), '<link href="http://igeonotecss.com/css/simple.css" rel="stylesheet" />');
	
	assert.equal(jsManager.renderTags('3rthwrapper', function(err) {
		assert.fail(err,null,'Should not call error cb');
	}), '<script src="/js/gplusone.js" type="text/javascript"></script><script src="/js/fbshare.js" type="text/javascript"></script>');
	
	assert.equal(jsManager.renderTags('googleMap', function(err) {
		assert.fail(err,null,'Should not call error cb');
	}), '<script src="http://maps.google.com/maps/api/js?sensor=false" type="text/javascript"></script>');
};

test();
