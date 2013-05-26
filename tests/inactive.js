var staticHandler = require('../index.js');
var assert = require('assert');
var vows = require('vows');


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

vows.describe('Test suite for md5 calculation of baseurl').addBatch({
	'after loading of js with hash flag inactive' : {
		topic : function() {
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
			jsManager.parseConfig(config.js);
			jsManager.on('done', this.callback);
			jsManager.preRenderAll();
		},
		'we should not have a set of md5 for path' : function() {
			var jsManager = staticHandler.getJsManager();
			assert.equal(jsManager.renderTags('3rthwrapper', function(err) {
				assert.fail(err, null, 'Should not call error cb');
			}), '<script src="/js/gplusone.js" type="text/javascript"></script><script src="/js/fbshare.js" type="text/javascript"></script>');

			assert.equal(jsManager.renderTags('googleMap', function(err) {
				assert.fail(err, null, 'Should not call error cb');
			}), '<script src="http://maps.google.com/maps/api/js?sensor=false" type="text/javascript"></script>');
		}
	}
}).addBatch({
	'after loading of css with hash flag inactive' : {
		topic : function() {
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

			var cssManager = staticHandler.getCssManager();
			cssManager.parseConfig(config.css);
			cssManager.on('done', this.callback);
			cssManager.preRenderAll();
		},
		'we should not have a set of md5 for path' : function() {
			var cssManager = staticHandler.getCssManager();
			assert.equal(cssManager.renderTags('simple', function(err) {
				assert.fail(err, null, 'Should not call error cb');
			}), '<link href="http://igeonotecss.com/css/simple.css" rel="stylesheet" />');
		}
	}

}).export(module);
