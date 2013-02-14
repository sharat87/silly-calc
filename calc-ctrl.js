var app = angular.module('CalcApp', []);

function CalcCtrl($scope) {

    $scope.code = [
        'a = 2',
        'a',
        'sin(pi/4) * sqrt(a) + 42',
        'L3'
    ].join('\n');

    $scope.results = function () {
        var lines = $scope.code.split('\n'),
            evaluator = new TapDigit.Evaluator(),
            results = [];
        for (var i = 0, len = lines.length; i < len; i++) {
            var code = 'L' + (i + 1) + ' = ' + lines[i];
            results.push(evaluator.evaluate(code));
        }
        return results;
    };

}
