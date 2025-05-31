import { Attacker, Defender, Weapon } from './units.js';
import { Dice } from './dice.js';
import { JsonParser } from './jsonparser.js';

export class Calculator {
    constructor(attackers, defenders) {
        this.attackers = attackers;
        this.defenders = defenders;
    }

    getAttacker(index) {
        return new Attacker(this.attackers[index]);
    }

    getDefender(index) {
        return new Defender(this.defenders[index]);
    }

    rollDice(amount) {
        const dice = new Dice();
        return Array.from({ length: amount }, () => dice.roll());
    }

    rerollDice(rolls, toBeat, keywords) {
        if (Array.isArray(keywords) && keywords.includes("RerollHits")) {
            return rolls.map(roll => (roll < toBeat ? new Dice().roll() : roll));
        }
        if (Array.isArray(keywords) && keywords.includes("Reroll1s")) {
            return rolls.map(roll => (roll === 1 ? new Dice().roll() : roll));
        }
        return rolls;
    }

    hits(weapon, defender, rolls) {
        let hits = 0;
        let critWounds = 0;
        let toHit = weapon.to_hit;
        const dice = new Dice();

        if (Array.isArray(defender.Keywords) && defender.Keywords.includes("-1 hit")) {
            toHit += 1;
        }

        rolls = this.rerollDice(rolls, toHit, weapon.Keywords);

        for (const roll of rolls) {
            if (roll >= toHit) {
                hits++;
                if ((roll === 6 || (roll === 5 && weapon.betterCrits)) && weapon.sustainedHits) {
                    hits += dice.parseAndRoll(weapon.sustainedHits);
                }
                if (roll === 6 && weapon.lethalHits) {
                    hits--;
                    critWounds++;
                }
            }
        }

        return { hits, critWounds };
    }

    wounds(weapon, defender, rolls) {
        let wounds = 0;
        let mortalWounds = 0;
        let toWound = 0;

        if (weapon.strength >= 2 * defender.toughness) {
            toWound = 2;
        } else if (weapon.strength > defender.toughness) {
            toWound = 3;
        } else if (weapon.strength === defender.toughness) {
            toWound = 4;
        } else if (weapon.strength * 2 <= defender.toughness) {
            toWound = 6;
        } else {
            toWound = 5;
        }

        if (Array.isArray(weapon.Keywords) && (weapon.Keywords.includes("+1 wound") || weapon.Keywords.includes("lance"))) {
            toWound -= 1;
        }

        rolls = this.rerollDice(rolls, toWound, weapon.Keywords);

        for (const roll of rolls) {
            if (roll >= toWound) {
                if (roll === 6 && weapon.devastatingWounds) {
                    mortalWounds++;
                } else {
                    wounds++;
                }
            }
        }

        return { wounds, mortalWounds };
    }

    saves(weapon, defender, rolls) {
        let failed = 0;
        let save = defender.save;
        let ap = weapon.ap;

        if (Array.isArray(defender.Keywords) && defender.Keywords.includes("-1 ap")) ap = Math.max(0, ap - 1);
        if (Array.isArray(weapon.Keywords) && weapon.Keywords.includes("+1 ap")) ap++;

        save += ap;
        if (defender.invulnerable && defender.invulnerable < save) {
            save = defender.invulnerable;
        }

        rolls = this.rerollDice(rolls, save, defender.Keywords);

        for (const roll of rolls) {
            if (roll < save) failed++;
        }

        return failed;
    }

    damage(weapon, defender) {
        const dice = new Dice();
        let dmg = dice.parseAndRoll(weapon.damage);
        if (Array.isArray(defender.Keywords) && defender.Keywords.includes("-1 dmg")) dmg = Math.max(1, dmg - 1);
        return dmg;
    }
}

export class Simulator {
    constructor(amount) {
        this.amount = amount;
    }

    simulateOne(weapon, defender) {
        const calculator = new Calculator([], []);
        const hitRolls = calculator.rollDice(weapon.attacks);
        const hitResult = calculator.hits(weapon, defender, hitRolls);

        const woundRolls = calculator.rollDice(hitResult.hits);
        const woundResult = calculator.wounds(weapon, defender, woundRolls);

        const saveRolls = calculator.rollDice(woundResult.wounds);
        const failedSaves = calculator.saves(weapon, defender, saveRolls);

        let totalDamage = 0;
        for (let i = 0; i < failedSaves; i++) {
            totalDamage += calculator.damage(weapon, defender);
        }
        totalDamage += woundResult.mortalWounds;

        return {
            hits: hitResult.hits,
            wounds: woundResult.wounds,
            failedSaves,
            damage: totalDamage
        };
    }

    simulateAmount(weapon, defender) {
        const results = Array.from({ length: this.amount }, () => this.simulateOne(weapon, defender));
        return this.parseResults(results);
    }

    parseResults(results) {
        let hits = 0, wounds = 0, saves = 0, damage = 0;
        for (const r of results) {
            hits += r.hits;
            wounds += r.wounds;
            saves += r.failedSaves;
            damage += r.damage;
        }
        return {
            hits: hits / this.amount,
            wounds: wounds / this.amount,
            failedSaves: saves / this.amount,
            damage: damage / this.amount
        };
    }

    modelsDestroyed(averageDamage, defender) {
        return Math.floor(averageDamage / defender.wounds);
    }
}

function run(jsonData) {
    const jsonParser = new JsonParser(jsonData);
    const defenders = jsonParser.getDefenders();
    let results = [];
    let amount = jsonParser.json["Amount"] || 100;
    for (let i = 0; i < jsonParser.json["Attackers"].length; i++) {
        const attacker = jsonParser.getAttacker(i);

        const simulator = new Simulator(amount);
        let result = simulator.simulateAmount(attacker, defenders);
        console.log(result);
        results.push(result);
    }
    return results;
}

export default run;
