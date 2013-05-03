(function () {
    /*jshint browser:true */
    /*global Lang ace */
    "use strict";

    function extend(array) {
        var args = array.slice.call(arguments, 1);
        args.splice(0, 0, array.length, 0);
        array.splice.apply(array, args);
    }

    var inEditor, outDisplay;

    function OutputDisplay(elementId, value) {
        this.container = document.getElementById(elementId);
        this.values = [];
        this.folds = [];
        this.render();
    }

    OutputDisplay.prototype = {

        render: function () {
            var gutterMarkup = [],
                outputMarkup = [],
                foldNo = 0,
                i = 0,
                len = this.values.length;

            while (i < len) {
                var isCollapsed = this.isRowCollapsed(i);
                extend(outputMarkup, '<div class="line',
                    (isCollapsed ? ' collapsed' : ''), '">', this.values[i],
                    '</div>');
                extend(gutterMarkup, '<div',
                    (isCollapsed ? ' class=collapsed' : ''), '>', i + 1,
                    '</div>');
                ++i;
            }

            this.container.innerHTML =
                '<div class=gutter>' + gutterMarkup.join('') + '</div>' +
                '<div class=output>' + outputMarkup.join('') + '</div>';
        },

        setValues: function (values) {
            this.values = values;
            this.render();
        },

        setFolds: function (folds) {
            this.folds = folds;
            this.render();
        },

        isRowCollapsed: function (rowNo) {
            for (var i = this.folds.length - 1; i >= 0; i--) {
                var fold = this.folds[i];
                if (fold.start.row < rowNo && rowNo <= fold.end.row)
                    return true;
            }
            return false;
        },

        hiLine: function (lineNo) {
            var current = this.container.querySelector('.line.current');
            if (current) current.classList.remove('current');
            this.container.querySelectorAll('.line')[lineNo - 1]
                .classList.add('current');
        }

    };

    function setupEditor() {
        inEditor = ace.edit('input-editor');
        inEditor.setShowPrintMargin(false);

        outDisplay = new OutputDisplay('output-display');

        // Hide the editor's builtin scrollbar.
        inEditor.renderer.scrollBar.element.style.display = 'none';

        // Remove the small gap at the right edge, reserved for the vertical
        // scrollbar.
        inEditor.renderer.scrollBar.width = 0;

        inEditor.session.setMode('lang/ace-mode-js');
        // inSession.setUseWorker(true);
    }

    function recalculate() {
        var code = inEditor.getValue();
        if (recalculate.last === code) return;

        var lang = new Lang(), results;

        try {
            results = lang.calc(code);
        } catch (e) {
            if (e instanceof lang.parser.SyntaxError) {
                console.error(e);
                results = null;
            } else throw e;
        }

        if (results !== null)
            outDisplay.setValues(results);

        recalculate.last = code;
    }

    function resizeEditors() {
        var height = inEditor.session.getScreenLength() *
            inEditor.renderer.lineHeight +
            inEditor.renderer.scrollBar.getWidth();
        inEditor.container.style.minHeight = height + 'px';
        inEditor.resize();
        outDisplay.container.style.minHeight = height + 'px';
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
            outDisplay.hiLine(inEditor.selection.getCursor().row + 1);
        });

        inEditor.session.on('changeFold', function () {
            outDisplay.setFolds(inEditor.session.getAllFolds());
        });

        inEditor.setValue([
            'a = 2',
            'a',
            'sin(PI/4) * sqrt(a) + 42 ;:',
            '3',
            ''
        ].join('\n'));
        inEditor.clearSelection();
        inEditor.focus();
    }

    main();
}());
