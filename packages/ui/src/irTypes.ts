// IR Types für UI (Kopie aus packages/parser/ir.ts)
import type { WeaponModifiers } from './types/modifiers';

export interface WeaponProfile {
  name: string;
  type: 'melee' | 'ranged';
  profile: {
    A: number;
    BS?: number;
    WS?: number;
    S: number;
    AP: number;
    D: number;
    range?: number;
  };
  keywords: string[];
  modifiers?: WeaponModifiers; // Add modifiers to weapon profile
}

export interface ModelProfile {
  name: string;
  count: number;
  profile: {
    M: number;
    T: number;
    Sv: number;
    W: number;
    Ld: number;
    OC: number;
    Inv?: number;
  };
  weapons: WeaponProfile[];
}

export interface Unit {
  name: string;
  models: ModelProfile[];
  unitKeywords: string[];
  abilities: string[];
  auras: string[];
  modifiers: string[];
  combinedWeapons?: WeaponProfile[]; // Waffen kombiniert auf Unit-Ebene
}

export interface IRSquad {
  faction: string;
  points: number;
  units: Unit[];
}
