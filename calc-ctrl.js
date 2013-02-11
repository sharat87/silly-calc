var app = angular.module('CalcApp', []);

// Apply given piece of code (as attribute) when the enter keyup event is
// triggered.
var eventHandlerDirective = function () {
    return function (scope, elem, attrs) {
        elem.on('keydown', function (e) {
            if (e.which === 13 && attrs.onEnterKey)
                scope.$apply(attrs.onEnterKey);
            if (e.which === 8 && attrs.onBackspaceKey)
                scope.$apply(attrs.onBackspaceKey);
            console.info('keydown', e.which, e);
        });
    };
};

app.directive('onEnterKey', eventHandlerDirective);
app.directive('onBackspaceKey', eventHandlerDirective);

// Handling up/down keys to move focus up and down within the inputs.
app.directive('focusIter', function () {

    return function (scope, elem, attrs) {
        var atomSelector = attrs.focusIter;

        elem.on('keydown', atomSelector, function (e) {
            var atoms = elem.find(atomSelector),
                toAtom = null;

            for (var i = atoms.length - 1; i >= 0; i--) {
                if (atoms[i] === e.target) {
                    if (e.which === 38) {
                        toAtom = atoms[i - 1];
                    } else if (e.which === 40) {
                        toAtom = atoms[i + 1];
                    }
                    break;
                }
            }

            if (toAtom) {
                e.preventDefault();
                toAtom.focus();
            }

        });

    };
});

// Elements with this attribute gain focus, on creation.
app.directive('initFocus', function () {
    return function (scope, elem, attrs) {
        elem[0].focus();
    };
});

function CalcCtrl($scope) {

    var lastEntryId = 0,
        evaluator = new TapDigit.Evaluator();

    $scope.evalEntry = function (entry) {
        if (!entry.code) return '';
        try {
            return evaluator.evaluate(entry.code);
        } catch (err) {
            return 'Error: ' + err.toString();
        }
    };

    $scope.insertAfter = function (entry) {
        var newEntry = {id: ++lastEntryId, code: ''};
        for (var i = $scope.entries.length - 1; i >= 0; i--) {
            if ($scope.entries[i].id == entry.id) break;
        }
        $scope.entries.splice(i + 1, 0, newEntry);
    };

    $scope.entries = [
        {id: ++lastEntryId, code: 'a = 2'},
        {id: ++lastEntryId, code: 'a'},
        {id: ++lastEntryId, code: 'sin(pi/4) * sqrt(2) + 42'}
    ];

}
