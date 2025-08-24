import { describe, it, expect } from 'vitest';
import { IRSquadSchema } from './ir.js';

const validExample = {
  faction: 'ADEPTUS ASTARTES',
  points: 1000,
  units: [
    {
      name: 'Intercessor Squad',
      models: [
        {
          name: 'Intercessor',
          count: 5,
          profile: { M: 6, T: 4, Sv: 3, W: 2, Ld: 7, OC: 1, Inv: 5 },
          weapons: [
            {
              name: 'Bolt Rifle',
              type: 'ranged',
              profile: { A: 2, BS: 3, S: 4, AP: -1, D: 2, range: 24 },
              keywords: ['Rapid Fire 1', 'Assault'],
            },
          ],
        },
      ],
      unitKeywords: ['INFANTRY', 'ADEPTUS ASTARTES'],
      abilities: ['Oath of Moment'],
      auras: [],
      modifiers: [],
    },
  ],
};

describe('IRSchema', () => {
  it('validates a correct example', () => {
    expect(() => IRSquadSchema.parse(validExample)).not.toThrow();
  });

  it('fails on missing required fields', () => {
    expect(() => IRSquadSchema.parse({})).toThrow();
  });
});
