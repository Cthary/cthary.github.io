import run from './src/scripts/w40k.js';

const testData = {
  "Amount": 1000,
  "Attackers": [
    {
      "Name": "Test Heavy Bolter with -1D Target",
      "Weapons": [
        {
          "name": "Heavy Bolter",
          "type": "Ranged",
          "attacks": "3",
          "to_hit": 3,
          "strength": 5,
          "ap": 1,
          "damage": "2",
          "amount": 1,
          "Keywords": ["sustained hits 1"]
        }
      ]
    }
  ],
  "Defenders": [
    {
      "Name": "Space Marine with -1D",
      "type": "Infantry",
      "models": 5,
      "toughness": 4,
      "wounds": 2,
      "save": 3,
      "invulnerable": 7,
      "Keywords": ["-1D"]
    }
  ]
};

console.log("Testing new keywords and detailed statistics...");
const results = run(testData);
console.log("Results:", JSON.stringify(results, null, 2));
