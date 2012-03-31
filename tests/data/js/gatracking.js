
VNF.namespace("VNF.util");

VNF.util.GaTracking = function(code){
    this.code = code;
};

VNF.util.GaTracking.prototype = {
    loadScriptAndTrack: function(){
        if (!this.code) {
            throw new Error("No tracking code was set");
        }
        var _gaq = window._gaq || [];
        _gaq.push(["_setAccount", this.code]);
        _gaq.push(["_trackPageview"]);
        window._gaq = _gaq;
        this.loadScript();
    },
    loadScript: function(){
        var s, ga = document.createElement("script");
        ga.type = "text/javascript";
        ga.async = true;
        ga.src = ("https:" == document.location.protocol ? "https://ssl" : "http://www") +
        ".google-analytics.com/ga.js";
        s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(ga, s);
    },
    track: function(url){
        if (!this.code) {
            throw new Error("No tracking code was set");
        }
        var pageTracker = _gat._getTracker(this.code);
        pageTracker._trackPageview(url ? url : "");
    }
};
