
VNF.namespace("VNF.util");

VNF.util.GPlusOne = function(containerId, size, lang) {
	this.containerId = containerId;
    this.size = size;
	this.lang = lang;
	this.scriptId = "util_GPlusOne";
};

VNF.util.GPlusOne.prototype = {
    loadScript: function() {
		$("#" + this.scriptId).remove();
        var s, gplusone = document.createElement("script");
        gplusone.type = "text/javascript";
        gplusone.async = true;
		gplusone.id = this.scriptId;
        gplusone.src = "https://apis.google.com/js/plusone.js";
		if (this.lang) {
			gplusone.text = "{lang: '" +  this.lang + "'}";
		}
        s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(gplusone, s);
    },
    run: function(url) {
        var buttonMarkup = '<g:plusone';
		if (this.size) {
			buttonMarkup += ' size="' + this.size + '"';
		}
		buttonMarkup += '></g:plusone>';
		$("#" + this.containerId).empty().append(buttonMarkup);
		this.loadScript();
		this.clean();
    },
	clean : function() {
		setTimeout(function() {
			var first = true;
			$('script[src*="client__plusone"]').each(function() {
				if (!first) {
					$(this).remove();
				} else {
					first = false;
				}
			});
		}, 5000);
	}
};
