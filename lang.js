var langEval = (function () {
    /*jshint browser:true */
    "use strict";

    var BUILTINS = {
        // Answer of previous operation
        ans: null,

        // Constants
        PI: Math.PI,

        // Functions
        abs: Math.abs,
        sqrt: Math.sqrt,
        log: Math.log,
        sin: Math.sin,
        cos: Math.cos,

        // Sum of given numbers
        sum: function () {
            var sum = 0;
            for (var i = arguments.length; i-- > 0;)
                sum += arguments[i];
            return sum;
        }

    };

    function langEval(input) {
        if (window.LangParser === null)
            throw new TypeError('Parser is not loaded yet.');

        var env = clone(window.LangParser);
        env.scope = BUILTINS;
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

            if (output.ok && output.hasValue)
                env.scope.ans = output.value;

            if (env.headerRow && output.hasValue)
                env.results[env.headerRow] = output;
        }

        return env.results;
    }

    function clone(obj) {
        var obj2 = {};
        for (var key in obj)
            if (obj.hasOwnProperty(key))
                obj2[key] = obj[key];
        return obj2;
    }

    return langEval;
}());
