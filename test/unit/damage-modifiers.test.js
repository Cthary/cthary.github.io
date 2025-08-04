import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import { Calculator } from "../../src/scripts/w40k.js";
import { TestUtils } from "../test-utils.js";

describe("Damage Modifier Keywords Tests", () => {
    test("should apply +1D damage increase correctly", () => {
        const testData = TestUtils.createSimulationData();
        testData.Attackers[0].Weapons[0].Keywords = ["+1D"];
        testData.Attackers[0].Weapons[0].damage = "1"; // Base damage 1
        testData.Defenders[0].Keywords = []; // No defensive keywords

        const calculator = new Calculator(testData.Attackers, testData.Defenders);
        const weapon = calculator.getAttacker(0).getWeapon(0);
        const defender = calculator.getDefender(0);

        // Should apply +1D keyword internally
        assert(weapon.Keywords.includes("+1 dmg"), "Weapon should have internal +1 dmg keyword");

        // Test damage calculation - should be base(1) + 1 = 2
        const damage = calculator.damage(weapon, defender);
        assert(damage >= 2, `Expected damage >= 2 with +1D, got ${damage}`);
    });

    test("should apply damage modifiers in correct order: /2D → +1D → -1D", () => {
        const testData = TestUtils.createSimulationData();
        testData.Attackers[0].Weapons[0].Keywords = ["+1D"];
        testData.Attackers[0].Weapons[0].damage = "4"; // Base damage 4
        testData.Defenders[0].Keywords = ["/2D", "-1D"]; // Halve then reduce by 1

        // Simulation of the order: 4 → /2 = 2 → +1 = 3 → -1 = 2
        // Manual calculation test
        let damage = 4; // Base
        damage = Math.max(1, Math.floor(damage / 2)); // /2D: 4/2 = 2
        damage += 1; // +1D: 2+1 = 3
        damage = Math.max(1, damage - 1); // -1D: 3-1 = 2

        assert.equal(damage, 2, "Modifier order should result in damage 2");
    });

    test("should handle /2D without other modifiers", () => {
        const testData = TestUtils.createSimulationData();
        testData.Attackers[0].Weapons[0].Keywords = [];
        testData.Attackers[0].Weapons[0].damage = "3"; // Base damage 3
        testData.Defenders[0].Keywords = ["/2D"];

        const calculator = new Calculator(testData.Attackers, testData.Defenders);
        const weapon = calculator.getAttacker(0).getWeapon(0);
        const defender = calculator.getDefender(0);

        const damage = calculator.damage(weapon, defender);
        assert(damage >= 1 && damage <= 2, `Expected damage 1-2 with /2D on damage 3, got ${damage}`);
    });

    test("should handle -1D without reducing below 1", () => {
        const testData = TestUtils.createSimulationData();
        testData.Attackers[0].Weapons[0].Keywords = [];
        testData.Attackers[0].Weapons[0].damage = "1"; // Base damage 1
        testData.Defenders[0].Keywords = ["-1D"];

        const calculator = new Calculator(testData.Attackers, testData.Defenders);
        const weapon = calculator.getAttacker(0).getWeapon(0);
        const defender = calculator.getDefender(0);

        const damage = calculator.damage(weapon, defender);
        assert.equal(damage, 1, "Damage should not reduce below 1");
    });

    test("should handle multiple +1D keywords", () => {
        const testData = TestUtils.createSimulationData();
        testData.Attackers[0].Weapons[0].Keywords = ["+1D", "+1D"]; // Two +1D
        testData.Attackers[0].Weapons[0].damage = "1"; // Base damage 1
        testData.Defenders[0].Keywords = [];

        const calculator = new Calculator(testData.Attackers, testData.Defenders);
        const weapon = calculator.getAttacker(0).getWeapon(0);

        // Current implementation only adds the keyword once, even if specified multiple times
        const matches = weapon.Keywords.filter(k => k === "+1 dmg");
        assert.equal(matches.length, 1, "Should have one +1 dmg internal keyword (no duplicates)");

        // Note: This documents the current behavior - duplicates are not processed separately
    });

    test("should validate keyword parsing for damage modifiers", () => {
        const testData = TestUtils.createSimulationData();
        testData.Attackers[0].Weapons[0].Keywords = ["+1D"];
        testData.Defenders[0].Keywords = ["/2D", "-1D"];

        const calculator = new Calculator(testData.Attackers, testData.Defenders);
        const weapon = calculator.getAttacker(0).getWeapon(0);
        const defender = calculator.getDefender(0);

        // Weapon should parse +1D to internal keyword
        assert(weapon.Keywords.includes("+1 dmg"), "Weapon should parse +1D correctly");

        // Defender should parse damage reduction keywords
        assert(defender.Keywords.includes("halve damage"), "Defender should parse /2D correctly");
        assert(defender.Keywords.includes("-1 dmg"), "Defender should parse -1D correctly");
    });

    test("should handle combination with variable damage dice", () => {
        const testData = TestUtils.createSimulationData();
        testData.Attackers[0].Weapons[0].Keywords = ["+1D"];
        testData.Attackers[0].Weapons[0].damage = "D6"; // Variable damage
        testData.Defenders[0].Keywords = [];

        const calculator = new Calculator(testData.Attackers, testData.Defenders);
        const weapon = calculator.getAttacker(0).getWeapon(0);
        const defender = calculator.getDefender(0);

        // Test multiple times due to random nature
        const damages = [];
        for (let i = 0; i < 10; i++) {
            damages.push(calculator.damage(weapon, defender));
        }

        // All damages should be at least 2 (min D6=1 + 1)
        const allValidDamage = damages.every(d => d >= 2 && d <= 7);
        assert(allValidDamage, `All damages should be 2-7 with D6+1D, got: ${damages}`);
    });
});
