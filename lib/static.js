
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
			if(!res.local("bottomScripts")) {
				res.local("bottomScripts", []);
			}
			return function(script) {
				res.local("bottomScripts").push(script);
			};
		},
		/* bottomScripts is accessible in template; provide this for reset value since it is reasonable */
		renderBottomScripts : function(req, res) {
			return function() {
				var scripts = res.local("bottomScripts") || [];
				res.local("bottomScripts", []);
				return scripts.join("");
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

	
	config = underscore.extend(globalSettings, config);
	
	var jsManager = this.getJsManager(config);
	var cssManager = this.getCssManager(config);

	this.addTemplateHelpers(app);

	app.get(new RegExp(cssManager.location + '.+.css'), function(req, res, next) {
		try {
			if(cssManager.hasContent(req.url)) {
				res.setHeader('Content-Type', config.contentType.css);
				res.setHeader('Cache-Control', 'public, max-age=' + config.maxAge.css);
				res.setHeader('Date', new Date());
				res.setHeader('Expires', new Date(Date.now() + config.maxAge.css));
				res.send(cssManager.getContent(req.url));
				return;
			}
		} catch(e) {

		}
		next();
	});

	app.get(new RegExp(jsManager.location + '.+.js'), function(req, res, next) {
		try {
			if(jsManager.hasContent(req.url)) {
				res.setHeader('Content-Type', config.contentType.js);
				res.setHeader('Cache-Control', 'public, max-age=' + config.maxAge.js);
				res.setHeader('Date', new Date());
				res.setHeader('Expires', new Date(Date.now() + config.maxAge.js));
				res.send(jsManager.getContent(req.url));
				return;
			}
		} catch(e) {
		}
		next();
	});
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

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

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
	this.cache = {};
	this.cacheMap = {};
	this.active = active;
	this.sqwishStrict = sqwishStrict;
	this.inmemory = inmemory;
	this.locationMap = {};
};

Manager.prototype = {
	parseConfig : function(config) {
		var block;
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
		if(this.locationMap.hasOwnProperty(location)) {
			blocks = this.locationMap[location];
		}
		if(this.locationMap.hasOwnProperty(StaticHandler.GLOBAL)) {
			blocks = blocks.concat(this.locationMap[StaticHandler.GLOBAL]);
		}
		return blocks;
	},
	addFiles : function(block, filenames) {
		if(!this.files.hasOwnProperty(block)) {
			this.files[block] = [];
		}
		var i, len = this.files[block].length, self = this;
		if(!util.isArray(filenames)) {
			filenames = [filenames];
		}
		filenames.forEach(function(filename) {
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
		if(!this.urls.hasOwnProperty(block)) {
			this.urls[block] = [];
		}
		var i, len = this.urls[block].length, self = this;
		if(!util.isArray(urls)) {
			urls = [urls];
		}
		urls.forEach(function(url) {
			for( i = 0; i < len; i++) {
				if(self.urls[block][i] == url) {
					return this;
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
		return this.cacheMap.hasOwnProperty(url);
	},
	getContent : function(url) {
		try {
			return this.cache[this.cacheMap[url]][1] || "";
		} catch(e) {
			return "";
		}
	},
	_getCacheKey : function(files) {
		return files.join(';');
	},
	_getCache : function(files) {
		return this.cache[this._getCacheKey(files)];
	},
	_setAndCache : function(files) {
		var funk = require('funk')('parallel'), path = this.path + '/', type = this.type, manager = this, location = this.location;

		if(!this.path)
			throw new Error('You must configure first!');

		files.forEach(function(el) {
			fs.readFile(path + el, 'utf8', funk.result(el));
		});

		funk.run(function() {
			var self = this, minified, bundled = '', md5dist = '', distPath = 'dist', cacheKey;

			files.forEach(function(el) {
				if(type === 'css') {
					bundled += self[el];
				} else {
					bundled += self[el] + ';';
				}
			});
			if(type === 'css') {
				minified = sqwish.minify(bundled, self.sqwishStrict);
			} else if(type === 'js') {( function() {
					var jsp = uglify.parser, pro = uglify.uglify, ast = jsp.parse(bundled);
					ast = pro.ast_mangle(ast);
					ast = pro.ast_squeeze(ast);
					minified = pro.gen_code(ast);
				}());
			}
			md5dist = distPath + '/' + md5(minified) + '.' + type;
			md5Location = manager.location + '/' + md5dist;
			cacheKey = manager._getCacheKey(files);
			manager.cacheMap[md5Location] = cacheKey;
			// write to static file
			if(!manager.inmemory) {
				manager.cache[cacheKey] = [manager.location + '/' + md5dist, minified];
			} else {			
				manager.cache[cacheKey] = [manager.location + '/' + md5dist, null];
				fs.writeFile(path + md5dist, minified);
			}
		});
	},
	_run : function(files) {
		var cached = this._getCache(files), returnFiles, location = this.location;

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
		var blocks = {};

		for(block in this.files) {
			this.renderTags(block);
		}
	}
};
