// Simple test for keyword parsing
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon } from "../../src/scripts/units.js";

test("Simple Cover Test", (t) => {
    t.test("basic weapon creation", () => {
        const weapon = new Weapon({
            name: "Test Weapon",
            type: "Ranged",
            attacks: "1",
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: []
        });
        assert.ok(weapon.name === "Test Weapon");
    });

    t.test("ignores cover keyword", () => {
        const weapon = new Weapon({
            name: "Cover-Ignoring Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 4,
            strength: 4,
            ap: 1,
            damage: "1",
            Keywords: ["ignores cover"]
        });

        assert.ok(weapon.Keywords.includes("ignores-cover-effect"), "Should have ignores-cover-effect keyword");
    });
});
