import { describe, it, expect } from 'vitest';
import { monteCarlo } from './montecarlo.js';

describe('monteCarlo', () => {
  it('simulates basic attack vs defender', () => {
    const { stats } = monteCarlo(
      1000,
      { A: 2, BS: 3, S: 4, AP: 0, D: 1 },
      { T: 4, Sv: 3, W: 2 }
    );
    expect(stats.mean).toBeGreaterThan(0);
    expect(stats.max).toBeGreaterThan(0);
    expect(stats.killChance).toBeGreaterThanOrEqual(0);
    expect(stats.killChance).toBeLessThanOrEqual(1);
  });

  it('killChance is 1 if damage always kills', () => {
    const { stats } = monteCarlo(
      100,
      { A: 10, BS: 2, S: 10, AP: 0, D: 10 },
      { T: 1, Sv: 6, W: 1 }
    );
    expect(stats.killChance).toBe(1);
  });
});
