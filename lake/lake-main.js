(function () {

    var codeInput = document.getElementById('source-input'),
        lexerDisplay = document.getElementById('lexer-display'),
        parserDisplay = document.getElementById('parser-display'),
        interpreterDisplay = document.getElementById('interpreter-display');

    var update = function () {
        var code = codeInput.value,
            lake = new Lake(),
            tokens = null, ast = null, result = null;

        try {
            tokens = lake.lex(code);
        } catch (err) {
            if (err instanceof SyntaxError) {
                lexerDisplay.parentNode.classList.add('error');
                lexerDisplay.innerText = err.toString() + '\n' + code + '\n' +
                    repeat(' ', err.column) + '↑';
                return;
            } else {
                throw err;
            }
        }

        lexerDisplay.parentNode.classList.remove('error');
        lexerDisplay.innerText = tokensToString(tokens);

        try {
            ast = lake.parse(tokens);
        } catch (err) {
            if (err instanceof SyntaxError) {
                parserDisplay.parentNode.classList.add('error');
                parserDisplay.innerText = err.toString();
                return;
            } else {
                throw err;
            }
        }

        parserDisplay.parentNode.classList.remove('error');
        parserDisplay.innerText = JSON.stringify(ast, null, 4);

        try {
            result = lake.interpret(ast);
        } catch (err) {
            interpreterDisplay.parentNode.classList.add('error');
            interpreterDisplay.innerText = err.toString();
            return;
        }

        interpreterDisplay.parentNode.classList.remove('error');
        interpreterDisplay.innerText = result.toString();
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
            sTokens.push(tokens[i].toString());
        }
        return sTokens.join('\n');
    }

    function repeat(str, count) {
        var strs = [];
        while (count--) strs.push(str);
        return strs.join('');
    }

}());
