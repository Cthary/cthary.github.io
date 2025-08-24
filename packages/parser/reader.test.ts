import { describe, it, expect } from 'vitest';
import { readBattlescribe } from './reader.js';
import path from 'path';

describe('Battlescribe Reader', () => {
  it('parses a simple .ros file and maps to IR', async () => {
    const file = path.resolve(__dirname, '../../fixtures/intercessor.ros');
    const ir = await readBattlescribe(file);
    expect(ir).toMatchInlineSnapshot(`
      {
        "faction": "Adeptus Astartes",
        "points": 1000,
        "units": [
          {
            "abilities": [
              "Oath of Moment",
            ],
            "auras": [],
            "models": [
              {
                "count": 5,
                "name": "Intercessor",
                "profile": {
                  "Inv": 5,
                  "Ld": 7,
                  "M": 6,
                  "OC": 1,
                  "Sv": 3,
                  "T": 4,
                  "W": 2,
                },
                "weapons": [
                  {
                    "keywords": [
                      "Rapid Fire 1",
                      "Assault",
                    ],
                    "name": "Bolt Rifle",
                    "profile": {
                      "A": 2,
                      "AP": -1,
                      "BS": 3,
                      "D": 2,
                      "S": 4,
                      "range": 24,
                    },
                    "type": "ranged",
                  },
                ],
              },
            ],
            "modifiers": [],
            "name": "Intercessor Squad",
            "unitKeywords": [
              "INFANTRY",
              "ADEPTUS ASTARTES",
            ],
          },
        ],
      }
    `);
  });
  it('parses a terminator squad', async () => {
    const file = path.resolve(__dirname, '../../fixtures/terminator.ros');
    const ir = await readBattlescribe(file);
    expect(ir).toMatchInlineSnapshot(`
      {
        "faction": "Adeptus Astartes",
        "points": 200,
        "units": [
          {
            "abilities": [
              "Teleport Strike",
            ],
            "auras": [],
            "models": [
              {
                "count": 3,
                "name": "Terminator",
                "profile": {
                  "Inv": 4,
                  "Ld": 6,
                  "M": 5,
                  "OC": 1,
                  "Sv": 2,
                  "T": 5,
                  "W": 3,
                },
                "weapons": [
                  {
                    "keywords": [
                      "Rapid Fire 2",
                    ],
                    "name": "Storm Bolter",
                    "profile": {
                      "A": 2,
                      "AP": 0,
                      "BS": 2,
                      "D": 1,
                      "S": 4,
                      "range": 24,
                    },
                    "type": "ranged",
                  },
                  {
                    "keywords": [
                      "Melee",
                    ],
                    "name": "Power Fist",
                    "profile": {
                      "A": 2,
                      "AP": -2,
                      "BS": undefined,
                      "D": 2,
                      "S": 8,
                      "range": undefined,
                    },
                    "type": "ranged",
                  },
                ],
              },
            ],
            "modifiers": [],
            "name": "Terminator Squad",
            "unitKeywords": [
              "INFANTRY",
              "TERMINATOR",
            ],
          },
        ],
      }
    `);
  });

  it('parses a gaunt brood', async () => {
    const file = path.resolve(__dirname, '../../fixtures/gaunts.ros');
    const ir = await readBattlescribe(file);
    expect(ir).toMatchInlineSnapshot(`
      {
        "faction": "Tyranids",
        "points": 60,
        "units": [
          {
            "abilities": [
              "Scuttling Swarm",
            ],
            "auras": [],
            "models": [
              {
                "count": 10,
                "name": "Termagant",
                "profile": {
                  "Inv": undefined,
                  "Ld": 8,
                  "M": 6,
                  "OC": 2,
                  "Sv": 6,
                  "T": 3,
                  "W": 1,
                },
                "weapons": [
                  {
                    "keywords": [
                      "Assault",
                    ],
                    "name": "Fleshborer",
                    "profile": {
                      "A": 1,
                      "AP": 0,
                      "BS": 4,
                      "D": 1,
                      "S": 4,
                      "range": 18,
                    },
                    "type": "ranged",
                  },
                ],
              },
            ],
            "modifiers": [],
            "name": "Termagant Brood",
            "unitKeywords": [
              "INFANTRY",
              "TERMAGANT",
            ],
          },
        ],
      }
    `);
  });
});
