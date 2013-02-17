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
            var token = null,
                tokens = [],
                inputSize = input.length,
                m, matchLen;

            do {
                /*jshint boss:true */
                input = input.replace(reWhiteSpace, '');

                if (input.length === 0) {
                    token = {type: 'end', val: null};
                    matchLen = 0;

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
                    token = {type: 'operator', val: m[0]};

                } else if (m = input.match(reIdentifier)) {
                    token = {type: 'identifier', val: m[0]};

                } else {
                    var err = SyntaxError('Lake: Unidentified input');
                    err.line = 1;
                    err.column = inputSize - input.length;
                    throw err;

                }

                tokens.push(token);
                input = input.substr(matchLen || m[0].length);
                matchLen = null;
            } while (token.type !== 'end');

            return tokens;
        };

    }());

    // The Lake parser.
    Lake.parse = (function () {

        var tokens = null;

        var opTable = {
            '=': [0, 'left'],
            '+': [1, 'left'],
            '-': [1, 'left'],
            '*': [2, 'left'],
            '/': [2, 'left'],
            '^': [3, 'right']
        };

        function popToken() {
            var token = tokens[0];
            if (token.type !== 'end') tokens.shift();
            return token;
        }

        function peekToken() {
            return tokens[0];
        }

        function parseAtom(minPrec) {
            var t = popToken();

            if (!t) {
                throw SyntaxError('Lake: Unexpected end of input.');
            }

            if (t.type === 'open-paren') {
                var e = parseExpr(0), closeToken = popToken();
                if (closeToken.type !== 'close-paren' &&
                    closeToken.type !== 'end') {
                    throw SyntaxError('Unclosed paren');
                }
                return e;
            }

            if (t.type === 'operator' && t.val === '-') {
                return {op: '-', left: 0, right: parseAtom()};
            }

            if (t.type === 'number') {
                return parseFloat(t.val, 10);
            }

            if (t.type === 'identifier') {
                return {op: 'ref', name: t.val};
            }

            throw SyntaxError('Lake: Unexpected "' + t.type + '"');

        }

        function parseExpr(minPrec) {
            var left = parseAtom(), result = left;

            while (true) {
                var t = peekToken();
                if (!t || t.type !== 'operator') break;

                var prec = opTable[t.val][0],
                    assoc = opTable[t.val][1],
                    nextMinPrec;

                if (prec < minPrec) break;
                popToken();

                nextMinPrec = minPrec + (assoc === 'left');

                right = parseExpr(nextMinPrec);
                result = {op: t.val, left: result, right: right};
            }

            return result;
        }

        return function parse(_tokens) {
            tokens = _tokens;
            return parseExpr(0);
        };

    }());

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
