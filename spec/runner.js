(function () {
    var jasmineEnv = jasmine.getEnv(),
        htmlReporter = new jasmine.HtmlReporter();
    jasmineEnv.updateInterval = 1000;
    jasmineEnv.addReporter(htmlReporter);
    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };
    window.onload = function () { jasmineEnv.execute(); };
}());
