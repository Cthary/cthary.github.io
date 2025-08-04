// Test für Torrent Funktionalität
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Weapon, Defender } from "../../src/scripts/units.js";
import { Calculator } from "../../src/scripts/w40k.js";

test("Torrent Keyword Functionality", () => {
    const torrentWeapon = new Weapon({
        name: "Torrent Flamer",
        type: "Ranged",
        attacks: "D6",
        to_hit: 4,
        strength: 5,
        ap: 0,
        damage: "1",
        Keywords: ["torrent"]
    });

    const defender = new Defender({
        Name: "Target Unit",
        type: "infantry",
        toughness: 4,
        wounds: 1,
        models: 5,
        save: 4,
        invulnerable: 7,
        Keywords: []
    });

    const calculator = new Calculator([torrentWeapon], [defender]);

    // Bei Torrent sollten alle Attacks automatisch treffen
    // Verwende eine feste Zahl für deterministische Tests
    torrentWeapon.attacks = "6"; // Überschreibe für Test

    const hitResult = calculator.hits(torrentWeapon, defender);

    // Mit Torrent sollten alle 6 Attacks treffen
    assert.strictEqual(hitResult.hits, 6, "All attacks should auto-hit with torrent");
    assert.ok(torrentWeapon.Keywords.includes("torrent-effect"), "Should have torrent-effect keyword");
});
