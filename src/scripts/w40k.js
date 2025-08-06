import { Attacker, Defender, Weapon } from "./units.js";
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
        
        if (attackCount <= 0) {
            return { normalHits: 0, criticalHits: 0, mortalWounds: 0 };
        }
        
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
        const rolls = this.rollWithRerolls(attackCount, hitTarget, rerollType, critHitThreshold);
        
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
        const hasSustainedHits = weapon.Keywords.some(k => k.toLowerCase().includes("sustained hits"));
        if (hasSustainedHits && criticalHits > 0) {
            // Finde den Sustained Hits Wert
            const sustainedKeyword = weapon.Keywords.find(k => k.toLowerCase().includes("sustained hits"));
            const match = sustainedKeyword.match(/sustained\s+hits\s+(\d+|d\d+)/i);
            let sustainedValue = "1"; // Default
            if (match) {
                sustainedValue = match[1];
            }
            const sustainedTotal = this.calculateSustainedHits(sustainedValue, criticalHits);
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
        const hasLethalHits = weapon.Keywords.some(k => k.toLowerCase().includes("lethal hits"));
        if (hasLethalHits) {
            autoWounds = criticalHits; // Critical Hits werden zu normalen Wounds
        }

        // Würfle für normale Hits (+ Critical Hits wenn kein Lethal Hits)
        const hitsToRoll = hasLethalHits ? normalHits : totalHits;
        const rolls = this.rollWithRerolls(hitsToRoll, woundTarget, rerollType, critWoundThreshold);

        let normalWounds = autoWounds; // Lethal Hits als normale Wounds
        let criticalWounds = 0;
        let mortalWounds = 0;

        const hasDevastatingWounds = weapon.Keywords.some(k => k.toLowerCase().includes("devastating wounds"));

        for (const roll of rolls) {
            if (roll >= woundTarget) {
                const isCritical = this.isCriticalWound(roll, critWoundThreshold, weapon, defender);
                
                if (isCritical) {
                    if (hasDevastatingWounds) {
                        mortalWounds++; // Critical Wounds mit Devastating Wounds werden zu Mortal Wounds
                    } else {
                        criticalWounds++; // Normale Critical Wounds
                    }
                } else {
                    normalWounds++; // Normale Wounds
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

        // Check for damage reroll keywords
        const hasKnightDamageReroll = weapon.Keywords.includes("KnightDamageReroll");
        const hasRerollLowDamage = weapon.Keywords.includes("RerollDamageLow3");

        // Normale Damage Instances
        for (let i = 0; i < remainingWounds; i++) {
            let damage;
            if (typeof weapon.getDamage === 'function') {
                damage = weapon.getDamage();
            } else {
                damage = this.dice.parseAndRoll(weapon.damage);
            }

            // Apply damage rerolls
            if (hasKnightDamageReroll) {
                // Knight damage reroll: exactly 1 reroll per model, use it on any damage
                let rerollDamage;
                if (typeof weapon.getDamage === 'function') {
                    rerollDamage = weapon.getDamage();
                } else {
                    rerollDamage = this.dice.parseAndRoll(weapon.damage);
                }
                damage = Math.max(damage, rerollDamage); // Take the better result
            } else if (hasRerollLowDamage && damage < 3) {
                // Reroll damage if it's less than 3
                if (typeof weapon.getDamage === 'function') {
                    damage = weapon.getDamage();
                } else {
                    damage = this.dice.parseAndRoll(weapon.damage);
                }
            }

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
        else if (weapon.Keywords.includes("KnightHitReroll")) rerollType = "knight"; // 1x Reroll pro Model

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
        else if (weapon.Keywords.includes("KnightWoundReroll")) rerollType = "knight"; // 1x Reroll pro Model

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

    rollWithRerolls(count, target, rerollType, critThreshold = 6) {
        let rolls = this.rollDice(count);

        if (rerollType === "miss") {
            const failedIndices = rolls.map((roll, i) => roll < target ? i : -1).filter(i => i !== -1);
            failedIndices.forEach(i => rolls[i] = this.dice.roll());
        } else if (rerollType === "ones") {
            const onesIndices = rolls.map((roll, i) => roll === 1 ? i : -1).filter(i => i !== -1);
            onesIndices.forEach(i => rolls[i] = this.dice.roll());
        } else if (rerollType === "nocrit") {
            // Reroll alle Würfe die KEINE Critical Hits/Wounds sind (< critThreshold)
            const nonCritIndices = rolls.map((roll, i) => roll < critThreshold ? i : -1).filter(i => i !== -1);
            nonCritIndices.forEach(i => rolls[i] = this.dice.roll());
        } else if (rerollType === "knight") {
            // Knight reroll: exactly 1 reroll per model, use it on the worst roll
            if (rolls.length > 0) {
                const worstRollIndex = rolls.indexOf(Math.min(...rolls));
                rolls[worstRollIndex] = this.dice.roll();
            }
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

        const result = {
            hits: hitResult.normalHits + hitResult.criticalHits,
            wounds: woundResult.normalWounds + woundResult.criticalWounds,
            failedSaves: saveResult.failedSaves,
            fnpSaves: fnpResult.savedWounds,
            finalDamageInstances: damageInstances,
            mortalWounds: woundResult.mortalWounds + hitResult.mortalWounds,
            totalDamage: damageInstances.reduce((sum, dmg) => sum + dmg, 0)
        };
        
        console.log('Final simulation result:', result);
        return result;
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

// Neue, optimierte Hauptfunktion mit Gruppen-Support
function run(jsonData) {
    const simulationCount = jsonData.Amount || 1000;
    const results = [];

    console.log('Simulation Input:', jsonData);

    // Gruppiere Angreifer nach Gruppen zusammen, aber behalte Waffen-Zuordnung
    const attackerGroups = {};
    jsonData.Attackers.forEach(attacker => {
        // Extrahiere Gruppen-Namen aus dem Angreifer-Namen
        const match = attacker.Name.match(/\((.*?)\)$/);
        const groupName = match ? match[1] : 'Einzelkämpfer';
        
        if (!attackerGroups[groupName]) {
            attackerGroups[groupName] = {
                GroupName: groupName,
                Attackers: [],
                WeaponGroups: []  // Neue Struktur für Waffen-Gruppierung
            };
        }
        
        attackerGroups[groupName].Attackers.push(attacker);
        
        // Gruppiere Waffen nach ursprünglichem Besitzer bereits beim Hinzufügen
        attacker.Weapons.forEach(weapon => {
            // Extrahiere ursprünglichen Angreifer-Namen (ohne Nummer und Gruppe)
            const originalName = attacker.Name.replace(/\s+\d+\s+\(.*?\)$/, '').trim();
            
            console.log(`Processing weapon ${weapon.name} for attacker ${attacker.Name} -> originalOwner: ${originalName}, amount: ${weapon.amount}`);
            
            // Suche nach existierender Waffe mit gleichem Namen und Besitzer
            const existingWeaponIndex = attackerGroups[groupName].WeaponGroups.findIndex(w => 
                w.name === weapon.name && w.originalOwner === originalName
            );
            
            if (existingWeaponIndex >= 0) {
                // Kombiniere die Waffen-Mengen
                attackerGroups[groupName].WeaponGroups[existingWeaponIndex].amount += weapon.amount;
                console.log(`Combined weapon ${weapon.name} (${originalName}): new amount = ${attackerGroups[groupName].WeaponGroups[existingWeaponIndex].amount}`);
            } else {
                // Füge neue Waffe hinzu mit Deep Copy der Keywords
                attackerGroups[groupName].WeaponGroups.push({
                    ...weapon,
                    Keywords: JSON.parse(JSON.stringify(weapon.Keywords || [])), // Deep copy keywords
                    originalOwner: originalName
                });
                console.log(`Added new weapon ${weapon.name} (${originalName}): amount = ${weapon.amount}`);
            }
        });
    });

    // Simuliere jeden Angreifer-Gruppe gegen jeden Verteidiger-Gruppe
    for (const [groupName, attackerGroup] of Object.entries(attackerGroups)) {
        const groupResult = {
            Name: `${groupName} (${attackerGroup.Attackers.length} Angreifer)`,
            Target: []
        };

        const defenderGroups = jsonData.Defenders || [];
        
        for (const defenderGroup of defenderGroups) {
            if (defenderGroup.Members && defenderGroup.Members.length > 0) {
                // Simuliere Gruppen-Kampf mit Leader-System
                const groupTargetResult = simulateGroupCombat(
                    attackerGroup.WeaponGroups, 
                    defenderGroup, 
                    simulationCount
                );
                
                groupResult.Target.push(groupTargetResult);
            }
        }

        results.push(groupResult);
    }

    console.log('Simulation Results:', results);
    return results;
}

// Neue Funktion für Gruppen-Kämpfe mit Leader-System
function simulateGroupCombat(weaponGroups, defenderGroup, simulationCount) {
    const simulator = new OptimizedSimulator();
    
    // Sortiere Verteidiger: Leader zuletzt
    const sortedMembers = [...defenderGroup.Members].sort((a, b) => {
        if (a.isLeader && !b.isLeader) return 1;
        if (!a.isLeader && b.isLeader) return -1;
        return 0;
    });

    // Waffen sind bereits korrekt gruppiert, nur Display-Namen hinzufügen
    const uniqueWeapons = weaponGroups.map(weapon => ({
        ...weapon,
        Keywords: JSON.parse(JSON.stringify(weapon.Keywords || [])), // Deep copy keywords
        displayName: `${weapon.name} (${weapon.originalOwner})`
    }));

    console.log('Final unique weapons for display:', uniqueWeapons.map(w => ({ name: w.displayName, amount: w.amount })));

    const groupTargetResult = {
        Name: defenderGroup.Name,
        Members: [],
        Weapons: uniqueWeapons.map(weapon => ({
            Name: weapon.displayName,
            Hits: 0,
            Wounds: 0,
            FailedSaves: 0,
            AverageDamage: 0
        }))
    };

    // Sammle Waffen-Statistiken separat (für alle Waffen-Instanzen)
    const weaponStats = uniqueWeapons.map(() => ({
        totalHits: 0,
        totalWounds: 0,
        totalFailedSaves: 0,
        totalDamage: 0
    }));

    // Simuliere jede Runde
    for (let sim = 0; sim < simulationCount; sim++) {
        // Erstelle Kopie der Verteidiger für diese Simulation
        const defenderState = sortedMembers.map(member => ({
            ...member,
            currentModels: member.models,
            currentWounds: member.wounds
        }));

        let totalHits = 0;
        let totalWounds = 0;
        let totalFailedSaves = 0;
        let totalDamage = 0;

        // Simuliere alle Waffen kombiniert
        uniqueWeapons.forEach((weapon, weaponIndex) => {
            console.log('Processing weapon:', weapon);
            console.log('Weapon amount:', weapon.amount);
            console.log('Weapon attacks:', weapon.attacks);
            
            // Erstelle Weapon-Objekt direkt mit der Weapon-Klasse für bessere Kompatibilität
            let tempWeapon;
            
            try {
                // Versuche die richtige Weapon-Klasse zu verwenden, falls verfügbar
                if (typeof Weapon !== 'undefined') {
                    console.log('Using Weapon class');
                    tempWeapon = new Weapon({
                        name: weapon.name,
                        type: weapon.type,
                        attacks: weapon.attacks,
                        to_hit: weapon.to_hit,
                        strength: weapon.strength,
                        ap: weapon.ap,
                        damage: weapon.damage,
                        Keywords: JSON.parse(JSON.stringify(weapon.Keywords || [])) // Deep copy of keywords
                        // Don't include amount here - it's handled in the simulation loop
                    });
                } else {
                    console.log('Using fallback weapon object');
                    // Fallback auf manuelles Objekt
                    tempWeapon = {
                        name: weapon.name,
                        type: weapon.type,
                        attacks: weapon.attacks,
                        to_hit: weapon.to_hit,
                        strength: weapon.strength,
                        ap: weapon.ap,
                        damage: weapon.damage,
                        Keywords: JSON.parse(JSON.stringify(weapon.Keywords || [])), // Deep copy of keywords
                        
                        // Methode für Attack-Parsing
                        getAttacks: function() {
                            if (typeof this.attacks === 'string') {
                                if (this.attacks.includes('d')) {
                                    const parts = this.attacks.toLowerCase().split('d');
                                    const numDice = parts[0] === '' ? 1 : parseInt(parts[0]) || 1;
                                    const sides = parseInt(parts[1]) || 6;
                                    let total = 0;
                                    for (let i = 0; i < numDice; i++) {
                                        total += Math.floor(Math.random() * sides) + 1;
                                    }
                                    return total;
                                }
                                return parseInt(this.attacks) || 1;
                            }
                            return this.attacks || 1;
                        },

                        // Damage-Parsing Methode
                        getDamage: function() {
                            if (typeof this.damage === 'string') {
                                if (this.damage.includes('d')) {
                                    const parts = this.damage.toLowerCase().split('d');
                                    const numDice = parts[0] === '' ? 1 : parseInt(parts[0]) || 1;
                                    const sides = parseInt(parts[1]) || 6;
                                    let total = 0;
                                    for (let i = 0; i < numDice; i++) {
                                        total += Math.floor(Math.random() * sides) + 1;
                                    }
                                    return total;
                                }
                                return parseInt(this.damage) || 1;
                            }
                            return this.damage || 1;
                        }
                    };
                }
            } catch (error) {
                console.error('Error creating weapon object:', error);
                return; // Skip this weapon
            }

            // Prüfe ob tempWeapon erfolgreich erstellt wurde
            if (!tempWeapon) {
                console.error('Failed to create tempWeapon for:', weapon);
                return;
            }

            // Erstelle Standard-Verteidiger für Waffen-Simulation
            const standardDefender = {
                models: Math.max(1, defenderState.reduce((sum, d) => sum + d.currentModels, 0)),
                toughness: sortedMembers[0].toughness,
                wounds: sortedMembers[0].wounds,
                save: sortedMembers[0].save,
                invulnerable: sortedMembers[0].invulnerable,
                Keywords: sortedMembers[0].Keywords || []
            };

            console.log(`Simulating weapon: ${weapon.displayName}, Amount: ${weapon.amount}`);

            // Simuliere diese Waffe entsprechend ihrer amount
            let weaponTotalHits = 0;
            let weaponTotalWounds = 0;
            let weaponTotalFailedSaves = 0;
            let weaponTotalDamage = 0;

            // Simuliere die Waffe so oft wie amount angibt
            for (let weaponInstance = 0; weaponInstance < weapon.amount; weaponInstance++) {
                const weaponResult = simulator.simulateSingleCombat(tempWeapon, standardDefender);
                
                weaponTotalHits += weaponResult.hits;
                weaponTotalWounds += weaponResult.wounds;
                weaponTotalFailedSaves += weaponResult.failedSaves;
                weaponTotalDamage += weaponResult.totalDamage;
            }

            // Sammle Waffen-Statistiken
            weaponStats[weaponIndex].totalHits += weaponTotalHits;
            weaponStats[weaponIndex].totalWounds += weaponTotalWounds;
            weaponStats[weaponIndex].totalFailedSaves += weaponTotalFailedSaves;
            weaponStats[weaponIndex].totalDamage += weaponTotalDamage;

            totalHits += weaponTotalHits;
            totalWounds += weaponTotalWounds;
            totalFailedSaves += weaponTotalFailedSaves;

            // Verteile Schaden mit Leader-System
            let remainingDamage = weaponTotalDamage;
            
            for (const defender of defenderState) {
                if (remainingDamage <= 0) break;
                if (defender.currentModels <= 0) continue;

                // Verteile Schaden auf diesen Verteidiger
                while (remainingDamage > 0 && defender.currentModels > 0) {
                    const damageToApply = Math.min(remainingDamage, defender.currentWounds);
                    defender.currentWounds -= damageToApply;
                    remainingDamage -= damageToApply;

                    if (defender.currentWounds <= 0) {
                        defender.currentModels--;
                        if (defender.currentModels > 0) {
                            defender.currentWounds = defender.wounds; // Nächstes Modell hat volle Wounds
                        } else {
                            defender.currentWounds = 0; // Keine Modelle mehr übrig
                        }
                    }
                }
            }

            totalDamage += (weaponTotalDamage - remainingDamage);
        });

        // Sammle Ergebnisse für diese Simulation
        sortedMembers.forEach((member, index) => {
            if (!groupTargetResult.Members[index]) {
                groupTargetResult.Members[index] = {
                    Name: member.Name,
                    MaximumModels: member.models,
                    MaxWounds: member.wounds,
                    IsLeader: member.isLeader,
                    ModelsDestroyed: 0,
                    TotalDamage: 0,
                    CompleteWipeoutChance: 0,
                    KillDistribution: [],
                    SimulationResults: []
                };
            }

            const modelsKilled = member.models - defenderState[index].currentModels;
            let damageDealt;
            
            if (member.models === 1) {
                // Für Einzelmodelle: Berechne totale Wunden basierend auf verbleibendem Zustand
                if (defenderState[index].currentModels === 0) {
                    // Modell ist tot - es hat seine vollen Wunden genommen
                    damageDealt = member.wounds;
                } else {
                    // Modell lebt noch - berechne wie viele Wunden es genommen hat
                    damageDealt = member.wounds - defenderState[index].currentWounds;
                }
            } else {
                // Für Mehrfachmodelle: Berücksichtige getötete Modelle plus Wunden am aktuellen Modell
                damageDealt = (member.models - defenderState[index].currentModels) * member.wounds + 
                              (member.wounds - defenderState[index].currentWounds);
            }

            groupTargetResult.Members[index].SimulationResults.push({
                modelsKilled: modelsKilled,
                damageDealt: damageDealt,
                completeWipeout: defenderState[index].currentModels === 0
            });
        });
    }

    // Berechne finale Waffen-Statistiken
    weaponStats.forEach((stats, index) => {
        groupTargetResult.Weapons[index].Hits = stats.totalHits / simulationCount;
        groupTargetResult.Weapons[index].Wounds = stats.totalWounds / simulationCount;
        groupTargetResult.Weapons[index].FailedSaves = stats.totalFailedSaves / simulationCount;
        groupTargetResult.Weapons[index].AverageDamage = stats.totalDamage / simulationCount;
    });

    // Berechne finale Statistiken für jedes Member
    groupTargetResult.Members.forEach(member => {
        const results = member.SimulationResults;
        
        member.ModelsDestroyed = results.reduce((sum, r) => sum + r.modelsKilled, 0) / results.length;
        member.TotalDamage = results.reduce((sum, r) => sum + r.damageDealt, 0) / results.length;
        member.CompleteWipeoutChance = (results.filter(r => r.completeWipeout).length / results.length) * 100;

        // Erstelle Kill-Distribution (oder Wound-Distribution für Einzelmodelle)
        const isSingleModel = member.MaximumModels === 1;
        const distributionCounts = {};
        
        results.forEach(r => {
            const value = isSingleModel ? Math.min(r.damageDealt, member.MaxWounds) : r.modelsKilled;
            distributionCounts[value] = (distributionCounts[value] || 0) + 1;
        });
        
        const distributionArray = [];
        const maxValue = isSingleModel ? member.MaxWounds : member.MaximumModels;
        
        for (let i = 0; i <= maxValue; i++) {
            const cumulativeCount = Object.keys(distributionCounts)
                .filter(k => parseInt(k) >= i)
                .reduce((sum, k) => sum + distributionCounts[k], 0);
            
            if (cumulativeCount > 0) {
                const percentage = (cumulativeCount / simulationCount) * 100;
                distributionArray.push({
                    value: i,
                    percentage: percentage,
                    count: cumulativeCount
                });
            }
        }

        member.KillDistribution = distributionArray;
        delete member.SimulationResults; // Entferne temporäre Daten
    });

    return groupTargetResult;
}

export default run;
