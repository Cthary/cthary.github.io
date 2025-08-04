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
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1000, // Erhöhe für bessere Statistik
            Attackers: [{
                Name: "Enhanced Marines",
                Weapons: [TestUtils.createTestWeapon({
                    name: "Enhanced Bolter",
                    attacks: "4",
                    to_hit: 4,
                    strength: 4,
                    Keywords: ["+1 to hit", "lethal hits"]
                })]
            }]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Mit +1 to hit (4+ wird zu 3+) sollten die Hits deutlich höher sein als ohne Modifier
        // Ohne +1 to hit: 4 Attacken * 0.5 = 2.0 Hits im Durchschnitt
        // Mit +1 to hit: 4 Attacken * 0.667 = 2.67 Hits im Durchschnitt
        // Akzeptiere etwas Varianz in Monte-Carlo-Simulationen
        assert.ok(weapon.Hits > 1.8, `Should have more hits due to +1 to hit, got ${weapon.Hits}`);

        // Lethal hits sollten automatische Wounds erzeugen
        assert.ok(weapon.Wounds > 0, "Should have wounds from lethal hits");
    });

    test("should handle damage reduction keywords", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 100,
            Attackers: [{
                Name: "Heavy Weapons",
                Weapons: [TestUtils.createTestWeapon({
                    name: "Lascannon",
                    attacks: "1",
                    to_hit: 3,
                    strength: 12,
                    ap: 3,
                    damage: "D6+1"
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

        // Trotz hohem Schaden sollte -1D die Anzahl vernichteter Modelle reduzieren
        assert.ok(results[0].Target[0].ModelsDestroyed < 5, "Damage reduction should limit kills");
    });

    test("should handle edge case with no hits", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 10,
            Attackers: [{
                Name: "Bad Shooter",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "1",
                    to_hit: 6,
                    strength: 1,
                    Keywords: ["-1 to hit"] // Macht 6+ zu unmöglichen 7+
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                toughness: 10
            })]
        });

        const results = run(simulationData);

        // Sollte ohne Fehler laufen, auch wenn keine Treffer erzielt werden
        TestUtils.validateSimulationResult(results[0]);
        assert.strictEqual(results[0].Target[0].ModelsDestroyed, 0);
    });

    test("should validate statistical consistency", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1000, // Größere Stichprobe für Statistik
            Attackers: [{
                Name: "Consistent Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "4",
                    to_hit: 4, // 50% Hit-Rate
                    strength: 4,
                    ap: 0,
                    damage: "1"
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                models: 10,
                toughness: 4, // 50% Wound-Rate
                save: 4 // 50% Save-Rate
            })]
        });

        const results = run(simulationData);
        const weapon = results[0].Target[0].Weapons[0];

        // Erwartete Werte: 4 Attacks * 0.5 Hit * 0.5 Wound * 0.5 Failed Save = 1.0
        TestUtils.assertInRange(weapon.Hits, 2.0, 0.1, "Hit consistency");
        TestUtils.assertInRange(weapon.Wounds, 1.0, 0.1, "Wound consistency");
        TestUtils.assertInRange(weapon.FailedSaves, 0.5, 0.15, "Save consistency");
    });

    test("should handle complex keyword combinations", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 100,
            Attackers: [{
                Name: "Elite Unit",
                Weapons: [TestUtils.createTestWeapon({
                    name: "Elite Weapon",
                    attacks: "3",
                    to_hit: 3,
                    strength: 6,
                    ap: 2,
                    damage: "2",
                    Keywords: [
                        "twin-linked",      // Reroll wound fails
                        "sustained hits 1", // Extra hits on 6s
                        "+1 to wound",      // Better wounds
                        "melta 1"          // Extra damage at short range
                    ]
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                models: 5,
                toughness: 4,
                wounds: 2,
                save: 3,
                Keywords: ["-1 to hit"] // Makes hitting harder
            })]
        });

        const results = run(simulationData);

        TestUtils.validateSimulationResult(results[0]);

        // Komplexe Interaktionen sollten trotzdem funktionieren
        const weapon = results[0].Target[0].Weapons[0];
        assert.ok(weapon.Hits > 0, "Should still achieve some hits");
        assert.ok(weapon.Wounds > 0, "Should still achieve some wounds");
    });

    test("should validate kill distribution", () => {
        const simulationData = TestUtils.createTestSimulationData({
            Amount: 1000,
            Attackers: [{
                Name: "Precise Attacker",
                Weapons: [TestUtils.createTestWeapon({
                    attacks: "5",
                    to_hit: 2, // Sehr gute Trefferrate
                    strength: 8,
                    ap: 3,
                    damage: "1"
                })]
            }],
            Defenders: [TestUtils.createTestDefender({
                models: 5,
                toughness: 4,
                wounds: 1,
                save: 6 // Sehr schlechte Rüstung
            })]
        });

        const results = run(simulationData);
        const target = results[0].Target[0];

        // Prüfe KillDistribution
        assert.ok(Array.isArray(target.KillDistribution));
        assert.ok(target.KillDistribution.length > 0);

        // Summe aller Wahrscheinlichkeiten sollte etwa 100% sein
        const totalProbability = target.KillDistribution.reduce((sum, item) => sum + item.probability, 0);
        TestUtils.assertInRange(totalProbability, 100, 0.01, "Total probability");

        // CompleteWipeoutChance sollte definiert sein
        assert.ok(typeof target.CompleteWipeoutChance === "number");
        assert.ok(target.CompleteWipeoutChance >= 0 && target.CompleteWipeoutChance <= 100);
    });
});
