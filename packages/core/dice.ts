// Deterministischer RNG (SplitMix32)
export class RNG {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    let z = (this.state += 0x9e3779b9);
    z = (z ^ (z >>> 16)) >>> 0;
    z = Math.imul(z, 0x85ebca6b) >>> 0;
    z = (z ^ (z >>> 13)) >>> 0;
    z = Math.imul(z, 0xc2b2ae35) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    return z >>> 0;
  }
  // [0,1)
  nextFloat(): number {
    return this.next() / 0x100000000;
  }
  // 1..n
  rollDie(n: number): number {
    return Math.floor(this.nextFloat() * n) + 1;
  }
}

// Würfelfunktionen
export function rollMany(n: number, sides: number, rng: RNG): number[] {
  return Array.from({ length: n }, () => rng.rollDie(sides));
}

export function countSuccess(rolls: number[], target: number): number {
  return rolls.filter(r => r >= target).length;
}

// To-Hit, To-Wound, Save, Damage (Basis)
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

// AP ist negativ für besseren Save (z.B. AP -1 macht aus 3+ einen 4+ Save)
export function toSave(Sv: number, AP: number, Inv?: number): number {
  const normal = Sv + (-AP);
  if (Inv && Inv < normal) return Inv;
  return normal;
}

export function applyDamage(W: number, D: number): number {
  return Math.max(0, W - D);
}
