import { Calculator } from "../../src/scripts/w40k.js";
import { Defender } from "../../src/scripts/units.js";
import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";

describe("Feel No Pain Tests", () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator([], []);
    });

    describe("Feel No Pain Keyword Parsing", () => {
        test("should parse feel no pain 6 correctly", () => {
            const defenderData = {
                Name: "Test Unit",
                type: "Infantry",
                toughness: 4,
                wounds: 1,
                models: 1,
                save: 3,
                invulnerable: 7,
                Keywords: ["feel no pain 6"]
            };

            const defender = new Defender(defenderData);
            assert.strictEqual(defender.feelNoPainValue, 6);
        });

        test("should parse feel no pain 5 correctly", () => {
            const defenderData = {
                Name: "Test Unit",
                type: "Infantry",
                toughness: 4,
                wounds: 1,
                models: 1,
                save: 3,
                invulnerable: 7,
                Keywords: ["feel no pain 5"]
            };

            const defender = new Defender(defenderData);
            assert.strictEqual(defender.feelNoPainValue, 5);
        });

        test("should handle no feel no pain keyword", () => {
            const defenderData = {
                Name: "Test Unit",
                type: "Infantry",
                toughness: 4,
                wounds: 1,
                models: 1,
                save: 3,
                invulnerable: 7,
                Keywords: []
            };

            const defender = new Defender(defenderData);
            assert.strictEqual(defender.feelNoPainValue, null);
        });

        test("should handle multiple keywords including feel no pain", () => {
            const defenderData = {
                Name: "Test Unit",
                type: "Infantry",
                toughness: 4,
                wounds: 1,
                models: 1,
                save: 3,
                invulnerable: 7,
                Keywords: ["-1D", "feel no pain 4", "+1 to hit"]
            };

            const defender = new Defender(defenderData);
            assert.strictEqual(defender.feelNoPainValue, 4);
        });
    });

    describe("Feel No Pain Rolls", () => {
        test("should handle feel no pain with all successful rolls", () => {
            const defender = {
                feelNoPainValue: 2 // Always succeeds on 2+
            };

            // Mock the rollDice method to always return 6s
            const originalRollDice = calculator.rollDice;
            calculator.rollDice = () => [6, 6, 6];

            const result = calculator.feelNoPain(defender, 3);

            assert.strictEqual(result.survivedDamage, 3);
            assert.strictEqual(result.remainingDamage, 0);

            calculator.rollDice = originalRollDice;
        });

        test("should handle feel no pain with all failed rolls", () => {
            const defender = {
                feelNoPainValue: 6 // Only succeeds on 6+
            };

            // Mock the rollDice method to always return 1s
            const originalRollDice = calculator.rollDice;
            calculator.rollDice = () => [1, 1, 1];

            const result = calculator.feelNoPain(defender, 3);

            assert.strictEqual(result.survivedDamage, 0);
            assert.strictEqual(result.remainingDamage, 3);

            calculator.rollDice = originalRollDice;
        });

        test("should handle feel no pain with mixed rolls", () => {
            const defender = {
                feelNoPainValue: 4 // Succeeds on 4+
            };

            // Mock the rollDice method to return mixed results
            const originalRollDice = calculator.rollDice;
            calculator.rollDice = () => [1, 4, 6, 2, 5];

            const result = calculator.feelNoPain(defender, 5);

            assert.strictEqual(result.survivedDamage, 3); // Rolls of 4, 6, 5 succeeded
            assert.strictEqual(result.remainingDamage, 2); // Rolls of 1, 2 failed

            calculator.rollDice = originalRollDice;
        });

        test("should handle defender without feel no pain", () => {
            const defender = {
                feelNoPainValue: null
            };

            const result = calculator.feelNoPain(defender, 3);

            assert.strictEqual(result.survivedDamage, 0);
            assert.strictEqual(result.remainingDamage, 3);
        });

        test("should handle zero failed saves", () => {
            const defender = {
                feelNoPainValue: 5
            };

            const result = calculator.feelNoPain(defender, 0);

            assert.strictEqual(result.survivedDamage, 0);
            assert.strictEqual(result.remainingDamage, 0);
        });
    });

    describe("Edge Cases", () => {
        test("should handle feel no pain with different values", () => {
            for (let fnpValue = 2; fnpValue <= 6; fnpValue++) {
                const defender = {
                    feelNoPainValue: fnpValue
                };

                // Mock successful rolls
                const originalRollDice = calculator.rollDice;
                calculator.rollDice = () => [6, 6];

                const result = calculator.feelNoPain(defender, 2);

                assert.strictEqual(result.survivedDamage, 2);
                assert.strictEqual(result.remainingDamage, 0);

                calculator.rollDice = originalRollDice;
            }
        });

        test("should handle large number of failed saves", () => {
            const defender = {
                feelNoPainValue: 4
            };

            // Mock half successful rolls
            const successfulRolls = new Array(50).fill(4);
            const failedRolls = new Array(50).fill(3);
            const allRolls = [...successfulRolls, ...failedRolls];

            const originalRollDice = calculator.rollDice;
            calculator.rollDice = () => allRolls;

            const result = calculator.feelNoPain(defender, 100);

            assert.strictEqual(result.survivedDamage, 50);
            assert.strictEqual(result.remainingDamage, 50);

            calculator.rollDice = originalRollDice;
        });
    });
});
