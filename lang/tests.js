var evaluator = new TapDigit.Evaluator(),
    equalExpectation = function (actual, expected) {
        return function () {
            expect(actual).toEqual(expected);
        };
    },
    assertAndPrint = function (tests) {
        for (var i = 0; i < tests.length; i++) {
            var expr = tests[i][0],
                actual = evaluator.evaluate(expr),
                expected = tests[i][1],
                msg = 'evals "' + expr +
                    '" to ' + actual + ' (is ' + expected + ')';
            it(msg, equalExpectation(actual, expected));
        }
    };

describe('Language test', function () {
    assertAndPrint([
        ['1-2', -1],
        // ['1%2', 1],
        // ['.02 * 10', 0.2],
        // ['-(2 * 10,00,000)', -2000000],
        // ['(1.2 + 2) * 3', (1.2 + 2) * 3],
        // ['x = 1', 1],
        // ['x = y = 1', 1],
        // ['x + 2', 3],
        // ['1+2', 3],
        // ['2^2*3', 12],
        // ['2*3', 6],
        // ['1+2*3', 7],
        // ['2*3+4*5', 26],
        // ['2*3*4', 24],
        // ['2^3', 8],
        // ['2^3*2', 16],
        // ['log(1)', 0],
        // ['log(2)', Math.log(2)],
        // ['exp(1)', Math.exp(1)],
        // ['10 + 2', 12],
        // ['3!', 6],
        // ['pi = 22 / 7', 22 / 7],
        // ['sin(90)', Math.sin(90)],
        // ['a = b = 1', 1],
        // ['2%', 0.02],
        // ['3%2%2', 1],
        // ['1+(2+3)', 6],
        ['(1+2)+3', 6]
    ]);
});

// console.log('☺ All good');
