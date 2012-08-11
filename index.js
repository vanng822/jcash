var StaticHandler = require('./lib/static');
var imageHandler = require('./lib/image');


function isObject(testObj) {
	return typeof testObj == 'object';
}

function overrideProperty(obj, prop, value) {
	if(!obj.hasOwnProperty(prop)) {
		obj[prop] = value;
		return;
	}
	/* deep override only when matching type object */
	if(isObject(value) && isObject(obj[prop])) {
		overrideObject(obj[prop], value);
		return;
	}
	obj[prop] = value;
}

function overrideObject(obj) {
	var i, len, source, j, jlen, props;
	for( i = 1, len = arguments.length; i < len; i++) {
		source = arguments[i];
		props = Object.keys(source);
		for( j = 0, jlen = props.length; j < jlen; j++) {
			overrideProperty(obj, props[j], source[props[j]]);
		}
	}
}

overrideObject(StaticHandler, imageHandler);

module.exports = StaticHandler;