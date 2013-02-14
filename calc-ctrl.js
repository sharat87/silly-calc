var app = angular.module('CalcApp', []);

function CalcCtrl($scope) {

    $scope.code = [
        'a = 2',
        'a',
        'sin(pi/4) * sqrt(a) + 42'
    ].join('\n');

    $scope.results = function () {
        var lines = $scope.code.split('\n'),
            evaluator = new TapDigit.Evaluator(),
            results = [];
        for (var i = 0; i < lines.length; i++) {
            results.push(evaluator.evaluate(lines[i]));
        }
        return results;
    };

}
