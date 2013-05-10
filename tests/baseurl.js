var staticHandler = require('../index.js');
var assert = require('assert');

var config = {
	js : {
		files : {
			'3rthwrapper' : ['gplusone.js', 'fbshare.js', 'geolocation.js', 'loading.js', 'gatracking.js'],
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
	active : true,
	inmemory : true,
	pathJs : __dirname + '/data/js',
	pathCss : __dirname + '/data/css',
	locationCss : '/styles',
	locationJs : '/javascript',
	maxAgeCss : 3600,
	maxAgeJs : 3600,
	baseurlCss : 'http://igeonotecss.com',
	baseurlJs : 'http://igeonotejs.com'
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

	console.log('Start running the basurl tests ...');
	assert.equal(jsManager.getUrls('3rthwrapper')[0], 'http://igeonotejs.com/javascript/dist/359d39bfca5ea031eca0d55ba732d434.js');
	assert.equal(jsManager.getUrls('jhistory')[0], 'http://igeonotejs.com/javascript/dist/c45c3983e39ef2d0cea5a01fc657f0b1.js');
	assert.equal(jsManager.renderTags('3rthwrapper'), '<script src="http://igeonotejs.com/javascript/dist/359d39bfca5ea031eca0d55ba732d434.js" type="text/javascript"></script>');
	assert.equal(jsManager.renderTags('jhistory'), '<script src="http://igeonotejs.com/javascript/dist/c45c3983e39ef2d0cea5a01fc657f0b1.js" type="text/javascript"></script>');

	assert.deepEqual(jsManager.getLocationMap('/'), ['jQuery', 'jshistory', '3rthwrapper', 'googleMap']);
	assert.deepEqual(jsManager.getLocationMap('/note'), ['jQuery', 'jhistory']);
	assert.deepEqual(jsManager.getLocationMap('/city/map'), ['jQuery', 'jhistory', 'googleMap']);
	assert.deepEqual(jsManager.getLocationMap('/none'), []);
	assert.deepEqual(jsManager.getLocationMap(), []);

	assert.equal(cssManager.getUrls('simple')[0], 'http://igeonotecss.com/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css');
	assert.equal(cssManager.getUrls('mobile')[0], 'http://igeonotecss.com/styles/dist/d41d8cd98f00b204e9800998ecf8427e.css');
	assert.equal(cssManager.renderTags('simple'), '<link href="http://igeonotecss.com/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css" rel="stylesheet" />');
	assert.equal(cssManager.renderTags('mobile'), '<link href="http://igeonotecss.com/styles/dist/d41d8cd98f00b204e9800998ecf8427e.css" rel="stylesheet" />');

	assert.deepEqual(cssManager.getLocationMap('/city/map'), ['simple']);
	assert.deepEqual(cssManager.getLocationMap(), ['simple']);

	assert.equal(cssManager.hasContent('/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css'), true);
	assert.deepEqual(cssManager.getContent('/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css'), {
		location : '/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css',
		minifiedContent : 'body{width:100%}',
		md5OfContent : '7b15f87241fa98c82689ac21b216b9b7'
	});
	assert.deepEqual(cssManager.getContent('/styles/dist/d41d8cd98f00b204e9800998ecf8427e.css'), {
		location : '/styles/dist/d41d8cd98f00b204e9800998ecf8427e.css',
		minifiedContent : '',
		md5OfContent : 'd41d8cd98f00b204e9800998ecf8427e'
	});

	console.log('baseurl tests done!');
};

console.log('waiting for md5 calculation for baseurl test ...');
test();
