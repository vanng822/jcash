var staticHandler = require('../index.js');
var assert = require('assert');

var imageManager = staticHandler.getImageManager({
	path : __dirname + '/data/img',
	hasGm : true
});

function test() {
	console.log('Start running the image test ...');

	imageManager.run('loading.gif', 'tests/data/img/', 'tests/data/img/dist', function(err, info) {
		assert.deepEqual(info, {
			original : '/img/loading.gif',
			filename : '/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif',
			size : {
				width : 35,
				height : 35
			}
		});
		assert.equal(imageManager.getUrl('/img/loading.gif'), '/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif');
		assert.equal(imageManager.renderTag('/img/loading.gif'), '<img src="/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif" width="35" height="35" />');

	});

	imageManager.addCache({
		original : '/img2/testing.gif',
		filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif'
	});

	assert.throws(function() {
		imageManager.addCache();
	}, function(err) {
		if(( err instanceof Error) && /.original or .filename is missing/.test(err)) {
			return true;
		}
	});

	assert.throws(function() {
		imageManager.addCache({
			original : '/img2/testing.gif'
		});
	}, function(err) {
		if(( err instanceof Error) && /.original or .filename is missing/.test(err)) {
			return true;
		}
	});

	assert.throws(function() {
		imageManager.addCache({
			filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif'
		});
	}, function(err) {
		if(( err instanceof Error) && /.original or .filename is missing/.test(err)) {
			return true;
		}
	});

	assert.throws(function() {
		imageManager.addCache({
			size : {
				width : 35,
				height : 35
			}
		});
	}, function(err) {
		if(( err instanceof Error) && /.original or .filename is missing/.test(err)) {
			return true;
		}
	});

	assert.throws(function() {
		imageManager.addCacheBatch([{
			original : '/img2/testing4.gif',
			size : {
				width : 35,
				height : 35
			}
		}, {
			original : '/img2/testing4.gif',
			filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif',
			size : {
				width : 35,
				height : 35
			}
		}]);
	}, function(err) {
		if(( err instanceof Error) && /.original or .filename is missing/.test(err)) {
			return true;
		}
	});

	assert.equal(imageManager.getUrl('/img2/testing.gif'), '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif');

	imageManager.addCacheBatch([{
		original : '/img2/testing2.gif',
		filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b2.gif'
	}, {
		original : '/img2/testing3.gif',
		filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b3.gif',
		size : {
			width : 10,
			height : 10
		}
	}]);

	assert.equal(imageManager.getUrl('/img2/testing3.gif'), '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b3.gif');
	assert.equal(imageManager.renderTag('/img2/testing2.gif'), '<img src="/img/dist2/395c0d77abb4d15f7a505c32d3fd40b2.gif" />');
	assert.equal(imageManager.renderTag('/img2/testing3.gif'), '<img src="/img/dist2/395c0d77abb4d15f7a505c32d3fd40b3.gif" width="10" height="10" />');

	assert.equal(imageManager.renderTag('/img2/testing3.gif', {
		"class" : "img",
		"alt" : "testing 3",
		"title" : "testing 3"
	}), '<img src="/img/dist2/395c0d77abb4d15f7a505c32d3fd40b3.gif" width="10" height="10" class="img" alt="testing 3" title="testing 3" />');

	assert.equal(imageManager.renderTag('/img2/testing3.gif', {
		"alt" : '3"TV>2',
		"title" : '"testing 3"<4'
	}), '<img src="/img/dist2/395c0d77abb4d15f7a505c32d3fd40b3.gif" width="10" height="10" alt="3&quot;TV&gt;2" title="&quot;testing 3&quot;&lt;4" />');

	var fetchCounter = 0;
	imageManager.fetchFiles(function(err, info) {
		assert.equal(err, null);
		fetchCounter++;
		if(fetchCounter == 3) {
			/* assert directly on the cache :-/ */

			assert.deepEqual(imageManager.cache['/img2/testing.gif'], {

				original : '/img2/testing.gif',
				filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b0.gif'

			});
			assert.deepEqual(imageManager.cache['/img2/testing2.gif'], {

				original : '/img2/testing2.gif',
				filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b2.gif'

			});

			assert.deepEqual(imageManager.cache['/img2/testing3.gif'], {

				original : '/img2/testing3.gif',
				filename : '/img/dist2/395c0d77abb4d15f7a505c32d3fd40b3.gif',
				size : {
					width : 10,
					height : 10

				}
			});
			assert.deepEqual(imageManager.cache['/img/icons/favicon.ico'], {
				original : '/img/icons/favicon.ico',
				filename : '/img/dist/47399e0ed593a425123ebfe5a9c44cc8.ico',
				size : {
					width : 16,
					height : 16
				}
			});

			assert.deepEqual(imageManager.cache['/img/loading.gif'], {

				original : '/img/loading.gif',
				filename : '/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif',
				size : {
					width : 35,
					height : 35
				}

			});

			assert.deepEqual(imageManager.cache['/img/icons/favicon.png'], {
				original : '/img/icons/favicon.png',
				filename : '/img/dist/3dbf67627cd67f2878fe0d23442efffc.png',
				size : {
					width : 16,
					height : 16
				}
			});
			console.log('image test done!');
		}
	});
};

test();
