(function () {
    var codeInput = document.getElementById('code-input'),
        resultsPanel = document.getElementById('results-panel'),
        gutter = document.getElementById('gutter'),
        lastEvaledCode = null;

    function updateSheet() {
        if (lastEvaledCode === codeInput.value) return;
        lastEvaledCode = codeInput.value;

        var lines = codeInput.value.split('\n'),
            // evaluator = new TapDigit.Evaluator(),
            evaluator = new Lake(),
            resultHtmls = [],
            gutterHtmls = [];

        for (var i = 0, len = lines.length; i < len; ++i) {
            var line = lines[i],
                varname = 'L' + (i + 1),
                result = line ? evaluator.evaluate(line) : '';

            resultHtmls.splice(resultHtmls.length, 0,
                '<div class=result data-label="', varname, ': ">', result,
                '</div>');
            gutterHtmls.splice(gutterHtmls.length, 0,
                '<div>', varname, ': ', '</div>');

            if (result)
                evaluator.evaluate(varname + ' = ' + result);
        }

        resultsPanel.innerHTML = resultHtmls.join('');
        gutter.innerHTML = gutterHtmls.join('');
    }

    codeInput.addEventListener('change', updateSheet);
    codeInput.addEventListener('click', updateSheet);

    codeInput.addEventListener('keydown', function (e) {

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

    });

    codeInput.value = [
        'a = 2',
        'a',
        'sin(PI/4) * sqrt(a) + 42',
        'L3'
    ].join('\n');

    updateSheet();

}());
