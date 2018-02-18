var langEval = (function () {
    /*jshint browser:true */
    "use strict";

    function langEval(input) {
        var lines = input.split('\n'),
            results = [],
            parser = math.parser(),
            i = 0,
            len = lines.length;

        while (i++ < len) {
            var res = {ok: true, line: i};
            results.push(res);

            try {
                res.value = parser.eval(lines[i - 1]);
            } catch (e) {
                if (e.name !== 'SyntaxError') throw e;
                res.ok = false;
                res.error = e;
            }

            if (res.value)
                parser.set('ans', res.value);
        }

        return results;
    }

    return langEval;
}());
