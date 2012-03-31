var uglify = require('uglify-js'), sqwish = require('sqwish'), underscore = require('underscore');
var crypto = require('crypto'), fs = require('fs'), util = require('util');

var globalSettings = {
	active : true,
	sqwishStrict : true,
	inmemory : false,
	path : {
		css : './public/css',
		js : './public/js'
	},
	location : {
		css : '/css',
		js : '/js'
	},
	contentType : {
		css : 'text/css; charset=utf-8',
		js : 'text/javascript; charset=utf-8'
	},
	maxAge : {
		css : 3600,
		js : 3600
	}
};

var cssManager, jsManager, StaticHandler = {};

/* global configs */
StaticHandler.globalSettings = function(configs) {
	globalSettings = underscore.extend(globalSettings, configs);
	return this;
};
/**
 * if not calling with block this one will be use
 *
 */
StaticHandler.GLOBAL = '*';

StaticHandler.addTemplateHelpers = function(app) {
	var jsManager = this.getJsManager();
	var cssManager = this.getCssManager();

	/* template functions */
	app.dynamicHelpers({
		renderScriptTags : function(req, res) {
			return function(block) {
				var blocks, html = '';
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
				var blocks, html = '';
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
			/* possibly call once when the request is made but for sure */
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
	});
};
/**
 *
 *
 * @param app
 * 	Server
 * @param config
 * Object
 *
 */
StaticHandler.boostrap = function(app, config) {
	var jsManager, cssManager;
	config = underscore.extend(globalSettings, config);
	jsManager = this.getJsManager(config);
	cssManager = this.getCssManager(config);
	this.addTemplateHelpers(app);

	app.get(new RegExp(cssManager.location + '.+.css'), handleCssRequest);
	app.get(new RegExp(jsManager.location + '.+.js'), handleJsRequest);
};
/**
 * Alternative usage
 *
 * need to export template functions separately
 *
 */
StaticHandler.jcash = function(globalConfigs) {
	var jsManager, cssManager;
	this.globalSettings(globalConfigs);

	return function(req, res, next) {
		/* can use mime for lookup */
		handleCssRequest(req, res, function() {
			handleJsRequest(req, res, next);
		})
	};
};

StaticHandler.getCssManager = function(config) {
	if(!cssManager) {
		config = underscore.extend(globalSettings, config);
		cssManager = new Manager(config.path.css, config.location.css, 'css', config.active, config.inmemory, config.sqwishStrict);
	}
	return cssManager;
};

StaticHandler.getJsManager = function(config) {
	if(!jsManager) {
		config = underscore.extend(globalSettings, config);
		jsManager = new Manager(config.path.js, config.location.js, 'js', config.active, config.inmemory, config.sqwishStrict);
	}
	return jsManager;
};

module.exports = StaticHandler;

var handleCssRequest = function(req, res, next) {
	var cssManager = StaticHandler.getCssManager(), cache;
	try {
		if(cssManager.hasContent(req.url)) {
			if(( cache = cssManager.getContent(req.url))) {
				res.setHeader('Content-Type', globalSettings.contentType.css);
				res.setHeader('Cache-Control', 'public, max-age=' + globalSettings.maxAge.css);
				res.setHeader('Date', new Date());
				res.setHeader('Expires', new Date(Date.now() + globalSettings.maxAge.css));
				res.setHeader('ETag', cache[2]);
				if(req.headers.hasOwnProperty('if-none-match') && req.headers['if-none-match'] == cache[2]) {
					res.writeHead(304);
					res.end();
				} else {
					res.send(cache[1]);
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
				res.setHeader('Content-Type', globalSettings.contentType.js);
				res.setHeader('Cache-Control', 'public, max-age=' + globalSettings.maxAge.js);
				res.setHeader('Date', new Date());
				res.setHeader('Expires', new Date(Date.now() + globalSettings.maxAge.js));
				res.setHeader('ETag', cache[2]);
				if(req.headers.hasOwnProperty('if-none-match') && req.headers['if-none-match'] == cache[2]) {
					res.writeHead(304);
					res.end();
				} else {
					res.send(cache[1]);
				}
				return;
			}
		}
	} catch(e) {
	}
	next();
};
var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
};
/**
 *
 * @param path
 * 	the path to static files, ie /home/..../css
 * @param location
 * 	the path where static files serving, ie /css
 * @param type
 * 	type of static files, ie css or js
 * @param active
 *
 * @inmemory
 *
 */
var Manager = function(path, location, type, active, inmemory, sqwishStrict) {
	this.path = path;
	this.location = location;
	this.type = type;
	this.files = {};
	this.urls = {};
	/**
	 * each entry is an array of
	 * 	first element: url to serve
	 *  second element: the content if inmemory else null
	 *  third element: the md5 hash of the content, for setting etags
	 */
	this.cache = {};
	this.cacheMap = {};
	this.active = active;
	this.sqwishStrict = sqwishStrict;
	this.inmemory = inmemory;
	this.locationMap = {};
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
		len = this.files[block].length;

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
	getUrls : function(block) {
		var files = [], urls = [], returnFiles = [], location = this.location;

		if(this.files.hasOwnProperty(block)) {
			files = this.files[block];
		}

		if(this.urls.hasOwnProperty(block)) {
			urls = this.urls[block];
		}

		if(this.active) {
			return urls.concat(this._run(files));
		} else {
			/* serve with location for instance /css */
			files.forEach(function(file) {
				returnFiles.push(location + '/' + file);
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
	_setAndCache : function(files) {
		var funk = require('funk')('parallel'), path = this.path + '/', type = this.type, manager = this, location = this.location;

		files.forEach(function(el) {
			fs.readFile(path + el, 'utf8', funk.result(el));
		});

		funk.run(function() {
			var self = this, minified, bundled = '', md5dist = '', distPath = 'dist', cacheKey, md5ofContent;

			files.forEach(function(el) {
				if(type == 'css') {
					bundled += self[el];
				} else {
					bundled += self[el] + ';';
				}
			});
			if(type === 'css') {
				minified = sqwish.minify(bundled, self.sqwishStrict);
			} else {( function() {
					var jsp = uglify.parser, pro = uglify.uglify, ast = jsp.parse(bundled);
					ast = pro.ast_mangle(ast);
					ast = pro.ast_squeeze(ast);
					minified = pro.gen_code(ast);
				}());
			}
			md5ofContent = md5(minified);
			md5dist = distPath + '/' + md5ofContent + '.' + type;
			md5Location = manager.location + '/' + md5dist;
			cacheKey = manager._getCacheKey(files);
			manager.cacheMap[md5Location] = cacheKey;
			// write to static file
			if(manager.inmemory) {
				manager.cache[cacheKey] = [manager.location + '/' + md5dist, minified, md5ofContent];
			} else {
				manager.cache[cacheKey] = [manager.location + '/' + md5dist, null, md5ofContent];
				fs.writeFile(path + md5dist, minified);
			}
		});
	},
	_run : function(files) {
		var cached = this._getCache(this._getCacheKey(files)), returnFiles, location = this.location;

		if(cached) {
			return [cached[0]];
		} else {
			if(files.length) {
				this._setAndCache(files);
			}
			returnFiles = [];
			files.forEach(function(file) {
				returnFiles.push(location + '/' + file);
			});
			return returnFiles;
		}
	},
	renderJsTag : function(url) {
		return '<script src="' + url + '" type="text/javascript"></script>';
	},
	renderCssTag : function(url) {
		return '<link href="' + url + '" rel="stylesheet" />';
	},
	renderTags : function(block) {
		var html = '', urls = this.getUrls(block), renderfunc, location = this.location;

		if(this.type == 'css') {
			renderfunc = this.renderCssTag;
		} else {
			renderfunc = this.renderJsTag;
		}

		urls.forEach(function(url) {
			html += renderfunc(url);
		});
		return html;
	},
	preRenderAll : function() {
		var block;
		for(block in this.files) {
			this.renderTags(block);
		}
	}
};
