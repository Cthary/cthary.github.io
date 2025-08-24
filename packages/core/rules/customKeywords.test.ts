import { describe, it, expect } from 'vitest';
import { CUSTOM_KEYWORDS, resolveCustomKeyword } from './customKeywords.js';

describe('CUSTOM_KEYWORDS', () => {
  it('should contain at least 10 unique codes', () => {
    const codes = new Set(CUSTOM_KEYWORDS.map(k => k.code));
    expect(codes.size).toBeGreaterThanOrEqual(10);
  });

  it('should resolve known codes', () => {
    expect(resolveCustomKeyword('RH1')).toMatchObject({ effect: 'reroll:hit:1' });
    expect(resolveCustomKeyword('FNP5')).toMatchObject({ effect: 'fnp:5' });
    expect(resolveCustomKeyword('NOOC')).toMatchObject({ effect: 'oc:0' });
  });

  it('should return undefined for unknown code', () => {
    expect(resolveCustomKeyword('UNKNOWN')).toBeUndefined();
  });
});
