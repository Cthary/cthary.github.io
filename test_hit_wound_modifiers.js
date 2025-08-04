// Test für die neuen +1/-1 to Hit/Wound Keywords
import { Dice } from './src/scripts/dice.js';
import { Attacker, Defender, Weapon } from './src/scripts/units.js';
import run from './src/scripts/w40k.js';

console.log("=== Test der neuen +1/-1 to Hit/Wound Keywords ===");

// Test 1: +1 to Hit Bonus
console.log("\n--- Test 1: +1 to Hit ---");
const testData1 = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": "4",
            "strength": "4",
            "ap": "0",
            "damage": "1",
            "amount": "1",
            "Keywords": ["+1 to hit"]
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": "4",
        "wounds": "1",
        "models": "10",
        "save": "3",
        "invulnerable": "0",
        "Keywords": []
    }]
};

let results = run(testData1);
console.log(`Mit +1 to Hit (sollte auf 3+ treffen):`, results[0].Target[0].Weapons[0].AverageDamage);

// Test 2: -1 to Hit Penalty
console.log("\n--- Test 2: -1 to Hit ---");
const testData2 = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged", 
            "attacks": "10",
            "to_hit": "4",
            "strength": "4",
            "ap": "0",
            "damage": "1",
            "amount": "1",
            "Keywords": ["-1 to hit"]
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": "4",
        "wounds": "1",
        "models": "10",
        "save": "3",
        "invulnerable": "0",
        "Keywords": []
    }]
};

results = run(testData2);
console.log(`Mit -1 to Hit (sollte auf 5+ treffen):`, results[0].Target[0].Weapons[0].AverageDamage);

// Test 3: +1 to Wound
console.log("\n--- Test 3: +1 to Wound ---");
const testData3 = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": "3",
            "strength": "4",
            "ap": "0", 
            "damage": "1",
            "amount": "1",
            "Keywords": ["+1 to wound"]
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": "4",
        "wounds": "1",
        "models": "10",
        "save": "3",
        "invulnerable": "0",
        "Keywords": []
    }]
};

results = run(testData3);
console.log(`Mit +1 to Wound (S4 vs T4 sollte auf 3+ verwunden statt 4+):`, results[0].Target[0].Weapons[0].AverageDamage);

// Test 4: Baseline ohne Modifikatoren
console.log("\n--- Test 4: Baseline (kein Modifier) ---");
const testDataBaseline = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": "4",
            "strength": "4",
            "ap": "0",
            "damage": "1",
            "amount": "1",
            "Keywords": []
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": "4",
        "wounds": "1",
        "models": "10",
        "save": "3",
        "invulnerable": "0",
        "Keywords": []
    }]
};

results = run(testDataBaseline);
console.log(`Baseline (4+ to hit, 4+ to wound):`, results[0].Target[0].Weapons[0].AverageDamage);

console.log("\n=== Test abgeschlossen ===");
