// Modifier types for weapons
export interface WeaponModifiers {
  modifications: Modifications;
  rerolls: Rerolls;
  keywords: Keyword[];
}

export interface Modifications {
  hit: number; // +1, 0, -1
  wound: number; // +1, 0, -1
  damage: number; // +1, 0, -1
  crit: number; // +1, 0, -1
}

export interface Rerolls {
  hit: RerollType;
  wound: RerollType;
  damage: DamageRerollType;
}

export type RerollType = 'N/A' | '1' | 'Miss' | 'NonCrit';
export type DamageRerollType = 'N/A' | '1' | '< 50%';

export interface Keyword {
  name: string;
  type: KeywordType;
  value?: number; // For keywords like "Sustained Hits X"
  description: string;
}

export type KeywordType = 'Blast' | 'SustainedHits' | 'LethalHits' | 'DevastatingWounds';

// Predefined keywords
export const AVAILABLE_KEYWORDS: Keyword[] = [
  {
    name: 'Blast',
    type: 'Blast',
    description: '+1 Angriff je 5 Modelle im gegnerischen Squad'
  },
  {
    name: 'Sustained Hits',
    type: 'SustainedHits',
    value: 1,
    description: 'Bei einem Crit Treffer wird X zusätzliche Treffer generiert'
  },
  {
    name: 'Lethal Hits',
    type: 'LethalHits',
    description: 'Bei einem Crit Treffer wird eine automatische Wunde erzeugt'
  },
  {
    name: 'Devastating Wounds',
    type: 'DevastatingWounds',
    description: 'Bei einem Krit Woundroll ignoriert der Schaden alle Rüstungswürfe'
  }
];

// Default modifier values
export const DEFAULT_MODIFIERS: WeaponModifiers = {
  modifications: {
    hit: 0,
    wound: 0,
    damage: 0,
    crit: 0
  },
  rerolls: {
    hit: 'N/A',
    wound: 'N/A',
    damage: 'N/A'
  },
  keywords: []
};
