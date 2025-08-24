import { RNG, rollMany, countSuccess, toHit, toWound, toSave, applyDamage } from './dice.js';

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
  attack: { A: number; BS: number; S: number; AP: number; D: number },
  defender: { T: number; Sv: number; W: number; Inv?: number },
  seed = 42
): { results: MonteCarloResult[]; stats: MonteCarloStats } {
  const rng = new RNG(seed);
  const results: MonteCarloResult[] = [];
  for (let i = 0; i < runs; ++i) {
    // 1. Attacks
    const attacks = attack.A;
    // 2. To Hit
    const hitTarget = toHit(attack);
    const hitRolls = rollMany(attacks, 6, rng);
    const hits = countSuccess(hitRolls, hitTarget);
    // 3. To Wound
    const woundTarget = toWound(attack.S, defender.T);
    const woundRolls = rollMany(hits, 6, rng);
    const wounds = countSuccess(woundRolls, woundTarget);
    // 4. Saves
    const saveTarget = toSave(defender.Sv, attack.AP, defender.Inv);
    const saveRolls = rollMany(wounds, 6, rng);
    const failedSaves = wounds - countSuccess(saveRolls, saveTarget);
    // 5. Damage
    let totalDamage = 0;
    let woundsLeft = defender.W;
    let kills = 0;
    for (let j = 0; j < failedSaves; ++j) {
      woundsLeft = applyDamage(woundsLeft, attack.D);
      totalDamage += attack.D;
      if (woundsLeft === 0) kills = 1;
    }
    results.push({ totalDamage, kills, survived: 1 - kills, woundsLeft });
  }
  // Aggregation
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
