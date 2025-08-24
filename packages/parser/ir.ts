import { z } from 'zod';

// --- IR Types ---

export const WeaponProfileSchema = z.object({
  name: z.string(),
  type: z.enum(['melee', 'ranged']),
  profile: z.object({
    A: z.number(), // Attacks
    BS: z.number().optional(), // Ballistic Skill (ranged)
    WS: z.number().optional(), // Weapon Skill (melee)
    S: z.number(), // Strength
    AP: z.number(), // Armour Pen
    D: z.number(), // Damage
    range: z.number().optional(),
  }),
  keywords: z.array(z.string()),
});

export const ModelProfileSchema = z.object({
  name: z.string(),
  count: z.number(),
  profile: z.object({
    M: z.number(), // Movement
    T: z.number(), // Toughness
    Sv: z.number(), // Save
    W: z.number(), // Wounds
    Ld: z.number(), // Leadership
    OC: z.number(), // Objective Control
    Inv: z.number().optional(), // Invulnerable Save
  }),
  weapons: z.array(WeaponProfileSchema),
});

export const UnitSchema = z.object({
  name: z.string(),
  models: z.array(ModelProfileSchema),
  unitKeywords: z.array(z.string()),
  abilities: z.array(z.string()),
  auras: z.array(z.string()),
  modifiers: z.array(z.string()),
});

export const IRSquadSchema = z.object({
  faction: z.string(),
  points: z.number(),
  units: z.array(UnitSchema),
});

export type WeaponProfile = z.infer<typeof WeaponProfileSchema>;
export type ModelProfile = z.infer<typeof ModelProfileSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type IRSquad = z.infer<typeof IRSquadSchema>;
