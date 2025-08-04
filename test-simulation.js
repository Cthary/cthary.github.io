// Test der Simulation
import { Weapon, Defender } from './src/scripts/units.js';
import { Simulator } from './src/scripts/w40k.js';

// Test-Daten
const weaponData = {
    "name": "Bolter",
    "type": "Ranged",
    "attacks": "10",
    "to_hit": 4,
    "strength": 4,
    "ap": 0,
    "damage": "1",
    "amount": 1,
    "Keywords": []
};

const defenderData = {
    "Name": "Ork",
    "type": "Infantry",
    "models": 10,
    "toughness": 4,
    "wounds": 1,
    "save": 6,
    "invulnerable": 7,
    "Keywords": []
};

const weapon = new Weapon(weaponData);
const defender = new Defender(defenderData);
const simulator = new Simulator(1000);

console.log("Test-Simulation:");
console.log("Waffe:", weapon.name);
console.log("Attacks:", weapon.attacks);
console.log("To Hit:", weapon.to_hit);
console.log("Strength:", weapon.strength);
console.log("AP:", weapon.ap);
console.log("Damage:", weapon.damage);

console.log("\nVerteidiger:", defender.Name);
console.log("Toughness:", defender.toughness);
console.log("Save:", defender.save);

// Simuliere einen einzelnen Angriff
const results = simulator.simulateAmount(weapon, defender, 1000);
const parsed = simulator.parseSimulatedResultsByAmount(1000, results);

console.log("\nErgebnisse (1000 Simulationen):");
console.log("Durchschn. Treffer:", parsed.hits / 1000);
console.log("Durchschn. Verwundungen:", parsed.wounds / 1000);
console.log("Fehlgeschlagene Saves:", parsed.failedSaves / 1000);
console.log("Durchschn. Schaden:", parsed.damage / 1000);

// Erwartete Werte:
// 10 Attacks, 4+ to hit = 5 Treffer (50%)
// S4 vs T4 = 4+ to wound = 2.5 Verwundungen (50%)  
// 6+ Save = 2.08 fehlgeschlagene Saves (~83.3%)
// 1 Damage = 2.08 Schaden
console.log("\nErwartete Werte:");
console.log("Treffer: 5.0");
console.log("Verwundungen: 2.5");
console.log("Fehlgeschlagene Saves: 2.08");
console.log("Schaden: 2.08");
