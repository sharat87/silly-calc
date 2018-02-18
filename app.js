(function () {
    var inEditor, outDisplay,
        dirtyIndicator = document.getElementById('dirty-indicator');

    var currentFile = null;

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
                var val, result = this.values[i];

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
                    val = result.value ? result.value.toLocaleString() : '';

                }

                outputMarkup.push('<div class="line');
                gutterMarkup.push('<div class="');

                if (this.currentLine === i + 1) {
                    outputMarkup.push(' current');
                    gutterMarkup.push(' current');
                }

                if (this.isRowCollapsed(i)) {
                    outputMarkup.push(' collapsed');
                    gutterMarkup.push(' collapsed');
                }

                outputMarkup.push('">' + val + '</div>');
                gutterMarkup.push('">' + (i + 1) + '</div>');

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
            for (var i = this.folds.length; i--;) {
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

            if (src[0] === '@') {
                var parts = src.substr(1).split('='), conf = {};
                if (parts.length < 2)
                    continue;
                conf[parts[0].trim()] = parts[1].trim();
                console.debug('Setting config', conf);
                // FIXME: Options can only be set globally. They need to be reset after this `@` line is removed.
                math.config(conf);
                continue;
            }

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
        localStorage.setItem('src:' + currentFile.name, inEditor.getValue());
    }

    function loadFile(name) {
        currentFile = {name: name};
        if (!localStorage['src:' + name])
            localStorage.setItem('src:' + name,
                'a = 3\n'
                + 'a ^ 2\n'
                + '\n'
                + 'Using functions and line references:\n'
                + 'sin(PI/4) * sqrt(a) + 41\n'
                + 'ans + 10\n');
        inEditor.setValue(localStorage['src:' + name]);
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
        var triggers = document.querySelector('nav').querySelectorAll('[popup]'),
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

    function setupFiles() {
        var openListing = document.getElementById('open-listing');
        updateListing();

        openListing.addEventListener('click', function (event) {
            if (event.target.tagName !== 'A')
                return;
            event.preventDefault();
            var name = event.target.innerText;
            loadFile(name);
        });

        document.getElementById('new-sheet-form').addEventListener('submit', function (event) {
            event.preventDefault();
            loadFile(event.target.sheetName.value);
            updateListing();
        });

        function updateListing() {
            var files = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key.substr(0, 4) === 'src:')
                    files.push(key.substr(4));
            }
            files.sort();

            openListing.innerHTML = '';
            for (i = 0; i < files.length; ++i) {
                openListing.innerHTML += '<li><a href="#"' + (files[i] === currentFile.name ? ' class=active' : '') +
                    '>' + files[i] + '</a>';
            }
        }
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

        loadFile('default');
        setupFiles();

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
