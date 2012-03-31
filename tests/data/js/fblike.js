/**
 *
 */
VNF.namespace("VNF.util");

VNF.util.FbLike = function(){

};

IsGoodness.youtube.FacebookLike = function(b, e){
    var d = 600;
    var a = "http://youtubevideo.isgoodness.com/watch/video/id/" + e;
    var c = '<iframe src="http://www.facebook.com/plugins/like.php?layout=standard&amp;show_faces=true&amp;width=' + d + "&amp;action=like&amp;colorscheme=light&amp;href=" + escape(a) + '" scrolling="no" frameborder="0" allowTransparency="true" style="border:none; height: 25px;overflow:hidden; width:' + d + 'px; height:px"></iframe>';
    YUI(IsGoodness.config.yui.base).use("node", function(g){
        var f = g.one("#" + b);
        f.set("innerHTML", c)
    })
};
