/**
 * 
 */
VNF.namespace("VNF.util");

VNF.util.FbShare = function(containerId, url) {
 	this.containerId = containerId;
	this.url = url;
	this.scriptId = "util_FbShare";
};

VNF.util.FbShare.prototype = {
	loadScript : function() {
		$("#" + this.scriptId).remove();
		
		var s, share = document.createElement("script");
        share.type = "text/javascript";
        share.async = true;
        
		share.src = "http://static.ak.fbcdn.net/connect.php/js/FB.Share";
		share.id = this.scriptId;
		
        s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(share, s);
		
	},
	run : function() {
		$("#" + this.containerId).empty().append(
			'<a name="fb_share" type="button_count" share_url="' + this.url + '"></a>' 
		);
		this.loadScript();
	}
};