(function (e) {

    var codeInput = document.getElementById('source-input'),
        resultDisplay = document.getElementById('result-display'),
        lastParsedCode = null;

    function updateSheet() {
        var code = codeInput.value;

        if (code == lastParsedCode) return;

        resultDisplay.innerText = '???';

        try {
            result = new Lang().calc(code);
        } catch (err) {
            resultDisplay.innerText = err.toString();
            console.error(err);
            return;
        }

        resultDisplay.innerText = JSON.stringify(result);
        lastParsedCode = code;
    }

    codeInput.addEventListener('change', updateSheet);
    codeInput.addEventListener('click', updateSheet);
    codeInput.addEventListener('keydown', function () {
        setTimeout(updateSheet, 0);
    });
    updateSheet();

}());
