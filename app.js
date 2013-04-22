ace.define('ace/mode/lake', function(require, exports, module) {

    var oop = require('ace/lib/oop'),
        TextMode = require('ace/mode/text').Mode,
        Tokenizer = require('ace/tokenizer').Tokenizer,
        TextHighlightRules =
            require('ace/mode/text_highlight_rules').TextHighlightRules;

    var LakeHighlightRules = function() {
        this.$rules = {
            start: [
                {token: 'constant.numeric', regex: /\d+/}
            ]
        };
    };
    oop.inherits(LakeHighlightRules, TextHighlightRules);

    var Mode = function() {
        this.$tokenizer = new Tokenizer(new LakeHighlightRules().getRules());
    };
    oop.inherits(Mode, TextMode);

    (function() {
        // Extra logic goes here. (see below)
    }).call(Mode.prototype);

    exports.Mode = Mode;
});

(function () {
    /*jshint browser:true */
    /*global Lake ace */
    "use strict";

    var inEditor = null,
        outEditor = null,
        cursorHl = document.getElementById('cursor-hl'),
        lastEvaledCode = null;

    function setupEditor() {
        inEditor = ace.edit('input-editor');
        inEditor.setShowPrintMargin(false);

        outEditor = ace.edit('output-editor');
        outEditor.setReadOnly(true);

        inEditor.getSession().setMode('ace/mode/lake');
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
            var line = lines[i], result;

            try {
                result = evaluator.evaluate(line);
            } catch (e) {
                if (e instanceof Lake.Error) {
                    result = null;
                } else throw e;
            }

            if (result !== null) {
                evaluator.evaluate('L' + (i + 1) + ' = ' + result);
                results.push(result);
            } else {
                results.push('');
            }
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

        inEditor.on('change', updateSheet);
        inEditor.selection.on('changeCursor', function (e) {
            outEditor.gotoLine(inEditor.selection.getCursor().row + 1);
        });
    }

    main();
}());
