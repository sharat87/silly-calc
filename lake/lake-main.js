(function () {

    var codeInput = document.getElementById('source-input'),
        lexerDisplay = document.getElementById('lexer-display'),
        parserDisplay = document.getElementById('parser-display'),
        resultDisplay = document.getElementById('result-display');

    function updateSheet() {
        var code = codeInput.value,
            lake = new Lake(),
            tokens = null, ast = null, result = null;

        parserDisplay.innerText = '';
        resultDisplay.innerText = '???';

        try {
            tokens = lake.lex(code);
        } catch (err) {
            lexerDisplay.parentNode.classList.add('error');
            lexerDisplay.innerText = err.toString() + '\n' + code + '\n' +
                repeat(' ', err.column) + '↑';
            throw err;
        }

        lexerDisplay.parentNode.classList.remove('error');
        lexerDisplay.innerText = tokensToString(tokens);

        try {
            ast = lake.parse(tokens);
        } catch (err) {
            parserDisplay.parentNode.classList.add('error');
            parserDisplay.innerText = err.toString();
            throw err;
        }

        parserDisplay.parentNode.classList.remove('error');
        parserDisplay.innerText = JSON.stringify(ast, null, 2);

        try {
            result = lake.interpret(ast);
        } catch (err) {
            resultDisplay.classList.add('error');
            resultDisplay.innerText = err.toString();
            throw err;
        }

        resultDisplay.classList.remove('error');
        resultDisplay.innerText = result.toString();
    }

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

    // Layout management
    var Layout = (function layout() {
        var sourcePane = document.getElementById('source-pane'),
            lexerPane = document.getElementById('lexer-pane'),
            parserPane = document.getElementById('parser-pane');

        function reTile() {
            lexerPane.style.height = parserPane.style.height =
                (window.innerHeight - sourcePane.offsetHeight) + 'px';
            codeInput.style.width = (codeInput.value.length * 13) + 'px';
        }

        return {reTile: reTile};
    }());

    // Startup the app.
    (function startup() {

        var onInputChange = function () {
            updateSheet();
            Layout.reTile();
        };

        codeInput.addEventListener('change', onInputChange);
        codeInput.addEventListener('keydown', function () {
            setTimeout(onInputChange, 0);
        });

        window.addEventListener('resize', Layout.reTile);

        Layout.reTile();
        updateSheet();
    }());

}());
