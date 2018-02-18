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
        env.headerRow = null;

        var row = 0;
        var results = [];
        var lines = input.split('\n');
        var parser = math.parser();

        for (var len = lines.length; row < len; ++row) {
            var output = {ok: true, line: row + 1};
            results.push(output);

            try {
                output.value = parser.eval(lines[row]);
            } catch (e) {
                if (e.name !== 'SyntaxError') throw e;
                output.ok = false;
                output.error = e;
            }

            if (output.value)
                parser.set('ans', output.value);
        }

        console.log(results);
        return results;
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
