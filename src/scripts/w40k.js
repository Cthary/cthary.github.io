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

    rollDice(amount, toBeat, keywords) {
        let rolls = [];
        const dice = new Dice();
        for (let i = 0; i < amount; i++) {
            let roll = dice.roll();
            rolls.push(roll);
        }
        return this.rerollDice(rolls, toBeat, keywords);
    }

    rerollDice(rolls, toBeat, keywords) {
        if (keywords === "miss") {
            rolls = rolls.filter((roll) => roll >= toBeat).concat(
                rolls.filter((roll) => roll < toBeat).map(() => this.rollDice(1, toBeat, keywords)[0])
            );
        } else if (keywords === "1") {
            rolls = rolls.filter((roll) => roll !== 1).concat(
                rolls.filter((roll) => roll === 1).map(() => this.rollDice(1, toBeat, keywords)[0])
            );
        } else if (keywords === "crit6") {
            rolls = rolls.filter((roll) => roll === 6).concat(
                rolls.filter((roll) => roll !== 6).map(() => this.rollDice(1, toBeat, keywords)[0])
            );
        } else if (keywords === "crit5") {
            rolls = rolls.filter((roll) => roll >= 5).concat(
                rolls.filter((roll) => roll < 5).map(() => this.rollDice(1, toBeat, keywords)[0])
            );
        }
        return rolls;
    }

    hits(weapon, defender) {
        let hits = 0;
        let wounds = 0;
        let attacks = weapon.attacks;
        let to_hit = weapon.to_hit;
        let keywords = weapon.Keywords;
        let result = {
            "hits": 0,
            "wounds": 0
        };


        if (defender.Keywords.includes("-1 hit")) {
            to_hit += 1;
        }
        const dice = new Dice();
        let reroll = "";
        if(weapon.Keywords.includes("HR1")){
            reroll = "1";
        } else if(weapon.Keywords.includes("HRMiss")){
            reroll = "miss";
        } else if(weapon.Keywords.includes("HRCrit")){
            if(weapon.Keywords.includes("better crits")){
                reroll = "crit5";
            } else {
                reroll = "crit6";
            }
        }
        let rolls = this.rollDice(rolls, to_hit, reroll);
        for (const roll of rolls) {
            if (roll >= to_hit) {
                hits++;
                if (roll === 6 || (roll === 5 && weapon.Keywords.includes("better crits"))) {
                    if (weapon.sustainedHits) {
                        let sustainedHits = dice.parseAndRoll(weapon.sustainedHits);
                        hits += sustainedHits;
                    }
                    if (weapon.lethalHits) {
                        hits--;
                        wounds++;
                    }
                }
            }
        }
        result.hits = hits;
        result.wounds = wounds;
        return result;
    }

    wounds(weapon, defender, rolls) {
        let wounds = 0;
        let damage = 0;
        let toWound = 0;
        let keywords = weapon.Keywords;
        let result = {
            "wounds": 0,
            "damage": 0
        };

        if (weapon.strength >= 2 * defender.toughness) {
            toWound = 2;
        } else if (weapon.strength > defender.toughness) {
            toWound = 3;
        } else if (weapon.strength === defender.toughness) {
            toWound = 4;
        } else if (weapon.strength * 2 <= defender.toughness) {
            toWound = 6;
        } else if (weapon.strength < defender.toughness) {
            toWound = 5;
        }

        if (keywords.includes("+1 wound") || keywords.includes("lance")) {
            toWound -= 1;
        }

        let reroll = "";
        if(weapon.Keywords.includes("WR1")){
            reroll = "1";
        } else if(weapon.Keywords.includes("WRMiss")){
            reroll = "miss";
        } else if(weapon.Keywords.includes("WRCrit")){
                reroll = "crit6";
        }
        rolls = this.rerollDice(rolls, toWound, reroll);
        for (const roll of rolls) {
            if (keywords.includes("WOUND")) {
                wounds++;
            } else if (roll >= toWound) {
                if (roll === 6) {
                    if (weapon.devastatingWounds) {
                        damage++;
                    }
                } else {
                    wounds++;
                }
            } 
        }
        result.wounds = wounds;
        result.damage = damage;
        return result;
    }

    saves(weapon, defender, rolls) {
        let failedSaves = 0;
        let result = {
            "failedSaves": 0
        };
        let save = defender.save;
        let ap = weapon.ap;
        let invulnerable = defender.invulnerable;

        if (defender.Keywords.includes("-1 ap")) {
            ap = Math.max(0, ap - 1);
        }
        if (weapon.Keywords.includes("+1 ap")) {
            ap += 1;
        }

        save += ap;

        if (save > invulnerable) {
            save = invulnerable;
        }
        rolls = this.rerollDice(rolls, save, defender.Keywords);
        for (const roll of rolls) {
            if (roll < save) {
                failedSaves++;
            }
        }
        result.failedSaves = failedSaves;
        return result;
    }

    damage(weapon, defender) {
        let damage = 0;
        const dice = new Dice();
        let result = {
            "damage": 0
        };
        damage = dice.parseAndRoll(weapon.damage);
        if (defender.Keywords.includes("-1 dmg")) {
            damage = Math.max(1, damage - 1);
        }
        result = damage;
        return result;
    }
}

export class Simulator {
    constructor(amount) {
        this.amount = amount;
    }

    createNewRolls(rolls) {
        let result = [];
        for (let i = 0; i < rolls; i++) {
            result.push(1);
        }
        return result;
    } 

    simulateOne(weapon, defender) {
        let results = [];
        let calculator = new Calculator([weapon], [defender]);
        let hits = calculator.hits(weapon, defender);
        let wounds = calculator.wounds(weapon, defender, this.createNewRolls(hits.hits));
        let saves = calculator.saves(weapon, defender, this.createNewRolls(wounds.wounds + hits.wounds));
        let damage = saves.failedSaves + wounds.damage
        let damageArray = [];
        for (let i = 0; i < damage; i++) {
            damageArray.push(calculator.damage(weapon, defender));
        }
        results.push({
            "hits": hits.hits,
            "wounds": wounds.wounds,
            "failedSaves": saves.failedSaves,
            "damage": damageArray
        });
        return results;
    }

    simulateAmount(weapon, defender, amount) {
        let results = [];
        for (let i = 0; i < amount; i++) {
            let result = this.simulateOne(weapon, defender);
            results.push(result);
        }
        return results;
    }

    parseSimulatedResultsByAmount(amount, results) {
        let hits = 0;
        let wounds = 0;
        let failedSaves = 0;
        let damage = [];
        for (let i = 0; i < amount; i++) {
            hits += results[i][0].hits;
            wounds += results[i][0].wounds;
            failedSaves += results[i][0].failedSaves;
            for (let j = 0; j < results[i][0].damage.length; j++) {
                damage.push(0);
                damage[j] += results[i][0].damage[j];
            }
        }
        for (let i = 0; i < damage.length; i++) {
            damage[i] /= amount;
        }
        return {
            "hits": hits / amount,
            "wounds": wounds / amount,
            "failedSaves": failedSaves / amount,
            "damage": damage
        };
    }

    parseModelsDestroyed(results, defender) {
        let modelsDestroyed = 0;
        let damages = results.damage;
        let tempWounds = 0;
        for (let i = 0; i < results.length; i++) {
            let damage = results[i];
            damage += tempWounds; 
            if (damage >= defender.wounds) {
                modelsDestroyed++;
                tempWounds = 0;
            } else {
                tempWounds += results[i];
            }
        }
        return modelsDestroyed;
    }

    getNewTargetJson(){
        return {
            "Name": "",
            "ModelsDestroyed": 0,
            "MaximumModels": 0,
            "Weapons": []
        };
    }

    createResults(attacker, defenders, amount) {
        let result = {
            "Name": attacker.Name,
            "Target": [],
        };
        for (let i = 0; i < defenders.length; i++) {
            let defender = defenders[i];
            let target = this.getNewTargetJson();
            target.Name = defender.Name;
            target.MaximumModels = defender.models;
            for (let j = 0; j < attacker.Weapons.length; j++) {
                let weapon = attacker.getWeapon(j);
                let simulator = new Simulator(amount);
                let results = simulator.simulateAmount(weapon, defender, amount);
                let parsedResults = simulator.parseSimulatedResultsByAmount(amount, results);
                let amountDestroyed = simulator.parseModelsDestroyed(results[0][0].damage, defender);
                target.ModelsDestroyed += amountDestroyed
                target.Weapons.push({
                    "Name": weapon.name,
                    "Hits": parsedResults.hits,
                    "Wounds": parsedResults.wounds,
                    "FailedSaves": parsedResults.failedSaves,
                    //"Damage": parsedResults.damage,
                });
            }
            result.Target.push(target);
        }
        return result;
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
        let result = simulator.createResults(attacker, defenders, amount);
        console.log(result);
        results.push(result);
    }
    return results;
}

export default run;
