function Editor(el) {
    var self = this;
    self.el = el;
    self.lines = [];
    self.render();
    self.el.addEventListener('keydown', function (e) {
        setTimeout(function () { self.update(e); }, 0);
    });
}

Editor.prototype = {

    render: function () {
        var htmls = [];
        for (var i = 0, len = this.lines.length; i < len; ++i) {
            htmls.push('<div class=line>' +
                       this.lines[i] + '</div>');
        }
        this.el.innerHTML = htmls.join('');
    },

    update: function (e) {
        this.updateCursorLine();
    }

};

var editor = new Editor(document.getElementById('editor'));
editor.lines = ['abc', 'def'];
editor.render();
