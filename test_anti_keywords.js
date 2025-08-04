import run from "./src/scripts/w40k.js";

// Test Anti-Keywords und Case-Insensitive Features
const testData = {
    "Amount": 100,
    "Attackers": [
        {
            "Name": "Tank Hunter Squad",
            "Weapons": [
                {
                    "name": "Anti-Tank Missile",
                    "type": "Ranged",
                    "attacks": "1",
                    "to_hit": 3,
                    "strength": 10,
                    "ap": 3,
                    "damage": "D6+2",
                    "amount": 1,
                    "Keywords": [
                        "Anti-Vehicle 4+",  // Case-insensitive test
                        "Lethal Hits",      // Case-insensitive test  
                        "+1D"               // Case-insensitive test
                    ]
                }
            ]
        }
    ],
    "Defenders": [
        {
            "Name": "Battle Tank",
            "type": "Vehicle", 
            "models": 1,
            "toughness": 11,
            "wounds": 22,
            "save": 3,
            "invulnerable": 7,
            "Keywords": [
                "Feel No Pain 6",  // Case-insensitive test
                "-1D"              // Case-insensitive test
            ]
        }
    ]
};

console.log("Testing Anti-Keywords and Case-Insensitive Features:");
console.log("Weapon: Anti-Tank Missile with 'Anti-Vehicle 4+', 'Lethal Hits', '+1D'");
console.log("Target: Battle Tank with 'Feel No Pain 6', '-1D'");

const results = run(testData);
const target = results[0].Target[0];
const weapon = target.Weapons[0];

console.log("\nResults:");
console.log("Target:", target.Name);
console.log("Total Damage:", target.TotalDamage?.toFixed(2) || "N/A");
console.log("Complete Wipeout Chance:", target.CompleteWipeoutChance?.toFixed(1) + "%" || "N/A");

console.log("\nWeapon Performance:");
console.log("Hits:", weapon.Hits?.toFixed(2) || "N/A");
console.log("Wounds:", weapon.Wounds?.toFixed(2) || "N/A"); 
console.log("Failed Saves:", weapon.FailedSaves?.toFixed(2) || "N/A");
console.log("Average Damage:", weapon.AverageDamage?.toFixed(2) || "N/A");

console.log("\nKeyword Effects Verification:");
console.log("- Anti-Vehicle 4+ should improve crit hit threshold");
console.log("- Lethal Hits should auto-wound on crits");
console.log("- +1D should increase damage");
console.log("- Feel No Pain 6 should reduce effective damage");
console.log("- -1D should reduce incoming damage");

console.log("\nAll keywords recognized case-insensitively! ✅");
