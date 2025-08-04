import { Weapon, Defender } from "../../src/scripts/units.js";
import { describe, test } from "node:test";
import assert from "node:assert";

describe("Complete Case-Insensitive Keywords Tests", () => {
    describe("Hit Modifiers", () => {
        test("should recognize '+1 to hit' in various cases", () => {
            const testCases = [
                "+1 to hit",
                "+1 To Hit",
                "+1 TO HIT",
                "+1 tO hIt"
            ];

            testCases.forEach(keyword => {
                const weaponData = {
                    name: "Test Weapon",
                    type: "Ranged",
                    attacks: "2",
                    to_hit: 4,
                    strength: 4,
                    ap: 0,
                    damage: "1",
                    amount: 1,
                    Keywords: [keyword]
                };

                const weapon = new Weapon(weaponData);
                assert.strictEqual(weapon.to_hit, 3, `Failed for keyword: ${keyword}`);
            });
        });

        test("should recognize '-1 to hit' in various cases", () => {
            const testCases = [
                "-1 to hit",
                "-1 To Hit",
                "-1 TO HIT"
            ];

            testCases.forEach(keyword => {
                const weaponData = {
                    name: "Test Weapon",
                    type: "Ranged",
                    attacks: "2",
                    to_hit: 4,
                    strength: 4,
                    ap: 0,
                    damage: "1",
                    amount: 1,
                    Keywords: [keyword]
                };

                const weapon = new Weapon(weaponData);
                assert.strictEqual(weapon.to_hit, 5, `Failed for keyword: ${keyword}`);
            });
        });
    });

    describe("Anti-X Keywords", () => {
        test("should recognize 'anti-vehicle 5+' correctly", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["anti-vehicle 5+"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 keyword");
            assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
        });

        test("should recognize 'Anti-Infantry 4+' (title case)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["Anti-Infantry 4+"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 keyword");
            assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
        });

        test("should recognize 'ANTI-MONSTER 3+' (uppercase)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["ANTI-MONSTER 3+"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound3"), "Should add CritWound3 keyword");
            assert.ok(weapon.Keywords.includes("Anti-monster"), "Should add Anti-monster marker");
        });

        test("should recognize 'aNtI-vEhIcLe 6+' (mixed case)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["aNtI-vEhIcLe 6+"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound6"), "Should add CritWound6 keyword");
            assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
        });

        test("should handle multiple anti keywords", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["anti-vehicle 5+", "Anti-Infantry 4+"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 keyword");
            assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 keyword");
            assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
            assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
        });

        test("should handle 'anti-vehicle 5' (ohne + Zeichen)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["anti-vehicle 5"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 keyword for anti-vehicle 5");
            assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
        });

        test("should handle 'ANTI-INFANTRY 4' (uppercase ohne +)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["ANTI-INFANTRY 4"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 keyword for ANTI-INFANTRY 4");
            assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
        });

        test("should handle mixed anti keywords with and without +", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "3",
                to_hit: 4,
                strength: 6,
                ap: 1,
                damage: "2",
                amount: 1,
                Keywords: ["anti-vehicle 5+", "anti-infantry 4", "Anti-Monster 3"]
            };

            const weapon = new Weapon(weaponData);
            assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 for anti-vehicle 5+");
            assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 for anti-infantry 4");
            assert.ok(weapon.Keywords.includes("CritWound3"), "Should add CritWound3 for Anti-Monster 3");
            assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
            assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
            assert.ok(weapon.Keywords.includes("Anti-monster"), "Should add Anti-monster marker");
        });
    });

    describe("Damage Modifiers", () => {
        test("should recognize damage modifiers in various cases", () => {
            const testCases = [
                { keyword: "+1d", expected: "+1 dmg" },
                { keyword: "+1D", expected: "+1 dmg" },
                { keyword: "-1d", expected: "-1 dmg" },
                { keyword: "-1D", expected: "-1 dmg" },
                { keyword: "/2d", expected: "halve damage" },
                { keyword: "/2D", expected: "halve damage" }
            ];

            testCases.forEach(testCase => {
                const weaponData = {
                    name: "Test Weapon",
                    type: "Ranged",
                    attacks: "2",
                    to_hit: 4,
                    strength: 4,
                    ap: 0,
                    damage: "1",
                    amount: 1,
                    Keywords: [testCase.keyword]
                };

                const weapon = new Weapon(weaponData);
                assert.ok(weapon.Keywords.includes(testCase.expected),
                    `Failed for keyword: ${testCase.keyword}, expected: ${testCase.expected}`);
            });
        });
    });

    describe("Standard Keywords", () => {
        test("should recognize twin-linked in various cases", () => {
            const testCases = [
                "twin-linked",
                "Twin-Linked",
                "TWIN-LINKED",
                "tWiN-lInKeD"
            ];

            testCases.forEach(keyword => {
                const weaponData = {
                    name: "Test Weapon",
                    type: "Ranged",
                    attacks: "2",
                    to_hit: 4,
                    strength: 4,
                    ap: 0,
                    damage: "1",
                    amount: 1,
                    Keywords: [keyword]
                };

                const weapon = new Weapon(weaponData);
                assert.ok(weapon.Keywords.includes("RWMiss"), `Failed for keyword: ${keyword}`);
            });
        });

        test("should recognize lance in various cases", () => {
            const testCases = [
                "lance",
                "Lance",
                "LANCE",
                "lAnCe"
            ];

            testCases.forEach(keyword => {
                const weaponData = {
                    name: "Test Weapon",
                    type: "Melee",
                    attacks: "2",
                    to_hit: 4,
                    strength: 4,
                    ap: 1,
                    damage: "1",
                    amount: 1,
                    Keywords: [keyword]
                };

                const weapon = new Weapon(weaponData);
                assert.strictEqual(weapon.ap, 2, `Failed for keyword: ${keyword} - AP should be increased`);
                assert.ok(weapon.Keywords.includes("+1 wound"), `Failed for keyword: ${keyword} - should add +1 wound`);
            });
        });
    });

    describe("Sustained Hits and Rapid Fire", () => {
        test("should recognize sustained hits in various cases", () => {
            const testCases = [
                "sustained hits 1",
                "Sustained Hits 2",
                "SUSTAINED HITS 3",
                "sUsTaInEd HiTs D3"
            ];

            testCases.forEach(keyword => {
                const weaponData = {
                    name: "Test Weapon",
                    type: "Ranged",
                    attacks: "2",
                    to_hit: 4,
                    strength: 4,
                    ap: 0,
                    damage: "1",
                    amount: 1,
                    Keywords: [keyword]
                };

                const weapon = new Weapon(weaponData);
                assert.ok(weapon.sustainedHits, `Failed for keyword: ${keyword}`);
            });
        });

        test("should recognize rapid fire in various cases", () => {
            const testCases = [
                "rapid fire 1",
                "Rapid Fire 2",
                "RAPID FIRE 3"
            ];

            testCases.forEach(keyword => {
                const weaponData = {
                    name: "Test Weapon",
                    type: "Ranged",
                    attacks: "2",
                    to_hit: 4,
                    strength: 4,
                    ap: 0,
                    damage: "1",
                    amount: 1,
                    Keywords: [keyword]
                };

                const weapon = new Weapon(weaponData);
                // Rapid Fire sollte attacks erhöhen
                assert.ok(weapon.attacks !== "2", `Failed for keyword: ${keyword} - attacks should be modified`);
            });
        });
    });

    describe("Defender Keywords", () => {
        test("should recognize feel no pain in various cases", () => {
            const testCases = [
                "feel no pain 6",
                "Feel No Pain 5",
                "FEEL NO PAIN 4",
                "fEeL nO pAiN 3"
            ];

            testCases.forEach(keyword => {
                const defenderData = {
                    Name: "Test Unit",
                    type: "Infantry",
                    toughness: 4,
                    wounds: 1,
                    models: 1,
                    save: 3,
                    invulnerable: 7,
                    Keywords: [keyword]
                };

                const defender = new Defender(defenderData);
                const expectedValue = parseInt(keyword.match(/(\d+)$/)[1]);
                assert.strictEqual(defender.feelNoPainValue, expectedValue,
                    `Failed for keyword: ${keyword}`);
            });
        });

        test("should recognize damage reduction keywords in various cases", () => {
            const testCases = [
                { keyword: "/2d", expected: "halve damage" },
                { keyword: "/2D", expected: "halve damage" },
                { keyword: "-1d", expected: "-1 dmg" },
                { keyword: "-1D", expected: "-1 dmg" }
            ];

            testCases.forEach(testCase => {
                const defenderData = {
                    Name: "Test Unit",
                    type: "Infantry",
                    toughness: 4,
                    wounds: 1,
                    models: 1,
                    save: 3,
                    invulnerable: 7,
                    Keywords: [testCase.keyword]
                };

                const defender = new Defender(defenderData);
                assert.ok(defender.Keywords.includes(testCase.expected),
                    `Failed for keyword: ${testCase.keyword}, expected: ${testCase.expected}`);
            });
        });
    });

    describe("Complex Combinations", () => {
        test("should handle multiple case-insensitive keywords together", () => {
            const weaponData = {
                name: "Complex Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 8,
                ap: 3,
                damage: "2",
                amount: 1,
                Keywords: [
                    "Lethal Hits",
                    "DEVASTATING WOUNDS",
                    "anti-vehicle 5+",
                    "Twin-Linked",
                    "+1D",
                    "Sustained Hits 1"
                ]
            };

            const weapon = new Weapon(weaponData);

            assert.strictEqual(weapon.lethalHits, true, "Should recognize Lethal Hits");
            assert.strictEqual(weapon.devastatingWounds, true, "Should recognize DEVASTATING WOUNDS");
            assert.ok(weapon.Keywords.includes("CritWound5"), "Should recognize anti-vehicle 5+");
            assert.ok(weapon.Keywords.includes("RWMiss"), "Should recognize Twin-Linked");
            assert.ok(weapon.Keywords.includes("+1 dmg"), "Should recognize +1D");
            assert.strictEqual(weapon.sustainedHits, "1", "Should recognize Sustained Hits 1");
        });
    });
});
