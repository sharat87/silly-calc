var Lang = (function () {
    function Lang() {
        if (!Lang.grammar) throw new TypeError('Language grammar is not set');
        this.parser = PEG.buildParser(Lang.grammar, {
            trackLineAndColumn: true
        });
    }

    Lang.prototype = {

        calc: function (input) {
            return this.parser.parse(input);
        },

        set: function (name, value) {
            this.parser.scope[name] = value;
        }

    };

    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        Lang.grammar = this.responseText;
    };
    xhr.open('get', 'grammar.pegjs', false);
    xhr.send();

    return Lang;
}());
