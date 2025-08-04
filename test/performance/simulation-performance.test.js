import { test, describe } from "node:test";
import { strict as assert } from "assert";
import { Simulator } from "../../src/scripts/w40k.js";
import { Weapon, Defender } from "../../src/scripts/units.js";
import { TestUtils } from "../test-utils.js";

describe("Performance Tests", () => {
    test("should complete 1000 simulations in reasonable time", async () => {
        const startTime = performance.now();

        const weapon = new Weapon(TestUtils.createTestWeapon());
        const defender = new Defender(TestUtils.createTestDefender());
        const simulator = new Simulator(1000);

        const results = simulator.simulateAmount(weapon, defender, 1000);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Should complete within 5 seconds
        assert.ok(duration < 5000, `Simulation took ${duration}ms, should be < 5000ms`);
        assert.strictEqual(results.length, 1000);

        // Validate all results are valid
        results.forEach((result, index) => {
            assert.ok(Array.isArray(result), `Result ${index} should be an array`);
            assert.ok(result.length > 0, `Result ${index} should not be empty`);
            assert.ok(typeof result[0].hits === "number", `Result ${index} hits should be a number`);
            assert.ok(typeof result[0].wounds === "number", `Result ${index} wounds should be a number`);
        });
    });

    test("should handle large-scale simulation efficiently", async () => {
        const startTime = performance.now();

        // Create a more complex scenario
        const weapons = [
            new Weapon(TestUtils.createTestWeapon({
                name: "Weapon 1",
                attacks: "D6+2",
                Keywords: ["lethal hits", "sustained hits 1"]
            })),
            new Weapon(TestUtils.createTestWeapon({
                name: "Weapon 2",
                attacks: "2D3",
                Keywords: ["devastating wounds"]
            }))
        ];

        const defenders = [
            new Defender(TestUtils.createTestDefender({ models: 10 })),
            new Defender(TestUtils.createTestDefender({
                Name: "Heavy Infantry",
                toughness: 6,
                wounds: 3,
                save: 3,
                models: 5
            }))
        ];

        const simulator = new Simulator(100);
        let totalResults = 0;

        // Run simulations for all weapon-defender combinations
        for (const weapon of weapons) {
            for (const defender of defenders) {
                const results = simulator.simulateAmount(weapon, defender, 100);
                totalResults += results.length;
            }
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Should handle complex scenarios efficiently
        assert.ok(duration < 3000, `Complex simulation took ${duration}ms, should be < 3000ms`);
        assert.strictEqual(totalResults, 400); // 2 weapons × 2 defenders × 100 simulations
    });

    test("should maintain consistent performance across multiple runs", async () => {
        const weapon = new Weapon(TestUtils.createTestWeapon());
        const defender = new Defender(TestUtils.createTestDefender());
        const simulator = new Simulator(100);

        const durations = [];
        const numRuns = 5;

        for (let i = 0; i < numRuns; i++) {
            const startTime = performance.now();
            simulator.simulateAmount(weapon, defender, 100);
            const endTime = performance.now();
            durations.push(endTime - startTime);
        }

        const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);

        // Performance should be consistent (max shouldn't be more than 3x min)
        const performanceVariation = maxDuration / minDuration;
        assert.ok(performanceVariation < 3,
            `Performance too inconsistent: ${performanceVariation}x variation (${minDuration}ms - ${maxDuration}ms)`);

        // Average should be reasonable
        assert.ok(averageDuration < 1000, `Average duration ${averageDuration}ms should be < 1000ms`);
    });

    test("should handle memory efficiently with large datasets", () => {
        const initialMemory = process.memoryUsage();

        const weapon = new Weapon(TestUtils.createTestWeapon({
            attacks: "10D6",
            Keywords: ["sustained hits D3", "lethal hits"]
        }));
        const defender = new Defender(TestUtils.createTestDefender({ models: 20 }));
        const simulator = new Simulator(500);

        // Run a memory-intensive simulation
        const results = simulator.simulateAmount(weapon, defender, 500);

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        // Memory increase should be reasonable (less than 50MB for this test)
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
        assert.ok(memoryIncreaseMB < 50,
            `Memory increase ${memoryIncreaseMB}MB should be < 50MB`);

        // Results should still be valid
        assert.strictEqual(results.length, 500);
        assert.ok(results.every(r => Array.isArray(r) && r.length > 0));
    });

    test("should scale linearly with simulation count", async () => {
        const weapon = new Weapon(TestUtils.createTestWeapon());
        const defender = new Defender(TestUtils.createTestDefender());

        const testCases = [10, 50, 100, 200];
        const durations = [];

        for (const count of testCases) {
            const simulator = new Simulator(count);
            const startTime = performance.now();
            simulator.simulateAmount(weapon, defender, count);
            const endTime = performance.now();
            durations.push(endTime - startTime);
        }

        // Check that duration scales roughly linearly
        // Duration for 200 simulations should not be more than 25x duration for 10
        const scalingFactor = durations[3] / durations[0]; // 200 vs 10
        assert.ok(scalingFactor < 25,
            `Poor scaling: ${scalingFactor}x for 20x more simulations`);

        // Each step should be reasonably proportional
        for (let i = 1; i < durations.length; i++) {
            const expectedRatio = testCases[i] / testCases[i - 1];
            const actualRatio = durations[i] / durations[i - 1];

            // Allow for some variation but should be roughly proportional
            assert.ok(actualRatio < expectedRatio * 2,
                `Poor scaling between ${testCases[i - 1]} and ${testCases[i]} simulations`);
        }
    });

    test("should handle edge cases without performance degradation", async () => {
        const testCases = [
            {
                name: "High damage weapon",
                weapon: TestUtils.createTestWeapon({
                    attacks: "10",
                    damage: "10D6+20"
                })
            },
            {
                name: "Many keywords",
                weapon: TestUtils.createTestWeapon({
                    Keywords: [
                        "lethal hits", "sustained hits 2", "devastating wounds",
                        "twin-linked", "rapid fire 3", "melta 4", "+1 hit", "+1 wound"
                    ]
                })
            },
            {
                name: "High model count",
                defender: TestUtils.createTestDefender({ models: 50 })
            }
        ];

        for (const testCase of testCases) {
            const startTime = performance.now();

            const weapon = new Weapon(testCase.weapon || TestUtils.createTestWeapon());
            const defender = new Defender(testCase.defender || TestUtils.createTestDefender());
            const simulator = new Simulator(100);

            const results = simulator.simulateAmount(weapon, defender, 100);

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Edge cases should still complete in reasonable time
            assert.ok(duration < 2000,
                `${testCase.name} took ${duration}ms, should be < 2000ms`);
            assert.strictEqual(results.length, 100);
        }
    });
});
