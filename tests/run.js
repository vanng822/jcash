var staticHandler = require('../index.js');
var assert = require('assert');
var fs = require('fs');
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
	inmemory : true,
	pathJs : __dirname + '/data/js',
	pathCss : __dirname + '/data/css',
	locationCss : '/styles',
	locationJs : '/javascript',
	maxAgeCss : 3600,
	maxAgeJs : 3600
});

var jsManager = staticHandler.getJsManager();
var cssManager = staticHandler.getCssManager();

jsManager.parseConfig(config.js);
cssManager.parseConfig(config.css);

cssManager.preRenderAll();
jsManager.preRenderAll();

function test() {
	if(!jsManager.isDone() || !cssManager.isDone()) {
		process.nextTick(test);
		return;
	}
	console.log('Start running the md5 tests ...');
	assert.equal(jsManager.getUrls('3rthwrapper')[0], '/javascript/dist/359d39bfca5ea031eca0d55ba732d434.js');
	assert.equal(jsManager.getUrls('jhistory')[0], '/javascript/dist/c45c3983e39ef2d0cea5a01fc657f0b1.js');
	assert.deepEqual(jsManager.getUrls('jQuery'), ['http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js', '/javascript/dist/c45c3983e39ef2d0cea5a01fc657f0b1.js']);
	assert.deepEqual(jsManager.getUrls('googleMap'), ['http://maps.google.com/maps/api/js?sensor=false']);

	assert.equal(jsManager.renderTags('3rthwrapper'), '<script src="/javascript/dist/359d39bfca5ea031eca0d55ba732d434.js" type="text/javascript"></script>');
	assert.equal(jsManager.renderTags('jhistory'), '<script src="/javascript/dist/c45c3983e39ef2d0cea5a01fc657f0b1.js" type="text/javascript"></script>');

	assert.equal(jsManager.renderTags('jQuery'), '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script><script src="/javascript/dist/c45c3983e39ef2d0cea5a01fc657f0b1.js" type="text/javascript"></script>');
	assert.equal(jsManager.renderTags('googleMap'), '<script src="http://maps.google.com/maps/api/js?sensor=false" type="text/javascript"></script>');

	assert.deepEqual(jsManager.getLocationMap('/'), ['jQuery', 'jshistory', '3rthwrapper', 'googleMap']);
	assert.deepEqual(jsManager.getLocationMap('/note'), ['jQuery', 'jhistory']);
	assert.deepEqual(jsManager.getLocationMap('/city/map'), ['jQuery', 'jhistory', 'googleMap']);
	assert.deepEqual(jsManager.getLocationMap('/none'), []);
	assert.deepEqual(jsManager.getLocationMap(), []);

	assert.equal(cssManager.getUrls('simple')[0], '/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css');
	assert.equal(cssManager.getUrls('mobile')[0], '/styles/dist/d41d8cd98f00b204e9800998ecf8427e.css');
	assert.equal(cssManager.renderTags('simple'), '<link href="/styles/dist/7b15f87241fa98c82689ac21b216b9b7.css" rel="stylesheet" />');
	assert.equal(cssManager.renderTags('mobile'), '<link href="/styles/dist/d41d8cd98f00b204e9800998ecf8427e.css" rel="stylesheet" />');

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

	/* default keys */
	var testDumpCssDefault = '';
	testDumpCssDefault += 'static.css.simple.location = /styles/dist/7b15f87241fa98c82689ac21b216b9b7.css' + "\n";
	testDumpCssDefault += 'static.css.simple.minifiedContent = body{width:100%}' + "\n";
	testDumpCssDefault += 'static.css.simple.md5OfContent = 7b15f87241fa98c82689ac21b216b9b7' + "\n";
	testDumpCssDefault += 'static.css.mobile.location = /styles/dist/d41d8cd98f00b204e9800998ecf8427e.css' + "\n";
	testDumpCssDefault += 'static.css.mobile.minifiedContent = ' + "\n";
	testDumpCssDefault += 'static.css.mobile.md5OfContent = d41d8cd98f00b204e9800998ecf8427e' + "\n";

	assert.equal(cssManager.dump("", {
		prekey : "static.css",
		returnValue : true
	}), testDumpCssDefault);
	
	var testDumpCssEscape = ''
	testDumpCssEscape += 'static.css.simple.location = /styles/dist/7b15f87241fa98c82689ac21b216b9b7.css' + "\n";
	testDumpCssEscape += "static.css.simple.minifiedContent = body\\{width:100\\%\\}" + "\n";
	testDumpCssEscape += 'static.css.simple.md5OfContent = 7b15f87241fa98c82689ac21b216b9b7' + "\n";
	testDumpCssEscape += 'static.css.mobile.location = /styles/dist/d41d8cd98f00b204e9800998ecf8427e.css' + "\n";
	testDumpCssEscape += 'static.css.mobile.minifiedContent = ' + "\n";
	testDumpCssEscape += 'static.css.mobile.md5OfContent = d41d8cd98f00b204e9800998ecf8427e' + "\n";
	
	assert.equal(cssManager.dump("", {
		prekey : "static.css",
		returnValue : true,
		escape : function(c) {
			return String(c).replace(/{/g,'\\{').replace(/}/g,'\\}').replace(/%/g,'\\%');
		}
	}), testDumpCssEscape);
	
	var testDumpCss = ''
	testDumpCss += 'static.css.simple.location = /styles/dist/7b15f87241fa98c82689ac21b216b9b7.css' + "\n";
	testDumpCss += 'static.css.simple.content = body{width:100%}' + "\n";
	testDumpCss += 'static.css.simple.md5OfContent = 7b15f87241fa98c82689ac21b216b9b7' + "\n";
	testDumpCss += 'static.css.mobile.location = /styles/dist/d41d8cd98f00b204e9800998ecf8427e.css' + "\n";
	testDumpCss += 'static.css.mobile.content = ' + "\n";
	testDumpCss += 'static.css.mobile.md5OfContent = d41d8cd98f00b204e9800998ecf8427e' + "\n";

	assert.equal(cssManager.dump(__dirname + '/data/js/dist/dump.conf', {
		prekey : "static.css",
		minifiedContent : 'content',
		returnValue : true
	}), testDumpCss);

	fs.readFile(__dirname + '/data/js/dump.conf', function(err, data) {
		assert.equal(jsManager.dump("", {
			prekey : "static.js",
			minifiedContent : 'content',
			returnValue : true
		}), data);
	});
	console.log('md5 tests done!');
};

console.log('waiting for md5 calculation for md5 test ...');
test();
