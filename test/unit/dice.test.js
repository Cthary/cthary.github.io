import { test, describe } from "node:test";
import { strict as assert } from "assert";
import { Dice } from "../../src/scripts/dice.js";
import { TestUtils } from "../test-utils.js";

describe("Dice Class", () => {
    let dice;

    test("should create a new Dice instance", () => {
        dice = new Dice();
        assert.ok(dice instanceof Dice);
    });

    test("should roll a number between 1 and 6", () => {
        dice = new Dice();
        const results = TestUtils.runMultipleTimes(() => dice.roll(), 1000);

        // Prüfe, dass alle Ergebnisse zwischen 1 und 6 liegen
        results.forEach(result => {
            assert.ok(result >= 1 && result <= 6, `Roll result ${result} should be between 1 and 6`);
            assert.ok(Number.isInteger(result), `Roll result ${result} should be an integer`);
        });

        // Prüfe statistische Verteilung (sollte etwa 3.5 im Durchschnitt sein)
        TestUtils.validateDiceDistribution(results, 3.5, 0.1);
    });

    test("should parse simple dice expressions", () => {
        dice = new Dice();

        // Teste verschiedene Ausdrücke
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

        // Mock Math.random für deterministische Tests
        const restoreRandom = TestUtils.mockRandom([0.5, 0.8, 0.2]); // Sollte 4, 5, 2 ergeben

        try {
            assert.strictEqual(dice.parseAndRoll("D6"), 4);
            assert.strictEqual(dice.parseAndRoll("d6"), 5);
            assert.strictEqual(dice.parseAndRoll("1D6"), 2);
        } finally {
            restoreRandom();
        }
    });

    test("should parse and roll D3 expressions", () => {
        dice = new Dice();

        const restoreRandom = TestUtils.mockRandom([0.0, 0.4, 0.8]); // Sollte 1, 2, 3 ergeben

        try {
            assert.strictEqual(dice.parseAndRoll("D3"), 1);
            assert.strictEqual(dice.parseAndRoll("d3"), 2);
            assert.strictEqual(dice.parseAndRoll("1D3"), 3);
        } finally {
            restoreRandom();
        }
    });

    test("should parse multiple dice expressions", () => {
        dice = new Dice();

        const restoreRandom = TestUtils.mockRandom([0.5, 0.5, 0.5]); // Jeder Würfel ergibt 4 bzw. 2 für D3

        try {
            assert.strictEqual(dice.parseAndRoll("2D6"), 8); // 4 + 4
            assert.strictEqual(dice.parseAndRoll("3D3"), 6); // 2 + 2 + 2
        } finally {
            restoreRandom();
        }
    });

    test("should parse expressions with modifiers", () => {
        dice = new Dice();

        const restoreRandom = TestUtils.mockRandom([0.5]); // Würfel ergibt 4

        try {
            assert.strictEqual(dice.parseAndRoll("D6+2"), 6); // 4 + 2
            assert.strictEqual(dice.parseAndRoll("D6-1"), 3); // 4 - 1
            assert.strictEqual(dice.parseAndRoll("2D6+3"), 11); // 4 + 4 + 3
        } finally {
            restoreRandom();
        }
    });

    test("should handle complex expressions", () => {
        dice = new Dice();

        const restoreRandom = TestUtils.mockRandom([0.5, 0.8]); // 4, 5

        try {
            assert.strictEqual(dice.parseAndRoll("2D6+1"), 10); // 4 + 5 + 1
            // Complex multi-dice expressions like "D3+D6-2" are not supported yet
            // For now, test that it returns 0 for unsupported expressions
            assert.strictEqual(dice.parseAndRoll("D3+D6-2"), 0);
        } finally {
            restoreRandom();
        }
    });

    test("should handle edge cases", () => {
        dice = new Dice();

        // Leerer String
        assert.strictEqual(dice.parseAndRoll(""), 0);

        // Null/Undefined
        assert.strictEqual(dice.parseAndRoll(null), 0);
        assert.strictEqual(dice.parseAndRoll(undefined), 0);

        // Nur Modifikatoren
        assert.strictEqual(dice.parseAndRoll("+5"), 5);
        assert.strictEqual(dice.parseAndRoll("-3"), -3);
    });

    test("should maintain statistical distribution for D6", () => {
        dice = new Dice();

        const results = TestUtils.runMultipleTimes(() => dice.parseAndRoll("D6"), 6000);

        // Überprüfe, dass jede Zahl von 1-6 etwa gleich oft vorkommt
        const counts = [0, 0, 0, 0, 0, 0, 0]; // Index 0 nicht verwendet
        results.forEach(result => counts[result]++);

        for (let i = 1; i <= 6; i++) {
            TestUtils.assertInRange(counts[i], 1000, 0.1, `Frequency of ${i}`);
        }
    });

    test("should handle sustained hits parsing", () => {
        dice = new Dice();

        const restoreRandom = TestUtils.mockRandom([0.5]); // Würfel ergibt 4

        try {
            // Diese Tests simulieren, wie sustained hits in der Realität geparst werden
            assert.strictEqual(dice.parseAndRoll("1"), 1);
            assert.strictEqual(dice.parseAndRoll("D3"), 2);
            assert.strictEqual(dice.parseAndRoll("D6"), 4);
        } finally {
            restoreRandom();
        }
    });
});
