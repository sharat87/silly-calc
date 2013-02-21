(function () {
    var codeInput = document.getElementById('code-input'),
        resultsPanel = document.getElementById('results-panel'),
        gutter = document.getElementById('gutter');

    function updateSheet() {

        var lines = codeInput.value.split('\n'),
            evaluator = new TapDigit.Evaluator(),
            resultHtmls = [],
            gutterHtmls = [];

        for (var i = 0, len = lines.length; i < len; ++i) {
            var line = lines[i],
                varname = 'L' + (i + 1),
                code = varname + ' = ' + line,
                result = line ? evaluator.evaluate(code) : '-';
            resultHtmls.splice(resultHtmls.length, 0,
                '<div class=result data-label="', varname, ': ">', result,
                '</div>');
            gutterHtmls.splice(gutterHtmls.length, 0,
                '<div>', varname, ': ', '</div>');
        }

        resultsPanel.innerHTML = resultHtmls.join('');
        gutter.innerHTML = gutterHtmls.join('');
    }

    codeInput.addEventListener('keydown', function () {
        setTimeout(updateSheet, 0);
    });
    codeInput.addEventListener('change', updateSheet);

    codeInput.value = [
        'a = 2',
        'a',
        'sin(pi/4) * sqrt(a) + 42',
        'L3'
    ].join('\n');

    updateSheet();

}());
