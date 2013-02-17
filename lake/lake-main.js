(function () {

    var codeInput = document.getElementById('source-input'),
        lexerDisplay = document.getElementById('lexer-display'),
        parserDisplay = document.getElementById('parser-display');

    var update = function () {
        var code = codeInput.value,
            tokens = null, ast = null;

        try {
            tokens = Lake.lex(code);
        } catch (err) {
            if (err instanceof SyntaxError) {
                lexerDisplay.classList.add('error');
                lexerDisplay.innerText = err.toString() + '\n' + code + '\n' +
                    repeat(' ', err.column) + '↑';
                return;
            } else {
                throw err;
            }
        }

        lexerDisplay.classList.remove('error');
        lexerDisplay.innerText = tokensToString(tokens);

        try {
            ast = Lake.parse(tokens);
        } catch (err) {
            if (err instanceof SyntaxError) {
                parserDisplay.classList.add('error');
                parserDisplay.innerText = err.toString();
                return;
            } else {
                throw err;
            }
        }

        parserDisplay.classList.remove('error');
        parserDisplay.innerText = JSON.stringify(ast, null, 4);
    };

    codeInput.addEventListener('change', update);
    codeInput.addEventListener('keydown', function () {
        setTimeout(update, 0);
    });

    update();

    // Helper functions
    function tokensToString(tokens) {
        var sTokens = [];
        for (var i = 0; i < tokens.length; i++) {
            var type = tokens[i].type, val = tokens[i].val;
            sTokens.push(type + (val ? ': ' + val : ''));
        }
        return sTokens.join('\n');
    }

    function repeat(str, count) {
        var strs = [];
        while (count--) strs.push(str);
        return strs.join('');
    }

}());
