// Test just Dice import
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Dice } from "../../src/scripts/dice.js";

test("Dice Import Test", (t) => {
    t.test("create dice", () => {
        const dice = new Dice();
        assert.ok(dice !== null);
    });
    
    t.test("parse and roll", () => {
        const dice = new Dice();
        const result = dice.parseAndRoll("1");
        assert.ok(result >= 1);
    });
});
