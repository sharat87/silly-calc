function Lake(scope) {
    if (!(this instanceof Lake)) return new Lake(scope);
    this.scope = scope || {};
}

// Lake.prototype.lex
(function () {

    // Mapping of token name to a boolean indicating whether the token
    // has semantic `val` or not.
    var tokenSpec = [
        // reWhiteSpace = /^\s+/,
        // Triplets of (<token-name>, <matcher>[, <data-part>])
        // If <matcher> is a regex, then <data-part> can refer to the group
        // indicating the semantic data, and defaults to 0.
        ['number', /^\d+/],
        ['operator', /^[=\-\+\*\/\^]+/],
        ['identifier', /^[a-zA-Z_][a-zA-Z0-9_]*/],

        // If <matcher> is a string, the input is checked whether it starts
        // with the matcher. <data-part> is ignored.
        ['openParen', '('],
        ['closeParen', ')'],
        ['comma', ','],

        // When using regex, if <data-part> is null, no semantic data is
        // saved in the token.
        ['end', /^$/, null]
    ];

    function Token(name, val) {
        if (!(this instanceof Token)) return new Token(name, val);
        this.name = name;

        if (arguments.length === 0)
            this.val = null;
        else if (val instanceof Object)
            this.set(val);
        else
            this.val = val;
    }

    Token.prototype = {

        set: function (props) {
            for (var key in props) {
                if (props.hasOwnProperty(key))
                    this[key] = props[key];
            }
        },

        toString: function () {
            return '<' + this.name +
                (this.val === null ? '' : ' ' + this.val) + '>';
        }

    };

    Lake.prototype.lex = function (input) {
        var token = null,
            tokens = [],
            inputSize = input.length;

        do {
            input = input.replace(/^\s+/, '');
            token = null;

            for (var i = 0; i < tokenSpec.length; i++) {
                var name = tokenSpec[i][0],
                    matcher = tokenSpec[i][1],
                    dataPart = tokenSpec[i][2],
                    match;

                if (typeof matcher === 'string') {
                    if (input.substr(0, matcher.length) === matcher)
                        token = Token(name, {
                            val: null,
                            matchLen: matcher.length
                        });

                } else if (matcher instanceof RegExp) {
                    match = input.match(matcher);
                    if (match)
                        token = Token(name, {
                            val: dataPart === null ?
                                null : match[dataPart || 0],
                            matchLen: match[0].length
                        });

                }

                if (token) break;

            }

            if (token === null) {
                var err = SyntaxError('Lake: Unidentified input');
                err.line = 1;
                err.column = inputSize - input.length;
                throw err;
            }

            tokens.push(token);
            input = input.substr(token.matchLen);

        } while (token.name !== 'end');

        return tokens;
    };

}());

// Lake.prototype.parse
// Precedence climbing used for `parseAtom` and `parseExpr` from:
// http://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing/
(function () {

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
        if (token.name !== 'end') tokens.shift();
        return token;
    }

    function peekToken(lookAhead) {
        return tokens[lookAhead || 0];
    }

    function parseExpr(minPrec) {
        minPrec = minPrec || 0;
        var left = parseAtom(), result = left;

        while (true) {
            var t = peekToken();
            if (!t || t.name !== 'operator') break;

            var prec = opTable[t.val][0],
                assoc = opTable[t.val][1],
                nextMinPrec;

            if (prec < minPrec) break;
            popToken();

            nextMinPrec = minPrec + (assoc === 'left');

            right = parseExpr(nextMinPrec);
            result = {op: 'call', name: t.val, args: [result, right]};
        }

        return result;
    }

    function parseAtom(minPrec) {
        var t = popToken();

        if (!t) {
            throw SyntaxError('Lake: Unexpected end of input.');
        }

        if (t.name === 'openParen') {
            var e = parseExpr(), closeToken = popToken();
            if (closeToken.name !== 'closeParen' &&
                closeToken.name !== 'end') {
                throw SyntaxError('Unclosed paren');
            }
            return e;
        }

        if (t.name === 'operator' && t.val === '-') {
            return {op: '-', left: 0, right: parseAtom()};
        }

        if (t.name === 'number') {
            return parseFloat(t.val, 10);
        }

        if (t.name === 'identifier') {
            return {op: 'ref', name: t.val};
        }

        throw SyntaxError('Lake: Unexpected "' + t.name + '"');

    }

    Lake.prototype.parse = function (_tokens) {
        tokens = _tokens;
        return parseExpr();
    };

}());

// Lake.prototype.interpret
(function () {

    // Builtins.
    var builtins = {
        '+': function (x, y) { return x + y; },
        '-': function (x, y) { return x - y; },
        '*': function (x, y) { return x * y; },
        '/': function (x, y) { return x / y; },
        '^': function (x, y) { return Math.pow(x, y); },

        '=': function (ref, value) {
            return this.scope[ref.name] = this.interpret(value);
        }

    };

    // OpCode implementations.
    var ops = {

        ref: function (ast) {
            return this.scope[ast.name];
        },

        call: function (ast) {
            var fn = this.scope[ast.name] || builtins[ast.name],
                iArgs;

            if (ast.name === '=') {
                iArgs = ast.args;
            } else {
                iArgs = [];
                for (var i = 0, len = ast.args.length; i < len; ++i) {
                    iArgs.push(this.interpret(ast.args[i]));
                }
            }

            return fn.apply(this, iArgs);
        }

    };

    Lake.prototype.interpret = function (ast) {
        if (typeof ast === 'number') {
            return ast;
        } else if (ast instanceof Object) {
            return ops[ast.op].call(this, ast);
        } else {
            throw Error('Lake: Unrecognizable ast: ' + ast);
        }
    };

}());

Lake.prototype.evaluate = function (input) {
    throw Error('Not implemented yet yo!');
};

window.Lake = Lake;
