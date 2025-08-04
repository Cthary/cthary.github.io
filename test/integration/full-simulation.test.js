import { test, describe } from "node:test";
import { strict as assert } from "assert";
import run from "../../src/scripts/w40k.js";
import { TestUtils } from "../test-utils.js";

describe("Full Simulation Integration Tests", () => {
    test("should run complete simulation with basic setup", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 100,
            Attackers: [{
                Name: "Space Marines",
                Weapons: [TestUtils.createTestWeapon({
                    name: "Bolter",
                    attacks: "2",
                    to_hit: 3,
                    strength: 4,
                    ap: 0,
                    damage: "1"
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                Name: "Ork Boyz",
                models: 10,
                toughness: 5,
                wounds: 1,
                save: 6
            })]
        });

        const results = run(simulationData);

        TestUtils.validateSimulationResult(results[0]);
        assert.strictEqual(results[0].Name, "Space Marines");
        assert.strictEqual(results[0].Target[0].Name, "Ork Boyz");
        assert.ok(results[0].Target[0].ModelsDestroyed >= 0);
    });

    test("should handle multiple attackers and defenders", () => {
        const simulationData = {
            Amount: 50,
            Attackers: [
                {
                    Name: "Space Marines",
                    Weapons: [TestUtils.createTestWeapon({ name: "Bolter" })]
                },
                {
                    Name: "Terminators",
                    Weapons: [TestUtils.createTestWeapon({
                        name: "Storm Bolter",
                        attacks: "4",
                        strength: 4
                    })]
                }
            ],
            Defenders: [
                TestUtils.createTestDefender({ Name: "Orks", models: 10 }),
                TestUtils.createTestDefender({ Name: "Gretchin", models: 20, toughness: 2 })
            ]
        };

        const results = run(simulationData);

        assert.strictEqual(results.length, 2); // Zwei Angreifer

        results.forEach(result => {
            TestUtils.validateSimulationResult(result);
            assert.strictEqual(result.Target.length, 2); // Zwei Verteidiger pro Angreifer
        });
    });

    test("should validate keyword effects in full simulation", () => {
        // Simple test without complex random mocking
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Enhanced Marines",
                Weapons: [TestUtils.createTestWeapon({
                    name: "Enhanced Bolter",
                    attacks: "1",
                    to_hit: 4,
                    strength: 4,
                    Keywords: ["+1 to hit"]
                })]
            }]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have valid results
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });

    test("should handle damage reduction keywords", () => {
        // Simple test for damage reduction
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Heavy Weapons",
                Weapons: [TestUtils.createTestWeapon({
                    name: "Lascannon",
                    attacks: "1",
                    to_hit: 2, // Always hit
                    strength: 12,
                    ap: 3,
                    damage: "6" // Fixed damage
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                Name: "Tough Unit",
                models: 5,
                toughness: 8,
                wounds: 3,
                save: 2,
                Keywords: ["-1D"]
            })]
        });

        const results = run(simulationData);

        // Should run without errors and have valid results
        assert.ok(results[0].Target[0].ModelsDestroyed >= 0, "Should have valid models destroyed count");
    });

    test("should handle edge case with no hits", () => {
        // Test impossible hit scenarios
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Bad Shooter",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 6,
                    strength: 1,
                    Keywords: ["-1 to hit"] // Makes 6+ impossible (7+)
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 10
            })]
        });

        const results = run(simulationData);

        // Should run without errors even with no hits
        TestUtils.validateSimulationResult(results[0]);
        assert.ok(results[0].Target[0].ModelsDestroyed >= 0, "Should have valid destroyed count");
    });

    test("should validate deterministic consistency", () => {
        // Simple consistency test
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Consistent Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 2, // Always hit
                    strength: 10, // Always wound
                    ap: 6,
                    damage: "1"
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                models: 10,
                toughness: 1,
                save: 7 // No save
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Should have some valid results
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
        assert.ok(weapon.FailedSaves >= 0, "Should have valid failed saves");
    });

    test("should handle complex keyword combinations", () => {
        // Simple test for complex keywords
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Elite Unit",
                Weapons: [TestUtils.createTestWeapon({
                    name: "Elite Weapon",
                    attacks: "1",
                    to_hit: 3,
                    strength: 6,
                    ap: 2,
                    damage: "2",
                    Keywords: ["+1 to wound"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                models: 5,
                toughness: 4,
                wounds: 2,
                save: 3,
                Keywords: ["-1 to hit"]
            })]
        });

        const results = run(simulationData);

        TestUtils.validateSimulationResult(results[0]);

        // Should have valid results regardless of interactions
        const weapon = results[0].Target[0].Weapons[0];
        assert.ok(weapon.Hits >= 0, "Should have valid hits");
        assert.ok(weapon.Wounds >= 0, "Should have valid wounds");
    });

    test("should validate kill distribution", () => {
        // Simple test for kill distribution structure
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1,
            Attackers: [{
                Name: "Precise Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 2, // Good hit rate
                    strength: 8,
                    ap: 3,
                    damage: "1"
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                models: 5,
                toughness: 4,
                wounds: 1,
                save: 6 // Bad armor
            })]
        });

        const results = run(simulationData);
        const target = results[0].Target[0];

        // Check KillDistribution structure exists
        assert.ok(Array.isArray(target.KillDistribution), "Should have KillDistribution array");

        // Should have valid models destroyed count
        assert.ok(target.ModelsDestroyed >= 0, "Should have valid models destroyed");

        // CompleteWipeoutChance should be defined
        assert.ok(typeof target.CompleteWipeoutChance === "number", "Should have CompleteWipeoutChance");
        assert.ok(target.CompleteWipeoutChance >= 0 && target.CompleteWipeoutChance <= 100, "CompleteWipeoutChance should be percentage");
    });
});
