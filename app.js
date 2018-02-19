let inEditor, outDisplay;
const dirtyIndicator = document.getElementById('dirty-indicator');

let currentFile = null;

class Bus {
    constructor() {
        this.callbacks = new Map();
    }

    on(name, fn) {
        if (!this.callbacks.has(name))
            this.callbacks.set(name, []);
        this.callbacks.get(name).push(fn);
    }

    fire(name, ...data) {
        const fns = this.callbacks.get(name);
        if (fns)
            for (let fn of fns)
                fn(...data);
    }
}

class OutputDisplay {

    constructor(aceEditor, elementId) {
        this.aceEditor = aceEditor;
        this.container = document.getElementById(elementId);
        this.values = [];
        this.folds = [];
        this.currentLine = 1;
        this.render();

        aceEditor.selection.on('changeCursor', () => {
            this.currentLine = aceEditor.selection.getCursor().row + 1;
        });

        aceEditor.session.on('changeFold', () => {
            this.folds = aceEditor.session.getAllFolds();
        });
    }

    render() {
        const gutterMarkup = [],
            outputMarkup = [],
            len = this.values.length,
            annotations = [];

        let i = 0;

        while (i < len) {
            let val;
            const result = this.values[i];

            if (!result.ok) {
                val = result.error && !(result.error instanceof SyntaxError) ? result.error.message : '';

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
                let cls = ' current';
                outputMarkup.push(cls);
                gutterMarkup.push(cls);
            }

            if (this.isRowCollapsed(i)) {
                let cls = ' collapsed';
                outputMarkup.push(cls);
                gutterMarkup.push(cls);
            }

            if (result.annotation) {
                annotations.push(result.annotation);
                let cls = ' annotation-' + result.annotation.type;
                outputMarkup.push(cls);
                gutterMarkup.push(cls);
            }

            outputMarkup.push('">' + val + '</div>');
            gutterMarkup.push('">' + (i + 1) + '</div>');

            ++i;
        }

        this.container.innerHTML =
            '<div class=gutter>' + gutterMarkup.join('') + '</div>' +
            '<div class=output>' + outputMarkup.join('') + '</div>';

        this.aceEditor.session.setAnnotations(annotations);
    }

    get values() {
        return this._values;
    }

    set values(values) {
        this._values = values;
        this.render();
    }

    get folds() {
        return this._folds;
    }

    set folds(folds) {
        this._folds = folds;
        this.render();
    }

    get currentLine() {
        return this._currentLine;
    }

    set currentLine(lineNo) {
        if (this.currentLine === lineNo) return;
        this._currentLine = lineNo;
        this.render();
    }

    isRowCollapsed(rowNo) {
        for (let i = this.folds.length; i--;) {
            const fold = this.folds[i];
            if (fold.start.row < rowNo && rowNo <= fold.end.row)
                return true;
        }
        return false;
    }

}

function setupEditor() {
    inEditor = ace.edit('input-editor');
    inEditor.setShowPrintMargin(false);

    // Hide the editor's builtin scrollbar.
    inEditor.renderer.scrollBar.element.style.display = 'none';
    inEditor.renderer.scrollBar.width = 0;

    inEditor.session.setMode('lang/ace-mode-js');
    // inSession.setUseWorker(true);

    outDisplay = new OutputDisplay(inEditor, 'output-display');
}

function recalculate() {
    const code = inEditor.getValue();
    if (recalculate.__last === code) return;
    outDisplay.values = evalCode(code);
    recalculate.__last = code;
}

function evalCode(input) {
    const lines = input.split('\n'),
        results = [],
        parser = math.parser(),
        len = lines.length;

    let currentHeader = null, i = 0;

    while (i < len) {
        const src = lines[i++], res = {ok: true, lineNo: i, src: src};
        results.push(res);

        if (src[0] === '@') {
            const parts = src.substr(1).split('='), conf = {};
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
            res.annotation = {
                row: i - 1,
                column: 0,
                text: e.message,
                type: 'error'
            };
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
    const height = inEditor.session.getScreenLength() *
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

const updateSheet = (function () {
    // `lastChangeAt` is `null` when input is not dirty, and the time of
    // last change, when input is dirty.
    let lastChangeAt = 0;

    setInterval(function () {
        if (lastChangeAt === null || Date.now() - lastChangeAt < 150)
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
    const triggers = document.querySelector('nav').getElementsByTagName('button');
    let openedPopup = null;

    for (let i = triggers.length; i-- > 0;)
        triggers[i].addEventListener('click', openPopup);

    function openPopup(e) {
        const popupId = e.currentTarget.dataset.popup;
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
    const openListing = document.getElementById('open-listing');
    updateListing();

    openListing.addEventListener('click', function (event) {
        if (event.target.tagName !== 'A')
            return;
        event.preventDefault();
        const name = event.target.innerText;
        loadFile(name);
    });

    document.getElementById('new-sheet-form').addEventListener('submit', function (event) {
        event.preventDefault();
        loadFile(event.target.sheetName.value);
        updateListing();
    });

    function updateListing() {
        const files = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.substr(0, 4) === 'src:')
                files.push(key.substr(4));
        }
        files.sort();

        openListing.innerHTML = '';
        for (let i = 0; i < files.length; ++i) {
            openListing.innerHTML += '<li><a href="#"' + (files[i] === currentFile.name ? ' class=active' : '') +
                '>' + files[i] + '</a>';
        }
    }
}

function initSettings() {
    const settingsElem = document.getElementById('settings'),
        inputs = settingsElem.querySelectorAll('input[name], select');

    for (let i = inputs.length; i-- > 0;) {
        const input = inputs[i],
            key = input.dataset.keyName = 'conf' + titleCase(input.name);
        if (localStorage.hasOwnProperty(key))
            input.value = localStorage[key];
        else
            localStorage.setItem(key, input.value);
    }

    settingsElem.addEventListener('change', function (e) {
        localStorage.setItem(e.target.dataset.keyName, e.target.value);
        const event = new CustomEvent('conf-change', {
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
    math.config({
        number: 'BigNumber',
        precision: 15
    });

    setupEditor();
    setupPopups();

    inEditor.on('change', updateSheet);

    loadFile('default');
    setupFiles();

    window.addEventListener('storage', () => {
        loadFile(currentFile.name);
    });

    initSettings();
    document.addEventListener('conf-change', function (e) {
        const name = e.detail.name;
        if (name === 'fix') {
            outDisplay.render();
        }
    });

    inEditor.clearSelection();
    inEditor.focus();
}

main();
