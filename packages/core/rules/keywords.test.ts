import { describe, it, expect } from 'vitest';
import { STANDARD_KEYWORDS, KeywordDef } from './keywords.js';

describe('STANDARD_KEYWORDS', () => {
  it('should contain at least 20 unique keywords', () => {
  const names = new Set(STANDARD_KEYWORDS.map((k: KeywordDef) => k.name));
    expect(names.size).toBeGreaterThanOrEqual(20);
  });

  it('should have correct structure', () => {
    for (const kw of STANDARD_KEYWORDS) {
      expect(typeof kw.name).toBe('string');
      expect(['weapon', 'ability']).toContain(kw.type);
      expect(typeof kw.description).toBe('string');
    }
  });
});
