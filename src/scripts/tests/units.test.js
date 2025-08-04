import test from "ava";
import { Attacker, Defender, Weapon } from "../units.js";

const attackerJson = {
    "Name": "Space Marine",
    "Weapons": [
        {
            "name": "Bolt Rifle",
            "type":"R",
            "attacks": 1,
            "to_hit": 2,
            "strength": 9,
            "ap": 4,
            "damage": "D6+2",
            "amount": 1,
            "Keywords": []
        },
        {
            "name": "Melta Gun",
            "type":"M",
            "attacks": 1,
            "to_hit": 2,
            "strength": 9,
            "ap": 4,
            "damage": "D6+2",
            "amount": 1,
            "Keywords": [
                "BA Charge",
                "sustained hits D3",
                "+1 hit",
                "blast",
                "lethal hits",
                "devastating wounds"
            ]
        }
    ]
};

const defenderJson = {
    "Name": "Chaos Space Marine",
    "type": "infantry",
    "toughness": 5,
    "wounds": 4,
    "models": 10,
    "save": 2,
    "invulnerable": 4,
    "Keywords": [
        "-1 dmg"
    ]
};

test("Weapon without Keywords", (t) => {
    const weapon = new Weapon(attackerJson["Weapons"][0]);
    t.truthy(weapon);
    t.is(weapon.name, "Bolt Rifle");
    t.is(weapon.attacks, 1);
    t.is(weapon.to_hit, 2);
    t.is(weapon.strength, 9);
    t.is(weapon.ap, 4);
    t.is(weapon.damage, "D6+2");
    t.is(weapon.type, "R");
    t.is(weapon.amount, 1);
    t.deepEqual(weapon.Keywords, []);
});

test("Weapon with Keywords", (t) => {
    const weapon = new Weapon(attackerJson["Weapons"][1]);
    t.truthy(weapon);
    t.is(weapon.attacks, 2);
    t.is(weapon.to_hit, 1);
    t.is(weapon.strength, 11);
    t.is(weapon.ap, 4);
    t.is(weapon.sustainedHits, "D3");
    t.is(weapon.type, "M");
    t.truthy(weapon.lethalHits);
    t.truthy(weapon.devastatingWounds);
});

test("Attacker", (t) => {
    const attacker = new Attacker(attackerJson);
    t.truthy(attacker);
    t.deepEqual(attacker.json, attackerJson);
    t.deepEqual(attacker.Name, "Space Marine");
});

test("Attacker getWeapon", (t) => {
    const attacker = new Attacker(attackerJson);
    const weapon = attacker.getWeapon(0);
    t.truthy(weapon);
    t.deepEqual(weapon, new Weapon(attackerJson["Weapons"][0]));
});

test("Defender", (t) => {
    const defender = new Defender(defenderJson);
    t.truthy(defender);
    t.deepEqual(defender.Name, "Chaos Space Marine");
    t.is(defender.kills, 0);
    t.is(defender.type, "infantry");
    t.is(defender.toughness, 5);
    t.is(defender.wounds, 4);
    t.is(defender.models, 10);
    t.is(defender.save, 2);
    t.is(defender.invulnerable, 4);
    t.deepEqual(defender.Keywords, ["-1 dmg"]);
});

