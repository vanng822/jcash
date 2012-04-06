var staticHandler = require('../index.js');
var assert = require('assert');

var imageManager = staticHandler.getImageManager({
	path : __dirname + '/data/img'
});

function test() {
	console.log('Start running the image test ...');
	
	imageManager.run('loading.gif', 'tests/data/img/', 'tests/data/img/dist', '/img', function(err, info) {

		assert.deepEqual(info, {
			original : '/img/loading.gif',
			filename : '/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif',
			size : {
				width : 35,
				height : 35
			}
		});
		
		assert.equal(imageManager.getUrl('/img/loading.gif'), '/img/dist/395c0d77abb4d15f7a505c32d3fd40b9.gif');
	});

	imageManager.fetchFiles();

	console.log('filename test done!');
};

test();
