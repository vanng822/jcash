var fs = require('fs'), gm = require('gm'), crypto = require('crypto'), fspath = require('path');

/**
 *
 * Will calculate md5 of each specified image a put the content in a dist directory
 * You should have a handler for serving those file
 * You can call for a md5 hash url to the file
 * path, location, baseurl, active, distPath, dist
 */
var ImageManager = function(configs) {
	configs = configs || {};

	this.path = configs.path || fs.realpathSync('./public/img');
	this.location = configs.location || '/img';
	this.baseurl = configs.baseurl || '';
	this.active = configs.active || 1;
	this.dist = configs.dist || 'dist';
	this.distPath = (this.path + '/' + this.dist);
	this.exts = configs.exts || ['.png', '.jpg', '.ico', '.gif'];

	this.files = [];
	this.cache = {};
};
/**
 * @param {Array} files
 *  Array of json, each entry
 *  {
 * 	 filename: String
 * 	 [,path:String]
 *
 * 	}
 */
ImageManager.prototype.addFiles = function(files) {
	var manager = this;
	files.forEach(function(file) {
		if(!file.hasOwnProperty('filename') || file.filename != "") {
			throw new Error('Filename can not be empty');
		}
		manager.files.push(file);
	});
};
/**
 * Get all allowed images file in the specified path, recursively
 * Copy to dist and calculate md5 of the file contents
 * Fetch also image size
 *
 */
ImageManager.prototype.fetchFiles = function() {
	var manager = this;
	(function(path, collection) {
		var scandir = function(dir, callback) {
			fs.readdir(dir, function(err, files) {
				callback(err, files, dir);
			});
		};
		var handleResult = function(err, files, dir) {
			if(err)
				throw err;

			files.forEach(function(file) {
				fs.stat(dir + '/' + file, function(err, stats) {
					var relative, filename, subDir;
					if(err)
						throw err;

					if(stats.isFile()) {
						if(manager.exts.indexOf(fspath.extname(file)) != -1) {
							relative = fspath.relative(path, dir);
							filename = ((relative) ? relative + '/' : "") + file;
							/* maybe need it in the future*/
							collection.push(filename);
							manager.run(filename, path, manager.distPath, manager.location, function(err, info) {
								if(err)
									throw err;
							});
						}
					} else if(stats.isDirectory()) {
						subDir = dir + '/' + file;
						/* if subDir is the dist dir then skip */
						if(subDir !== manager.distPath) {
							scandir(subDir, handleResult);
						}
					}
				});
			});
		};
		scandir(path, handleResult);

	})(this.path, this.files);
};
/**
 * @param {String} url
 *  the url of the file that will be served.
 *  for instance /img/filename.png
 * @return {String}
 * will return md5 version for instance /img/8b95b0b9a0af37bd36041e0d0d58ddbe.png
 * if not ready or can not calculate for some reason it will return the original url
 */
ImageManager.prototype.getUrl = function(url) {
	if(this.cache.hasOwnProperty(url)) {
		return this.cache[url].filename;
	}
	return url;
};
/**
 * copy image to dist
 * Calculate md5 and get image size
 */
ImageManager.prototype.run = function(filename, sourcePath, distPath, location, callback) {
	var manager = this; (function() {
		var info = {};
		var paths = filename.split('/');
		var name = paths[paths.length - 1];
		var names = name.split('.');
		var type = (names.length > 1) ? names[names.length - 1] : 'png';
		var tmpname = distPath + '/' + (sourcePath + '/' + filename).replace(/\//g, '_');

		var shasum = crypto.createHash('md5');
		var readStream = fs.createReadStream(sourcePath + '/' + filename);
		var writeStream = fs.createWriteStream(tmpname, {
			flags : 'w+',
			encoding : null,
			mode : 0644
		});

		readStream.on('data', function(data) {
			writeStream.write(data);
			shasum.update(data);
		});

		readStream.on('end', function() {
			var md5filename = shasum.digest('hex');
			delete paths[paths.length - 1];
			var newname = distPath + '/' + md5filename + '.' + type;

			fs.rename(tmpname, newname, function(err) {
				info.original = location + '/' + filename;
				info.filename = location + '/' + manager.dist + '/' + md5filename + '.' + type;
				manager.cache[info.original] = info;
				gm(newname).size(function(err, size) {
					info.size = size;
					if(callback)
						callback(null, info);

				});
			});
		});
	})();
};

ImageManager.prototype.renderTag = function(url) {
	var src, size = '', cache;
	if(this.cache.hasOwnProperty(url)) {
		cache = this.cache[url];
		src = cache.filename;
		if(cache.size) {
			size = ' width="' + cache.size.width + '" height="' + cache.size.height + '"';
		}
	} else {
		src = url;
	}

	return '<img src="' + src + '"' + size + ' />';
};

/**
 * @return {Object}
 * -dynamicHelpers {Object}
 *   For exporting template functions to express/ejs
 */
var getImageManager = module.exports = (function() {

	var imageManager;

	return {
		/**
		 * @param {Object}
		 *  -path {String} default./public/img
		 *  -location {String} default /img
		 *  -baseurl {String} default ''
		 *  -active {Boolean} default 1
		 *  -dist {String} default dist
		 * 	-exts {Array} default ['.png', '.jpg', '.ico', '.gif']
		 * @return {ImageManager}
		 */
		getImageManager : function(configs) {
			if(!imageManager) {
				imageManager = new ImageManager(configs);
			}
			return imageManager;
		},
		dynamicHelpers : {
			getImageUrl : function(req, res) {
				var imageManager = getImageManager.getImageManager();
				return function(url) {
					return imageManager.getUrl(url);
				};
			},
			renderImageTag : function(req, res) {
				var imageManager = getImageManager.getImageManager();
				return function(url) {
					return imageManager.renderTag(url);
				};
			}
		}
	};
})();
