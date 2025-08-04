import { test, describe } from "node:test";
import { strict as assert } from "assert";
import { Calculator } from "../../src/scripts/w40k.js";
import { Weapon, Defender } from "../../src/scripts/units.js";
import { TestUtils } from "../test-utils.js";

describe("Calculator Class", () => {
    let calculator;
    let attackers;
    let defenders;

    test("should create Calculator with attackers and defenders", () => {
        attackers = [TestUtils.createTestAttacker()];
        defenders = [TestUtils.createTestDefender()];

        calculator = new Calculator(attackers, defenders);

        assert.ok(calculator instanceof Calculator);
        assert.strictEqual(calculator.attackers, attackers);
        assert.strictEqual(calculator.defenders, defenders);
    });

    test("should get attacker by index", () => {
        attackers = [TestUtils.createTestAttacker({ Name: "Space Marines" })];
        defenders = [TestUtils.createTestDefender()];
        calculator = new Calculator(attackers, defenders);

        const attacker = calculator.getAttacker(0);

        assert.strictEqual(attacker.Name, "Space Marines");
    });

    test("should get defender by index", () => {
        attackers = [TestUtils.createTestAttacker()];
        defenders = [TestUtils.createTestDefender({ Name: "Orks" })];
        calculator = new Calculator(attackers, defenders);

        const defender = calculator.getDefender(0);

        assert.strictEqual(defender.Name, "Orks");
    });

    describe("Dice Rolling", () => {
        test("should roll dice with correct distribution", () => {
            calculator = new Calculator([], []);

            const results = TestUtils.runMultipleTimes(() => calculator.rollDice(1, 4, ""), 1000);

            // Prüfe, dass alle Ergebnisse Arrays sind
            results.forEach(result => {
                assert.ok(Array.isArray(result));
                assert.strictEqual(result.length, 1);
                assert.ok(result[0] >= 1 && result[0] <= 6);
            });
        });

        test("should handle reroll miss", () => {
            calculator = new Calculator([], []);

            // Mock für deterministische Tests
            const restoreRandom = TestUtils.mockRandom([0.1, 0.8]); // Erst 1 (miss), dann 5 (hit)

            try {
                const result = calculator.rollDice(1, 4, "miss");
                assert.strictEqual(result.length, 1);
                assert.strictEqual(result[0], 5); // Reroll sollte 5 ergeben
            } finally {
                restoreRandom();
            }
        });

        test("should handle reroll 1s", () => {
            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.0, 0.8]); // Erst 1, dann 5

            try {
                const result = calculator.rollDice(1, 4, "1");
                assert.strictEqual(result.length, 1);
                assert.strictEqual(result[0], 5); // Reroll der 1 sollte 5 ergeben
            } finally {
                restoreRandom();
            }
        });
    });

    describe("Hit Calculation", () => {
        test("should calculate hits correctly", () => {
            const weaponData = TestUtils.createTestWeapon({
                attacks: "4",
                to_hit: 4,
                Keywords: []
            });
            const weapon = new Weapon(weaponData);
            const defender = new Defender(TestUtils.createTestDefender());

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.6, 0.6, 0.2, 0.8]); // 4, 4, 2, 5 -> 3 hits

            try {
                const result = calculator.hits(weapon, defender);
                assert.strictEqual(result.hits, 3);
                assert.strictEqual(result.wounds, 0); // Keine lethal hits
            } finally {
                restoreRandom();
            }
        });

        test("should apply hit modifiers from weapon", () => {
            const weaponData = TestUtils.createTestWeapon({
                attacks: "2",
                to_hit: 4,
                Keywords: ["+1 to hit"] // Sollte to_hit auf 3 setzen
            });
            const weapon = new Weapon(weaponData);
            const defender = new Defender(TestUtils.createTestDefender());

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.3, 0.4]); // 2, 3 -> nur 3 trifft bei 3+

            try {
                const result = calculator.hits(weapon, defender);
                assert.strictEqual(result.hits, 1); // Nur ein Treffer erwartet
            } finally {
                restoreRandom();
            }
        });

        test("should apply hit modifiers from defender", () => {
            const weaponData = TestUtils.createTestWeapon({
                attacks: "2",
                to_hit: 4,
                Keywords: []
            });
            const weapon = new Weapon(weaponData);
            const defenderData = TestUtils.createTestDefender({
                Keywords: ["-1 to hit"] // Sollte to_hit auf 5 erhöhen
            });
            const defender = new Defender(defenderData);

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.6, 0.8]); // 4, 5 -> nur 5 trifft bei 5+

            try {
                const result = calculator.hits(weapon, defender);
                assert.strictEqual(result.hits, 1);
            } finally {
                restoreRandom();
            }
        });

        test("should handle lethal hits", () => {
            const weaponData = TestUtils.createTestWeapon({
                attacks: "2",
                to_hit: 4,
                Keywords: ["lethal hits"]
            });
            const weapon = new Weapon(weaponData);
            const defender = new Defender(TestUtils.createTestDefender());

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.9, 0.6]); // 6 (crit), 4 (normal hit)

            try {
                const result = calculator.hits(weapon, defender);
                assert.strictEqual(result.hits, 1); // Normal hit
                assert.strictEqual(result.wounds, 1); // Lethal hit -> automatic wound
            } finally {
                restoreRandom();
            }
        });

        test("should handle sustained hits", () => {
            const weaponData = TestUtils.createTestWeapon({
                attacks: "1",
                to_hit: 4,
                Keywords: ["sustained hits 2"]
            });
            const weapon = new Weapon(weaponData);
            const defender = new Defender(TestUtils.createTestDefender());

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.9]); // 6 (critical hit)

            try {
                const result = calculator.hits(weapon, defender);
                assert.strictEqual(result.hits, 3); // 1 original + 2 sustained
            } finally {
                restoreRandom();
            }
        });
    });

    describe("Wound Calculation", () => {
        test("should calculate wounds with correct strength vs toughness", () => {
            const weaponData = TestUtils.createTestWeapon({
                strength: 4,
                Keywords: []
            });
            const weapon = new Weapon(weaponData);
            const defenderData = TestUtils.createTestDefender({
                toughness: 4,
                Keywords: []
            });
            const defender = new Defender(defenderData);

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.6, 0.2, 0.8]); // 4, 2, 5 -> 2 wounds bei 4+

            try {
                const result = calculator.wounds(weapon, defender, 3);
                assert.strictEqual(result.wounds, 2);
            } finally {
                restoreRandom();
            }
        });

        test("should apply wound modifiers", () => {
            const weaponData = TestUtils.createTestWeapon({
                strength: 4,
                Keywords: ["+1 to wound"] // Sollte WoundBonus+1 enthalten
            });
            const weapon = new Weapon(weaponData);
            const defenderData = TestUtils.createTestDefender({
                toughness: 4,
                Keywords: []
            });
            const defender = new Defender(defenderData);

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.4, 0.6]); // 3, 4 -> beide wunden bei 3+

            try {
                const result = calculator.wounds(weapon, defender, 2);
                assert.strictEqual(result.wounds, 2);
            } finally {
                restoreRandom();
            }
        });

        test("should handle devastating wounds", () => {
            const weaponData = TestUtils.createTestWeapon({
                strength: 4,
                Keywords: ["devastating wounds"]
            });
            const weapon = new Weapon(weaponData);
            const defenderData = TestUtils.createTestDefender({
                toughness: 4,
                Keywords: []
            });
            const defender = new Defender(defenderData);

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.9, 0.6]); // 6 (crit), 4 (normal)

            try {
                const result = calculator.wounds(weapon, defender, 2);
                assert.strictEqual(result.wounds, 1); // Normal wound
                assert.strictEqual(result.damage, 1); // Devastating wound -> mortal wound
            } finally {
                restoreRandom();
            }
        });
    });

    describe("Save Calculation", () => {
        test("should calculate saves correctly", () => {
            const weaponData = TestUtils.createTestWeapon({
                ap: 1
            });
            const weapon = new Weapon(weaponData);
            const defenderData = TestUtils.createTestDefender({
                save: 3,
                invulnerable: 7
            });
            const defender = new Defender(defenderData);

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.5, 0.2, 0.8]); // 4, 2, 5 -> 1 failed save bei 4+

            try {
                const result = calculator.saves(weapon, defender, 3);
                assert.strictEqual(result.failedSaves, 1);
            } finally {
                restoreRandom();
            }
        });

        test("should use invulnerable save when better", () => {
            const weaponData = TestUtils.createTestWeapon({
                ap: 4 // Würde Save auf 7+ verschlechtern
            });
            const weapon = new Weapon(weaponData);
            const defenderData = TestUtils.createTestDefender({
                save: 3,
                invulnerable: 5 // Besser als 7+
            });
            const defender = new Defender(defenderData);

            calculator = new Calculator([], []);

            const restoreRandom = TestUtils.mockRandom([0.6, 0.8]); // 4, 5 -> 1 failed save bei 5+

            try {
                const result = calculator.saves(weapon, defender, 2);
                assert.strictEqual(result.failedSaves, 1);
            } finally {
                restoreRandom();
            }
        });
    });
});
