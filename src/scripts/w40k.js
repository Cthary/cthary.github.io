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

    rollDice(amount, toBeat, rerollType, isHit = false) {
        let rolls = [];
        const dice = new Dice();
        for (let i = 0; i < amount; i++) {
            let roll = dice.roll();
            rolls.push(roll);
        }
        return this.rerollDice(rolls, toBeat, rerollType, isHit);
    }

    rerollDice(rolls, toBeat, rerollType, isHit = false) {
        const dice = new Dice();
        
        if (rerollType === "miss") {
            const failed = rolls.filter((roll) => roll < toBeat);
            const passed = rolls.filter((roll) => roll >= toBeat);
            const newRolls = failed.map(() => dice.roll());
            rolls = passed.concat(newRolls);
        } else if (rerollType === "1") {
            const ones = rolls.filter((roll) => roll === 1);
            const others = rolls.filter((roll) => roll !== 1);
            const newRolls = ones.map(() => dice.roll());
            rolls = others.concat(newRolls);
        } else if (rerollType === "nocrit") {
            const critThreshold = this.getCritThreshold(toBeat, isHit);
            const nonCrits = rolls.filter((roll) => roll === 1);
            const others = rolls.filter((roll) => roll !== 1);
            const newRolls = nonCrits.map(() => dice.roll());
            rolls = others.concat(newRolls);
        }
        
        return rolls;
    }

    getCritThreshold(toBeat, isHit) {
        // Standard ist 6+ für Critical Hits/Wounds
        return 6;
    }

    hits(weapon, defender) {
        let hits = 0;
        let wounds = 0;
        let attacks = weapon.getAttacks();
        let toHit = weapon.to_hit;
        let keywords = weapon.Keywords;
        let result = {
            "hits": 0,
            "wounds": 0
        };

        // Modifier durch Verteidiger
        if (defender.Keywords.includes("-1 hit")) {
            toHit += 1;
        }

        const dice = new Dice();
        
        // Reroll-Logik für Hit-Würfe
        let reroll = "";
        if (weapon.Keywords.includes("RH1")) {
            reroll = "1";
        } else if (weapon.Keywords.includes("RHMiss")) {
            reroll = "miss";
        } else if (weapon.Keywords.includes("RHNoCrit")) {
            reroll = "nocrit";
        }

        // Critical Hit Threshold bestimmen
        let critHitThreshold = 6;
        for (const keyword of weapon.Keywords) {
            if (keyword.startsWith("CritHit")) {
                const match = keyword.match(/CritHit(\d+)/);
                if (match) {
                    critHitThreshold = parseInt(match[1]);
                }
            }
        }

        let rolls = this.rollDice(attacks, toHit, reroll, true);
        
        for (const roll of rolls) {
            if (roll >= toHit) {
                hits++;
                
                // Critical Hit Check
                if (roll >= critHitThreshold) {
                    // Sustained Hits
                    if (weapon.sustainedHits) {
                        let sustainedHits = dice.parseAndRoll(weapon.sustainedHits);
                        hits += sustainedHits;
                    }
                    
                    // Lethal Hits
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

    wounds(weapon, defender, hitCount) {
        let wounds = 0;
        let mortalWounds = 0;
        let toWound = 0;
        let keywords = weapon.Keywords;
        let result = {
            "wounds": 0,
            "damage": 0
        };

        // To Wound basierend auf Strength vs Toughness
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

        // Modifier
        if (keywords.includes("+1 wound") || keywords.includes("lance")) {
            toWound -= 1;
        }

        // Reroll-Logik für Wound-Würfe
        let reroll = "";
        if (weapon.Keywords.includes("RW1")) {
            reroll = "1";
        } else if (weapon.Keywords.includes("RWMiss")) {
            reroll = "miss";
        } else if (weapon.Keywords.includes("RWNoCrit")) {
            reroll = "nocrit";
        }

        // Critical Wound Threshold bestimmen
        let critWoundThreshold = 6;
        for (const keyword of weapon.Keywords) {
            if (keyword.startsWith("CritWound")) {
                const match = keyword.match(/CritWound(\d+)/);
                if (match) {
                    critWoundThreshold = parseInt(match[1]);
                }
            }
        }

        // Würfle für jede Treffer
        let rolls = this.rollDice(hitCount, toWound, reroll, false);
        
        for (const roll of rolls) {
            if (keywords.includes("WOUND")) {
                wounds++;
            } else if (roll >= toWound) {
                if (roll >= critWoundThreshold) {
                    // Critical Wound - Devastating Wounds
                    if (weapon.devastatingWounds) {
                        mortalWounds++;
                    } else {
                        wounds++;
                    }
                } else {
                    wounds++;
                }
            } 
        }
        
        result.wounds = wounds;
        result.damage = mortalWounds;
        return result;
    }

    saves(weapon, defender, woundCount) {
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
        
        // Würfle für jede Verwundung
        let rolls = this.rollDice(woundCount, save, "", false);
        
        for (const roll of rolls) {
            if (roll < save) {
                failedSaves++;
            }
        }
        result.failedSaves = failedSaves;
        return result;
    }

    damage(weapon, defender) {
        const dice = new Dice();
        let damage = dice.parseAndRoll(weapon.damage);
        
        // Damage Reduction
        if (defender.Keywords.includes("-1 dmg")) {
            damage = Math.max(1, damage - 1);
        }
        
        if (defender.Keywords.includes("halve damage")) {
            damage = Math.max(1, Math.floor(damage / 2));
        }
        
        return damage;
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
        
        // Hit Phase
        let hitResult = calculator.hits(weapon, defender);
        let totalHits = hitResult.hits;
        let automaticWounds = hitResult.wounds; // Von Lethal Hits
        
        // Wound Phase für normale Hits
        let woundResult = calculator.wounds(weapon, defender, totalHits);
        let totalWounds = woundResult.wounds + automaticWounds;
        let mortalWounds = woundResult.damage; // Von Devastating Wounds
        
        // Save Phase
        let saveResult = calculator.saves(weapon, defender, totalWounds);
        let failedSaves = saveResult.failedSaves;
        
        // Damage Phase
        let totalDamageInstances = failedSaves + mortalWounds;
        let damageArray = [];
        for (let i = 0; i < totalDamageInstances; i++) {
            let damageValue = calculator.damage(weapon, defender);
            damageArray.push(damageValue);
        }
        
        results.push({
            "hits": totalHits,
            "wounds": totalWounds,
            "failedSaves": failedSaves,
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
        let totalDamage = 0;
        
        for (let i = 0; i < amount; i++) {
            hits += results[i][0].hits;
            wounds += results[i][0].wounds;
            failedSaves += results[i][0].failedSaves;
            
            // Schaden summieren
            for (let j = 0; j < results[i][0].damage.length; j++) {
                totalDamage += results[i][0].damage[j];
            }
        }
        
        return {
            "hits": hits / amount,
            "wounds": wounds / amount,
            "failedSaves": failedSaves / amount,
            "totalDamage": totalDamage / amount
        };
    }

    parseModelsDestroyed(results, defender) {
        let modelsDestroyed = 0;
        let currentModelWounds = 0;
        
        // Alle Simulationen durchgehen und Schaden sammeln
        let allDamageValues = [];
        for (let i = 0; i < results.length; i++) {
            for (let j = 0; j < results[i][0].damage.length; j++) {
                allDamageValues.push(results[i][0].damage[j]);
            }
        }
        
        // Schaden auf Modelle anwenden
        for (let damage of allDamageValues) {
            currentModelWounds += damage;
            if (currentModelWounds >= defender.wounds) {
                modelsDestroyed++;
                currentModelWounds = 0;
            }
        }
        
        return modelsDestroyed / results.length; // Durchschnitt über alle Simulationen
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
            
            // Sammle detaillierte Ergebnisse für Diagramme
            let allSimulationResults = [];
            let modelKillCounts = new Array(defender.models + 1).fill(0);
            
            for (let j = 0; j < attacker.Weapons.length; j++) {
                let weapon = attacker.getWeapon(j);
                let simulator = new Simulator(amount);
                let results = simulator.simulateAmount(weapon, defender, amount);
                let parsedResults = simulator.parseSimulatedResultsByAmount(amount, results);
                
                // Detaillierte Analyse für jede Simulation
                for (let sim = 0; sim < results.length; sim++) {
                    let modelsKilled = this.calculateModelsKilledInSingleSim(results[sim][0], defender);
                    modelKillCounts[modelsKilled]++;
                    allSimulationResults.push({
                        modelsKilled: modelsKilled,
                        totalDamage: results[sim][0].damage.reduce((sum, dmg) => sum + dmg, 0),
                        hits: results[sim][0].hits,
                        wounds: results[sim][0].wounds,
                        failedSaves: results[sim][0].failedSaves
                    });
                }
                
                let averageDestroyed = allSimulationResults.reduce((sum, r) => sum + r.modelsKilled, 0) / allSimulationResults.length;
                target.ModelsDestroyed += averageDestroyed;
                
                target.Weapons.push({
                    "Name": weapon.name,
                    "Hits": parsedResults.hits,
                    "Wounds": parsedResults.wounds,
                    "FailedSaves": parsedResults.failedSaves,
                    "AverageDamage": parsedResults.totalDamage
                });
            }
            
            // Berechne Wahrscheinlichkeiten
            target.KillDistribution = modelKillCounts.map((count, kills) => ({
                kills: kills,
                probability: (count / amount) * 100,
                count: count
            }));
            
            target.CompleteWipeoutChance = (modelKillCounts[defender.models] / amount) * 100;
            
            result.Target.push(target);
        }
        return result;
    }

    calculateModelsKilledInSingleSim(simResult, defender) {
        let modelsKilled = 0;
        let currentModelWounds = 0;
        
        for (let damage of simResult.damage) {
            currentModelWounds += damage;
            if (currentModelWounds >= defender.wounds) {
                modelsKilled++;
                currentModelWounds = 0;
            }
        }
        
        return Math.min(modelsKilled, defender.models);
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
