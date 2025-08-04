import test from "ava";
import { JsonParser } from "../jsonparser.js";

const json = {
    "Attackers": [
        {
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
        }
    ],
    "Defenders": [
        {
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
        }
    ]
};

const jsonParser = new JsonParser(json);

test("Attacker without Keywords", (t) => {
    const attacker = jsonParser.getAttacker(0);
    t.truthy(attacker);
    t.is(attacker.Name, "Space Marine");
    const weapon = attacker.getWeapon(0);
    t.truthy(weapon);
    t.is(weapon.name, "Bolt Rifle");
    t.is(weapon.attacks, 1);
    t.is(weapon.to_hit, 2);
    t.is(weapon.strength, 9);
    t.is(weapon.ap, 4);
    t.is(weapon.damage, "D6+2");
});

test("Attacker with Keywords", (t) => {
    const attacker = jsonParser.getAttacker(0);
    const weapon = attacker.getWeapon(1);
    t.truthy(weapon);
    t.is(weapon.name, "Melta Gun");
    t.is(weapon.attacks, 2);
    t.is(weapon.to_hit, 1);
    t.is(weapon.strength, 11);
    t.is(weapon.ap, 4);
    t.is(weapon.damage, "D6+2");
    t.is(weapon.type, "M");
    t.is(weapon.amount, 1);
    t.true(weapon.Keywords.includes("BA Charge"));
    t.true(weapon.Keywords.includes("sustained hits D3"));
    t.true(weapon.Keywords.includes("+1 hit"));
    t.true(weapon.Keywords.includes("blast"));
    t.true(weapon.Keywords.includes("lethal hits"));
    t.true(weapon.Keywords.includes("devastating wounds"));
});

test("Defender", (t) => {
    const defenders = jsonParser.getDefenders();
    const defender = defenders[0];
    t.truthy(defender);
    t.is(defender.Name, "Chaos Space Marine");
    t.is(defender.type, "infantry");
    t.is(defender.toughness, 5);
    t.is(defender.wounds, 4);
    t.is(defender.models, 10);
    t.is(defender.save, 2);
    t.is(defender.invulnerable, 4);
    t.true(defender.Keywords.includes("-1 dmg"));
});

test("JsonParser.getAttacker", (t) => {
    const attacker = jsonParser.getAttacker(0);
    t.truthy(attacker);
    t.is(attacker.Name, "Space Marine");
});
