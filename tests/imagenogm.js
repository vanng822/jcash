var staticHandler = require('../index.js');
var assert = require('assert');
var vows = require('vows');

var imageManager = staticHandler.getImageManager({
	path : __dirname + '/data/img',
	hasGm : false
});

vows.describe('Test suite for image with no gm').addBatch({
	'When fetching files on file system' : {
		topic : function() {
			var self = this, fetchCounter = 0;
			imageManager.addCacheBatch([{
				original : '/img2/testing.gif',
				filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif',
				size : {
					width : 10,
					height : 10
				}
			}, {
				original : '/img3/testing.gif',
				filename : 'http://test.com/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif',
				size : {
					width : 10,
					height : 10
				}
			}]);

			imageManager.fetchFiles(function(err, info) {
				assert.equal(err, null);
				fetchCounter++;
				if(fetchCounter == 3) {
					self.callback();
				};
			});
		},
		'We should have size for cache entries' : function() {
			assert.equal(imageManager.getUrl('/img2/testing.gif'), '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif');
			assert.equal(imageManager.renderTag('/img2/testing.gif'), '<img src="/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif" width="10" height="10" />');
			assert.equal(imageManager.getUrl('/img3/testing.gif'), 'http://test.com/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif');
			assert.equal(imageManager.renderTag('/img3/testing.gif'), '<img src="http://test.com/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif" width="10" height="10" />');
		},
		'but no size for entries from disk' : function() {
			assert.equal(imageManager.getUrl('/img/loading.gif'), '/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif');
			assert.equal(imageManager.renderTag('/img/loading.gif'), '<img src="/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif" />');

			assert.equal(imageManager.getUrl('/img/icons/favicon.png'), '/img/dist/3dbf67627cd67f2878fe0d23442efffc.png');
			assert.equal(imageManager.renderTag('/img/icons/favicon.png'), '<img src="/img/dist/3dbf67627cd67f2878fe0d23442efffc.png" />');
		}
	}
}).export(module);
