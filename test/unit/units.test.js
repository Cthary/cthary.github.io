import { test, describe } from "node:test";
import { strict as assert } from "assert";
import { Attacker, Defender, Weapon } from "../../src/scripts/units.js";
import { TestUtils } from "../test-utils.js";

describe("Attacker Class", () => {
    test("should create an Attacker from JSON", () => {
        const attackerData = TestUtils.createTestAttacker({
            Weapons: [TestUtils.createTestWeapon()]
        });

        const attacker = new Attacker(attackerData);

        assert.strictEqual(attacker.Name, "Test Attacker");
        assert.strictEqual(attacker.Weapons.length, 1);
    });

    test("should get weapon by index", () => {
        const weaponData = TestUtils.createTestWeapon({ name: "Bolter" });
        const attackerData = TestUtils.createTestAttacker({
            Weapons: [weaponData]
        });

        const attacker = new Attacker(attackerData);
        const weapon = attacker.getWeapon(0);

        assert.ok(weapon instanceof Weapon);
        assert.strictEqual(weapon.name, "Bolter");
    });
});

describe("Defender Class", () => {
    test("should create a Defender from JSON", () => {
        const defenderData = TestUtils.createTestDefender({
            models: 10,
            toughness: 5,
            Keywords: ["-1 to hit"]
        });

        const defender = new Defender(defenderData);

        assert.strictEqual(defender.Name, "Test Defender");
        assert.strictEqual(defender.models, 10);
        assert.strictEqual(defender.toughness, 5);
        assert.strictEqual(defender.kills, 0);
        assert.ok(defender.Keywords.includes("-1 to hit"));
    });

    test("should handle missing Keywords array", () => {
        const defenderData = TestUtils.createTestDefender();
        delete defenderData.Keywords;

        const defender = new Defender(defenderData);

        assert.ok(Array.isArray(defender.Keywords));
        assert.strictEqual(defender.Keywords.length, 0);
    });
});

describe("Weapon Class", () => {
    test("should create a Weapon from JSON", () => {
        const weaponData = TestUtils.createTestWeapon({
            name: "Heavy Bolter",
            strength: 5,
            ap: 1,
            Keywords: ["sustained hits 1"]
        });

        const weapon = new Weapon(weaponData);

        assert.strictEqual(weapon.name, "Heavy Bolter");
        assert.strictEqual(weapon.strength, 5);
        assert.strictEqual(weapon.ap, 1);
        assert.ok(weapon.Keywords.includes("sustained hits 1"));
    });

    test("should parse +1 to hit keywords", () => {
        const weaponData = TestUtils.createTestWeapon({
            to_hit: 4,
            Keywords: ["+1 to hit"]
        });

        const weapon = new Weapon(weaponData);

        // +1 to hit sollte to_hit von 4 auf 3 reduzieren
        assert.strictEqual(weapon.to_hit, 3);
    });

    test("should parse -1 to hit keywords", () => {
        const weaponData = TestUtils.createTestWeapon({
            to_hit: 4,
            Keywords: ["-1 to hit"]
        });

        const weapon = new Weapon(weaponData);

        // -1 to hit sollte to_hit von 4 auf 5 erhöhen
        assert.strictEqual(weapon.to_hit, 5);
    });

    test("should parse +1 to wound keywords", () => {
        const weaponData = TestUtils.createTestWeapon({
            Keywords: ["+1 to wound"]
        });

        const weapon = new Weapon(weaponData);

        // +1 to wound sollte als WoundBonus+1 markiert werden
        assert.ok(weapon.Keywords.includes("WoundBonus+1"));
    });

    test("should parse -1 to wound keywords", () => {
        const weaponData = TestUtils.createTestWeapon({
            Keywords: ["-1 to wound"]
        });

        const weapon = new Weapon(weaponData);

        // -1 to wound sollte als WoundPenalty-1 markiert werden
        assert.ok(weapon.Keywords.includes("WoundPenalty-1"));
    });

    test("should parse sustained hits keywords", () => {
        const testCases = [
            { keyword: "sustained hits 1", expected: "1" },
            { keyword: "sustained hits 2", expected: "2" },
            { keyword: "sustained hits D3", expected: "D3" },
            { keyword: "SUSTAINED HITS 1", expected: "1" }
        ];

        testCases.forEach(({ keyword, expected }) => {
            const weaponData = TestUtils.createTestWeapon({
                Keywords: [keyword]
            });

            const weapon = new Weapon(weaponData);

            assert.strictEqual(weapon.sustainedHits, expected, `Should parse "${keyword}" correctly`);
        });
    });

    test("should parse rapid fire keywords", () => {
        const weaponData = TestUtils.createTestWeapon({
            attacks: "2",
            Keywords: ["rapid fire 1"]
        });

        const weapon = new Weapon(weaponData);

        // Rapid fire sollte +1 Attack hinzufügen
        assert.strictEqual(weapon.attacks, "3");
    });

    test("should parse melta keywords", () => {
        const weaponData = TestUtils.createTestWeapon({
            damage: "2",
            Keywords: ["melta 2"]
        });

        const weapon = new Weapon(weaponData);

        // Melta sollte +2 Damage hinzufügen
        assert.strictEqual(weapon.damage, "4");
    });

    test("should parse anti-X keywords", () => {
        const weaponData = TestUtils.createTestWeapon({
            Keywords: ["anti-INFANTRY 4+"]
        });

        const weapon = new Weapon(weaponData);

        // Anti-X sollte CritWound4 hinzufügen, nicht CritHit4
        assert.ok(weapon.Keywords.includes("CritWound4"));
        assert.ok(weapon.Keywords.includes("Anti-infantry"));
    });

    test("should handle lance keyword", () => {
        const weaponData = TestUtils.createTestWeapon({
            type: "Melee",
            ap: 0,
            Keywords: ["lance"]
        });

        const weapon = new Weapon(weaponData);

        // Lance sollte +1 wound hinzufügen und AP erhöhen
        assert.ok(weapon.Keywords.includes("+1 wound"));
        assert.strictEqual(weapon.ap, 1);
    });

    test("should handle twin-linked keyword", () => {
        const weaponData = TestUtils.createTestWeapon({
            Keywords: ["twin-linked"]
        });

        const weapon = new Weapon(weaponData);

        // Twin-linked sollte RWMiss hinzufügen
        assert.ok(weapon.Keywords.includes("RWMiss"));
    });

    test("should handle lethal hits keyword", () => {
        const weaponData = TestUtils.createTestWeapon({
            Keywords: ["lethal hits"]
        });

        const weapon = new Weapon(weaponData);

        assert.strictEqual(weapon.lethalHits, true);
    });

    test("should handle devastating wounds keyword", () => {
        const weaponData = TestUtils.createTestWeapon({
            Keywords: ["devastating wounds"]
        });

        const weapon = new Weapon(weaponData);

        assert.strictEqual(weapon.devastatingWounds, true);
    });

    test("should handle damage reduction keywords", () => {
        const testCases = [
            { keyword: "-1D", expected: "-1 dmg" },
            { keyword: "/2D", expected: "halve damage" }
        ];

        testCases.forEach(({ keyword, expected }) => {
            const weaponData = TestUtils.createTestWeapon({
                Keywords: [keyword]
            });

            const weapon = new Weapon(weaponData);

            assert.ok(weapon.Keywords.includes(expected), `Should convert "${keyword}" to "${expected}"`);
        });
    });

    test("should get attacks as dice roll", () => {
        const weaponData = TestUtils.createTestWeapon({
            attacks: "D6"
        });

        const weapon = new Weapon(weaponData);
        const attacks = weapon.getAttacks();

        assert.ok(typeof attacks === "number");
        assert.ok(attacks >= 1 && attacks <= 6);
    });

    test("should get damage as dice roll", () => {
        const weaponData = TestUtils.createTestWeapon({
            damage: "2D3"
        });

        const weapon = new Weapon(weaponData);
        const damage = weapon.getDamage();

        assert.ok(typeof damage === "number");
        assert.ok(damage >= 2 && damage <= 6);
    });

    test("should handle addToValue utility function", () => {
        const weaponData = TestUtils.createTestWeapon();
        const weapon = new Weapon(weaponData);

        // Test mit String-Werten
        assert.strictEqual(weapon.addToValue("5", 2), "7");
        assert.strictEqual(weapon.addToValue("D6", 3), "D6+3");
        assert.strictEqual(weapon.addToValue("2D3+1", 2), "2D3+3");

        // Test mit Number-Werten
        assert.strictEqual(weapon.addToValue(5, 2), 7);
    });

    test("should handle multiple keyword combinations", () => {
        const weaponData = TestUtils.createTestWeapon({
            to_hit: 4,
            Keywords: ["+1 to hit", "lethal hits", "sustained hits 1", "+1 to wound"]
        });

        const weapon = new Weapon(weaponData);

        assert.strictEqual(weapon.to_hit, 3); // +1 to hit
        assert.strictEqual(weapon.lethalHits, true);
        assert.strictEqual(weapon.sustainedHits, "1");
        assert.ok(weapon.Keywords.includes("WoundBonus+1"));
    });
});
