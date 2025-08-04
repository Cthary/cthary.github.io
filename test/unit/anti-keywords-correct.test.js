// Test für korrigierte Anti-X Keywords (Critical Wounds statt Critical Hits)
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon } from "../../src/scripts/units.js";

test("Anti-X Keywords sollten Critical Wounds verursachen", (t) => {
    t.test("should create CritWound keywords instead of CritHit", () => {
        const weapon = new Weapon({
            name: "Anti-Vehicle Weapon",
            type: "Ranged",
            attacks: "1",
            to_hit: 4,
            strength: 8,
            ap: 2,
            damage: "D6",
            Keywords: ["anti-vehicle 5+"]
        });

        assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 keyword");
        assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
        assert.ok(!weapon.Keywords.some(k => k.startsWith("CritHit")), "Should NOT add CritHit keywords");
    });

    t.test("should work with defender type matching", () => {
        const weapon = new Weapon({
            name: "Anti-Infantry Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 3,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: ["anti-infantry 4+"]
        });

        assert.ok(weapon.Keywords.includes("CritWound4"), "Should have CritWound4 keyword");
        assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should have Anti-infantry marker");
    });

    t.test("should handle case-insensitive anti keywords", () => {
        const weapon = new Weapon({
            name: "Case Test Weapon",
            type: "Ranged",
            attacks: "1",
            to_hit: 4,
            strength: 7,
            ap: 1,
            damage: "2",
            Keywords: ["ANTI-VEHICLE 6", "Anti-Infantry 5", "anti-monster 4+"]
        });

        assert.ok(weapon.Keywords.includes("CritWound6"), "Should add CritWound6 for ANTI-VEHICLE 6");
        assert.ok(weapon.Keywords.includes("CritWound5"), "Should add CritWound5 for Anti-Infantry 5");
        assert.ok(weapon.Keywords.includes("CritWound4"), "Should add CritWound4 for anti-monster 4+");

        assert.ok(weapon.Keywords.includes("Anti-vehicle"), "Should add Anti-vehicle marker");
        assert.ok(weapon.Keywords.includes("Anti-infantry"), "Should add Anti-infantry marker");
        assert.ok(weapon.Keywords.includes("Anti-monster"), "Should add Anti-monster marker");
    });
});
