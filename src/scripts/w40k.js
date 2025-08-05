import { Attacker, Defender } from "./units.js";
import { Dice } from "./dice.js";
import { JsonParser } from "./jsonparser.js";

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
        const rolls = [];
        const dice = new Dice();
        for (let i = 0; i < amount; i++) {
            const roll = dice.roll();
            rolls.push(roll);
        }
        return this.rerollDice(rolls, toBeat, rerollType, isHit);
    }

    rerollDice(rolls, toBeat, rerollType, _isHit = false) {
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
            // const critThreshold = this.getCritThreshold(toBeat, isHit);
            const nonCrits = rolls.filter((roll) => roll === 1);
            const others = rolls.filter((roll) => roll !== 1);
            const newRolls = nonCrits.map(() => dice.roll());
            rolls = others.concat(newRolls);
        }

        return rolls;
    }

    getCritThreshold(_toBeat, _isHit) {
        // Standard ist 6+ für Critical Hits/Wounds
        return 6;
    }

    hits(weapon, defender) {
        let hits = 0;
        let wounds = 0;
        let mortalWounds = 0; // Für Hazardous
        let attacksToUse = weapon.getAttacks();
        let toHit = weapon.to_hit;
        const result = {
            "hits": 0,
            "wounds": 0,
            "mortalWounds": 0
        };

        // Blast: +1 Attack pro 5 Modelle (1-4=+0, 5-9=+1, 10-14=+2, etc.)
        if (weapon.Keywords.includes("blast-effect")) {
            const bonusAttacks = Math.floor(defender.models / 5);
            attacksToUse += bonusAttacks;
        }

        // Modifier durch Verteidiger
        if (defender.Keywords.includes("-1 hit") || defender.Keywords.includes("-1 to hit")) {
            toHit += 1;
        }

        if (defender.Keywords.includes("+1 hit") || defender.Keywords.includes("+1 to hit")) {
            toHit -= 1;
        }

        // Indirect Fire: -1 to hit und maximal 4+
        if (weapon.Keywords.includes("indirect-fire-effect")) {
            toHit += 1; // -1 to hit penalty
            toHit = Math.max(toHit, 4); // Nie besser als 4+
        }

        // Minimum 2+, Maximum 6+
        toHit = Math.max(2, Math.min(6, toHit));

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

        // Torrent: Automatische Hits, keine Hit-Würfe
        if (weapon.Keywords.includes("torrent-effect")) {
            hits = attacksToUse; // Alle Attacks treffen automatisch
        } else {
            // Normale Hit-Würfe
            const rolls = this.rollDice(attacksToUse, toHit, reroll, true);

            for (const roll of rolls) {
                // Hazardous: Bei 1er Würfen = 1 Mortal Wound
                if (weapon.Keywords.includes("hazardous-effect") && roll === 1) {
                    mortalWounds++;
                }

                if (roll >= toHit) {
                    hits++;

                    // Critical Hit Check
                    if (roll >= critHitThreshold) {
                        // Sustained Hits
                        if (weapon.sustainedHits) {
                            const dice = new Dice();
                            const sustainedHits = dice.parseAndRoll(weapon.sustainedHits);
                            hits += sustainedHits;
                        }

                        // Lethal Hits
                        if (weapon.lethalHits) {
                            // Lethal Hit bleibt ein Hit aber wird automatisch zur Wound
                            wounds++;
                        }
                    }
                }
            }
        }

        result.hits = hits;
        result.wounds = wounds;
        result.mortalWounds = mortalWounds;
        return result;
    }

    wounds(weapon, defender, hitCount) {
        let wounds = 0;
        let mortalWounds = 0;
        let toWound = 0;
        const keywords = weapon.Keywords;
        const result = {
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

        // Modifier von Waffe
        if (keywords.includes("+1 wound") || keywords.includes("lance") || keywords.includes("WoundBonus+1")) {
            toWound -= 1;
        }

        if (keywords.includes("-1 wound") || keywords.includes("WoundPenalty-1")) {
            toWound += 1;
        }

        // Modifier vom Verteidiger
        if (defender.Keywords.includes("-1 wound") || defender.Keywords.includes("-1 to wound")) {
            toWound += 1;
        }

        if (defender.Keywords.includes("+1 wound") || defender.Keywords.includes("+1 to wound")) {
            toWound -= 1;
        }

        // Minimum 2+, Maximum 6+
        toWound = Math.max(2, Math.min(6, toWound));

        // Reroll-Logik für Wound-Würfe
        let reroll = "";
        if (weapon.Keywords.includes("RW1")) {
            reroll = "1";
        } else if (weapon.Keywords.includes("RWMiss")) {
            reroll = "miss";
        } else if (weapon.Keywords.includes("RWNoCrit")) {
            reroll = "nocrit";
        }

        // Critical Wound Threshold bestimmen (für Anti-X Keywords)
        let critWoundThreshold = 6;
        for (const keyword of weapon.Keywords) {
            if (keyword.startsWith("CritWound")) {
                const match = keyword.match(/CritWound(\d+)/);
                if (match) {
                    critWoundThreshold = parseInt(match[1]);
                }
            }
        }

        // Anti-X Keywords: Prüfe ob Defender den entsprechenden Typ hat
        let antiBonus = false;
        for (const keyword of weapon.Keywords) {
            if (keyword.startsWith("Anti-")) {
                const targetType = keyword.substring(5).toLowerCase(); // Entferne "Anti-"
                if (defender.type && defender.type.toLowerCase() === targetType) {
                    antiBonus = true;
                    break;
                }
                // Auch Keywords des Defenders prüfen
                if (defender.Keywords.some(k => k.toLowerCase() === targetType)) {
                    antiBonus = true;
                    break;
                }
            }
        }

        // Würfle für jede Treffer
        const rolls = this.rollDice(hitCount, toWound, reroll, false);

        for (const roll of rolls) {
            if (keywords.includes("WOUND")) {
                wounds++;
            } else if (roll >= toWound) {
                // Prüfe für Critical Wound (Anti-X Keywords berücksichtigen)
                const isCriticalWound = antiBonus ? roll >= critWoundThreshold : roll >= 6;

                if (isCriticalWound) {
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
        const result = {
            "failedSaves": 0
        };
        let save = defender.save;
        let ap = weapon.ap;
        const invulnerable = defender.invulnerable;

        if (defender.Keywords.includes("-1 ap")) {
            ap = Math.max(0, ap - 1);
        }
        if (weapon.Keywords.includes("+1 ap")) {
            ap += 1;
        }

        save += ap;

        // Cover: +1 Save (außer gegen Weapons mit "Ignores Cover")
        if (defender.Keywords.includes("cover") && !weapon.Keywords.includes("ignores-cover-effect")) {
            save -= 1; // Besserer Save durch Cover
        }

        // FIX: Invulnerable Save verwenden wenn besser als normaler Save
        if (invulnerable < save) {
            save = invulnerable;
        }

        // Minimum 2+, Maximum 6+
        save = Math.max(2, Math.min(6, save));

        // Würfle für jede Verwundung
        const rolls = this.rollDice(woundCount, save, "", false);

        for (const roll of rolls) {
            if (roll < save) {
                failedSaves++;
            }
        }
        result.failedSaves = failedSaves;
        return result;
    }

    feelNoPain(defender, failedSaves) {
        let survivedDamage = 0;
        const result = {
            "survivedDamage": 0,
            "remainingDamage": failedSaves
        };

        // Prüfe ob Feel No Pain vorhanden ist
        if (defender.feelNoPainValue) {
            const fnpTarget = defender.feelNoPainValue;
            const rolls = this.rollDice(failedSaves, fnpTarget, "", false);

            for (const roll of rolls) {
                // FIX: Bei Feel No Pain gilt - niedrigere Werte sind BESSER
                // D.h. FNP 5+ ist besser als FNP 6+
                if (roll >= fnpTarget) {
                    survivedDamage++;
                }
            }

            result.survivedDamage = survivedDamage;
            result.remainingDamage = failedSaves - survivedDamage;
        }

        return result;
    }

    damage(weapon, defender) {
        const dice = new Dice();
        let damage = dice.parseAndRoll(weapon.damage);

        // Apply damage modifiers in correct order:
        // 1. Base damage (already calculated)
        // 2. Halve damage (/2D)
        // 3. Increase damage (+1D)
        // 4. Reduce damage (-1D)

        // Step 2: Halve damage first
        if (defender.Keywords.includes("halve damage")) {
            damage = Math.max(1, Math.floor(damage / 2));
        }

        // Step 3: Apply damage increase
        if (weapon.Keywords.includes("+1 dmg")) {
            damage += 1;
        }

        // Step 4: Apply damage reduction last
        if (defender.Keywords.includes("-1 dmg")) {
            damage = Math.max(1, damage - 1);
        }

        return damage;
    }
}

export class Simulator {
    constructor(amount) {
        this.amount = amount;
    }

    createNewRolls(rolls) {
        const result = [];
        for (let i = 0; i < rolls; i++) {
            result.push(1);
        }
        return result;
    }

    simulateOne(weapon, defender) {
        const results = [];
        const calculator = new Calculator([weapon], [defender]);

        // Hit Phase
        const hitResult = calculator.hits(weapon, defender);
        const totalHits = hitResult.hits;
        const automaticWounds = hitResult.wounds; // Von Lethal Hits
        const hazardousMortalWounds = hitResult.mortalWounds || 0; // Von Hazardous

        // Wound Phase für normale Hits
        const woundResult = calculator.wounds(weapon, defender, totalHits);
        const totalWounds = woundResult.wounds + automaticWounds;
        const devastatingMortalWounds = woundResult.damage; // Von Devastating Wounds

        // Save Phase
        const saveResult = calculator.saves(weapon, defender, totalWounds);
        const failedSaves = saveResult.failedSaves;

        // Feel No Pain Phase
        const fnpResult = calculator.feelNoPain(defender, failedSaves);
        const finalFailedSaves = fnpResult.remainingDamage;

        // Damage Phase
        const totalMortalWounds = hazardousMortalWounds + devastatingMortalWounds;
        const damageArray = [];

        // Normale Damage Instances
        for (let i = 0; i < finalFailedSaves; i++) {
            const damageValue = calculator.damage(weapon, defender);
            damageArray.push(damageValue);
        }

        // Mortal Wounds (immer 1 Damage, ignorieren alle Modifiers)
        for (let i = 0; i < totalMortalWounds; i++) {
            damageArray.push(1);
        }

        results.push({
            "hits": totalHits,
            "wounds": totalWounds,
            "failedSaves": failedSaves,
            "feelNoPainSaves": fnpResult.survivedDamage,
            "finalFailedSaves": finalFailedSaves,
            "damage": damageArray
        });
        return results;
    }

    simulateAmount(weapon, defender, amount) {
        const results = [];
        for (let i = 0; i < amount; i++) {
            const result = this.simulateOne(weapon, defender);
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
        const allDamageValues = [];
        for (let i = 0; i < results.length; i++) {
            for (let j = 0; j < results[i][0].damage.length; j++) {
                allDamageValues.push(results[i][0].damage[j]);
            }
        }

        // Schaden auf Modelle anwenden
        for (const damage of allDamageValues) {
            currentModelWounds += damage;
            if (currentModelWounds >= defender.wounds) {
                modelsDestroyed++;
                currentModelWounds = 0;
            }
        }

        return modelsDestroyed / results.length; // Durchschnitt über alle Simulationen
    }

    getNewTargetJson() {
        return {
            "Name": "",
            "ModelsDestroyed": 0,
            "MaximumModels": 0,
            "TotalDamage": 0, // Neu für einzelne große Einheiten
            "MaxWounds": 0, // Neu für Wounds-Information
            "Weapons": []
        };
    }

    createResults(attacker, defenders, amount) {
        const result = {
            "Name": attacker.Name,
            "Target": []
        };
        for (let i = 0; i < defenders.length; i++) {
            const defender = defenders[i];
            const target = this.getNewTargetJson();
            target.Name = defender.Name;
            target.MaximumModels = defender.models;
            target.MaxWounds = defender.wounds; // Wounds pro Modell

            // Für jede Simulation sammeln wir alle Waffen-Ergebnisse
            const simulationResults = [];
            
            // Führe alle Simulationen durch
            for (let sim = 0; sim < amount; sim++) {
                let totalDamageThisSim = 0;
                const weaponResults = [];

                for (let j = 0; j < attacker.Weapons.length; j++) {
                    const weapon = attacker.getWeapon(j);
                    // getAttacks() multipliziert bereits mit amount, daher nur einmal simulieren
                    const simulator = new Simulator(1); // Nur eine Simulation pro Durchgang
                    const results = simulator.simulateOne(weapon, defender);
                    const weaponDamage = results[0].damage.reduce((sum, dmg) => sum + dmg, 0);
                    totalDamageThisSim += weaponDamage;
                    
                    weaponResults.push({
                        name: weapon.name,
                        hits: results[0].hits,
                        wounds: results[0].wounds,
                        failedSaves: results[0].failedSaves,
                        damage: weaponDamage
                    });
                }

                simulationResults.push({
                    totalDamage: totalDamageThisSim,
                    weapons: weaponResults
                });
            }

            // Bestimme ob Einzelmodell oder Multi-Modell Unit
            const isSingleModel = defender.models === 1;
            let distributionCounts;
            let maxValue;

            if (isSingleModel) {
                // Für Einzelmodelle: Schadenverteilung
                const maxPossibleDamage = defender.wounds;
                distributionCounts = new Array(maxPossibleDamage + 1).fill(0);
                maxValue = defender.wounds;
                
                simulationResults.forEach(result => {
                    // FIX: Begrenze Schaden auf maximale Wounds des Ziels
                    const cappedDamage = Math.min(result.totalDamage, defender.wounds);
                    distributionCounts[cappedDamage]++;
                });
            } else {
                // Für Multi-Modell Units: Vernichtete Modelle
                // KEIN DECKEL - zeige alle möglichen Ergebnisse, auch über die Anzahl Modelle hinaus
                const maxObservedKills = Math.max(...simulationResults.map(r => 
                    this.calculateModelsKilledFromDamage(r.totalDamage, defender)
                ));
                const maxPossibleKills = Math.max(defender.models, maxObservedKills);
                distributionCounts = new Array(maxPossibleKills + 1).fill(0);
                maxValue = maxPossibleKills;
                
                simulationResults.forEach(result => {
                    const modelsKilled = this.calculateModelsKilledFromDamage(result.totalDamage, defender);
                    distributionCounts[modelsKilled]++;
                });

                // Debug: Log der Distribution für Multi-Model Units
                console.log(`Debug ${defender.Name}:`, {
                    distributionCounts,
                    totalSimulations: amount,
                    sumCheck: distributionCounts.reduce((a, b) => a + b, 0),
                    maxObservedKills,
                    defenderModels: defender.models
                });
            }

            // Berechne Durchschnittswerte
            const averageTotalDamage = simulationResults.reduce((sum, r) => sum + r.totalDamage, 0) / amount;
            const averageModelsDestroyed = isSingleModel ? 
                (averageTotalDamage / defender.wounds) : 
                simulationResults.reduce((sum, r) => sum + this.calculateModelsKilledFromDamage(r.totalDamage, defender), 0) / amount;

            target.ModelsDestroyed = averageModelsDestroyed;
            target.TotalDamage = averageTotalDamage;

            // Sammle Waffen-Statistiken
            const weaponStats = {};
            simulationResults.forEach(result => {
                result.weapons.forEach(weapon => {
                    if (!weaponStats[weapon.name]) {
                        weaponStats[weapon.name] = {
                            hits: 0,
                            wounds: 0,
                            failedSaves: 0,
                            damage: 0,
                            count: 0
                        };
                    }
                    weaponStats[weapon.name].hits += weapon.hits;
                    weaponStats[weapon.name].wounds += weapon.wounds;
                    weaponStats[weapon.name].failedSaves += weapon.failedSaves;
                    weaponStats[weapon.name].damage += weapon.damage;
                    weaponStats[weapon.name].count++;
                });
            });

            Object.keys(weaponStats).forEach(weaponName => {
                const stats = weaponStats[weaponName];
                const count = stats.count;
                target.Weapons.push({
                    "Name": weaponName,
                    "Hits": stats.hits / count,
                    "Wounds": stats.wounds / count,
                    "FailedSaves": stats.failedSaves / count,
                    "AverageDamage": stats.damage / count
                });
            });

            // Berechne Wahrscheinlichkeiten
            if (isSingleModel) {
                // Für Einzelmodelle: Schadenverteilung
                target.KillDistribution = distributionCounts.map((count, damage) => ({
                    kills: damage,
                    probability: (count / amount) * 100,
                    count: count,
                    label: `${damage} Wounds`
                })).filter(item => item.probability > 0.1); // Nur Ergebnisse > 0.1% anzeigen

                // Komplette Vernichtung = Schaden >= maximale Wounds
                const completeKillCount = distributionCounts.slice(defender.wounds).reduce((sum, count) => sum + count, 0);
                target.CompleteWipeoutChance = (completeKillCount / amount) * 100;
            } else {
                // Für Multi-Modell Units: Vernichtete Modelle - zeige ALLE Ergebnisse
                // Erstelle sowohl absolute als auch kumulative Verteilung
                const absoluteDistribution = distributionCounts.map((count, kills) => ({
                    kills: kills,
                    probability: (count / amount) * 100,
                    count: count,
                    label: `Exactly ${kills} Models`
                }));

                // Kumulative Verteilung: "Mindestens X Modelle getötet"
                const cumulativeDistribution = [];
                for (let i = 0; i <= maxValue; i++) {
                    const cumulativeCount = distributionCounts.slice(i).reduce((sum, count) => sum + count, 0);
                    const probability = (cumulativeCount / amount) * 100;
                    if (probability > 0.01) { // Nur Wahrscheinlichkeiten > 0.01% anzeigen
                        cumulativeDistribution.push({
                            kills: i,
                            probability: probability,
                            count: cumulativeCount,
                            label: `≥${i} Models`
                        });
                    }
                }

                // Verwende kumulative Verteilung für bessere Analyse
                target.KillDistribution = cumulativeDistribution;
                target.AbsoluteDistribution = absoluteDistribution.filter(item => item.count > 0);

                target.CompleteWipeoutChance = (distributionCounts[defender.models] / amount) * 100;
            }

            result.Target.push(target);
        }
        return result;
    }

    calculateModelsKilledFromDamage(totalDamage, defender) {
        let modelsKilled = 0;
        let remainingDamage = totalDamage;

        while (remainingDamage >= defender.wounds && modelsKilled < defender.models) {
            modelsKilled++;
            remainingDamage -= defender.wounds;
        }

        return modelsKilled;
    }

    calculateModelsKilledInSingleSim(simResult, defender) {
        let modelsKilled = 0;
        let currentModelWounds = 0;

        for (const damage of simResult.damage) {
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
    const results = [];
    const amount = jsonParser.json["Amount"] || 100;
    for (let i = 0; i < jsonParser.json["Attackers"].length; i++) {
        const attacker = jsonParser.getAttacker(i);

        const simulator = new Simulator(amount);
        const result = simulator.createResults(attacker, defenders, amount);
        // console.log(result);  // Commented out for production
        results.push(result);
    }
    return results;
}

export default run;
