import test from 'ava';
import { Attacker, Defender, Weapon } from '../units.js';
import { Dice } from '../dice.js';
import { Calculator, Simulator } from '../w40k.js';

const attackers = [
    {
        "Name": "Space Marine",
        "Weapons": [
            {
                "attacks": 1,
                "to_hit": 1,
                "strength": 5,
                "ap": 0,
                "damage": 2,
                "amount": 1,
                "Keywords": [
                    "sustained hits 1",
                    "lethal hits",
                    "devastating wounds"
                ]
            },
            {
                "attacks": 1,
                "to_hit": 1,
                "strength": 5,
                "ap": 4,
                "damage": 2,
                "amount": 1,
                "Keywords": [
                    "sustained hits 1",
                    "lethal hits",
                    "devastating wounds"
                ]
            },
            {
                "attacks": 10,
                "to_hit": 1,
                "strength": 10,
                "ap": 10,
                "damage": 2,
                "amount": 1,
                "Keywords": [
                    "sustained hits 1",
                    "lethal hits",
                    "devastating wounds"
                ]
            }
        ]
    },
    {
        "Name": "Ultra Space Marine",
        "Weapons": [
            {
                "attacks": 10,
                "to_hit": 1,
                "strength": 10,
                "ap": 10,
                "damage": 2,
                "amount": 1,
                "Keywords": [
                    "WOUND"
                ]
            }
        ]
    }
];

const defenders = [
    {
        "Name": "Chaos Space Marine",
        "type": "infantry",
        "toughness": 5,
        "wounds": 4,
        "models": 5,
        "save": 4,
        "invulnerable": 999,
        "Keywords": [
        ],
    },
    {
        "Name": "Chaos Space Marine",
        "type": "infantry",
        "toughness": 5,
        "wounds": 4,
        "models": 5,
        "save": 4,
        "invulnerable": 4,
        "Keywords": [
            "-1 dmg"
        ],
    },
    {
        "Name": "Chaos Space Marine",
        "type": "infantry",
        "toughness": 5,
        "wounds": 5,
        "models": 5,
        "save": 999,
        "invulnerable": 999,
        "Keywords": [
        ],
    }
];

test('Calculator.rollDice', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    let rolls = calculator.rollDice(1, 1, []);
    t.true(rolls[0] >= 1);
});

test('Calculator.rerollDice', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const rolls = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const toBeat = 1;
    const keywords = ["HR1"];
    const rerolled = calculator.rerollDice(rolls, toBeat, keywords);
    t.true(rerolled.length >= 10);
});

test('Calculator.hits', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const rolls = [1, 2, 3, 4, 5];
    const result = calculator.hits(weapon, defender, rolls);
    t.true(result.hits === 5);
    t.true(result.wounds === 0);
});

test('Calculator.hits (CRITS)', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const rolls = [6];
    const result = calculator.hits(weapon, defender, rolls);
    t.true(result.hits == 1);
    t.true(result.wounds == 1);
});

test('Calculator.wounds', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const rolls = [1, 2, 3, 4, 5];
    const result = calculator.wounds(weapon, defender, rolls);
    t.true(result.wounds === 2);
    t.true(result.damage === 0);
});

test('Calculator.wounds (CRITS)', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const rolls = [1, 2, 3, 4, 5, 6];
    const result = calculator.wounds(weapon, defender, rolls);
    t.true(result.wounds === 2);
    t.true(result.damage === 1);
});

test('Calculator.saves', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const rolls = [1, 2, 3, 4, 5, 6];
    const result = calculator.saves(weapon, defender, rolls);
    t.true(result.failedSaves === 3);
});

test('Calculator.saves (AP)', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(1);
    const defender = calculator.getDefender(0);
    const rolls = [1, 2, 3, 4, 5, 6];
    const result = calculator.saves(weapon, defender, rolls);
    t.true(result.failedSaves === 6);
});

test('Calculator.saves (INVULNERABLE)', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(1);
    const defender = calculator.getDefender(1);
    const rolls = [1, 2, 3, 4, 5, 6];
    const result = calculator.saves(weapon, defender, rolls);
    t.true(result.failedSaves === 3);
});

test('Calculator.damage', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const result = calculator.damage(weapon, defender);
    t.true(result === 2);
});

test('Calculator.damage (-DMG)', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(0);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(1);
    const result = calculator.damage(weapon, defender);
    t.true(result === 1);
});

test('Simulator.simulateOne', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(1);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const simulator = new Simulator(1);
    const result = simulator.simulateOne(weapon, defender);
    t.true(result[0].hits === 10);
    t.true(result[0].wounds === 10);
    t.true(result[0].failedSaves === 10);
    t.true(result[0].damage[0] === 2);
    t.true(result[0].damage[9] === 2);
});

test('Simulator.simulateAmount (x10)', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(1);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const simulator = new Simulator(1);
    const amount = 10;
    const result = simulator.simulateAmount(weapon, defender, amount);
    t.true(result.length === amount);
    t.true(result[0][0].hits === 10);
});

test('Simulator.parseSimulatedResultsByAmount (x10)', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(1);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(0);
    const simulator = new Simulator(1);
    const amount = 10;
    const result = simulator.simulateAmount(weapon, defender, amount);
    let results = simulator.parseSimulatedResultsByAmount(amount, result);
    t.true(results.hits === 10);
    t.true(results.wounds === 10);
    t.true(results.failedSaves === 10);
});

test('Simulator.parseModelsDestroyed', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(1);
    const weapon = attacker.getWeapon(0);
    const defender = calculator.getDefender(2);
    const simulator = new Simulator(1);
    const damages = [2, 2, 20, 2, 3];
    let results = simulator.parseModelsDestroyed(damages, defender);
    t.true(results === 2);
});

test('Simulator.createResults', (t) => {
    const calculator = new Calculator(attackers, defenders);
    const attacker = calculator.getAttacker(1);
    const defender = calculator.getDefender(2);
    const simulator = new Simulator(1);
    const amount = 1;
    let results = simulator.createResults(attacker, defenders, amount);
    t.true(results.Name === "Ultra Space Marine");
    t.true(results.Target.length === 3);
    t.true(results.Target[0].Name === "Chaos Space Marine");
    t.true(results.Target[0].MaximumModels === 5);
    t.true(results.Target[0].Weapons.length === 1);
});

test('Run', (t) => {

});