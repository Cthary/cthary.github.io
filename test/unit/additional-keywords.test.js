// Test für zusätzliche 10th Edition Keywords
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon } from "../../src/scripts/units.js";

test("Additional 10th Edition Keywords", (t) => {
    t.test("should recognize torrent keyword", () => {
        const weapon = new Weapon({
            name: "Torrent Weapon",
            type: "Ranged",
            attacks: "D6",
            to_hit: 4,
            strength: 5,
            ap: 0,
            damage: "1",
            Keywords: ["torrent"]
        });

        assert.ok(weapon.Keywords.includes("torrent-effect"), "Should have torrent-effect keyword");
    });

    t.test("should recognize ignores cover keyword", () => {
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

    t.test("should recognize indirect fire keyword", () => {
        const weapon = new Weapon({
            name: "Indirect Weapon",
            type: "Ranged",
            attacks: "D6",
            to_hit: 4,
            strength: 6,
            ap: 1,
            damage: "1",
            Keywords: ["indirect fire"]
        });

        assert.ok(weapon.Keywords.includes("indirect-fire-effect"), "Should have indirect-fire-effect keyword");
    });

    t.test("should recognize psychic keyword", () => {
        const weapon = new Weapon({
            name: "Psychic Power",
            type: "Ranged",
            attacks: "1",
            to_hit: 3,
            strength: 6,
            ap: 2,
            damage: "D3",
            Keywords: ["psychic"]
        });

        assert.ok(weapon.Keywords.includes("psychic-effect"), "Should have psychic-effect keyword");
    });

    t.test("should handle keywords case-insensitively", () => {
        const weapon = new Weapon({
            name: "Mixed Case Weapon",
            type: "Ranged",
            attacks: "2",
            to_hit: 4,
            strength: 5,
            ap: 1,
            damage: "1",
            Keywords: ["TORRENT", "Ignores Cover", "indirect fire", "PSYCHIC"]
        });

        assert.ok(weapon.Keywords.includes("torrent-effect"), "Should recognize TORRENT");
        assert.ok(weapon.Keywords.includes("ignores-cover-effect"), "Should recognize Ignores Cover");
        assert.ok(weapon.Keywords.includes("indirect-fire-effect"), "Should recognize indirect fire");
        assert.ok(weapon.Keywords.includes("psychic-effect"), "Should recognize PSYCHIC");
    });
});
