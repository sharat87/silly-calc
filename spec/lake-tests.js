// Lake testing helper function.
Lake.prototype.expect = function (input) {
    return expect(this.evaluate(input));
};

describe("Lake language", function () {

    var lake = new Lake();

    it("reads numbers", function () {
        lake.expect('1').toBe(1);
    });

    describe("does basic math operations:", function () {

        it("addition", function () {
            lake.expect('2 + 3').toBe(5);
            lake.expect('2 + 3 + 4').toBe(9);
        });

        it("subtraction", function () {
            lake.expect('5 - 2').toBe(3);
            // lake.expect('5 - 1 - 2').toBe(2);
        });

        it("multiplication", function () {
            lake.expect('3 * 2').toBe(6);
            lake.expect('3 * 2 * 2').toBe(12);
        });

        it("division", function () {
            lake.expect('4 / 2').toBe(2);
            lake.expect('1 / 2').toBe(0.5);
            // lake.expect('12 / 2 / 3').toBe(2);
        });

        it("power function", function () {
            lake.expect('2 ^ 3').toBe(8);
            lake.expect('2 ^ 3 ^ 2').toBe(512);
        });

    });

    describe("does precedence as:", function () {

        it("addition < multiplication", function () {
            lake.expect('2 + 3 * 4').toBe(14);
            // lake.expect('2 * 3 + 4').toBe(10);
        });

    });

});
