// Test Anti-X Keywords ohne + Zeichen
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon } from "../../src/scripts/units.js";

test("Anti-X Keywords ohne + sollten funktionieren", (t) => {
    t.test("should handle 'anti-vehicle 5' (ohne +)", () => {
        const weapon = new Weapon({
            name: "Anti-Vehicle Weapon",
            type: "Ranged",
            attacks: "1",
            to_hit: 4,
            strength: 8,
            ap: 2,
            damage: "D6",
            Keywords: ["anti-vehicle 5"]
        });

        assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 keyword");
        assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
    });

    t.test("should handle 'anti-infantry 4' (ohne +)", () => {
        const weapon = new Weapon({
            name: "Anti-Infantry Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 3,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: ["anti-infantry 4"]
        });

        assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 keyword");
        assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
    });

    t.test("should handle mixed Anti-X keywords with and without +", () => {
        const weapon = new Weapon({
            name: "Mixed Anti Weapon",
            type: "Ranged",
            attacks: "3",
            to_hit: 4,
            strength: 6,
            ap: 1,
            damage: "2",
            Keywords: ["anti-vehicle 5+", "anti-infantry 4", "anti-monster 3"]
        });

        assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 for anti-vehicle 5+");
        assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 for anti-infantry 4");
        assert.ok(weapon.Keywords.includes("CritWound3"), "Should add CritWound3 for anti-monster 3");
        assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
        assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
        assert.ok(weapon.Keywords.includes("Anti-monster"), "Should add Anti-monster marker");
    });

    t.test("should handle case-insensitive Anti-X keywords ohne +", () => {
        const weapon = new Weapon({
            name: "Case Test Weapon",
            type: "Ranged",
            attacks: "1",
            to_hit: 4,
            strength: 7,
            ap: 1,
            damage: "2",
            Keywords: ["ANTI-VEHICLE 6", "Anti-Infantry 5", "anti-monster 4"]
        });

        assert.ok(weapon.Keywords.includes("CritWound6"), "Should add CritWound6 for ANTI-VEHICLE 6");
        assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 for Anti-Infantry 5");
        assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 for anti-monster 4");
        assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
        assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
        assert.ok(weapon.Keywords.includes("Anti-monster"), "Should add Anti-monster marker");
    });
});
