// RNG, Dice, Monte-Carlo für Browser (Kopie aus core, keine Node-APIs)
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
export function toWound(S: number, T: number): number {
  if (S >= 2 * T) return 2;
  if (S > T) return 3;
  if (S === T) return 4;
  if (S < T && S * 2 > T) return 5;
  return 6;
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
  seed = 42
): { results: MonteCarloResult[]; stats: MonteCarloStats } {
  const rng = new RNG(seed);
  const results: MonteCarloResult[] = [];
  const maxModels = defender.modelCount || 1; // Default to single model if not specified
  
  for (let i = 0; i < runs; ++i) {
    const attacks = attack.A;
    const hitTarget = toHit(attack);
    const hitRolls = rollMany(attacks, 6, rng);
    const hits = countSuccess(hitRolls, hitTarget);
    const woundTarget = toWound(attack.S, defender.T);
    const woundRolls = rollMany(hits, 6, rng);
    const wounds = countSuccess(woundRolls, woundTarget);
    const saveTarget = toSave(defender.Sv, attack.AP, defender.Inv);
    const saveRolls = rollMany(wounds, 6, rng);
    const failedSaves = wounds - countSuccess(saveRolls, saveTarget);
    
    // Debug für erste Iteration
    if (i === 0) {
      console.log(`🎲 DEBUG Run ${i}:`, {
        attacks, hitTarget, hits, woundTarget, wounds, saveTarget, failedSaves,
        attackProfile: attack, defenderProfile: defender
      });
    }
    
    let totalDamage = 0;
    let currentModelWounds = defender.W;
    let kills = 0;
    let modelsRemaining = maxModels;
    
    for (let j = 0; j < failedSaves; ++j) {
      if (modelsRemaining <= 0) break; // No more models to kill
      
      const damageThisHit = attack.D;
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
