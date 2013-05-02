// Lang testing helper function.
Lang.prototype.expect = function (input) {
    return expect(this.calc(input));
};

describe("Silly language", function () {

    var lang = new Lang();

    it("nulls on empty input", function () {
        lang.expect('').toBe('');
    });

    it("has comments marked by semicolon", function () {
        lang.expect(';').toBe('');
        lang.expect('; holly ho!').toBe('');
    });

    describe("reads numbers like", function () {

        it("integers", function () {
            lang.expect('42').toBe(42);
            lang.expect('042').toBe(42);
        });

        it("decimals", function () {
            lang.expect('42.2').toBe(42.2);
            lang.expect('42.200').toBe(42.2);
            lang.expect('0.05').toBe(0.05);
            lang.expect('00.5').toBe(0.5);
            lang.expect('.5').toBe(0.5);
            lang.expect('.500').toBe(0.5);
        });

        it("hex numbers", function () {
            lang.expect('0x1').toBe(1);
            lang.expect('0xB').toBe(11);
            lang.expect('0x10').toBe(16);
        });

        it("oct numbers", function () {
            lang.expect('0o1').toBe(1);
            lang.expect('0o7').toBe(7);
            lang.expect('0o10').toBe(8);
        });

    });

    describe("does mathematical", function () {

        it("addition", function () {
            lang.expect('2 + 3').toBe(5);
            lang.expect('2 + 3 + 4').toBe(9);
        });

        it("subtraction", function () {
            lang.expect('5 - 2').toBe(3);
            lang.expect('5 - 1 - 2').toBe(2);
        });

        it("negation", function () {
            lang.expect('-10').toBe(-10);
            lang.expect('-0xA').toBe(-10);
        });

        it("multiplication", function () {
            lang.expect('3 * 2').toBe(6);
            lang.expect('3 * 2 * 2').toBe(12);
        });

        it("division", function () {
            lang.expect('4 / 2').toBe(2);
            lang.expect('1 / 2').toBe(0.5);
            lang.expect('12 / 2 / 3').toBe(2);
        });

        it("power function", function () {
            lang.expect('2 ^ 3').toBe(8);
            lang.expect('2 ^ 3 ^ 2').toBe(512);
        });

    });

    describe("handles precedence as:", function () {

        it("addition = subtraction", function () {
            lang.expect('2 + 3 - 4').toBe(1);
            lang.expect('2 - 3 + 4').toBe(3);
        });

        it("multiplication = division", function () {
            // This works as expected because `/` is left associative.
            lang.expect('3 / 4 * 2').toBe(1.5);
            lang.expect('2 * 3 / 4').toBe(1.5);
        });

        it("multiplication > subtraction", function () {
            lang.expect('5 - 2 * 2').toBe(1);
            lang.expect('5 * 2 - 2').toBe(8);
        });

        it("division > addition", function () {
            lang.expect('2 + 3 / 4').toBe(2.75);
            lang.expect('3 / 4 + 2').toBe(2.75);
        });

        it("division > subtraction", function () {
            lang.expect('5 - 3 / 4').toBe(4.25);
            lang.expect('5 / 2 - 2').toBe(0.5);
        });

        it("power > anything else", function () {
            lang.expect('2 ^ 3 + 1').toBe(9);
            lang.expect('1 + 3 ^ 2').toBe(10);
            lang.expect('2 ^ 3 * 2').toBe(16);
            lang.expect('2 * 3 ^ 2').toBe(18);
        });

    });

    describe("parentheses can", function () {

        it("override precedence rules", function () {
            lang.expect('2 * (3 + 4)').toBe(14);
            lang.expect('6 / (3 * 4)').toBe(0.5);
        });

        it("nest arbitrarily deep", function () {
            lang.expect('(2) * ((3 + 5) / (6 - 2))').toBe(4);
        });

        it("implicitly close at end", function () {
            lang.expect('(2) * ((3 + 5) / (6 - 2').toBe(4);
        });

    });

    describe("manages state", function () {

        var lang = new Lang();

        it("assigning variables", function () {
            lang.expect('a = 1').toBe(1);
            lang.expect('b = 2 + 3').toBe(5);
            lang.expect('c = (2 + 3) * 4').toBe(20);
        });

        it("retrieving values of variables", function () {
            lang.expect('a').toBe(1);
            lang.expect('b').toBe(5);
            lang.expect('c').toBe(20);
        });

    });

    describe("functions", function () {

        it("can take arguments", function () {
            lang.expect('sin(3.14)').toBe(Math.sin(3.14));
        });

        it("are atoms", function () {
            lang.expect('cos(3.14) * sin(0)').toBe(0);
            lang.expect('cos(sin(0))').toBe(1);
        });

    });

});

// vim: se fdm=indent :
