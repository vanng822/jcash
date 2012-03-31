
	VNF.namespace("VNF.util");

	VNF.util.MapScaleCalculator = function() {
		this.zoomMeters = [ 591657550.5, 295828775.3, 147914387.6, 73957193.82,
				36978596.91, 18489298.45, 9244649.227, 4622324.614,
				2311162.307, 1155581.153, 577790.5767, 288895.2884,
				144447.6442, 72223.82209, 36111.91104, 18055.95552,
				9027.977761, 4513.98888, 2256.99444, 1128.49722 ];
		this.degreeMeters = 111319.9;
	};

	VNF.util.MapScaleCalculator.prototype = {
		toMeters : function(zoom) {
			zoom = parseInt(zoom);
			if (zoom < 0 || zoom >= this.zoomMeters.length) {
				zoom = 14;
			}
			return this.zoomMeters[zoom];
		},
		toDegree : function(meters) {
			return meters / (this.degreeMeters * 360);
		},
		zoomToDegree : function(zoom) {
			return this.toDegree(this.toMeters(zoom));
		}
	};

	VNF.util.Geolocation = function() {
		//VNF.util.Geolocation.superclass.constructor.call(this);
	};
	
	VNF.util.Geolocation.prototype = {
		
	};
	VNF.util.Geolocation.fields = ["longitude", "latitude", "altitude", "accuracy", "altitudeAccuracy", "heading", "speed"];
	/*
	if (navigator.geolocation) {
		VNF.extend(VNF.util.Geolocation, navigator.geolocation);
	}

	VNF.util.geolocation = new VNF.util.Geolocation();
	*/
	
	VNF.util.GeoPositionConverter = function() {
	};
	
	VNF.util.GeoPositionConverter.RADIUS = 6371000;//m
	
	VNF.util.GeoPositionConverter.prototype = {
		toRad : function(decDegrees) {
			return decDegrees * Math.PI / 180;
		},
		getDistance : function(lng1, lat1, lng2, lat2) {
			var dLat = this.toRad(lat2-lat1);
			var dLng = this.toRad(lng2-lng1);
			var a = Math.sin(dLat/2) * Math.sin(dLat/2) 
					+ Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)); 
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			return  c * VNF.util.GeoPositionConverter.RADIUS;
		},
		getDDLongitudeNotation : function(decDegrees) {
			if (decDegrees < 0)
				return "W";
			return "E";
		},
		getDDLatitudeNotation : function(decDegrees) {
			if (decDegrees < 0)
				return "S";
			return "N";
		},
		getDDLongitude : function(decDegrees) {
			var dd = this.toDD(decDegrees);
			return dd.degrees + "° " + dd.minutes + "' " + dd.seconds + "\" "
					+ this.getDDLongitudeNotation(decDegrees);
		},
		getDDLatitude : function(decDegrees) {
			var dd = this.toDD(decDegrees);
			return dd.degrees + "° " + dd.minutes + "' " + dd.seconds + "\" "
					+ this.getDDLatitudeNotation(decDegrees);
		},
		toDD : function(decDegrees) {
			var dd = {};
			decDegrees = Math.abs(decDegrees);
			dd.degrees = Math.floor(decDegrees);
			dd.minutes = Math.floor(decDegrees * 60) % 60;
			dd.seconds = Math.round(10 * ((decDegrees * 3600) % 60)) / 10;
			return dd;
		}
	};
	
