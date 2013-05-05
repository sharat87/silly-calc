var langEval = (function () {
    /*jshint browser:true */
    /*global PEG */
    "use strict";

    var parser = null;
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

    function langEval(input) {
        if (parser === null)
            throw new TypeError('Parser is not loaded yet.');

        var env = clone(parser);
        env.scope = {};
        env.row = 0;
        env.headerRow = null;
        env.results = [];

        var lines = input.split('\n'), output;

        for (var len = lines.length; env.row < len;) {

            try {
                output = env.parse(lines[env.row]);
            } catch (e) {
                if (e.name !== 'SyntaxError') throw e;
                e.line = env.row + 1;
                output = {ok: false, error: e};
            }

            env.results[env.row++] = output;

            if (env.headerRow && output.hasValue)
                env.results[env.headerRow] = output;
        }

        return env.results;
    }

    function initParser(grammar) {
        parser = PEG.buildParser(grammar, {trackLineAndColumn: true});
        parser.defaultScope = BUILTINS;
    }

    function clone(obj) {
        var obj2 = {};
        for (var key in obj)
            if (obj.hasOwnProperty(key))
                obj2[key] = obj[key];
        return obj2;
    }

    // TODO: Make async.
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        initParser(this.responseText);
    };
    xhr.open('get', 'grammar.pegjs', false);
    xhr.send();

    return langEval;
}());
