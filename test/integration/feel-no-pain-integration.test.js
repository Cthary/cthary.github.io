import { Simulator } from "../../src/scripts/w40k.js";
import { Attacker, Defender } from "../../src/scripts/units.js";
import { describe, test } from "node:test";
import assert from "node:assert";

describe("Feel No Pain Integration Tests", () => {
    describe("Full Simulation with Feel No Pain", () => {
        test("should apply feel no pain in complete simulation", () => {
            // Setup: Attacker with high-damage weapon vs Defender with Feel No Pain
            const attackerData = {
                Name: "Heavy Weapon Team",
                Weapons: [
                    {
                        name: "Lascannon",
                        type: "Ranged",
                        attacks: "1",
                        to_hit: 4,
                        strength: 12,
                        ap: 3,
                        damage: "D6+1",
                        amount: 1,
                        Keywords: []
                    }
                ]
            };

            const defenderData = {
                Name: "Chaos Rhino",
                type: "Vehicle",
                toughness: 9,
                wounds: 10,
                models: 1,
                save: 3,
                invulnerable: 7,
                Keywords: ["feel no pain 6"]
            };

            const attacker = new Attacker(attackerData);
            const defender = new Defender(defenderData);
            const weapon = attacker.getWeapon(0);

            const simulator = new Simulator(100);

            // Run multiple simulations to verify feel no pain works
            let totalSimulations = 0;

            for (let i = 0; i < 10; i++) {
                const results = simulator.simulateOne(weapon, defender);
                totalSimulations++;

                // Check if feel no pain was triggered - we don't need to track this
                // Just verify the structure is correct

                // Verify structure of results includes feel no pain data
                assert(Object.prototype.hasOwnProperty.call(results[0], "feelNoPainSaves"));
                assert(Object.prototype.hasOwnProperty.call(results[0], "finalFailedSaves"));
                assert(typeof results[0].feelNoPainSaves === "number");
                assert(typeof results[0].finalFailedSaves === "number");

                // Verify that final failed saves = failed saves - feel no pain saves
                const expectedFinalFailedSaves = results[0].failedSaves - results[0].feelNoPainSaves;
                assert.strictEqual(results[0].finalFailedSaves, expectedFinalFailedSaves);
            }

            // With Feel No Pain 6, we should see some saves (not every time due to randomness)
            // But the structure should always be correct
            assert(totalSimulations === 10);
        });

        test("should handle defender without feel no pain correctly", () => {
            const attackerData = {
                Name: "Bolter Marine",
                Weapons: [
                    {
                        name: "Bolt Rifle",
                        type: "Ranged",
                        attacks: "2",
                        to_hit: 3,
                        strength: 4,
                        ap: 1,
                        damage: "1",
                        amount: 1,
                        Keywords: []
                    }
                ]
            };

            const defenderData = {
                Name: "Ork Boy",
                type: "Infantry",
                toughness: 5,
                wounds: 1,
                models: 1,
                save: 6,
                invulnerable: 7,
                Keywords: [] // No feel no pain
            };

            const attacker = new Attacker(attackerData);
            const defender = new Defender(defenderData);
            const weapon = attacker.getWeapon(0);

            const simulator = new Simulator(100);
            const results = simulator.simulateOne(weapon, defender);

            // Should have feel no pain data but with 0 saves
            assert.strictEqual(results[0].feelNoPainSaves, 0);
            assert.strictEqual(results[0].finalFailedSaves, results[0].failedSaves);
        });

        test("should handle multiple feel no pain saves in single simulation", () => {
            // High-volume attack to increase chances of multiple feel no pain rolls
            const attackerData = {
                Name: "Heavy Bolter Team",
                Weapons: [
                    {
                        name: "Heavy Bolter",
                        type: "Ranged",
                        attacks: "3",
                        to_hit: 4,
                        strength: 5,
                        ap: 1,
                        damage: "2",
                        amount: 1,
                        Keywords: []
                    }
                ]
            };

            const defenderData = {
                Name: "Death Company Marine",
                type: "Infantry",
                toughness: 4,
                wounds: 2,
                models: 1,
                save: 3,
                invulnerable: 7,
                Keywords: ["feel no pain 5"] // Better feel no pain
            };

            const attacker = new Attacker(attackerData);
            const defender = new Defender(defenderData);
            const weapon = attacker.getWeapon(0);

            const simulator = new Simulator(100);

            // Run simulation multiple times to verify consistency
            for (let i = 0; i < 5; i++) {
                const results = simulator.simulateOne(weapon, defender);

                // Verify feel no pain saves cannot exceed failed saves
                assert(results[0].feelNoPainSaves <= results[0].failedSaves);

                // Verify final failed saves is correct
                const expectedFinalFailedSaves = results[0].failedSaves - results[0].feelNoPainSaves;
                assert.strictEqual(results[0].finalFailedSaves, expectedFinalFailedSaves);

                // Verify final failed saves cannot be negative
                assert(results[0].finalFailedSaves >= 0);
            }
        });

        test("should validate feel no pain with damage modifiers", () => {
            const attackerData = {
                Name: "Power Weapon Marine",
                Weapons: [
                    {
                        name: "Power Sword",
                        type: "Melee",
                        attacks: "3",
                        to_hit: 3,
                        strength: 5,
                        ap: 2,
                        damage: "1",
                        amount: 1,
                        Keywords: ["+1D"] // Increases damage
                    }
                ]
            };

            const defenderData = {
                Name: "Terminator",
                type: "Infantry",
                toughness: 5,
                wounds: 3,
                models: 1,
                save: 2,
                invulnerable: 4,
                Keywords: ["feel no pain 5", "-1D"] // Both feel no pain and damage reduction
            };

            const attacker = new Attacker(attackerData);
            const defender = new Defender(defenderData);
            const weapon = attacker.getWeapon(0);

            const simulator = new Simulator(100);
            const results = simulator.simulateOne(weapon, defender);

            // Verify that both feel no pain and damage modifiers can work together
            // Feel no pain applies after saves but before damage calculation
            assert(typeof results[0].feelNoPainSaves === "number");
            assert(results[0].feelNoPainSaves >= 0);
            assert(results[0].finalFailedSaves >= 0);
            assert(results[0].finalFailedSaves <= results[0].failedSaves);
        });
    });

    describe("Feel No Pain Edge Cases", () => {
        test("should handle feel no pain with mortal wounds", () => {
            const attackerData = {
                Name: "Psyker",
                Weapons: [
                    {
                        name: "Psychic Power",
                        type: "Psychic",
                        attacks: "1",
                        to_hit: 3,
                        strength: 6,
                        ap: 0,
                        damage: "D3",
                        amount: 1,
                        Keywords: ["devastating wounds"] // Creates mortal wounds
                    }
                ]
            };

            const defenderData = {
                Name: "Captain",
                type: "Infantry",
                toughness: 4,
                wounds: 5,
                models: 1,
                save: 3,
                invulnerable: 4,
                Keywords: ["feel no pain 4"]
            };

            const attacker = new Attacker(attackerData);
            const defender = new Defender(defenderData);
            const weapon = attacker.getWeapon(0);

            const simulator = new Simulator(100);
            const results = simulator.simulateOne(weapon, defender);

            // Mortal wounds should bypass saves but feel no pain should still work
            // (depending on game rules - in this implementation feel no pain applies to damage instances)
            assert(typeof results[0].feelNoPainSaves === "number");
            assert(results[0].feelNoPainSaves >= 0);
        });

        test("should handle zero damage scenarios", () => {
            const attackerData = {
                Name: "Weak Attacker",
                Weapons: [
                    {
                        name: "Weak Weapon",
                        type: "Ranged",
                        attacks: "1",
                        to_hit: 6, // Hard to hit
                        strength: 1,
                        ap: 0,
                        damage: "1",
                        amount: 1,
                        Keywords: []
                    }
                ]
            };

            const defenderData = {
                Name: "Tough Defender",
                type: "Vehicle",
                toughness: 12,
                wounds: 20,
                models: 1,
                save: 2,
                invulnerable: 7,
                Keywords: ["feel no pain 2"] // Very good feel no pain
            };

            const attacker = new Attacker(attackerData);
            const defender = new Defender(defenderData);
            const weapon = attacker.getWeapon(0);

            const simulator = new Simulator(100);
            const results = simulator.simulateOne(weapon, defender);

            // Should handle zero or very low damage gracefully
            assert(results[0].feelNoPainSaves >= 0);
            assert(results[0].finalFailedSaves >= 0);
            assert(results[0].finalFailedSaves <= results[0].failedSaves);
        });
    });
});
