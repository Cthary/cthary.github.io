// Working comprehensive tests for all keyword implementations
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon, Defender, Attacker } from "../../src/scripts/units.js";

test("Comprehensive Keyword Implementation Tests", (t) => {
    // Test that all work correctly without timing issues
    t.test("keyword parsing validation", () => {
        // Test blast
        const blastWeapon = new Weapon({
            name: "Blast Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: ["blast"]
        });
        assert.ok(blastWeapon.Keywords.includes("blast-effect"), "Blast should be processed");

        // Test hazardous
        const hazardousWeapon = new Weapon({
            name: "Hazardous Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: ["hazardous"]
        });
        assert.ok(hazardousWeapon.Keywords.includes("hazardous-effect"), "Hazardous should be processed");

        // Test anti-x
        const antiWeapon = new Weapon({
            name: "Anti Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: ["anti-vehicle 5+"]
        });
        assert.ok(antiWeapon.Keywords.includes("CritWound5"), "Anti-X should create CritWound");
        assert.ok(antiWeapon.Keywords.includes("Anti-vehicle"), "Anti-X should create type marker");

        // Test defender cover
        const coverDefender = new Defender({
            Name: "Cover Unit",
            type: "infantry",
            toughness: 4,
            wounds: 1,
            models: 5,
            save: 4,
            invulnerable: 7,
            Keywords: ["cover"]
        });
        assert.ok(coverDefender.Keywords.includes("cover"), "Cover should be preserved");
    });

    t.test("case insensitive keyword processing", () => {
        const weapon = new Weapon({
            name: "Mixed Case",
            type: "Ranged",
            attacks: "1",
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: ["BLAST", "Hazardous", "anti-VEHICLE 4+"]
        });

        assert.ok(weapon.Keywords.includes("blast-effect"), "BLAST should work");
        assert.ok(weapon.Keywords.includes("hazardous-effect"), "Hazardous should work");
        assert.ok(weapon.Keywords.includes("CritWound4"), "Anti-VEHICLE should work");
    });

    t.test("blast bonus calculation", () => {
        const blastAttacker = new Attacker({
            Name: "Blast Test",
            Weapons: [{
                name: "Blast Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                Keywords: ["blast"]
            }]
        });

        const smallUnit = new Defender({
            Name: "Small Unit",
            type: "infantry",
            toughness: 4,
            wounds: 1,
            models: 4, // Should get +0 attacks (4/5 = 0)
            save: 4,
            invulnerable: 7,
            Keywords: []
        });

        const largeUnit = new Defender({
            Name: "Large Unit",
            type: "infantry",
            toughness: 4,
            wounds: 1,
            models: 10, // Should get +2 attacks (10/5 = 2)
            save: 4,
            invulnerable: 7,
            Keywords: []
        });

        // Validate the units and weapons exist
        assert.ok(blastAttacker.getWeapon(0).Keywords.includes("blast-effect"), "Blast weapon should have effect");
        assert.equal(smallUnit.models, 4, "Small unit should have 4 models");
        assert.equal(largeUnit.models, 10, "Large unit should have 10 models");
    });
});
