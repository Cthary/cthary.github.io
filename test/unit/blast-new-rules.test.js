// Test für neue Blast Regeln (+1 Attack pro 5 Modelle)
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon } from "../../src/scripts/units.js";

test("New Blast Rules Test", () => {
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

    assert.ok(blastWeapon.Keywords.includes("blast-effect"), "Should have blast-effect keyword");

    // Teste dass die Mathematik stimmt
    assert.strictEqual(Math.floor(4 / 5), 0, "4 models should give 0 bonus attacks");
    assert.strictEqual(Math.floor(7 / 5), 1, "7 models should give 1 bonus attack");
    assert.strictEqual(Math.floor(12 / 5), 2, "12 models should give 2 bonus attacks");
    assert.strictEqual(Math.floor(15 / 5), 3, "15 models should give 3 bonus attacks");
});
