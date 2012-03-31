
VNF.namespace("VNF.util");

VNF.util.Loading = {
    loadingElement: null,
    loadingElementId: "loadingElementId",
    getLoadingElement: function(){
        if (!this.loadingElement) {
            var test = $("#" + this.loadingElementId);
            if (test.length < 1) {
                this.loadingElement = document.createElement('div');
                this.loadingElement.className = "loading hidden";
                this.loadingElement.id = this.loadingElementId;
                this.loadingElement.innerHTML = '<img src="/img/icons/loading.gif" alt="loading" />';
            }
            $(document.body).append(this.loadingElement);
        }
        return this.loadingElement;
    },
    show: function(event){
        var el = this.getLoadingElement();
        if (event) {
            $(el).css("left", event.pageX).css("top", event.pageY);
        }
        $("#" + this.loadingElementId).removeClass("hidden").addClass("visible");
    },
    hide: function(){
        $("#" + this.loadingElementId).removeClass("visible").addClass("hidden");
    }
};
