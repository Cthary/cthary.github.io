import { Weapon } from "../../src/scripts/units.js";
import { describe, test } from "node:test";
import assert from "node:assert";

describe("Case-Insensitive Keywords Tests", () => {
    describe("Lethal Hits Case Sensitivity", () => {
        test("should recognize 'lethal hits' (lowercase)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["lethal hits"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.lethalHits, true);
        });

        test("should recognize 'Lethal Hits' (title case)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["Lethal Hits"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.lethalHits, true);
        });

        test("should recognize 'LETHAL HITS' (uppercase)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["LETHAL HITS"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.lethalHits, true);
        });

        test("should recognize 'LeThaL hItS' (mixed case)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["LeThaL hItS"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.lethalHits, true);
        });

        test("should not recognize 'lethal hit' (singular)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["lethal hit"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.lethalHits, false);
        });
    });

    describe("Devastating Wounds Case Sensitivity", () => {
        test("should recognize 'devastating wounds' (lowercase)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["devastating wounds"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.devastatingWounds, true);
        });

        test("should recognize 'Devastating Wounds' (title case)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["Devastating Wounds"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.devastatingWounds, true);
        });

        test("should recognize 'DEVASTATING WOUNDS' (uppercase)", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["DEVASTATING WOUNDS"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.devastatingWounds, true);
        });
    });

    describe("Mixed Keywords", () => {
        test("should handle multiple case-insensitive keywords", () => {
            const weaponData = {
                name: "Test Weapon",
                type: "Ranged",
                attacks: "2",
                to_hit: 4,
                strength: 4,
                ap: 0,
                damage: "1",
                amount: 1,
                Keywords: ["Lethal Hits", "DEVASTATING WOUNDS", "sustained hits 1"]
            };

            const weapon = new Weapon(weaponData);
            assert.strictEqual(weapon.lethalHits, true);
            assert.strictEqual(weapon.devastatingWounds, true);
            assert.strictEqual(weapon.sustainedHits, "1");
        });
    });
});
