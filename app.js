(function () {
    var codeInput = document.getElementById('code-input'),
        resultsPanel = document.getElementById('results-panel');

    var updateResults = function () {
        var lines = codeInput.value.split('\n'),
            evaluator = new TapDigit.Evaluator(),
            htmls = [];

        for (var i = 0, len = lines.length; i < len; i++) {
            var code = 'L' + (i + 1) + ' = ' + lines[i],
                result = evaluator.evaluate(code);
            htmls.splice(htmls.length, 0,
                         '<div class=result>', result, '</div>');
        }

        resultsPanel.innerHTML = htmls.join('');
    };

    codeInput.addEventListener('keydown', function () {
        setTimeout(updateResults, 0);
    });
    codeInput.addEventListener('change', updateResults);

    codeInput.value = [
        'a = 2',
        'a',
        'sin(pi/4) * sqrt(a) + 42',
        'L3'
    ].join('\n');

    updateResults();

}());
