(function () {

    function Lake(scope) {
        if (!(this instanceof Lake)) return new Lake(scope);
        this.scope = scope;
    }

    // The Lake lexer.
    Lake.lex = (function () {

        var reWhiteSpace = /^\s+/,
            reIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*/,
            reNumber = /^\d+/,
            reOperator = /^[=\-\+\*\/\^]+/;

        return function lex(input) {
            var tokens = [], inputSize = input.length, m, matchLen;

            while (true) {
                /*jshint boss:true */
                input = input.replace(reWhiteSpace, '');

                if (input.length === 0) {
                    // Exhausted the input.
                    break;

                } else if (input[0] === '(') {
                    token = {type: 'open-paren', val: null};
                    matchLen = 1;

                } else if (input[0] === ')') {
                    token = {type: 'close-paren', val: null};
                    matchLen = 1;

                } else if (input[0] === ',') {
                    token = {type: 'comma', val: null};
                    matchLen = 1;

                } else if (m = input.match(reNumber)) {
                    token = {type: 'number', val: m};

                } else if (m = input.match(reOperator)) {
                    token = {type: 'operator', val: m};

                } else if (m = input.match(reIdentifier)) {
                    token = {type: 'identifier', val: m};

                } else {
                    var err = SyntaxError('Lake: Unidentified input');
                    err.line = 1;
                    err.column = inputSize - input.length;
                    throw err;

                }

                tokens.push(token);
                input = input.substr(matchLen || m[0].length);
                matchLen = null;
            }

            return tokens;
        };

    }());

    // The Lake parser.
    Lake.parse = function (tokens) {
        throw Error('Not implemented yet yo!');
    };

    Lake.prototype = {

        interpret: function (ast) {
            throw Error('Not implemented yet yo!');
        },

        evaluate: function (input) {
            throw Error('Not implemented yet yo!');
        }

    };

    window.Lake = Lake;

}());
