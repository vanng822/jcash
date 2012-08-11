var fs = require('fs'), crypto = require('crypto'), fspath = require('path');
var exec = require('child_process').exec;

function scandir(dir, callback) {
	fs.readdir(dir, function(err, files) {
		callback(err, files, dir);
	});
}

function fetchFiles(manager, callback) {
	var path = manager.path;

	var handleResult = function(err, files, dir) {
		var i, len;
		if(err) {
			callback(err, null);
			return;
		};

		for( i = 0, len = files.length; i < len; i++) {
			;(function(file) {
				fs.stat(dir + '/' + file, function(err, stats) {
					var relative, filename, subDir;
					if(err) {
						callback(err, null);
						return;
					};

					if(stats.isFile()) {
						if(manager.exts.indexOf(fspath.extname(file)) != -1) {
							relative = fspath.relative(path, dir);
							filename = ((relative) ? relative + '/' : "") + file;
							manager.run(filename, path, manager.distPath, callback);
						}
					} else if(stats.isDirectory()) {
						subDir = dir + '/' + file;
						/* if subDir is the dist dir then skip */
						if(subDir != manager.distPath) {
							scandir(subDir, handleResult);
						}
					}
				});
			})(files[i]);
		}
	};
	scandir(path, handleResult);
}

/**
 *
 * Will calculate md5 of each specified image a put the content in a dist directory
 * You should have a handler for serving those file
 * You can call for a md5 hash url to the file
 * @param {Object}
 * -path
 * -location
 * -baseurl
 * -active
 * -dist
 * -exts
 * -hasGm
 */
var ImageManager = function(configs) {
	var configs = configs || {};

	this.path = configs.path || fs.realpathSync('./public/img');
	this.location = configs.location || '/img';
	this.baseurl = configs.baseurl || '';
	this.active = 1;

	if(configs.hasOwnProperty('active')) {
		this.active = configs.active;
	}
	this.dist = configs.dist || 'dist';
	this.exts = configs.exts || ['.png', '.jpg', '.ico', '.gif'];
	this.hasGm = false;
	if(configs.hasOwnProperty('hasGm')) {
		this.hasGm = configs.hasGm;
	}

	this.distPath = (this.path + '/' + this.dist);

	this.cache = {};
};
/**
 * Get all allowed images file in the specified path, recursively
 * Copy to dist and calculate md5 of the file contents
 * Fetch also image size
 * callback(err, cacheInfo)
 */
ImageManager.prototype.fetchFiles = function(callback) {
	var callback = callback || (function(err, info) {
		if(err)
			throw err;
	});
	fetchFiles(this, callback);
};

ImageManager.prototype.getSize = function(filename, cacheInfo, callback) {
	var manager;
	if(this.hasGm) {
		manager = this;
		exec('gm identify -ping ' + filename, function(err, stdout, stderr) {
			var entries, i, len, props, dim, size = {
				height : 0,
				width : 0
			};

			if(err) {
				if(callback)
					callback(err, null);
				else
					throw err;
				return;
			}
			stdout = (stdout || "").trim().replace(/\r\n|\r/g, "\n");
			entries = stdout.split("\n");
			for( i = 0, len = entries.length; i < len; i++) {
				props = entries[i].split(' ');
				if(props.length > 2) {
					dim = props[2].split('+');
					dim = dim[0].split('x');
					if(dim.length == 2) {
						if(dim[0] > size.width) {
							size.width = dim[0];
						}
						if(dim[1] > size.height) {
							size.height = dim[1];
						}
					}

				}
			}

			if(size.width > 0) {
				cacheInfo.size = size;
			}
			manager.addCache(cacheInfo);
			if(callback)
				callback(null, cacheInfo);

		});
	} else {
		this.addCache(cacheInfo);
		if(callback)
			callback(null, cacheInfo);
	}
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
 * callback(err, cacheInfo)
 * @see addCache for detail of cacheInfo
 */
ImageManager.prototype.run = function(filename, sourcePath, distPath, callback) {
	var manager = this;
	;(function() {
		var info = {};
		var ext = fspath.extname(filename);
		var tmpname = distPath + '/' + (sourcePath + '/' + filename).replace(/\//g, '_') + '.' + process.pid;
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
			readStream.destroy();
		});

		readStream.on('close', function() {
			var md5filename = shasum.digest('hex');
			var newname = distPath + '/' + md5filename + ext;
			fs.exists(newname, function(exists) {
				if(!exists) {
					fs.rename(tmpname, newname, function(err) {
						if(err) {
							if(callback)
								callback(err, null);
							else
								throw err;
							return;
						}

						info.original = manager.location + '/' + filename;
						info.filename = manager.baseurl + manager.location + '/' + manager.dist + '/' + md5filename + ext;
						/* calculate size based on original */
						manager.getSize(sourcePath + '/' + filename, info, callback);
					});
				} else {
					fs.unlink(tmpname, function(err) {
						if(err) {
							console.log(err);
						}
					});
					info.original = manager.location + '/' + filename;
					info.filename = manager.baseurl + manager.location + '/' + manager.dist + '/' + md5filename + ext;
					/* calculate size based on original */
					manager.getSize(sourcePath + '/' + filename, info, callback);
				}
			});
		});
	})();
};
/**
 * Can use this method to insert cache entry generated using other ways
 *
 * @param {Object}
 * -original {String} original location for cache key; real or just an alias if insert manually, ie /img/none.gif
 * -filename {String} hash location, ie /img/dist/3dbf67627cd67f2878fe0d23442efffc.gif
 * -size {Object}
 *   -width {Integer}
 *   -height {Integer}
 */
ImageManager.prototype.addCache = function(cacheInfo) {
	if(!cacheInfo || !cacheInfo.original || !cacheInfo.filename) {
		throw new Error('.original or .filename is missing');
	}
	this.cache[cacheInfo.original] = cacheInfo;
};
/**
 * @param {Array}
 * Each element is a cacheInfo
 * @see addCache
 */
ImageManager.prototype.addCacheBatch = function(batch) {
	var i, len;
	for( i = 0, len = batch.length; i < len; i++) {
		this.addCache(batch[i]);
	}
};

ImageManager.prototype.renderTag = function(url, attributes) {
	var src, size = '', cache, html, keys, i, len;
	attributes = attributes || {};

	if(this.cache.hasOwnProperty(url)) {
		cache = this.cache[url];
		src = cache.filename;
		if(cache.size && cache.size.width && cache.size.height) {
			size = 'width="' + cache.size.width + '" height="' + cache.size.height + '" ';
		}
	} else {
		src = url;
	}
	html = '<img src="' + src + '" ' + size;
	keys = Object.keys(attributes);

	for( i = 0, len = keys.length; i < len; i++) {
		html += keys[i] + '="' + String(attributes[keys[i]]).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '" ';
	}
	html += '/>';

	return html;
};
/**
 * @param {String} filename
 *
 */
ImageManager.prototype.dump = function(filename) {
	fs.writeFileSync(filename, JSON.stringify(this));
};
/**
 * @param {String} filename
 *
 */
ImageManager.prototype.load = function(filename, callback) {
	var manager = this;

	fs.readFile(filename, function(err, data) {
		var props, i, len;
		if(err) {
			if(callback)
				callback(err, null);
			else
				throw err;
			return;
		}
		data = JSON.parse(data);
		props = Object.keys(manager);

		for( i = 0, len = props.length; i < len; i++) {
			if(data.hasOwnProperty(props[i])) {
				manager[props[i]] = data[props[i]];
			}
		}

		if(callback)
			callback(null, manager);
	});
};
/**
 * @return {Object}
 * -dynamicHelpers {Object}
 *   For exporting template functions to express/ejs
 */
var getImageManager = module.exports = (function() {

	var imageManager;
	var getInstance = function(configs) {
		if(!imageManager) {
			imageManager = new ImageManager(configs);
		}
		return imageManager;
	};
	return {
		/**
		 * @param {Object}
		 *  -path {String} default./public/img
		 *  -location {String} default /img
		 *  -baseurl {String} default ''
		 *  -active {Boolean} default 1
		 *  -dist {String} default dist
		 * 	-exts {Array} default ['.png', '.jpg', '.ico', '.gif']
		 *  -hasGm {Boolean} default false
		 *    if module gm is installed and use it for getting image size
		 *    be aware that gm needs GraphicsMagick to work
		 *
		 * @return {ImageManager}
		 */
		getImageManager : function(configs) {
			return getInstance(configs);
		},
		dynamicHelpers : {
			getImageUrl : function(req, res) {
				return function(url) {
					return getInstance().getUrl(url);
				};
			},
			renderImageTag : function(req, res) {
				return function(url, attributes) {
					return getInstance().renderTag(url, attributes);
				};
			}
		}
	};
})();
