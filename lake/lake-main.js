(function () {

    var codeInput = document.getElementById('source-input'),
        lexerDisplay = document.getElementById('lexer-display');

    var update = function () {
        var code = codeInput.value,
            tokens = null;

        try {
            tokens = Lake.lex(code);
        } catch (err) {
            if (err instanceof SyntaxError) {
                lexerDisplay.classList.add('error');
                lexerDisplay.innerText = err.toString() + '\n' + code + '\n' +
                    repeat(' ', err.column) + '↑';
                return;
            }
        }

        lexerDisplay.classList.remove('error');
        lexerDisplay.innerText = tokensToString(tokens);
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
