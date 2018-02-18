(function () {
    /*jshint browser:true */
    /*global evalCode ace CustomEvent */
    "use strict";

    var inEditor, outDisplay,
        dirtyIndicator = document.getElementById('dirty-indicator');

    function extend(array) {
        var args = array.slice.call(arguments, 1);
        args.splice(0, 0, array.length, 0);
        array.splice.apply(array, args);
    }

    function OutputDisplay(elementId) {
        this.container = document.getElementById(elementId);
        this.values = [];
        this.folds = [];
        this.currentLine = 1;
        this.render();
    }

    OutputDisplay.prototype = {

        render: function () {
            var gutterMarkup = [],
                outputMarkup = [],
                i = 0,
                len = this.values.length,
                annotations = [];

            inEditor.session.clearAnnotations();

            while (i < len) {
                var result = this.values[i],
                    val = result,
                    isCollapsed = this.isRowCollapsed(i),
                    isCurrent = this.currentLine === i + 1;

                if (!result.ok) {
                    val = result.error && !(result.error instanceof SyntaxError) ? result.error.message : '';
                    annotations.push({
                        row: result.error.line - 1,
                        column: result.error.column - 1,
                        text: result.error.message,
                        type: 'error',
                        raw: result
                    });

                } else if (result.value instanceof Function) {
                    val = '[Function ' + result.value.name + ']';

                } else {
                    // See http://stackoverflow.com/a/2901298/151048
                    // result.value.toFixed(localStorage.confFix).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    val = result.value && result.value.toLocaleString();

                }

                extend(outputMarkup, '<div class="line',
                    (isCurrent ? ' current' : ''),
                    (isCollapsed ? ' collapsed' : ''), '">', val, '</div>');
                extend(gutterMarkup, '<div class="',
                    (isCurrent ? ' current' : ''),
                    (isCollapsed ? ' collapsed' : ''), '">', i + 1,
                    '</div>');

                ++i;
            }

            this.container.innerHTML =
                '<div class=gutter>' + gutterMarkup.join('') + '</div>' +
                '<div class=output>' + outputMarkup.join('') + '</div>';

            inEditor.session.setAnnotations(annotations);
        },

        setValues: function (values) {
            this.values = values;
            this.render();
        },

        setFolds: function (folds) {
            this.folds = folds;
            this.render();
        },

        setCurrentLine: function (lineNo) {
            if (this.currentLine === lineNo) return;
            this.currentLine = lineNo;
            this.render();
        },

        isRowCollapsed: function (rowNo) {
            for (var i = this.folds.length - 1; i >= 0; i--) {
                var fold = this.folds[i];
                if (fold.start.row < rowNo && rowNo <= fold.end.row)
                    return true;
            }
            return false;
        }

    };

    function setupEditor() {
        inEditor = ace.edit('input-editor');
        inEditor.setShowPrintMargin(false);

        outDisplay = new OutputDisplay('output-display');

        // Hide the editor's builtin scrollbar.
        inEditor.renderer.scrollBar.element.style.display = 'none';
        inEditor.renderer.scrollBar.width = 0;

        inEditor.session.setMode('lang/ace-mode-js');
        // inSession.setUseWorker(true);
    }

    function recalculate() {
        var code = inEditor.getValue();
        if (recalculate.__last === code) return;
        outDisplay.setValues(evalCode(code));
        recalculate.__last = code;
    }

    function evalCode(input) {
        var lines = input.split('\n'),
            results = [],
            parser = math.parser(),
            currentHeader = null,
            i = 0,
            len = lines.length;

        while (i < len) {
            var src = lines[i++], res = {ok: true, lineNo: i, src: src};
            results.push(res);

            if (src[src.length - 1] === ':') {
                updateCurrentHeader();
                currentHeader = res;
                continue;
            }

            try {
                res.value = parser.eval(src);
            } catch (e) {
                res.ok = false;
                res.error = e;
            }

            if (res.value)
                parser.set('ans', res.value);
        }

        updateCurrentHeader();
        console.debug(results);
        return results;

        function updateCurrentHeader() {
            if (currentHeader)
                currentHeader.value = parser.get('ans');
        }
    }

    function resizeEditor() {
        var height = inEditor.session.getScreenLength() *
            inEditor.renderer.lineHeight +
            inEditor.renderer.scrollBar.getWidth();
        inEditor.container.style.minHeight = height + 'px';
        inEditor.resize();
        outDisplay.container.style.minHeight = height + 'px';
    }

    function save() {
        localStorage.input = inEditor.getValue();
    }

    var updateSheet = (function () {
        // `lastChangeAt` is `null` when input is not dirty, and the time of
        // last change, when input is dirty.
        var lastChangeAt = 0;

        setInterval(function () {
            if (window.math === null || lastChangeAt === null || Date.now() - lastChangeAt < 150)
                return;
            lastChangeAt = null;
            recalculate();
            save();
            dirtyIndicator.classList.remove('dirty');
        }, 100);

        return function updateSheet() {
            resizeEditor();
            lastChangeAt = Date.now();
            dirtyIndicator.classList.add('dirty');
        };
    }());

    function setupPopups() {
        var triggers = document.getElementById('topbar').querySelectorAll('[popup]'),
            openedPopup = null;

        for (var i = triggers.length; i-- > 0;)
            triggers[i].addEventListener('click', openPopup);

        function openPopup(e) {
            var popupId = e.currentTarget.getAttribute('popup');
            if (openedPopup && openedPopup.id === popupId) {
                closePopup();
            } else {
                closePopup();
                openedPopup = document.getElementById(popupId);
                openedPopup.classList.add('open');
            }
        }

        function closePopup() {
            if (openedPopup)
                openedPopup.classList.remove('open');
            openedPopup = null;
        }

        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('popup-close'))
                closePopup();
        });

        document.addEventListener('keydown', function (e) {
            if (e.which === 27) // ESC key
                closePopup();
        });
    }

    function initSettings() {
        var settingsElem = document.getElementById('settings'),
            inputs = settingsElem.querySelectorAll('input[name], select');

        for (var i = inputs.length; i-- > 0;) {
            var input = inputs[i],
                key = input.dataset.keyName = 'conf' + titleCase(input.name);
            if (localStorage.hasOwnProperty(key))
                input.value = localStorage[key];
            else
                localStorage.setItem(key, input.value);
        }

        settingsElem.addEventListener('change', function (e) {
            localStorage.setItem(e.target.dataset.keyName, e.target.value);
            var event = new CustomEvent('conf-change', {
                detail: {
                    name: e.target.name,
                    key: e.target.dataset.keyName,
                    value: e.target.value,
                    input: e.target
                }
            });
            document.dispatchEvent(event);
        });

        function titleCase(text) {
            return text.replace(/^./, function (m) {
                return m.toUpperCase();
            });
        }

    }

    function main() {
        setupEditor();
        setupPopups();

        inEditor.on('change', updateSheet);

        inEditor.selection.on('changeCursor', function () {
            outDisplay.setCurrentLine(inEditor.selection.getCursor().row + 1);
        });

        inEditor.session.on('changeFold', function () {
            outDisplay.setFolds(inEditor.session.getAllFolds());
        });

        inEditor.setValue(localStorage.input || (
            'a = 3\n'
            + 'a ^ 2\n'
            + '\n'
            + 'Using functions and line references:\n'
            + 'sin(PI/4) * sqrt(a) + 41\n'
            + 'ans + 10\n'
        ));

        window.addEventListener('storage', function () {
            inEditor.setValue(localStorage.input);
        });

        initSettings();
        document.addEventListener('conf-change', function (e) {
            var name = e.detail.name;
            if (name === 'fix') {
                outDisplay.render();
            }
        });

        inEditor.clearSelection();
        inEditor.focus();
    }

    main();
}());
