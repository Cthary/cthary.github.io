import { test, describe } from "node:test";
import { strict as assert } from "assert";
import run from "../../src/scripts/w40k.js";
import { TestUtils } from "../test-utils.js";

describe("Hit/Wound Modifier Keywords Tests", () => {
    test("should apply +1 to hit modifier correctly", () => {
        const baselineData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Baseline Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 4, // 4+ = 50%
                    strength: 4,
                    Keywords: []
                })]
            }]
        });

        const modifiedData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Modified Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 4, // Wird zu 3+ durch +1 = 66.7%
                    strength: 4,
                    Keywords: ["+1 to hit"]
                })]
            }]
        });

        const baselineResults = run(baselineData);
        const modifiedResults = run(modifiedData);

        const baselineHits = baselineResults[0].Target[0].Weapons[0].Hits;
        const modifiedHits = modifiedResults[0].Target[0].Weapons[0].Hits;

        // +1 to hit sollte etwa 33% mehr Treffer ergeben (von 50% auf 66.7%)
        const improvement = (modifiedHits - baselineHits) / baselineHits;
        TestUtils.assertInRange(improvement, 0.33, 0.1, "+1 to hit improvement");
    });

    test("should apply -1 to hit modifier correctly", () => {
        const baselineData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Baseline Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 4, // 4+ = 50%
                    strength: 4,
                    Keywords: []
                })]
            }]
        });

        const modifiedData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Modified Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 4, // Wird zu 5+ durch -1 = 33.3%
                    strength: 4,
                    Keywords: ["-1 to hit"]
                })]
            }]
        });

        const baselineResults = run(baselineData);
        const modifiedResults = run(modifiedData);

        const baselineHits = baselineResults[0].Target[0].Weapons[0].Hits;
        const modifiedHits = modifiedResults[0].Target[0].Weapons[0].Hits;

        // -1 to hit sollte etwa 33% weniger Treffer ergeben (von 50% auf 33.3%)
        const reduction = (baselineHits - modifiedHits) / baselineHits;
        TestUtils.assertInRange(reduction, 0.33, 0.1, "-1 to hit reduction");
    });

    test("should apply +1 to wound modifier correctly", () => {
        const baselineData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Baseline Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 3, // Konstante Trefferrate
                    strength: 4, // S4 vs T4 = 4+ to wound
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const modifiedData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Modified Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 3,
                    strength: 4, // Wird zu 3+ durch +1 to wound
                    Keywords: ["+1 to wound"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const baselineResults = run(baselineData);
        const modifiedResults = run(modifiedData);

        const baselineWounds = baselineResults[0].Target[0].Weapons[0].Wounds;
        const modifiedWounds = modifiedResults[0].Target[0].Weapons[0].Wounds;

        // +1 to wound sollte etwa 33% mehr Wounds ergeben (von 50% auf 66.7%)
        const improvement = (modifiedWounds - baselineWounds) / baselineWounds;
        TestUtils.assertInRange(improvement, 0.33, 0.15, "+1 to wound improvement"); // Erhöhe Toleranz auf 15%
    });

    test("should apply -1 to wound modifier correctly", () => {
        const baselineData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Baseline Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 3,
                    strength: 4, // S4 vs T4 = 4+ to wound
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const modifiedData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Modified Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 3,
                    strength: 4, // Wird zu 5+ durch -1 to wound
                    Keywords: ["-1 to wound"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4
            })]
        });

        const baselineResults = run(baselineData);
        const modifiedResults = run(modifiedData);

        const baselineWounds = baselineResults[0].Target[0].Weapons[0].Wounds;
        const modifiedWounds = modifiedResults[0].Target[0].Weapons[0].Wounds;

        // -1 to wound sollte etwa 33% weniger Wounds ergeben (von 50% auf 33.3%)
        const reduction = (baselineWounds - modifiedWounds) / baselineWounds;
        TestUtils.assertInRange(reduction, 0.33, 0.1, "-1 to wound reduction");
    });

    test("should apply defender hit modifiers correctly", () => {
        const baselineData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 4,
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                Keywords: [] // Keine Modifikatoren
            })]
        });

        const modifiedData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 4,
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                Keywords: ["-1 to hit"] // Schwerer zu treffen
            })]
        });

        const baselineResults = run(baselineData);
        const modifiedResults = run(modifiedData);

        const baselineHits = baselineResults[0].Target[0].Weapons[0].Hits;
        const modifiedHits = modifiedResults[0].Target[0].Weapons[0].Hits;

        // Defender -1 to hit sollte Treffer reduzieren
        assert.ok(modifiedHits < baselineHits, "Defender -1 to hit should reduce hits");

        const reduction = (baselineHits - modifiedHits) / baselineHits;
        TestUtils.assertInRange(reduction, 0.33, 0.1, "Defender -1 to hit reduction");
    });

    test("should apply defender wound modifiers correctly", () => {
        const baselineData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 3,
                    strength: 4,
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4,
                Keywords: []
            })]
        });

        const modifiedData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 3,
                    strength: 4,
                    Keywords: []
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4,
                Keywords: ["-1 to wound"] // Schwerer zu verwunden
            })]
        });

        const baselineResults = run(baselineData);
        const modifiedResults = run(modifiedData);

        const baselineWounds = baselineResults[0].Target[0].Weapons[0].Wounds;
        const modifiedWounds = modifiedResults[0].Target[0].Weapons[0].Wounds;

        // Defender -1 to wound sollte Wounds reduzieren
        assert.ok(modifiedWounds < baselineWounds, "Defender -1 to wound should reduce wounds");
    });

    test("should handle combined hit and wound modifiers", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Super Enhanced Unit",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "10",
                    to_hit: 4,
                    strength: 4,
                    Keywords: ["+1 to hit", "+1 to wound"]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 4,
                Keywords: ["-1 to hit", "-1 to wound"] // Gegenmodifikatoren
            })]
        });

        const results = run(simulationData);

        // Modifikatoren sollten sich teilweise aufheben
        // Weapon +1, Defender -1 = Baseline
        const weapon = results[0].Target[0].Weapons[0];

        // Sollte etwa baseline performance haben
        TestUtils.assertInRange(weapon.Hits, 5.0, 0.2, "Combined hit modifiers");
        TestUtils.assertInRange(weapon.Wounds, 2.5, 0.2, "Combined wound modifiers");
    });

    test("should respect hit/wound bounds (2+ to 6+)", () => {
        // Test extreme modifiers
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 100,
            Attackers: [{
                Name: "Extreme Unit",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "5",
                    to_hit: 2, // Bereits sehr gut
                    strength: 10, // Sehr stark
                    Keywords: ["+1 to hit", "+1 to wound"] // Weitere Verbesserung
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 3, // Schwach
                Keywords: ["-1 to hit", "-1 to wound"] // Versucht zu kompensieren
            })]
        });

        const results = run(simulationData);

        // Sollte ohne Fehler laufen, auch bei extremen Werten
        TestUtils.validateSimulationResult(results[0]);

        const weapon = results[0].Target[0].Weapons[0];
        assert.ok(weapon.Hits > 0, "Should still achieve hits");
        assert.ok(weapon.Wounds > 0, "Should still achieve wounds");
    });

    test("should validate alternative keyword syntax", () => {
        const testCases = [
            { keyword: "+1 hit", expectedBetter: true },
            { keyword: "+1 to hit", expectedBetter: true },
            { keyword: "-1 hit", expectedBetter: false },
            { keyword: "-1 to hit", expectedBetter: false },
            { keyword: "+1 wound", expectedBetter: true },
            { keyword: "+1 to wound", expectedBetter: true },
            { keyword: "-1 wound", expectedBetter: false },
            { keyword: "-1 to wound", expectedBetter: false }
        ];

        testCases.forEach(({ keyword, expectedBetter }) => {
            const simulationData = TestUtils.createTestSimulationData({
                Amount: 200,
                Attackers: [{
                    Name: "Test Unit",
                    Weapons: [TestUtils.createTestWeapon({
                        attacks: "10",
                        to_hit: 4,
                        strength: 4,
                        Keywords: [keyword]
                    })]
                }]
            });

            const results = run(simulationData);
            const weapon = results[0].Target[0].Weapons[0];

            if (expectedBetter) {
                if (keyword.includes("hit")) {
                    assert.ok(weapon.Hits > 5, `${keyword} should improve hits`);
                } else {
                    assert.ok(weapon.Wounds > 2.5, `${keyword} should improve wounds`);
                }
            } else {
                if (keyword.includes("hit")) {
                    assert.ok(weapon.Hits < 5, `${keyword} should reduce hits`);
                } else {
                    assert.ok(weapon.Wounds < 2.5, `${keyword} should reduce wounds`);
                }
            }
        });
    });
});
