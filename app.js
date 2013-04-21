(function () {
    /*jshint browser:true */
    /*global Lake ace */
    "use strict";

    var inputElem = document.getElementById('input-editor'),
        inEditor = null,
        outputElem = document.getElementById('output-editor'),
        outEditor = null,
        cursorHl = document.getElementById('cursor-hl'),
        lastEvaledCode = null;

    function setupEditor() {
        inEditor = ace.edit('input-editor');
        inEditor.setShowPrintMargin(false);

        outEditor = ace.edit('output-editor');
        outEditor.setReadOnly(true);

        // inEditor.setTheme('ace/theme/tomorrow');
        // outEditor.setTheme('ace/theme/tomorrow');

        // inSession.setMode('ace/mode/javascript');
        // inSession.setUseWorker(true);
    }

    function recalculate() {
        var code = inEditor.getValue();
        if (lastEvaledCode === code) return;
        lastEvaledCode = code;

        var lines = code.split('\n'),
            evaluator = new Lake(),
            results = [];

        for (var i = 0, len = lines.length; i < len; ++i) {
            var line = lines[i],
                varname = 'L' + (i + 1),
                result = '',
                isFail = false;

            if (line) {
                try {
                    result = evaluator.evaluate(line);
                } catch (e) {
                    isFail = true;
                    if (e instanceof SyntaxError) {
                        result = '<em>Error</em>';
                    } else throw e;
                }

                if (!isFail)
                    evaluator.evaluate(varname + ' = ' + result);
            }

            results.splice(results.length, 0, isFail ? 'Error' : result);
        }

        outEditor.setValue(results.join('\n'));
    }

    function updateCursorLine() {
        // var cursorLine = editor.getValue()
        //         .substr(0, codeInput.selectionStart)
        //         .split('\n')
        //         .length;

        // if (resultsPanel.prevCursorLine <= resultsPanel.childElementCount)
        //     resultsPanel.children[resultsPanel.prevCursorLine - 1]
        //         .classList.remove('cursor-hl');

        // resultsPanel.children[cursorLine - 1].classList.add('cursor-hl');
        // resultsPanel.prevCursorLine = cursorLine;
    }

    function updateSheet() {
        recalculate();
        updateCursorLine();
    }

    function onKeydown(e) {
        // <C-b> - Wrap in parens.
        if (e.ctrlKey && e.which === 66) {

            // TODO: Reimplement for Ace editor.
            return;

            // var oldCode = codeInput.value,
            //     start = codeInput.selectionStart,
            //     end = codeInput.selectionEnd,
            //     prefix = oldCode.substr(0, start),
            //     selection = oldCode.substr(start, end - start),
            //     suffix = oldCode.substr(end);

            // if (selection) {
            //     // Wrap the selection in parens.
            //     codeInput.value =
            //         [prefix, '(', selection, ')', suffix].join('');
            //     codeInput.selectionStart = start + 1;
            //     codeInput.selectionEnd = end + 1;

            // } else {
            //     // Nothing selection. Wrap whole current line in parens.
            //     var nlBegin = prefix.split('').reverse().indexOf('\n'),
            //         nlEnd = suffix.indexOf('\n'),
            //         lineStart = nlBegin === -1 ? 0 : prefix.length - nlBegin,
            //         lineEnd = nlEnd === -1 ?
            //             oldCode.length : prefix.length + nlEnd;

            //     codeInput.value = oldCode.substr(0, lineStart) + '(' +
            //         oldCode.substr(lineStart, lineEnd - lineStart) + ')' +
            //         oldCode.substr(lineEnd);

            //     codeInput.selectionStart = codeInput.selectionEnd = start + 1;

            // }
        }

        setTimeout(updateSheet, 0);
    }

    function setupPopups() {
        var buttons = document.getElementById('topbar')
                .querySelectorAll('[data-popup]'),
            popups = document.getElementsByClassName('popup');

        var i, len;
        for (i = 0, len = buttons.length; i < len; ++i) {
            buttons[i].addEventListener('click', onBtnClick);
        }

        for (i = 0, len = popups.length; i < len; ++i) {
            popups[i].addEventListener('click', onPopupClick);
        }

        document.addEventListener('keydown', function (e) {
            // ESC key.
            if (e.which === 27) {
                var activePopups =
                    document.getElementsByClassName('active popup');
                if (activePopups.length)
                    activePopups[activePopups.length - 1]
                        .classList.remove('active');
            }
        });

        function onBtnClick(e) {
            e.preventDefault();
            var btn = e.currentTarget,
                popup = document.querySelector(btn.dataset.popup);
            popup.classList.toggle('active');
        }

        function onPopupClick(e) {
            if (e.target.classList.contains('close')) {
                e.currentTarget.classList.remove('active');
            }
        }
    }

    function main() {
        setupEditor();
        setupPopups();

        // codeInput.addEventListener('change', updateSheet);
        // codeInput.addEventListener('keydown', onKeydown);
        // codeInput.addEventListener('mousedown', function () {
        //     setTimeout(updateCursorLine, 0);
        // });

        inEditor.setValue([
            'a = 2',
            'a',
            'sin(PI/4) * sqrt(a) + 42',
            'L3',
            ''
        ].join('\n'));

        updateSheet();

        inEditor.getSession().on('change', updateSheet);
    }

    main();
}());
