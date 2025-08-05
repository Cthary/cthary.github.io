import { Attacker, Defender } from "./units.js";
import { Dice } from "./dice.js";
import { JsonParser } from "./jsonparser.js";

export class CombatCalculator {
    constructor() {
        this.dice = new Dice();
    }

    // Optimierte Hit-Phase mit besserem Keyword-Handling
    calculateHits(weapon, defender) {
        let attackCount = weapon.getAttacks();
        let hitTarget = weapon.to_hit;
        let critHitThreshold = 6;
        let rerollType = "none";
        
        // Blast: +1 Attack pro 5 Modelle (1-4=+0, 5-9=+1, 10-14=+2, etc.)
        if (weapon.Keywords.some(k => k.toLowerCase().includes("blast"))) {
            const bonusAttacks = Math.floor(defender.models / 5);
            attackCount += bonusAttacks;
        }
        
        // Sammle alle Modifikatoren
        const modifiers = this.gatherHitModifiers(weapon, defender);
        hitTarget = Math.max(2, Math.min(6, hitTarget + modifiers.hitModifier));
        critHitThreshold = modifiers.critHitThreshold;
        rerollType = modifiers.rerollType;

        // Torrent: Automatische Hits
        if (weapon.Keywords.some(k => k.toLowerCase().includes("torrent"))) {
            return {
                normalHits: attackCount,
                criticalHits: 0,
                mortalWounds: 0
            };
        }

        // Würfelwürfe mit Rerolls
        const rolls = this.rollWithRerolls(attackCount, hitTarget, rerollType);
        
        let normalHits = 0;
        let criticalHits = 0;
        let mortalWounds = 0;

        for (const roll of rolls) {
            // Hazardous prüfen (nur bei ursprünglichen 1ern)
            if (weapon.Keywords.some(k => k.toLowerCase().includes("hazardous")) && roll === 1) {
                mortalWounds++;
            }

            if (roll >= hitTarget) {
                if (roll >= critHitThreshold) {
                    criticalHits++;
                } else {
                    normalHits++;
                }
            }
        }

        // Sustained Hits für Critical Hits
        if (weapon.sustainedHits && criticalHits > 0) {
            const sustainedTotal = this.calculateSustainedHits(weapon.sustainedHits, criticalHits);
            normalHits += sustainedTotal;
        }

        return { normalHits, criticalHits, mortalWounds };
    }

    // Optimierte Wound-Phase
    calculateWounds(weapon, defender, hitResult) {
        const { normalHits, criticalHits } = hitResult;
        const totalHits = normalHits + criticalHits;
        
        if (totalHits === 0) {
            return { normalWounds: 0, criticalWounds: 0, mortalWounds: 0 };
        }

        let woundTarget = this.calculateWoundTarget(weapon.strength, defender.toughness);
        let critWoundThreshold = 6;
        let rerollType = "none";

        // Sammle Wound-Modifikatoren
        const modifiers = this.gatherWoundModifiers(weapon, defender);
        woundTarget = Math.max(2, Math.min(6, woundTarget + modifiers.woundModifier));
        critWoundThreshold = modifiers.critWoundThreshold;
        rerollType = modifiers.rerollType;

        // Lethal Hits: Critical Hits werden automatisch zu Wounds
        let autoWounds = 0;
        if (weapon.lethalHits) {
            autoWounds = criticalHits;
        }

        // Würfle für normale Hits (+ Critical Hits wenn kein Lethal Hits)
        const hitsToRoll = weapon.lethalHits ? normalHits : totalHits;
        const rolls = this.rollWithRerolls(hitsToRoll, woundTarget, rerollType);

        let normalWounds = autoWounds; // Lethal Hits als normale Wounds
        let criticalWounds = 0;
        let mortalWounds = 0;

        for (const roll of rolls) {
            if (roll >= woundTarget) {
                const isCritical = this.isCriticalWound(roll, critWoundThreshold, weapon, defender);
                
                if (isCritical && weapon.devastatingWounds) {
                    mortalWounds++;
                } else if (isCritical) {
                    criticalWounds++;
                } else {
                    normalWounds++;
                }
            }
        }

        return { normalWounds, criticalWounds, mortalWounds };
    }

    // Optimierte Save-Phase
    calculateSaves(weapon, defender, woundResult) {
        const { normalWounds, criticalWounds } = woundResult;
        const totalWounds = normalWounds + criticalWounds;
        
        if (totalWounds === 0) {
            return { failedSaves: 0 };
        }

        let saveTarget = defender.save + weapon.ap;
        
        // Cover-Bonus (wenn nicht ignoriert)
        if (defender.Keywords.some(k => k.toLowerCase().includes("cover")) && 
            !weapon.Keywords.some(k => k.toLowerCase().includes("ignores cover"))) {
            saveTarget -= 1;
        }

        // Invulnerable Save verwenden wenn besser
        if (defender.invulnerable && defender.invulnerable < saveTarget) {
            saveTarget = defender.invulnerable;
        }

        saveTarget = Math.max(2, Math.min(6, saveTarget));

        // Würfle für Saves
        const rolls = this.rollDice(totalWounds);
        let failedSaves = 0;

        for (const roll of rolls) {
            if (roll < saveTarget) {
                failedSaves++;
            }
        }

        return { failedSaves };
    }

    // Optimierte Feel No Pain Phase
    calculateFeelNoPain(defender, failedSaves) {
        if (!defender.feelNoPainValue || failedSaves === 0) {
            return { savedWounds: 0, remainingWounds: failedSaves };
        }

        const rolls = this.rollDice(failedSaves);
        let savedWounds = 0;

        for (const roll of rolls) {
            if (roll >= defender.feelNoPainValue) {
                savedWounds++;
            }
        }

        return { 
            savedWounds, 
            remainingWounds: failedSaves - savedWounds 
        };
    }

    // Optimierte Damage-Phase
    calculateDamage(weapon, defender, remainingWounds, mortalWounds) {
        const damageInstances = [];

        // Normale Damage Instances
        for (let i = 0; i < remainingWounds; i++) {
            let damage = this.dice.parseAndRoll(weapon.damage);
            damage = this.applyDamageModifiers(damage, weapon, defender);
            damageInstances.push(damage);
        }

        // Mortal Wounds (immer 1 Damage, keine Modifikatoren)
        for (let i = 0; i < mortalWounds; i++) {
            damageInstances.push(1);
        }

        return damageInstances;
    }

    // Hilfsmethoden für bessere Struktur
    gatherHitModifiers(weapon, defender) {
        let hitModifier = 0;
        let critHitThreshold = 6;
        let rerollType = "none";

        // Waffen-Modifikatoren
        if (weapon.Keywords.some(k => k.toLowerCase().includes("indirect fire"))) {
            hitModifier += 1; // -1 to hit
        }

        // Verteidiger-Modifikatoren
        if (defender.Keywords.some(k => k.toLowerCase().includes("-1 to hit"))) {
            hitModifier += 1;
        }
        if (defender.Keywords.some(k => k.toLowerCase().includes("+1 to hit"))) {
            hitModifier -= 1;
        }

        // Rerolls
        if (weapon.Keywords.includes("RHMiss")) rerollType = "miss";
        else if (weapon.Keywords.includes("RH1")) rerollType = "ones";
        else if (weapon.Keywords.includes("RHNoCrit")) rerollType = "nocrit";

        // Critical Hit Threshold
        for (const keyword of weapon.Keywords) {
            const match = keyword.match(/CritHit(\d+)/);
            if (match) {
                critHitThreshold = parseInt(match[1]);
                break;
            }
        }

        return { hitModifier, critHitThreshold, rerollType };
    }

    gatherWoundModifiers(weapon, defender) {
        let woundModifier = 0;
        let critWoundThreshold = 6;
        let rerollType = "none";

        // Waffen-Modifikatoren
        if (weapon.Keywords.some(k => k.toLowerCase().includes("+1 to wound"))) {
            woundModifier -= 1;
        }
        if (weapon.Keywords.some(k => k.toLowerCase().includes("-1 to wound"))) {
            woundModifier += 1;
        }

        // "-1 wound when stronger" - wenn Stärke > Toughness
        if (weapon.Keywords.some(k => k.toLowerCase().includes("-1 wound when stronger"))) {
            if (weapon.strength > defender.toughness) {
                woundModifier += 1;
            }
        }

        // Lance (bei Charge)
        if (weapon.Keywords.some(k => k.toLowerCase().includes("lance"))) {
            woundModifier -= 1;
        }

        // Verteidiger-Modifikatoren
        if (defender.Keywords.some(k => k.toLowerCase().includes("-1 to wound"))) {
            woundModifier += 1;
        }
        if (defender.Keywords.some(k => k.toLowerCase().includes("+1 to wound"))) {
            woundModifier -= 1;
        }

        // Rerolls
        if (weapon.Keywords.includes("RWMiss")) rerollType = "miss";
        else if (weapon.Keywords.includes("RW1")) rerollType = "ones";
        else if (weapon.Keywords.includes("RWNoCrit")) rerollType = "nocrit";

        // Twin-linked
        if (weapon.Keywords.some(k => k.toLowerCase().includes("twin-linked") || k.toLowerCase().includes("twin linked"))) {
            rerollType = "miss";
        }

        // Critical Wound Threshold
        for (const keyword of weapon.Keywords) {
            const match = keyword.match(/CritWound(\d+)/);
            if (match) {
                critWoundThreshold = parseInt(match[1]);
                break;
            }
        }

        return { woundModifier, critWoundThreshold, rerollType };
    }

    calculateWoundTarget(strength, toughness) {
        if (strength >= 2 * toughness) return 2;
        if (strength > toughness) return 3;
        if (strength === toughness) return 4;
        if (strength * 2 <= toughness) return 6;
        return 5; // strength < toughness
    }

    isCriticalWound(roll, critThreshold, weapon, defender) {
        // Anti-X Keywords prüfen
        for (const keyword of weapon.Keywords) {
            if (keyword.startsWith("Anti-")) {
                const targetType = keyword.substring(5).toLowerCase();
                const hasType = defender.type?.toLowerCase() === targetType ||
                               defender.Keywords.some(k => k.toLowerCase() === targetType);
                
                if (hasType) {
                    // Anti-X macht Critical Wounds wahrscheinlicher
                    const match = keyword.match(/Anti-\w+\s+(\d+)/);
                    if (match) {
                        const antiThreshold = parseInt(match[1]);
                        return roll >= antiThreshold;
                    }
                }
            }
        }

        return roll >= critThreshold;
    }

    calculateSustainedHits(sustainedValue, criticalHits) {
        let total = 0;
        for (let i = 0; i < criticalHits; i++) {
            total += this.dice.parseAndRoll(sustainedValue);
        }
        return total;
    }

    applyDamageModifiers(baseDamage, weapon, defender) {
        let damage = baseDamage;

        // Reihenfolge: Halve -> Increase -> Decrease
        if (defender.Keywords.some(k => k.toLowerCase().includes("halve damage") || k.toLowerCase().includes("/2d"))) {
            damage = Math.max(1, Math.floor(damage / 2));
        }

        // Melta X: +X Damage bei Range ≤ Hälfte (simulieren als immer aktiv)
        for (const keyword of weapon.Keywords) {
            const meltaMatch = keyword.match(/melta\s+(\d+)/i);
            if (meltaMatch) {
                const bonusDamage = parseInt(meltaMatch[1]);
                damage += bonusDamage;
            }
        }

        if (weapon.Keywords.some(k => k.toLowerCase().includes("+1 dmg") || k.toLowerCase().includes("+1 damage"))) {
            damage += 1;
        }

        if (defender.Keywords.some(k => k.toLowerCase().includes("-1 dmg") || k.toLowerCase().includes("-1 damage"))) {
            damage = Math.max(1, damage - 1);
        }

        return damage;
    }

    rollWithRerolls(count, target, rerollType) {
        let rolls = this.rollDice(count);

        if (rerollType === "miss") {
            const failedIndices = rolls.map((roll, i) => roll < target ? i : -1).filter(i => i !== -1);
            failedIndices.forEach(i => rolls[i] = this.dice.roll());
        } else if (rerollType === "ones") {
            const onesIndices = rolls.map((roll, i) => roll === 1 ? i : -1).filter(i => i !== -1);
            onesIndices.forEach(i => rolls[i] = this.dice.roll());
        } else if (rerollType === "nocrit") {
            const nonCritIndices = rolls.map((roll, i) => roll === 1 ? i : -1).filter(i => i !== -1);
            nonCritIndices.forEach(i => rolls[i] = this.dice.roll());
        }

        return rolls;
    }

    rollDice(count) {
        const rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(this.dice.roll());
        }
        return rolls;
    }
}

export class OptimizedSimulator {
    constructor() {
        this.calculator = new CombatCalculator();
    }

    // Komplett optimierte Einzel-Simulation
    simulateSingleCombat(weapon, defender) {
        // Hit Phase
        const hitResult = this.calculator.calculateHits(weapon, defender);
        
        // Wound Phase
        const woundResult = this.calculator.calculateWounds(weapon, defender, hitResult);
        
        // Save Phase
        const saveResult = this.calculator.calculateSaves(weapon, defender, woundResult);
        
        // Feel No Pain Phase
        const fnpResult = this.calculator.calculateFeelNoPain(defender, saveResult.failedSaves);
        
        // Damage Phase
        const damageInstances = this.calculator.calculateDamage(
            weapon, defender, fnpResult.remainingWounds, woundResult.mortalWounds
        );

        return {
            hits: hitResult.normalHits + hitResult.criticalHits,
            wounds: woundResult.normalWounds + woundResult.criticalWounds,
            failedSaves: saveResult.failedSaves,
            fnpSaves: fnpResult.savedWounds,
            finalDamageInstances: damageInstances,
            mortalWounds: woundResult.mortalWounds + hitResult.mortalWounds,
            totalDamage: damageInstances.reduce((sum, dmg) => sum + dmg, 0)
        };
    }

    // Optimierte Batch-Simulation
    simulateBatch(weapon, defender, simulationCount) {
        const results = [];
        
        // Parallele Simulation für bessere Performance
        for (let i = 0; i < simulationCount; i++) {
            results.push(this.simulateSingleCombat(weapon, defender));
        }

        return results;
    }

    // Optimierte Kill-Berechnung
    calculateKillsFromDamage(damageInstances, defender) {
        let modelsKilled = 0;
        let currentModelWounds = 0;

        for (const damage of damageInstances) {
            currentModelWounds += damage;
            
            if (currentModelWounds >= defender.wounds) {
                modelsKilled++;
                currentModelWounds = 0;
                
                // Stoppe bei maximaler Anzahl Modelle
                if (modelsKilled >= defender.models) {
                    break;
                }
            }
        }

        return modelsKilled;
    }

    // Optimierte Statistik-Berechnung
    calculateStatistics(results, defender) {
        const stats = {
            averageHits: 0,
            averageWounds: 0,
            averageFailedSaves: 0,
            averageTotalDamage: 0,
            averageKills: 0,
            killDistribution: new Map(),
            damageDistribution: new Map(),
            completeWipeoutChance: 0
        };

        let totalKills = 0;
        let completeWipeouts = 0;

        // Sammle alle Statistiken in einem Durchgang
        for (const result of results) {
            stats.averageHits += result.hits;
            stats.averageWounds += result.wounds;
            stats.averageFailedSaves += result.failedSaves;
            stats.averageTotalDamage += result.totalDamage;

            const kills = this.calculateKillsFromDamage(result.finalDamageInstances, defender);
            totalKills += kills;

            // Kill-Verteilung
            const currentKills = stats.killDistribution.get(kills) || 0;
            stats.killDistribution.set(kills, currentKills + 1);

            // Damage-Verteilung (für Einzelmodelle)
            if (defender.models === 1) {
                const cappedDamage = Math.min(result.totalDamage, defender.wounds);
                const currentDamage = stats.damageDistribution.get(cappedDamage) || 0;
                stats.damageDistribution.set(cappedDamage, currentDamage + 1);
            }

            // Complete Wipeout
            if (kills >= defender.models) {
                completeWipeouts++;
            }
        }

        const simulationCount = results.length;
        stats.averageHits /= simulationCount;
        stats.averageWounds /= simulationCount;
        stats.averageFailedSaves /= simulationCount;
        stats.averageTotalDamage /= simulationCount;
        stats.averageKills = totalKills / simulationCount;
        stats.completeWipeoutChance = (completeWipeouts / simulationCount) * 100;

        return stats;
    }
}

// Neue, optimierte Hauptfunktion
function run(jsonData) {
    const jsonParser = new JsonParser(jsonData);
    const defenders = jsonParser.getDefenders();
    const simulationCount = jsonData.Amount || 1000;
    const results = [];

    for (let attackerIndex = 0; attackerIndex < jsonData.Attackers.length; attackerIndex++) {
        const attacker = jsonParser.getAttacker(attackerIndex);
        const simulator = new OptimizedSimulator();
        
        const attackerResult = {
            Name: attacker.Name,
            Target: []
        };

        for (const defender of defenders) {
            const targetResult = {
                Name: defender.Name,
                MaximumModels: defender.models,
                MaxWounds: defender.wounds,
                ModelsDestroyed: 0,
                TotalDamage: 0,
                CompleteWipeoutChance: 0,
                KillDistribution: [],
                Weapons: []
            };

            let totalDefenderStats = null;
            let combinedResults = [];

            // Simuliere alle Waffen gemeinsam für korrekte Kombination
            for (let sim = 0; sim < simulationCount; sim++) {
                let totalHits = 0;
                let totalWounds = 0;
                let totalFailedSaves = 0;
                let totalDamage = 0;
                let allDamageInstances = [];

                // Kombiniere alle Waffen in einer Simulation
                for (let weaponIndex = 0; weaponIndex < attacker.Weapons.length; weaponIndex++) {
                    const weapon = attacker.getWeapon(weaponIndex);
                    const weaponResult = simulator.simulateSingleCombat(weapon, defender);
                    
                    totalHits += weaponResult.hits;
                    totalWounds += weaponResult.wounds;
                    totalFailedSaves += weaponResult.failedSaves;
                    totalDamage += weaponResult.totalDamage;
                    allDamageInstances.push(...weaponResult.finalDamageInstances);

                    // Sammle Waffen-Statistiken (nur beim ersten Durchlauf)
                    if (sim === 0) {
                        targetResult.Weapons.push({
                            Name: weapon.name,
                            Hits: 0, // Wird später berechnet
                            Wounds: 0,
                            FailedSaves: 0,
                            AverageDamage: 0
                        });
                    }
                }

                combinedResults.push({
                    hits: totalHits,
                    wounds: totalWounds,
                    failedSaves: totalFailedSaves,
                    totalDamage: totalDamage,
                    finalDamageInstances: allDamageInstances
                });
            }

            // Berechne kombinierte Statistiken
            totalDefenderStats = simulator.calculateStatistics(combinedResults, defender);

            // Aktualisiere Waffen-Statistiken separat
            for (let weaponIndex = 0; weaponIndex < attacker.Weapons.length; weaponIndex++) {
                const weapon = attacker.getWeapon(weaponIndex);
                const weaponResults = simulator.simulateBatch(weapon, defender, simulationCount);
                const weaponStats = simulator.calculateStatistics(weaponResults, defender);

                targetResult.Weapons[weaponIndex].Hits = weaponStats.averageHits;
                targetResult.Weapons[weaponIndex].Wounds = weaponStats.averageWounds;
                targetResult.Weapons[weaponIndex].FailedSaves = weaponStats.averageFailedSaves;
                targetResult.Weapons[weaponIndex].AverageDamage = weaponStats.averageTotalDamage;
            }

            if (totalDefenderStats) {
                targetResult.ModelsDestroyed = totalDefenderStats.averageKills;
                targetResult.TotalDamage = totalDefenderStats.averageTotalDamage;
                targetResult.CompleteWipeoutChance = totalDefenderStats.completeWipeoutChance;

                // Konvertiere Kill-Distribution für UI
                const distributionArray = [];
                
                // Für einzelne Modelle: verwende Damage-Distribution für bessere Granularität
                if (defender.models === 1 && totalDefenderStats.damageDistribution.size > 0) {
                    const sortedDamage = Array.from(totalDefenderStats.damageDistribution.keys()).sort((a, b) => a - b);
                    const maxDamage = Math.max(...sortedDamage);
                    
                    for (let i = 0; i <= maxDamage; i++) {
                        const cumulativeCount = sortedDamage
                            .filter(d => d >= i)
                            .reduce((sum, d) => sum + (totalDefenderStats.damageDistribution.get(d) || 0), 0);
                        
                        if (cumulativeCount > 0) {
                            const probability = (cumulativeCount / simulationCount) * 100;
                            distributionArray.push({
                                kills: i,
                                probability: probability,
                                count: cumulativeCount,
                                label: `≥${i} Wounds`
                            });
                        }
                    }
                } else {
                    // Für Multi-Model-Units: verwende Kill-Distribution
                    const sortedKills = Array.from(totalDefenderStats.killDistribution.keys()).sort((a, b) => a - b);
                    
                    for (let i = 0; i <= Math.max(...sortedKills); i++) {
                        const cumulativeCount = sortedKills
                            .filter(k => k >= i)
                            .reduce((sum, k) => sum + (totalDefenderStats.killDistribution.get(k) || 0), 0);
                        
                        if (cumulativeCount > 0) {
                            const probability = (cumulativeCount / simulationCount) * 100;
                            distributionArray.push({
                                kills: i,
                                probability: probability,
                                count: cumulativeCount,
                                label: `≥${i} Models`
                            });
                        }
                    }
                }

                targetResult.KillDistribution = distributionArray;
            }

            attackerResult.Target.push(targetResult);
        }

        results.push(attackerResult);
    }

    return results;
}

export default run;
