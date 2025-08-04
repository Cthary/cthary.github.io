import run from "./src/scripts/w40k.js";

// Test mit der benutzerdefinierten Konfiguration
const testData = {
    "Amount": 100,
    "Attackers": [
        {
            "Name": "Hellblaster Squad",
            "Weapons": [
                {
                    "name": "Plasma Incinerator - Supercharge",
                    "type": "Ranged",
                    "attacks": "2",
                    "to_hit": 3,
                    "strength": 8,
                    "ap": 3,
                    "damage": "2",
                    "amount": 10,
                    "Keywords": [
                        "RHMiss",
                        "lethal hits"
                    ]
                }
            ]
        }
    ],
    "Defenders": [
        {
            "Name": "Canis Rex",
            "type": "Vehicle",
            "models": 1,
            "toughness": 11,
            "wounds": 26,
            "save": 3,
            "invulnerable": 7,
            "Keywords": [
                "feel no pain 6"
            ]
        }
    ]
};

console.log("Testing with user configuration:");
console.log("- Lethal Hits keyword (case-insensitive)");
console.log("- Feel No Pain 6 on single model unit");
console.log("- Damage display for single model units");

const results = run(testData);
const target = results[0].Target[0];

console.log("\nResults:");
console.log("Target:", target.Name);
console.log("Is single model unit:", target.MaximumModels === 1);
console.log("Total Damage:", target.TotalDamage?.toFixed(2) || "N/A");
console.log("Max Wounds:", target.MaxWounds);
console.log("Models Destroyed:", target.ModelsDestroyed?.toFixed(2) || "N/A");
console.log("Complete Wipeout Chance:", target.CompleteWipeoutChance?.toFixed(1) + "%" || "N/A");

console.log("\nWeapon results:");
if (target.Weapons && target.Weapons.length > 0) {
    const weapon = target.Weapons[0];
    console.log("Hits:", weapon.Hits?.toFixed(2) || "N/A");
    console.log("Wounds:", weapon.Wounds?.toFixed(2) || "N/A");
    console.log("Failed Saves:", weapon.FailedSaves?.toFixed(2) || "N/A");
    console.log("Average Damage:", weapon.AverageDamage?.toFixed(2) || "N/A");
}

console.log("\nTest completed successfully!");
