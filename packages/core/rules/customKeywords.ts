// Mapping für Custom-Keywords (z.B. RH1, RRW, FNP5, +A1, APM1)
// Siehe README_full.md

export interface CustomKeywordDef {
  code: string;
  description: string;
  effect: string;
  params?: string[];
}

export const CUSTOM_KEYWORDS: CustomKeywordDef[] = [
  { code: 'RH1', description: 'Reroll Hit rolls of 1', effect: 'reroll:hit:1' },
  { code: 'RHW', description: 'Reroll all Hit rolls', effect: 'reroll:hit:all' },
  { code: 'RRW', description: 'Reroll all Wound rolls', effect: 'reroll:wound:all' },
  { code: 'RW1', description: 'Reroll Wound rolls of 1', effect: 'reroll:wound:1' },
  { code: 'APM1', description: 'AP +1', effect: 'ap:mod:1' },
  { code: '+A1', description: '+1 Attacke pro Modell', effect: 'attacks:mod:1' },
  { code: 'FNP5', description: 'Feel No Pain 5+', effect: 'fnp:5' },
  { code: 'FNP6', description: 'Feel No Pain 6+', effect: 'fnp:6' },
  { code: 'FNP4', description: 'Feel No Pain 4+', effect: 'fnp:4' },
  { code: 'OCM1', description: 'OC +1', effect: 'oc:mod:1' },
  { code: 'DMG-1', description: 'Damage -1', effect: 'damage:mod:-1' },
  { code: 'EXA', description: 'Extra Attack', effect: 'attacks:extra:1' },
  { code: 'INV4', description: '4+ Invulnerable Save', effect: 'inv:4' },
  { code: 'INV5', description: '5+ Invulnerable Save', effect: 'inv:5' },
  { code: 'INV6', description: '6+ Invulnerable Save', effect: 'inv:6' },
  { code: 'FALLBACK', description: 'Kann nach Rückzug schießen/chargen', effect: 'fallback:shoot:charge' },
  { code: 'NOOC', description: 'OC = 0', effect: 'oc:0' },
  { code: 'BODYGUARD', description: 'Kann Charakter schützen', effect: 'bodyguard' },
  { code: 'DEEP', description: 'Deep Strike', effect: 'deepstrike' },
  { code: 'STEALTH', description: '-1 to Hit', effect: 'stealth' },
];

export function resolveCustomKeyword(code: string): CustomKeywordDef | undefined {
  return CUSTOM_KEYWORDS.find(k => k.code === code);
}
