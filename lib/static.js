var uglify = require('uglify-js'), sqwish = require('sqwish'), underscore = require('underscore');
var crypto = require('crypto'), fs = require('fs'), fspath = require('path'), util = require('util');

var globalSettings = {
	active : true,
	sqwishStrict : true,
	strictSemicolons : false,
	inmemory : false,
	pathCss : './public/css',
	pathJs : './public/js',
	locationCss : '/css',
	locationJs : '/js',
	contentTypeCss : 'text/css; charset=utf-8',
	contentTypeJs : 'text/javascript; charset=utf-8',
	maxAgeCss : 3600,
	maxAgeJs : 3600,
	baseurlCss : '',
	baseurlJs : '',
	distCss : 'dist',
	distJs : 'dist'
};

var cssManager, jsManager, StaticHandler = {};

/* global configs */
StaticHandler.globalSettings = function(configs) {
	globalSettings = underscore.extend(globalSettings, configs);
	return this;
};
/**
 * For all pages
 */
StaticHandler.GLOBAL = '*';

StaticHandler.addTemplateHelpers = function(app) {
	/* template functions */
	app.dynamicHelpers(viewHelpers);
};
/**
 * Template functions for rendering style and javascript tag
 *
 * addBottomScript and renderBottomScripts is for rendering the javascript later
 *
 */
var viewHelpers = {
	renderScriptTags : function(req, res) {
		return function(block) {
			var blocks, html = '', jsManager = StaticHandler.getJsManager();
			if(block) {
				return jsHandler.renderTags(block);
			}
			blocks = jsManager.getLocationMap(req.route.path);
			blocks.forEach(function(block) {
				html += jsManager.renderTags(block);
			});
			return html;
		}
	},
	renderStyleTags : function(req, res) {
		return function(block) {
			var blocks, html = '', cssManager = StaticHandler.getCssManager();
			if(block) {
				return cssManager.renderTags(block);
			}
			blocks = cssManager.getLocationMap(req.route.path);
			blocks.forEach(function(block) {
				html += cssManager.renderTags(block);
			});
			return html;
		}
	},
	addBottomScript : function(req, res) {
		if(!res.local('bottomScripts')) {
			res.local('bottomScripts', []);
		}
		return function(script) {
			res.local('bottomScripts').push(script);
		};
	},
	/* bottomScripts is accessible in template; provide this for reset value since it is reasonable */
	renderBottomScripts : function(req, res) {
		return function() {
			var scripts = res.local('bottomScripts') || [];
			res.local('bottomScripts', []);
			return scripts.join('');
		};
	}
};

/**
 *
 *
 * @param {HTTPServer|HTTPSServer} app
 * 	Express - HTTPServer
 * @param {Object} config
 *
 *
 */
StaticHandler.bootstrap = function(app, config) {
	var jsManager, cssManager;
	config = underscore.extend(globalSettings, config);
	jsManager = this.getJsManager(config);
	cssManager = this.getCssManager(config);
	this.addTemplateHelpers(app);

	app.get(new RegExp(cssManager.location + '.+.css'), handleCssRequest);
	app.get(new RegExp(jsManager.location + '.+.js'), handleJsRequest);
};
/**
 * Alternative usage, middleware
 *
 * .jcash({some global config})
 *
 * need to export template functions separately
 *
 *
 */
StaticHandler.jcash = function(globalConfigs) {
	
	this.globalSettings(globalConfigs);

	return function(req, res, next) {
		/* can use mime for lookup */
		handleCssRequest(req, res, function() {
			handleJsRequest(req, res, next);
		});
	};
};
/**
 * Singleton
 *
 * @param {Object} config
 *  configuration for creating CssManager object. It will be used only at the first call
 * @return CssManager
 */
StaticHandler.getCssManager = function(config) {
	if(!cssManager) {
		config = underscore.extend(globalSettings, config);
		cssManager = new CssManager(config.pathCss, config.locationCss, config.baseurlCss, config.active, config.inmemory, config.sqwishStrict, config.distCss);
	}
	return cssManager;
};
/**
 * Singleton
 *
 * @param {Object} config
 *  configuration for creating JsManager object. It will be used only at the first call
 * @return JsManager
 */
StaticHandler.getJsManager = function(config) {
	if(!jsManager) {
		config = underscore.extend(globalSettings, config);
		jsManager = new JsManager(config.pathJs, config.locationJs, config.baseurlJs, config.active, config.inmemory, config.strictSemicolons, config.distJs);
	}
	return jsManager;
};

module.exports = StaticHandler;

var handleCssRequest = function(req, res, next) {
	var cssManager = StaticHandler.getCssManager(), cache;
	try {
		if(cssManager.hasContent(req.url)) {
			if(( cache = cssManager.getContent(req.url))) {
				res.setHeader('Content-Type', globalSettings.contentTypeCss);
				res.setHeader('Cache-Control', 'public, max-age=' + globalSettings.maxAgeCss);
				res.setHeader('Date', new Date());
				res.setHeader('Expires', new Date(Date.now() + globalSettings.maxAgeCss));
				res.setHeader('ETag', cache.md5OfContent);
				if(req.headers.hasOwnProperty('if-none-match') && req.headers['if-none-match'] == cache.md5OfContent) {
					res.writeHead(304);
					res.end();
				} else {
					res.send(cache.minifiedContent);
				}
				return;
			}
		}
	} catch(e) {

	}
	next();
};
var handleJsRequest = function(req, res, next) {
	var jsManager = StaticHandler.getJsManager(), cache;
	try {
		if(jsManager.hasContent(req.url)) {
			if(( cache = jsManager.getContent(req.url))) {
				res.setHeader('Content-Type', globalSettings.contentTypeJs);
				res.setHeader('Cache-Control', 'public, max-age=' + globalSettings.maxAgeJs);
				res.setHeader('Date', new Date());
				res.setHeader('Expires', new Date(Date.now() + globalSettings.maxAgeJs));
				res.setHeader('ETag', cache.md5OfContent);
				if(req.headers.hasOwnProperty('if-none-match') && req.headers['if-none-match'] == cache.md5OfContent) {
					res.writeHead(304);
					res.end();
				} else {
					res.send(cache.minifiedContent);
				}
				return;
			}
		}
	} catch(e) {
	}
	next();
};
/**
 *
 * @param path
 * 	the path to static files, ie /home/..../css
 * @param location
 * 	the path where static files serving, ie /css
 *
 * @param baseurl
 *  baseurl of the resource. Good when serve different domain for static contents.
 *
 * @param active
 * turn on or off
 *
 * @param inmemory
 * if true the minified will store in cache for serving
 * if false it will write into disk. Make sure dist-directory is writeable
 *
 * @param strict
 * flag to parse to minifier
 *
 * @param dist
 * directory to write the minified contents
 *
 */
var Manager = function(path, location, baseurl, active, inmemory, strict, dist) {
	this.path = path;
	this.location = location;
	this.baseurl = baseurl;
	this.files = {};
	this.urls = {};
	/**
	 * each entry is an array of
	 *  first element: url to serve
	 *  second element: the content if inmemory else null
	 *  third element: the md5 hash of the content if inmemory else null, for setting etags
	 */
	this.cache = {};
	this.cacheMap = {};
	this.active = active;
	this.strict = strict;
	this.inmemory = inmemory;
	this.locationMap = {};
	this.dist = dist;

	this.blocksDone = 0;
	this.totalBlocks = 0;
	this.pathChecked = false;
};

Manager.prototype = {
	parseConfig : function(config) {
		var block, location;

		if(!config)
			return;

		if(config.hasOwnProperty('files')) {
			for(block in config.files) {
				this.addFiles(block, config.files[block]);
			}
		}

		if(config.hasOwnProperty('urls')) {
			for(block in config.urls) {
				this.addUrls(block, config.urls[block]);
			}
		}

		if(config.hasOwnProperty('locationMap')) {
			for(location in config.locationMap) {
				this.addLocationMap(location, config.locationMap[location]);
			}
		}
	},
	addLocationMap : function(location, blocks) {
		if(!util.isArray(blocks)) {
			blocks = [blocks];
		}
		this.locationMap[location] = blocks;
	},
	getLocationMap : function(location) {
		var blocks = [];

		if(this.locationMap.hasOwnProperty(StaticHandler.GLOBAL)) {
			blocks = this.locationMap[StaticHandler.GLOBAL];
		}

		if(this.locationMap.hasOwnProperty(location)) {
			blocks = blocks.concat(this.locationMap[location]);
		}

		return blocks;
	},
	addFiles : function(block, filenames) {
		var self = this;

		if(!this.files.hasOwnProperty(block)) {
			this.files[block] = [];
		}

		if(!util.isArray(filenames)) {
			filenames = [filenames];
		}

		filenames.forEach(function(filename) {
			var i, len = self.files[block].length;
			for( i = 0; i < len; i++) {
				if(self.files[block][i] == filename) {
					/* entry exists */
					return;
				}
			};
			self.files[block].push(filename);
		});
		return this;
	},
	addUrls : function(block, urls) {
		var self = this;

		if(!this.urls.hasOwnProperty(block)) {
			this.urls[block] = [];
		}

		if(!util.isArray(urls)) {
			urls = [urls];
		}

		urls.forEach(function(url) {
			var i, len = self.urls[block].length;
			for( i = 0; i < len; i++) {
				if(self.urls[block][i] == url) {
					return;
				}
			};
			self.urls[block].push(url);
		});
		return this;
	},
	getUrls : function(block, errcb) {
		var files = [], urls = [], returnFiles = [], baseurl = this.baseurl, location = this.location;

		if(this.files.hasOwnProperty(block)) {
			files = this.files[block];
		}

		if(this.urls.hasOwnProperty(block)) {
			urls = this.urls[block];
		}

		if(this.active) {
			return urls.concat(this._run(files, errcb));
		} else {
			/* serve with location for instance /css */
			files.forEach(function(file) {
				returnFiles.push(baseurl + location + '/' + file);
			});
			return urls.concat(returnFiles);
		}
	},
	hasContent : function(url) {
		return this.inmemory && this.cacheMap.hasOwnProperty(url);
	},
	getContent : function(url) {
		try {
			return this.cache[this.cacheMap[url]];
		} catch(e) {
			return null;
		}
	},
	_getCacheKey : function(files) {
		return files.join(';');
	},
	_getCache : function(cacheKey) {
		return this.cache[cacheKey];
	},
	checkPath : function() {
		if(!this.pathChecked) {
			var stat = fspath.existsSync(this.path);
			if(!stat) {
				throw new Error('Path does not exist: ' + this.path);
			}
			this.pathChecked = true;
		}
	},
	_setAndCache : function(files, errcb) {
		var funk = require('funk')('parallel'), path = this.path + '/', manager = this;

		this.checkPath();

		files.forEach(function(filename) {
			fs.readFile(path + filename, 'utf8', funk.result(filename, 1));
		});

		funk.run(function() {
			var self = this, minified, bundled = [], md5dist = '', cacheKey, md5OfContent;

			manager.blocksDone++;

			files.forEach(function(filename) {
				var data = self[filename];
				if( typeof data == "undefined") {
					if(errcb)
						errcb(new Error('Could not read data for file: ' + filename));
					else
						throw new Error('Could not read data for file: ' + filename);
				}
				bundled.push(data);
			});
			minified = manager.minify(bundled);
			md5OfContent = crypto.createHash('md5').update(minified).digest('hex');
			md5dist = manager.dist + '/' + md5OfContent + '.' + manager.getExtention();
			md5Location = manager.location + '/' + md5dist;
			cacheKey = manager._getCacheKey(files);
			manager.cacheMap[md5Location] = cacheKey;
			// write to static file
			if(manager.inmemory) {
				manager.cache[cacheKey] = {
					location : md5Location,
					minifiedContent : minified,
					md5OfContent : md5OfContent
				};
			} else {
				manager.cache[cacheKey] = {
					location : md5Location,
					minifiedContent : null,
					md5OfContent : md5OfContent
				};
				fs.writeFile(path + md5dist, minified, function(err) {
					if(err) {
						if(errcb) {
							errcb(err);
						} else {
							throw err;
						}
					} else if(errcb) {
						errcb(null);
					}
				});
			}
		});
	},
	_run : function(files, errcb) {
		var cached = this._getCache(this._getCacheKey(files)), returnFiles, baseurl = this.baseurl, location = this.location;

		if(cached) {
			return [baseurl + cached.location];
		} else {
			if(files.length) {
				this._setAndCache(files, errcb);
			}
			returnFiles = [];
			files.forEach(function(file) {
				returnFiles.push(baseurl + location + '/' + file);
			});
			return returnFiles;
		}
	},
	getExtention : function() {
		throw new Error('Implement');
	},
	minify : function(bundled) {
		throw new Error('Implement');
	},
	renderTag : function(url) {
		throw new Error('Implement');
	},
	renderTags : function(block, errcb) {
		var html = '', urls = this.getUrls(block, errcb), self = this;

		urls.forEach(function(url) {
			html += self.renderTag(url);
		});
		return html;
	},
	dump : function(filename, options) {
		var blocks, self = this, content = '', prekey;
		options = underscore.extend({
			location : 'location',
			minifiedContent : 'minifiedContent',
			md5OfContent : 'md5OfContent',
			prekey : '',
			returnValue : false,
			objectDump : false,
			escape : function(content) {
				return content;
			}
		}, options);

		if(!this.isDone()) {
			throw new Error('This method can only be called when reading all files and md5 calculation is done! use isDone for checking');
		}
		
		if(options.objectDump) {
			if(options.returnValue) {
				return JSON.stringify(this);
			} else {
				fs.writeFileSync(filename, JSON.stringify(this));
				return;
			}
		}
		
		if (typeof options.escape != 'function') {
			throw new Error('escape must be a function for escaping the content');
		}
		blocks = Object.keys(this.files);
		
		prekey = ( options.prekey ? options.prekey + '.' : '');
			
		blocks.forEach(function(block) {
			var cached = self._getCache(self._getCacheKey(self.files[block]));
			content += prekey + block + '.' + options.location + ' = ' + cached.location + "\n";
			content += prekey + block + '.' + options.minifiedContent + ' = ' + options.escape(cached.minifiedContent) + "\n";
			content += prekey + block + '.' + options.md5OfContent + ' = ' + cached.md5OfContent + "\n";
			if(self.urls.hasOwnProperty(block)) {
				self.urls[block].forEach(function(url) {
					content += prekey + block + '.' + options.location + ' = ' + url + "\n";
					content += prekey + block + '.' + options.minifiedContent + " = \n";
					content += prekey + block + '.' + options.md5OfContent + " = \n";
				});
			}
		});
		if(options.returnValue) {
			return content;
		}
		fs.writeFileSync(filename, content);
	},
	preRenderAll : function() {
		var blocks, self = this;
		blocks = Object.keys(this.files);
		this.totalBlocks = blocks.length;
		blocks.forEach(function(block) {
			setTimeout((function(block) {
				return function() {
					self.renderTags(block);
				};
			})(block), 0);
		});
	},
	isDone : function() {
		return this.totalBlocks == this.blocksDone;
	}
};

var CssManager = function(path, location, baseurl, active, inmemory, strict, dist) {
	Manager.call(this, path, location, baseurl, active, inmemory, strict, dist);
};

util.inherits(CssManager, Manager);

CssManager.prototype.minify = function(bundled) {
	var data = bundled.join();
	if(!data)
		return "";
	return sqwish.minify(data, this.strict);
};

CssManager.prototype.renderTag = function(url) {
	return '<link href="' + url + '" rel="stylesheet" />';
};

CssManager.prototype.getExtention = function() {
	return 'css';
};
var JsManager = function(path, location, baseurl, active, inmemory, strict, dist) {
	Manager.call(this, path, location, baseurl, active, inmemory, strict, dist);
};

util.inherits(JsManager, Manager);

JsManager.prototype.minify = function(bundled) {
	return uglify(bundled.join(';'));
};

JsManager.prototype.renderTag = function(url) {
	return '<script src="' + url + '" type="text/javascript"></script>';
};

JsManager.prototype.getExtention = function() {
	return 'js';
};
