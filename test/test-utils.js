import { strict as assert } from 'assert';

/**
 * Test-Utilities für Warhammer 40k Battle Simulator
 */
export class TestUtils {
    /**
     * Erstellt einen Standard-Angreifer für Tests
     */
    static createTestAttacker(overrides = {}) {
        return {
            Name: 'Test Attacker',
            Weapons: [],
            ...overrides
        };
    }

    /**
     * Erstellt eine Standard-Waffe für Tests
     */
    static createTestWeapon(overrides = {}) {
        return {
            name: 'Test Weapon',
            type: 'Ranged',
            attacks: '2',
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: '1',
            amount: 1,
            Keywords: [],
            ...overrides
        };
    }

    /**
     * Erstellt einen Standard-Verteidiger für Tests
     */
    static createTestDefender(overrides = {}) {
        return {
            Name: 'Test Defender',
            type: 'Infantry',
            models: 5,
            toughness: 4,
            wounds: 1,
            save: 3,
            invulnerable: 7,
            Keywords: [],
            ...overrides
        };
    }

    /**
     * Erstellt Standard-Simulationsdaten
     */
    static createTestSimulationData(overrides = {}) {
        return {
            Amount: 100,
            Attackers: [this.createTestAttacker()],
            Defenders: [this.createTestDefender()],
            ...overrides
        };
    }

    /**
     * Erstellt vollständige Simulationsdaten für Tests
     */
    static createSimulationData(overrides = {}) {
        return {
            Amount: 100,
            Attackers: [
                {
                    Name: "Space Marine Squad",
                    Weapons: [
                        {
                            name: "Bolter",
                            type: "Ranged",
                            attacks: "2",
                            to_hit: 3,
                            strength: 4,
                            ap: 0,
                            damage: "1",
                            amount: 1,
                            Keywords: ["rapid fire 1"]
                        }
                    ]
                }
            ],
            Defenders: [
                {
                    Name: "Ork Boyz",
                    type: "Infantry",
                    models: 10,
                    toughness: 5,
                    wounds: 1,
                    save: 6,
                    invulnerable: 7,
                    Keywords: []
                }
            ],
            ...overrides
        };
    }

    /**
     * Prüft ob ein Wert in einem erwarteten Bereich liegt (für Monte-Carlo-Simulationen)
     */
    static assertInRange(actual, expected, tolerance = 0.1, message = '') {
        const lowerBound = expected * (1 - tolerance);
        const upperBound = expected * (1 + tolerance);
        assert.ok(
            actual >= lowerBound && actual <= upperBound,
            `${message} Expected ${actual} to be between ${lowerBound} and ${upperBound} (${expected} ± ${tolerance * 100}%)`
        );
    }

    /**
     * Prüft ob Simulationsergebnisse gültig sind
     */
    static validateSimulationResult(result) {
        assert.ok(result, 'Result should exist');
        assert.ok(result.Name, 'Result should have a Name');
        assert.ok(Array.isArray(result.Target), 'Result should have Target array');
        
        result.Target.forEach(target => {
            assert.ok(target.Name, 'Target should have a Name');
            assert.ok(typeof target.ModelsDestroyed === 'number', 'ModelsDestroyed should be a number');
            assert.ok(typeof target.MaximumModels === 'number', 'MaximumModels should be a number');
            assert.ok(Array.isArray(target.Weapons), 'Target should have Weapons array');
            assert.ok(Array.isArray(target.KillDistribution), 'Target should have KillDistribution array');
        });
    }

    /**
     * Prüft statistische Eigenschaften einer Würfel-Simulation
     */
    static validateDiceDistribution(results, expectedValue, tolerance = 0.05) {
        const sum = results.reduce((a, b) => a + b, 0);
        const average = sum / results.length;
        
        this.assertInRange(average, expectedValue, tolerance, 'Dice average');
        
        // Prüfe, dass alle Werte im gültigen Bereich sind
        results.forEach(result => {
            assert.ok(result >= 1 && result <= 6, `Dice result ${result} should be between 1 and 6`);
        });
    }

    /**
     * Mock für Math.random um deterministische Tests zu ermöglichen
     */
    static mockRandom(sequence) {
        let index = 0;
        const originalRandom = Math.random;
        
        Math.random = () => {
            const value = sequence[index % sequence.length];
            index++;
            return value;
        };
        
        return () => {
            Math.random = originalRandom;
        };
    }

    /**
     * Führt eine Funktion mehrmals aus und sammelt Statistiken
     */
    static runMultipleTimes(fn, iterations = 100) {
        const results = [];
        for (let i = 0; i < iterations; i++) {
            results.push(fn());
        }
        return results;
    }
}
