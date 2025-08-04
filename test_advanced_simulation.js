import run from './src/scripts/w40k.js';

const testData = {
  "Amount": 1000,
  "Attackers": [
    {
      "Name": "Space Marine with Plasma Gun",
      "Weapons": [
        {
          "name": "Plasma Gun",
          "type": "Ranged",
          "attacks": "1",
          "to_hit": 3,
          "strength": 7,
          "ap": 2,
          "damage": "2",
          "amount": 1,
          "Keywords": ["rapid fire 1"]
        }
      ]
    },
    {
      "Name": "Melta Devastator",
      "Weapons": [
        {
          "name": "Multi-Melta",
          "type": "Ranged",
          "attacks": "2",
          "to_hit": 3,
          "strength": 9,
          "ap": 4,
          "damage": "D6",
          "amount": 1,
          "Keywords": ["melta 2"]
        }
      ]
    },
    {
      "Name": "Heavy Bolter Team",
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
      "Name": "Space Marine",
      "type": "Infantry",
      "models": 5,
      "toughness": 4,
      "wounds": 2,
      "save": 3,
      "invulnerable": 7,
      "Keywords": []
    },
    {
      "Name": "Terminator",
      "type": "Infantry",
      "models": 5,
      "toughness": 5,
      "wounds": 3,
      "save": 2,
      "invulnerable": 4,
      "Keywords": []
    }
  ]
};

console.log("Testing advanced simulation with keywords...");
console.log("");

const results = run(testData);
console.log("Results:", JSON.stringify(results, null, 2));
