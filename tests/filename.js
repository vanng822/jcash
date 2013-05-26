var staticHandler = require('../index.js');
var assert = require('assert');
var vows = require('vows');

vows.describe('Test suite for filename').addBatch({
	'when loading a config with none-existing file' : {
		topic : function() {
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
			cssManager.parseConfig({
				files : {
					'simple' : ['simple2.css'],
					'mobile' : ['mobile.css']
				}
			});
			var self = this;
			cssManager.renderTags('simple', function(err) {
				self.callback(err instanceof Error && /Could not read data for file/.test(err));
			});
		},
		'it should return an error' : function(is_err) {
			assert.ok(is_err);
		}
	}
}).export(module);
