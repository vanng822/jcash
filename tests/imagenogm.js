var staticHandler = require('../index.js');
var assert = require('assert');

var imageManager = staticHandler.getImageManager({
	path : __dirname + '/data/img',
	hasGm : false
});

function test() {
	console.log('Start running the image test ...');

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

	assert.equal(imageManager.getUrl('/img2/testing.gif'), '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif');
	assert.equal(imageManager.renderTag('/img2/testing.gif'), '<img src="/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif" width="10" height="10" />');
	assert.equal(imageManager.getUrl('/img3/testing.gif'), 'http://test.com/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif');
	assert.equal(imageManager.renderTag('/img3/testing.gif'), '<img src="http://test.com/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif" width="10" height="10" />');

	var fetchCounter = 0;
	imageManager.fetchFiles(function(err, info) {
		assert.equal(err, null);
		fetchCounter++;
		if(fetchCounter == 3) {
			assert.equal(imageManager.getUrl('/img/loading.gif'), '/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif');
			assert.equal(imageManager.renderTag('/img/loading.gif'), '<img src="/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif" />');

			assert.equal(imageManager.getUrl('/img/icons/favicon.png'), '/img/dist/3dbf67627cd67f2878fe0d23442efffc.png');
			assert.equal(imageManager.renderTag('/img/icons/favicon.png'), '<img src="/img/dist/3dbf67627cd67f2878fe0d23442efffc.png" />');
			console.log('filename test done!');
		}
	});
};


test();
