var StaticHandler = require('./lib/static');
var imageHandler = require('./lib/image');

for (var proto in imageHandler) {
	StaticHandler[proto] = imageHandler[proto];
};


module.exports = StaticHandler;