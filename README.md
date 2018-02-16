## [DEPRECATED]
Please I have no longer time for maintaining this package.
Previous version depended on old version of uglify-js which had security issues
https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-8857
https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-8858
PLEASE DO NOT USE THIS PACKAGE

## jcash
This project is mostly for adapting solutions out there for my personal use.
For the size of the image you have to install GraphicsMagick (http://www.graphicsmagick.org/)

## Usage
### Howto configure
	/**
	 *
	 * configuration rules
	 * location referred to the path in the url
	 *
	  {
	 		files: {
	 			block1 : [filename1, filename2, ...],
	 			...
	 		},
	 		urls : {
	 			block1 : [url1, url2,...],
	 			...
	 		},
	 		locationMap : {
	 			path1 : [block1, block2,...],
	 			path2 : [block1,block3,...],
	 			...
	 		}
	  }
	 */


### Real example

Real configuration at http://igeonote.com

	var config = {
		js : {
			files : {
				'igeonote' : [
					'vnf/namespace.js',
					'vnf/language.js',
					'vnf/util/gplusone.js',
					'vnf/util/fbshare.js',
					'vnf/util/geolocation.js',
					'vnf/util/loading.js',
					'vnf/util/gatracking.js',
					'jquery/jhistory.js',
					'igeonote.js']
			},
			urls : {
				'jQuery' : ['http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'],
				'googleMap' : ['http://maps.google.com/maps/api/js?sensor=false']
			},
			locationMap : {
				'/' : ['jQuery', 'igeonote', 'googleMap'],
				'/note' : ['jQuery', 'igeonote', 'googleMap'],
				'/city/map' : ['jQuery', 'igeonote', 'googleMap']
			}
		},
		css : {
			files : {
				'igeonote' : ['igeonote.css'],
				'mobile' : ['igeonote-phone.css']
			},
			urls : {

			},
			locationMap : {
				'*' : ['igeonote']
			}
		}
	};

Basic server setup

	var express = require('express');
	var staticHandler = require('jcash');
	var app = express.createServer();
	var jsManager = staticHandler.getJsManager();
	var cssManager = staticHandler.getCssManager();
	var imageManager = staticHandler.getImageManager({path : __dirname + '/public/img', hasGm : true});

	/* parsing the configuration */
	jsManager.parseConfig(staticConfig.js);
	cssManager.parseConfig(staticConfig.css);


	/* for serving the contents */
	staticHandler.bootstrap(app);

	/* Adding template functions */
	app.dynamicHelpers(staticHandler.dynamicHelpers);

	/* generate the cache */
	jsManager.preRenderAll();
	cssManager.preRenderAll();
	imageManager.fetchFiles();


Content template (ejs templates)

	<% addBottomScript('some javascript including script-tag here') %>
	<%- renderImageTag('/img/icons/loading.gif') %>

layout template with automatic location mapping

	<html>
		<head>
		<%- renderStyleTags() %>
		</head>
		<body>
		<%- body %>
		<%- renderScriptTags() %>
		<%- renderBottomScripts() %>
		<script type="text/javascript">
		$(function(){
			VNF.util.Loading.loadingImage = "<%- getImageUrl('/img/icons/loading.gif') %>";
		});
		</script>
		</body>
	</html>
