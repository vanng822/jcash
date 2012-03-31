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
			'mobile' : ['simple.css']
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
	inmemory : true,
	path : {
		js : __dirname + '/data/js',
		css : __dirname + '/data/css'
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

jsManager.parseConfig(config.js);
cssManager.parseConfig(config.css);

cssManager.preRenderAll();
jsManager.preRenderAll();
	

function test() {
	if (!jsManager.isDone() || !cssManager.isDone()) {
		console.log('waiting for md5 calculation ...');
		setTimeout(test,10);
		return;
	}
	
	console.log('Start running the tests ...');
	assert.equal(jsManager.getUrls('3rthwrapper')[0],'/javascript/dist/f8b0aedcbba67c37d8d44d427dccae2c.js');
	assert.equal(jsManager.getUrls('jhistory')[0],'/javascript/dist/6a744912514b63ade76d53e5db15a9ce.js');
	assert.equal(jsManager.renderTags('3rthwrapper'), '<script src="/javascript/dist/f8b0aedcbba67c37d8d44d427dccae2c.js" type="text/javascript"></script>');
	assert.equal(jsManager.renderTags('jhistory'), '<script src="/javascript/dist/6a744912514b63ade76d53e5db15a9ce.js" type="text/javascript"></script>');
	
	assert.deepEqual(jsManager.getLocationMap('/'), ['jQuery', 'jshistory', '3rthwrapper', 'googleMap']);
	assert.deepEqual(jsManager.getLocationMap('/note'), ['jQuery', 'jhistory']);
	assert.deepEqual(jsManager.getLocationMap('/city/map'), ['jQuery', 'jhistory', 'googleMap']);
	assert.deepEqual(jsManager.getLocationMap('/none'), []);
	assert.deepEqual(jsManager.getLocationMap(), []);
	
	assert.equal(cssManager.getUrls('simple')[0],'/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css');
	assert.equal(cssManager.getUrls('mobile')[0],'/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css');
	assert.equal(cssManager.renderTags('simple'), '<link href="/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css" rel="stylesheet" />');
	assert.equal(cssManager.renderTags('mobile'), '<link href="/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css" rel="stylesheet" />');
	
	assert.deepEqual(cssManager.getLocationMap('/city/map'), ['simple']);
	assert.deepEqual(cssManager.getLocationMap(), ['simple']);
	
	assert.equal(cssManager.hasContent('/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css'), true);
	assert.deepEqual(cssManager.getContent('/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css'),['/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css','body{width:100%}','7b15f87241fa98c82689ac21b216b9b7']);
	
	console.log('DONE!');
};


test();