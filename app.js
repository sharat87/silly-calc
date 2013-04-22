(function () {
    /*jshint browser:true */
    /*global Lake ace */
    "use strict";

    var inEditor, outEditor;

    function setupEditor() {
        inEditor = ace.edit('input-editor');
        inEditor.setShowPrintMargin(false);

        outEditor = ace.edit('output-editor');
        outEditor.setShowPrintMargin(false);
        outEditor.setReadOnly(true);

        // Hide the editor's builtin scrollbar.
        inEditor.renderer.scrollBar.element.style.display =
            outEditor.renderer.scrollBar.element.style.display = 'none';

        // Remove the small gap at the right edge, reserved for the vertical
        // scrollbar.
        inEditor.renderer.scrollBar.width =
            outEditor.renderer.scrollBar.width = 0;

        inEditor.session.setMode('lake/ace-mode-js');
        // inSession.setUseWorker(true);
    }

    function recalculate() {
        var code = inEditor.getValue();
        if (recalculate.last === code) return;

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
        outEditor.clearSelection();
        recalculate.last = code;
    }

    function resizeEditors() {
        var height = inEditor.session.getScreenLength() *
            inEditor.renderer.lineHeight +
            inEditor.renderer.scrollBar.getWidth();
        inEditor.container.style.minHeight = height + 'px';
        inEditor.resize();
        outEditor.container.style.minHeight = height + 'px';
        outEditor.resize();
    }

    function updateSheet() {
        recalculate();
        resizeEditors();
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
                popups = document.getElementsByClassName('popup'),
                popup = document.querySelector(btn.dataset.popup);
            for (var i = 0, len = popups.length; i < len; ++i) {
                popups[i].classList[
                    popup === popups[i] ? 'toggle' : 'remove']('active');
            }
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

        inEditor.on('change', updateSheet);

        inEditor.selection.on('changeCursor', function (e) {
            outEditor.gotoLine(inEditor.selection.getCursor().row + 1);
        });

        inEditor.setValue([
            'a = 2',
            'a',
            'sin(PI/4) * sqrt(a) + 42',
            'L3',
            ''
        ].join('\n'));
        inEditor.clearSelection();
        inEditor.focus();
    }

    main();
}());
