function Editor(el) {
    this.el = el;
    this.lines = [];
    this.render();
}

Editor.prototype = {
    render: function () {
        var htmls = [];
        for (var i = 0, len = this.lines.length; i < len; ++i) {
            htmls.push('<div class=line>' +
                       this.lines[i] + '</div>');
        }
        this.el.innerHTML = htmls.join('');
    }
};

var editor = new Editor(document.getElementById('editor'));
editor.lines = ['abc', 'def'];
editor.render();
