// Test für die neuen +1/-1 to Hit/Wound Keywords
import { Dice } from './src/scripts/dice.js';
import { Attacker, Defender, Weapon } from './src/scripts/units.js';
import run from './src/scripts/w40k.js';

console.log("=== Test der neuen +1/-1 to Hit/Wound Keywords ===");

// Baseline Test
console.log("\n--- Baseline Test (kein Modifier) ---");
const baselineData = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": 4,
            "strength": 4,
            "ap": 0,
            "damage": "1",
            "amount": 1,
            "Keywords": []
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": 4,
        "wounds": 1,
        "models": 10,
        "save": 3,
        "invulnerable": 7,
        "Keywords": []
    }]
};

let results = run(baselineData);
let baselineHits = results[0].Target[0].Weapons[0].Hits;
let baselineWounds = results[0].Target[0].Weapons[0].Wounds;
let baselineDamage = results[0].Target[0].Weapons[0].AverageDamage;
console.log(`Baseline: Hits: ${baselineHits.toFixed(2)}, Wounds: ${baselineWounds.toFixed(2)}, Damage: ${baselineDamage.toFixed(2)}`);

// Test +1 to Hit
console.log("\n--- Test +1 to Hit ---");
const hitBonusData = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": 4,
            "strength": 4,
            "ap": 0,
            "damage": "1",
            "amount": 1,
            "Keywords": ["+1 to hit"]
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": 4,
        "wounds": 1,
        "models": 10,
        "save": 3,
        "invulnerable": 7,
        "Keywords": []
    }]
};

results = run(hitBonusData);
let hitBonusHits = results[0].Target[0].Weapons[0].Hits;
let hitBonusWounds = results[0].Target[0].Weapons[0].Wounds;
let hitBonusDamage = results[0].Target[0].Weapons[0].AverageDamage;
console.log(`+1 to Hit: Hits: ${hitBonusHits.toFixed(2)}, Wounds: ${hitBonusWounds.toFixed(2)}, Damage: ${hitBonusDamage.toFixed(2)}`);
console.log(`Verbesserung: ${((hitBonusHits - baselineHits) / baselineHits * 100).toFixed(1)}% mehr Hits`);

// Test -1 to Hit
console.log("\n--- Test -1 to Hit ---");
const hitPenaltyData = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": 4,
            "strength": 4,
            "ap": 0,
            "damage": "1",
            "amount": 1,
            "Keywords": ["-1 to hit"]
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": 4,
        "wounds": 1,
        "models": 10,
        "save": 3,
        "invulnerable": 7,
        "Keywords": []
    }]
};

results = run(hitPenaltyData);
let hitPenaltyHits = results[0].Target[0].Weapons[0].Hits;
let hitPenaltyWounds = results[0].Target[0].Weapons[0].Wounds;
let hitPenaltyDamage = results[0].Target[0].Weapons[0].AverageDamage;
console.log(`-1 to Hit: Hits: ${hitPenaltyHits.toFixed(2)}, Wounds: ${hitPenaltyWounds.toFixed(2)}, Damage: ${hitPenaltyDamage.toFixed(2)}`);
console.log(`Verschlechterung: ${((baselineHits - hitPenaltyHits) / baselineHits * 100).toFixed(1)}% weniger Hits`);

// Test +1 to Wound
console.log("\n--- Test +1 to Wound ---");
const woundBonusData = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": 3,
            "strength": 4,
            "ap": 0,
            "damage": "1",
            "amount": 1,
            "Keywords": ["+1 to wound"]
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": 4,
        "wounds": 1,
        "models": 10,
        "save": 3,
        "invulnerable": 7,
        "Keywords": []
    }]
};

results = run(woundBonusData);
let woundBonusHits = results[0].Target[0].Weapons[0].Hits;
let woundBonusWounds = results[0].Target[0].Weapons[0].Wounds;
let woundBonusDamage = results[0].Target[0].Weapons[0].AverageDamage;
console.log(`+1 to Wound: Hits: ${woundBonusHits.toFixed(2)}, Wounds: ${woundBonusWounds.toFixed(2)}, Damage: ${woundBonusDamage.toFixed(2)}`);

// Vergleiche mit Baseline (gleiche Hit-Rate)
const woundBaselineData = {
    "Amount": 1000,
    "Attackers": [{
        "Name": "Test Attacker",
        "Weapons": [{
            "name": "Test Weapon",
            "type": "Ranged",
            "attacks": "10",
            "to_hit": 3,
            "strength": 4,
            "ap": 0,
            "damage": "1",
            "amount": 1,
            "Keywords": []
        }]
    }],
    "Defenders": [{
        "Name": "Test Defender", 
        "type": "Infantry",
        "toughness": 4,
        "wounds": 1,
        "models": 10,
        "save": 3,
        "invulnerable": 7,
        "Keywords": []
    }]
};

results = run(woundBaselineData);
let woundBaselineWounds = results[0].Target[0].Weapons[0].Wounds;
console.log(`Baseline (3+ to hit): Wounds: ${woundBaselineWounds.toFixed(2)}`);
console.log(`Verbesserung: ${((woundBonusWounds - woundBaselineWounds) / woundBaselineWounds * 100).toFixed(1)}% mehr Wounds`);

console.log("\n=== Test abgeschlossen ===");
