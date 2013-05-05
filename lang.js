var Lang = (function () {
    /*jshint browser:true */
    /*global PEG */
    "use strict";

    var BUILTINS = {

        // Constants
        PI: Math.PI,

        // Functions
        abs: Math.abs,
        sqrt: Math.sqrt,
        log: Math.log,
        sin: Math.sin,
        cos: Math.cos

    };

    function Lang() {
        if (!Lang.grammar) throw new TypeError('Language grammar is not set');
        this.parser = PEG.buildParser(Lang.grammar, {
            trackLineAndColumn: true
        });
        this.parser.defaultScope = BUILTINS;
        this.parser.scope = {};
        this.parser.row = 0;
        this.parser.headerRow = null;
        this.parser.results = [];
    }

    Lang.prototype.calc = function (input) {
        var lines = input.split('\n'), output;

        for (var len = lines.length; this.parser.row < len;) {

            try {
                output = this.parser.parse(lines[this.parser.row]);
            } catch (e) {
                if (e.name !== 'SyntaxError') throw e;
                e.line = this.parser.row + 1;
                output = {ok: false, error: e};
            }

            this.parser.results[this.parser.row++] = output;

            if (this.parser.headerRow && output.hasValue)
                this.parser.results[this.parser.headerRow] = output;
        }

        return this.parser.results;
    };

    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        Lang.grammar = this.responseText;
    };
    xhr.open('get', 'grammar.pegjs', false);
    xhr.send();

    return Lang;
}());
