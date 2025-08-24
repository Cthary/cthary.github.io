import { describe, it, expect } from 'vitest';
import { RNG, rollMany, countSuccess, toHit, toWound, toSave, applyDamage } from './dice.js';

describe('RNG', () => {
  it('is deterministic for same seed', () => {
    const a = new RNG(42);
    const b = new RNG(42);
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
  });
  it('produces values in [0,1)', () => {
    const rng = new RNG(1);
    for (let i = 0; i < 10; ++i) {
      expect(rng.nextFloat()).toBeGreaterThanOrEqual(0);
      expect(rng.nextFloat()).toBeLessThan(1);
    }
  });
  it('rollDie returns 1..n', () => {
    const rng = new RNG(123);
    for (let i = 0; i < 100; ++i) {
      const d = rng.rollDie(6);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });
});

describe('rollMany/countSuccess', () => {
  it('counts correct number of successes', () => {
    const rng = new RNG(1);
    const rolls = rollMany(10, 6, rng);
    const succ = countSuccess(rolls, 4);
    expect(succ).toBeGreaterThanOrEqual(0);
    expect(succ).toBeLessThanOrEqual(10);
  });
});

describe('toHit', () => {
  it('applies modifiers and clamps to 2/6', () => {
    expect(toHit({ BS: 3 }, 0)).toBe(3);
    expect(toHit({ BS: 3 }, 3)).toBe(6);
    expect(toHit({ BS: 3 }, -2)).toBe(2);
  });
});

describe('toWound', () => {
  it('returns correct wound target', () => {
    expect(toWound(4, 4)).toBe(4);
    expect(toWound(8, 4)).toBe(2);
    expect(toWound(5, 4)).toBe(3);
    expect(toWound(4, 5)).toBe(5);
    expect(toWound(2, 5)).toBe(6);
  });
});

describe('toSave', () => {
  it('returns best save (normal vs inv)', () => {
  expect(toSave(3, 0, 4)).toBe(3);
  expect(toSave(3, -1, 4)).toBe(4);
  expect(toSave(3, 0, 2)).toBe(2);
  expect(toSave(3, 0)).toBe(3);
  });
});

describe('applyDamage', () => {
  it('reduces wounds, clamps at 0', () => {
    expect(applyDamage(3, 2)).toBe(1);
    expect(applyDamage(2, 5)).toBe(0);
  });
});
