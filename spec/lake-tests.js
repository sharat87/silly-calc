// Lake testing helper function.
Lake.prototype.expect = function (input) {
    return expect(this.evaluate(input));
};

describe("Lake language", function () {

    var lake = new Lake();

    it("reads numbers", function () {
        lake.expect('1').toBe(1);
    });

    describe("does mathematical", function () {

        it("addition", function () {
            lake.expect('2 + 3').toBe(5);
            lake.expect('2 + 3 + 4').toBe(9);
        });

        it("subtraction", function () {
            lake.expect('5 - 2').toBe(3);
            lake.expect('5 - 1 - 2').toBe(2);
        });

        it("multiplication", function () {
            lake.expect('3 * 2').toBe(6);
            lake.expect('3 * 2 * 2').toBe(12);
        });

        it("division", function () {
            lake.expect('4 / 2').toBe(2);
            lake.expect('1 / 2').toBe(0.5);
            lake.expect('12 / 2 / 3').toBe(2);
        });

        it("power function", function () {
            lake.expect('2 ^ 3').toBe(8);
            lake.expect('2 ^ 3 ^ 2').toBe(512);
        });

    });

    describe("handles precedence as:", function () {

        it("addition = subtraction", function () {
            lake.expect('2 + 3 - 4').toBe(1);
            lake.expect('2 - 3 + 4').toBe(3);
        });

        it("multiplication = division", function () {
            // This works as expected because `/` is left associative.
            lake.expect('3 / 4 * 2').toBe(1.5);
            lake.expect('2 * 3 / 4').toBe(1.5);
        });

        it("multiplication > subtraction", function () {
            lake.expect('5 - 2 * 2').toBe(1);
            lake.expect('5 * 2 - 2').toBe(8);
        });

        it("division > addition", function () {
            lake.expect('2 + 3 / 4').toBe(2.75);
            lake.expect('3 / 4 + 2').toBe(2.75);
        });

        it("division > subtraction", function () {
            lake.expect('5 - 3 / 4').toBe(4.25);
            lake.expect('5 / 2 - 2').toBe(0.5);
        });

        it("power > anything else", function () {
            lake.expect('2 ^ 3 + 1').toBe(9);
            lake.expect('1 + 3 ^ 2').toBe(10);
            lake.expect('2 ^ 3 * 2').toBe(16);
            lake.expect('2 * 3 ^ 2').toBe(18);
        });

    });

    describe("parentheses can", function () {

        it("override precedence rules", function () {
            lake.expect('2 * (3 + 4)').toBe(14);
            lake.expect('6 / (3 * 4)').toBe(0.5);
        });

        it("nest arbitrarily deep", function () {
            lake.expect('(2) * ((3 + 5) / (6 - 2))').toBe(4);
        });

        it("implicitly close at end", function () {
            lake.expect('(2) * ((3 + 5) / (6 - 2').toBe(4);
        });

    });

    describe("manages state", function () {

        var lake = new Lake();

        it("assigning variables", function () {
            lake.expect('a = 1').toBe(1);
            lake.expect('b = 2 + 3').toBe(5);
            lake.expect('c = (2 + 3) * 4').toBe(20);
        });

        it("retrieving values of variables", function () {
            lake.expect('a').toBe(1);
            lake.expect('b').toBe(5);
            lake.expect('c').toBe(20);
        });

    });

});
