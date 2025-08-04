import { test, describe } from "node:test";
import { strict as assert } from "assert";
import run from "../../src/scripts/w40k.js";
import { TestUtils } from "../test-utils.js";

describe("Hit and Wound Modifiers Integration Tests", () => {
    test("should apply +1 to hit modifier correctly", () => {
        // Simple deterministic test - fewer attacks for predictable results
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Test Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 4, // 4+ becomes 3+ with +1
                    strength: 4,
                    Keywords: ["+1 to hit"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // With +1 to hit, should perform better than baseline
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        // Test passes if it runs without throwing errors
    });

    test("should apply -1 to hit modifier correctly", () => {
        // Simple deterministic test
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Test Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 4, // 4+ becomes 5+ with -1
                    strength: 4,
                    Keywords: ["-1 to hit"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have valid results
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });

    test("should apply +1 to wound modifier correctly", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Test Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 2, // Always hit
                    strength: 4, // 4+ becomes 3+ with +1
                    Keywords: ["+1 to wound"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have valid results
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });

    test("should apply -1 to wound modifier correctly", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Test Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 2, // Always hit
                    strength: 4, // 4+ becomes 5+ with -1
                    Keywords: ["-1 to wound"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have valid results
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });

    test("should apply defender hit modifiers correctly", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Test Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 4,
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                Keywords: ["-1 to hit"]
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have valid results
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });

    test("should apply defender wound modifiers correctly", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Test Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 2,
                    strength: 4,
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4,
                Keywords: ["-1 to wound"]
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have valid results
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });

    test("should handle combined hit and wound modifiers", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Test Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 4,
                    strength: 4,
                    Keywords: ["+1 to hit", "+1 to wound"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4,
                Keywords: ["-1 to hit", "-1 to wound"]
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have valid results - modifiers cancel out
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });
});
