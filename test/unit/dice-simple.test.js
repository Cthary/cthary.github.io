import { test, describe } from "node:test";
import { strict as assert } from "assert";
import { Dice } from "../../src/scripts/dice.js";

describe("Dice Class", () => {
    let dice;

    test("should create a new Dice instance", () => {
        dice = new Dice();
        assert.ok(dice instanceof Dice);
    });

    test("should roll a number between 1 and 6", () => {
        dice = new Dice();

        // Test multiple rolls to ensure they're all valid
        for (let i = 0; i < 10; i++) {
            const result = dice.roll();
            assert.ok(result >= 1 && result <= 6, `Roll result ${result} should be between 1 and 6`);
            assert.ok(Number.isInteger(result), `Roll result ${result} should be an integer`);
        }
    });

    test("should parse simple dice expressions", () => {
        dice = new Dice();

        // Test various expressions
        const testCases = [
            { input: "1", expected: 1 },
            { input: "6", expected: 6 },
            { input: "10", expected: 10 }
        ];

        testCases.forEach(({ input, expected }) => {
            const result = dice.parseAndRoll(input);
            assert.strictEqual(result, expected, `parseAndRoll('${input}') should return ${expected}`);
        });
    });

    test("should parse and roll D6 expressions", () => {
        dice = new Dice();

        // Test that D6 expressions return valid results
        const result1 = dice.parseAndRoll("D6");
        const result2 = dice.parseAndRoll("d6");
        const result3 = dice.parseAndRoll("1D6");

        assert.ok(result1 >= 1 && result1 <= 6, "D6 should return 1-6");
        assert.ok(result2 >= 1 && result2 <= 6, "d6 should return 1-6");
        assert.ok(result3 >= 1 && result3 <= 6, "1D6 should return 1-6");
    });

    test("should parse and roll D3 expressions", () => {
        dice = new Dice();

        const result1 = dice.parseAndRoll("D3");
        const result2 = dice.parseAndRoll("d3");
        const result3 = dice.parseAndRoll("1D3");

        assert.ok(result1 >= 1 && result1 <= 3, "D3 should return 1-3");
        assert.ok(result2 >= 1 && result2 <= 3, "d3 should return 1-3");
        assert.ok(result3 >= 1 && result3 <= 3, "1D3 should return 1-3");
    });

    test("should parse multiple dice expressions", () => {
        dice = new Dice();

        const result1 = dice.parseAndRoll("2D6");
        const result2 = dice.parseAndRoll("3D3");

        assert.ok(result1 >= 2 && result1 <= 12, "2D6 should return 2-12");
        assert.ok(result2 >= 3 && result2 <= 9, "3D3 should return 3-9");
    });

    test("should parse expressions with modifiers", () => {
        dice = new Dice();

        // Test expressions with fixed dice values
        const result1 = dice.parseAndRoll("6+2"); // 6 + 2 = 8
        const result2 = dice.parseAndRoll("6-1"); // 6 - 1 = 5

        assert.strictEqual(result1, 8, "6+2 should return 8");
        assert.strictEqual(result2, 5, "6-1 should return 5");
    });

    test("should handle complex expressions", () => {
        dice = new Dice();

        // Test that complex expressions return reasonable values
        const result1 = dice.parseAndRoll("2D6+1");
        assert.ok(result1 >= 3 && result1 <= 13, "2D6+1 should return 3-13");

        // Complex multi-dice expressions like "D3+D6-2" are not supported yet
        const result2 = dice.parseAndRoll("D3+D6-2");
        assert.strictEqual(result2, 0, "Unsupported expressions should return 0");
    });

    test("should handle edge cases", () => {
        dice = new Dice();

        // Empty string
        assert.strictEqual(dice.parseAndRoll(""), 0);

        // Null/Undefined
        assert.strictEqual(dice.parseAndRoll(null), 0);
        assert.strictEqual(dice.parseAndRoll(undefined), 0);

        // Just modifiers
        assert.strictEqual(dice.parseAndRoll("+5"), 5);
        assert.strictEqual(dice.parseAndRoll("-3"), -3);
    });

    test("should handle deterministic D6 patterns", () => {
        dice = new Dice();

        // Test that D6 expressions consistently return valid values
        for (let i = 0; i < 10; i++) {
            const result = dice.parseAndRoll("D6");
            assert.ok(result >= 1 && result <= 6, `D6 should return 1-6, got ${result}`);
        }
    });

    test("should handle sustained hits parsing", () => {
        dice = new Dice();

        // Test that these expressions work without errors
        assert.strictEqual(dice.parseAndRoll("1"), 1);

        const d3Result = dice.parseAndRoll("D3");
        assert.ok(d3Result >= 1 && d3Result <= 3, "D3 should return 1-3");

        const d6Result = dice.parseAndRoll("D6");
        assert.ok(d6Result >= 1 && d6Result <= 6, "D6 should return 1-6");
    });
});
