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
export function toHit(attack: { BS: number }, mods = 0): number {
  return Math.max(2, Math.min(6, attack.BS + mods));
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
  attack: { A: number; BS: number; S: number; AP: number; D: number },
  defender: { T: number; Sv: number; W: number; Inv?: number },
  seed = 42
): { results: MonteCarloResult[]; stats: MonteCarloStats } {
  const rng = new RNG(seed);
  const results: MonteCarloResult[] = [];
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
