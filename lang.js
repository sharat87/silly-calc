var Lang = (function () {

    BUILTINS = {

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

        for (var i = 0, len = lines.length; i < len; ++i) {

            try {
                output = this.parser.parse(lines[i]);
            } catch (e) {
                if (e.name !== 'SyntaxError') throw e;
                e.name = 'LangError';
                e.line = this.parser.row + 1;
                throw e;
            }

            this.parser.results[this.parser.row++] = output;

            if (this.parser.headerRow && typeof output == 'number')
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
