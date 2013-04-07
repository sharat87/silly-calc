(function () {
    var codeInput = document.getElementById('code-input'),
        resultsPanel = document.getElementById('results-panel'),
        gutter = document.getElementById('gutter'),
        cursorHl = document.getElementById('cursor-hl'),
        lastEvaledCode = null;

    function recalculate() {
        if (lastEvaledCode === codeInput.value) return;
        lastEvaledCode = codeInput.value;

        var lines = codeInput.value.split('\n'),
            evaluator = new Lake(),
            resultHtmls = [],
            gutterHtmls = [];

        for (var i = 0, len = lines.length; i < len; ++i) {
            var line = lines[i],
                varname = 'L' + (i + 1),
                result = '',
                evalSuccess = false;

            if (line) {
                try {
                    result = evaluator.evaluate(line);
                    evalSuccess = true;
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        result = '<em>Error</em>';
                    } else throw e;
                }
            }

            resultHtmls.splice(resultHtmls.length, 0,
                '<div class="result', line && !evalSuccess ? ' err' : '',
                '" data-label="', varname, ': ">', result, '</div>');
            gutterHtmls.splice(gutterHtmls.length, 0,
                '<div', '>', varname, ': ', '</div>');

            if (evalSuccess)
                evaluator.evaluate(varname + ' = ' + result);
        }

        resultsPanel.innerHTML = resultHtmls.join('');
        gutter.innerHTML = gutterHtmls.join('');
    }

    function updateCursorLine() {
        var cursorLine = codeInput.value
            .substr(0, codeInput.selectionStart)
            .split('\n')
            .length;

        if (resultsPanel.prevCursorLine <= resultsPanel.childElementCount)
            resultsPanel.children[resultsPanel.prevCursorLine - 1]
                .classList.remove('cursor-hl');

        resultsPanel.children[cursorLine - 1].classList.add('cursor-hl');
        resultsPanel.prevCursorLine = cursorLine;
    }

    function updateSheet() {
        recalculate();
        updateCursorLine();
    }

    function onKeydown(e) {
        // <C-b> - Wrap in parens.
        if (e.ctrlKey && e.which === 66) {

            var oldCode = codeInput.value,
                start = codeInput.selectionStart,
                end = codeInput.selectionEnd,
                prefix = oldCode.substr(0, start),
                selection = oldCode.substr(start, end - start),
                suffix = oldCode.substr(end);

            if (selection) {
                // Wrap the selection in parens.
                codeInput.value =
                    [prefix, '(', selection, ')', suffix].join('');
                codeInput.selectionStart = start + 1;
                codeInput.selectionEnd = end + 1;

            } else {
                // Nothing selection. Wrap whole current line in parens.
                var nlBegin = prefix.split('').reverse().indexOf('\n'),
                    nlEnd = suffix.indexOf('\n'),
                    lineStart = nlBegin === -1 ? 0 : prefix.length - nlBegin,
                    lineEnd = nlEnd === -1 ?
                        oldCode.length : prefix.length + nlEnd;

                codeInput.value = oldCode.substr(0, lineStart) + '(' +
                    oldCode.substr(lineStart, lineEnd - lineStart) + ')' +
                    oldCode.substr(lineEnd);

                codeInput.selectionStart = codeInput.selectionEnd = start + 1;

            }
        }

        setTimeout(updateSheet, 0);
    }

    function setupPopups() {
        var buttons = topbar.querySelectorAll('[data-popup]'),
            popups = document.getElementsByClassName('popup');

        var i, len;
        for (i = 0, len = buttons.length; i < len; ++i) {
            buttons[i].addEventListener('click', onBtnClick);
        }

        for (i = 0, len = popups.length; i < len; ++i) {
            popups[i].addEventListener('click', onPopupClick);
        }

        function onBtnClick(e) {
            e.preventDefault();
            var btn = e.currentTarget,
                popup = document.querySelector(btn.dataset.popup);
            popup.classList.add('active');
        }

        function onPopupClick(e) {
            if (e.target.classList.contains('close')) {
                e.currentTarget.classList.remove('active');
            }
        }
    }

    function main() {
        setupPopups();

        codeInput.addEventListener('change', updateSheet);
        codeInput.addEventListener('keydown', onKeydown);
        codeInput.addEventListener('mousedown', function () {
            setTimeout(updateCursorLine, 0);
        });

        codeInput.value = [
            'a = 2',
            'a',
            'sin(PI/4) * sqrt(a) + 42',
            'L3'
        ].join('\n');

        updateSheet();
    }

    main();
}());
