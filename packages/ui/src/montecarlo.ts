// RNG, Dice, Monte-Carlo für Browser (Kopie aus core, keine Node-APIs)
import type { WeaponModifiers } from './types/modifiers';

export class RNG {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    let z = (this.state += 0x9e3779b9);
    z = (z ^ (z >>> 16)) >>> 0;
    z = Math.imul(z, 0x85ebca6b) >>> 0;
    z = (z ^ (z >>> 13)) >>> 0;
    z = Math.imul(z, 0xc2b2ae35) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    return z >>> 0;
  }
  nextFloat(): number { return this.next() / 0x100000000; }
  rollDie(n: number): number { return Math.floor(this.nextFloat() * n) + 1; }
}
export function rollMany(n: number, sides: number, rng: RNG): number[] {
  return Array.from({ length: n }, () => rng.rollDie(sides));
}
export function countSuccess(rolls: number[], target: number): number {
  return rolls.filter(r => r >= target).length;
}
export function toHit(attack: { BS?: number; WS?: number }, mods = 0): number {
  const skill = attack.WS || attack.BS || 4; // Use WS for melee, BS for ranged, default to 4+
  return Math.max(2, Math.min(6, skill + mods));
}
export function toWound(S: number, T: number, mods = 0): number {
  let baseTarget = 4;
  if (S >= 2 * T) baseTarget = 2;
  else if (S > T) baseTarget = 3;
  else if (S === T) baseTarget = 4;
  else if (S < T && S * 2 > T) baseTarget = 5;
  else baseTarget = 6;
  
  return Math.max(2, Math.min(6, baseTarget + mods));
}
export function toSave(Sv: number, AP: number, Inv?: number): number {
  const normal = Sv + (-AP);
  if (Inv && Inv < normal) return Inv;
  return normal;
}
export function applyDamage(W: number, D: number): number {
  return Math.max(0, W - D);
}
export interface MonteCarloResult {
  totalDamage: number;
  kills: number;
  survived: number;
  woundsLeft: number;
}
export interface MonteCarloStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  killChance: number;
}

export function monteCarlo(
  runs: number,
  attack: { A: number; BS?: number; WS?: number; S: number; AP: number; D: number },
  defender: { T: number; Sv: number; W: number; Inv?: number; modelCount?: number },
  modifiers?: WeaponModifiers,
  seed = 42
): { results: MonteCarloResult[]; stats: MonteCarloStats } {
  const rng = new RNG(seed);
  const results: MonteCarloResult[] = [];
  const maxModels = defender.modelCount || 1; // Default to single model if not specified
  
  for (let i = 0; i < runs; ++i) {
    let attacks = attack.A;
    
    // Apply Blast keyword (bonus attacks based on enemy model count)
    if (modifiers?.keywords.some(k => k.type === 'Blast')) {
      const enemyModels = defender.modelCount || 1;
      const bonusAttacks = Math.floor(enemyModels / 5);
      attacks += bonusAttacks;
    }
    
    const hitTarget = toHit(attack, modifiers?.modifications.hit || 0);
    const hitRolls = rollMany(attacks, 6, rng);
    let hits = countSuccess(hitRolls, hitTarget);
    
    // Apply rerolls for hits
    if (modifiers?.rerolls.hit && modifiers.rerolls.hit !== 'N/A') {
      const rerollCondition = modifiers.rerolls.hit;
      const missedHits = hitRolls.filter(roll => {
        if (rerollCondition === '1') return roll === 1;
        if (rerollCondition === 'Miss') return roll < hitTarget;
        if (rerollCondition === 'NonCrit') return roll < 6;
        return false;
      }).length;
      
      // Reroll failed hits
      const rerollRolls = rollMany(missedHits, 6, rng);
      const rerollHits = countSuccess(rerollRolls, hitTarget);
      hits += rerollHits;
    }
    
    // Apply Sustained Hits keyword
    let sustainedHitsBonus = 0;
    const sustainedHitsKeyword = modifiers?.keywords.find(k => k.type === 'SustainedHits');
    if (sustainedHitsKeyword) {
      const critHits = hitRolls.filter(roll => roll === 6).length;
      sustainedHitsBonus = critHits * (sustainedHitsKeyword.value || 1);
      hits += sustainedHitsBonus;
    }
    
    const woundTarget = toWound(attack.S, defender.T, modifiers?.modifications.wound || 0);
    const woundRolls = rollMany(hits, 6, rng);
    let wounds = countSuccess(woundRolls, woundTarget);
    
    // Apply Lethal Hits keyword (auto-wounds on crit hits)
    let lethalWounds = 0;
    if (modifiers?.keywords.some(k => k.type === 'LethalHits')) {
      const critHits = hitRolls.filter(roll => roll === 6).length;
      lethalWounds = critHits;
      wounds += lethalWounds;
    }
    
    // Apply rerolls for wounds
    if (modifiers?.rerolls.wound && modifiers.rerolls.wound !== 'N/A') {
      const rerollCondition = modifiers.rerolls.wound;
      const missedWounds = woundRolls.filter(roll => {
        if (rerollCondition === '1') return roll === 1;
        if (rerollCondition === 'Miss') return roll < woundTarget;
        if (rerollCondition === 'NonCrit') return roll < 6;
        return false;
      }).length;
      
      // Reroll failed wounds
      const rerollRolls = rollMany(missedWounds, 6, rng);
      const rerollWounds = countSuccess(rerollRolls, woundTarget);
      wounds += rerollWounds;
    }
    
    const saveTarget = toSave(defender.Sv, attack.AP, defender.Inv);
    
    // Check for Devastating Wounds (skip saves on crit wounds)
    let devastatingWounds = 0;
    if (modifiers?.keywords.some(k => k.type === 'DevastatingWounds')) {
      const critWounds = woundRolls.filter(roll => roll === 6).length;
      devastatingWounds = critWounds;
    }
    
    const normalWounds = wounds - devastatingWounds;
    const saveRolls = rollMany(normalWounds, 6, rng);
    const failedSaves = normalWounds - countSuccess(saveRolls, saveTarget);
    
    // Total failed saves includes devastating wounds (which auto-fail saves)
    const totalFailedSaves = failedSaves + devastatingWounds;
    
    // Debug für erste Iteration
    if (i === 0) {
      console.log(`🎲 DEBUG Run ${i}:`, {
        attacks, hitTarget, hits, sustainedHitsBonus, woundTarget, wounds, lethalWounds, 
        saveTarget, failedSaves: totalFailedSaves, devastatingWounds,
        attackProfile: attack, defenderProfile: defender, modifiers
      });
    }
    
    let totalDamage = 0;
    let currentModelWounds = defender.W;
    let kills = 0;
    let modelsRemaining = maxModels;
    
    for (let j = 0; j < totalFailedSaves; ++j) {
      if (modelsRemaining <= 0) break; // No more models to kill
      
      let damageThisHit = attack.D;
      
      // Apply damage modifications
      if (modifiers?.modifications.damage) {
        damageThisHit = Math.max(1, damageThisHit + modifiers.modifications.damage);
      }
      
      // Apply damage rerolls
      if (modifiers?.rerolls.damage && modifiers.rerolls.damage !== 'N/A') {
        const rerollCondition = modifiers.rerolls.damage;
        let shouldReroll = false;
        
        if (rerollCondition === '1') {
          shouldReroll = damageThisHit === 1;
        } else if (rerollCondition === '< 50%') {
          const maxDamage = attack.D + (modifiers.modifications.damage || 0);
          shouldReroll = damageThisHit < (maxDamage / 2);
        }
        
        if (shouldReroll) {
          const rerollDamage = Math.max(1, rng.rollDie(attack.D) + (modifiers.modifications.damage || 0));
          damageThisHit = rerollDamage;
        }
      }
      
      totalDamage += damageThisHit;
      
      // Apply damage to current model only - excess damage is lost!
      const damageToApply = Math.min(damageThisHit, currentModelWounds);
      currentModelWounds -= damageToApply;
      
      // If current model is killed
      if (currentModelWounds === 0) {
        kills++;
        modelsRemaining--;
        if (modelsRemaining > 0) {
          currentModelWounds = defender.W; // Start new model with full wounds
        }
      }
      // Any excess damage beyond currentModelWounds is lost (Warhammer 40k rules)
    }
    
    const woundsLeft = modelsRemaining > 0 ? currentModelWounds : 0;
    const survived = modelsRemaining;
    results.push({ totalDamage, kills, survived, woundsLeft });
  }
  const damages = results.map(r => r.totalDamage).sort((a, b) => a - b);
  const mean = damages.reduce((a, b) => a + b, 0) / runs;
  const median = damages[Math.floor(runs / 2)];
  const std = Math.sqrt(damages.reduce((a, b) => a + (b - mean) ** 2, 0) / runs);
  const min = damages[0];
  const max = damages[damages.length - 1];
  const p25 = damages[Math.floor(runs * 0.25)];
  const p75 = damages[Math.floor(runs * 0.75)];
  const p90 = damages[Math.floor(runs * 0.9)];
  const p95 = damages[Math.floor(runs * 0.95)];
  const killChance = results.filter(r => r.kills > 0).length / runs;
  return {
    results,
    stats: { mean, median, std, min, max, p25, p75, p90, p95, killChance },
  };
}
