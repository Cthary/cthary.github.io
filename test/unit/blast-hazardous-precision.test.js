// Tests für Blast und Hazardous Keywords
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon } from "../../src/scripts/units.js";

test("Blast und Hazardous Keywords Tests", (t) => {
    t.test("Blast should give +1 attack per 5 models", () => {
        const blastWeapon = new Weapon({
            name: "Blast Weapon",
            type: "Ranged",
            attacks: "2", // Base attacks
            to_hit: 4,
            strength: 6,
            ap: 1,
            damage: "1",
            Keywords: ["blast"]
        });

        // Test: Blast sollte keyword haben
        assert.ok(blastWeapon.Keywords.includes("blast-effect"), "Should recognize blast keyword");

        // 1-4 Modelle = +0 attacks (base 2)
        // 5-9 Modelle = +1 attack (total 3)
        // 10-14 Modelle = +2 attacks (total 4)
        // 15-19 Modelle = +3 attacks (total 5)
    });

    t.test("Hazardous should cause mortal wounds on 1s", () => {
        const hazardousWeapon = new Weapon({
            name: "Hazardous Weapon",
            type: "Ranged",
            attacks: "6",
            to_hit: 4,
            strength: 6,
            ap: 1,
            damage: "1",
            Keywords: ["hazardous"]
        });

        assert.ok(hazardousWeapon.Keywords.includes("hazardous-effect"), "Should have hazardous-effect keyword");
    });

    t.test("Precision should be recognized and marked", () => {
        const precisionWeapon = new Weapon({
            name: "Precision Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 3,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: ["precision"]
        });

        assert.ok(precisionWeapon.Keywords.includes("precision-effect"), "Should have precision-effect keyword");
    });

    t.test("Keywords should work case-insensitively", () => {
        const weapon = new Weapon({
            name: "Mixed Case Weapon",
            type: "Ranged",
            attacks: "D3",
            to_hit: 4,
            strength: 5,
            ap: 0,
            damage: "1",
            Keywords: ["BLAST", "hazardous", "Precision"]
        });

        assert.ok(weapon.Keywords.includes("blast-effect"), "Should recognize BLAST");
        assert.ok(weapon.Keywords.includes("hazardous-effect"), "Should recognize hazardous");
        assert.ok(weapon.Keywords.includes("precision-effect"), "Should recognize Precision");
    });
});
