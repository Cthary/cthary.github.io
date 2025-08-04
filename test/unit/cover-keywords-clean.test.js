// Test für Cover und Ignores Cover Keywords
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Defender } from "../../src/scripts/units.js";

test("Cover and Ignores Cover Keywords", (t) => {
    t.test("should recognize cover keyword on defender", () => {
        const defender = new Defender({
            Name: "Cover Unit",
            type: "infantry",
            toughness: 4,
            wounds: 1,
            models: 5,
            save: 4,
            invulnerable: 7,
            Keywords: ["cover"]
        });

        assert.ok(defender.Keywords.includes("cover"), "Should have cover keyword");
    });
});
