var staticHandler = require('./index.js');
var assert = require('assert');

var config = {
	js : {
		files : {
			'3rthwrapper' : ['gplusone.js', 'fbshare.js', 'geolocation.js', 'loading.js', 'gatracking.js']
		}
	},
	css : {
		files : {
			'simple' : ['simple.css']
		}
	}
};

staticHandler.globalSettings({
	active : true,
	inmemory : true,
	pathJs : __dirname + '/tests/data/js',
	pathCss : __dirname + '/tests/data/css',
	locationCss : '/css',
	locationJs : '/js',
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
		process.nextTick(test);
		return;
	}
	var times = 1000000;
	console.log(' * run js.renderTags ' + times);
	var start = Date.now();
	for (i = 0; i < times; i++) {
		jsManager.renderTags('3rthwrapper');
	}
	console.log(' * took: ' + (Date.now() - start) + ' ms');
	
	console.log(' * run css.renderTags ' + times);
	var start = Date.now();
	for (i = 0; i < times; i++) {
		cssManager.renderTags('simple');
	}
	console.log(' * took: ' + (Date.now() - start) + ' ms');
};

test();

/**
 * v0.2.3
 * run js.renderTags 1000000
 * took: 791 ms
 * run css.renderTags 1000000
 * took: 543 ms
 * 
 * v0.2.0
 * run js.renderTags 1000000
 * took: 1203 ms
 * run css.renderTags 1000000
 * took: 748 ms
 *
 * cpus x4
 * [ { model: 'MacBookAir4,2',
    speed: 1800,
    times: 
     { user: 44032730,
       nice: 0,
       sys: 40634570,
       idle: 367414930,
       irq: 0 } },
  ... } ]
 */
