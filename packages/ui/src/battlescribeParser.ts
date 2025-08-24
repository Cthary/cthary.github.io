import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

// Minimal browserfähiger Battlescribe-Parser
export async function parseBattlescribeFile(file: File): Promise<unknown> {
  if (file.name.endsWith('.rosz')) {
    const zip = await JSZip.loadAsync(file);
    const xmlFile = zip.file('roster.xml');
    if (!xmlFile) throw new Error('roster.xml nicht gefunden in .rosz');
    const xml = await xmlFile.async('text');
    return parseBattlescribeXml(xml);
  } else if (file.name.endsWith('.ros')) {
    const xml = await file.text();
    return parseBattlescribeXml(xml);
  } else {
    throw new Error('Dateityp nicht unterstützt');
  }
}

import type { IRSquad, Unit, ModelProfile, WeaponProfile } from './irTypes';

export function parseBattlescribeXml(xml: string): IRSquad {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', allowBooleanAttributes: true });
  const parsed = parser.parse(xml);
  // Mapping zu IR (analog zu packages/parser/reader.ts, angepasst auf fast-xml-parser)
  const roster = parsed.roster;
  const force = roster.forces.force;
  const units = force.selections.selection;

  const ir: IRSquad = {
    faction: force.catalogueName,
    points: Number(roster.points ?? force.points ?? 0),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  units: (units as any[]).map((unit): Unit => {
      // Models
      const modelSelections = unit.selections?.selection || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const models = (modelSelections as any[]).map((model): ModelProfile => {
        // Model Profile
        const profile = model.profiles?.profile?.characteristics?.characteristic || [];
        const profileObj: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of profile as any[]) {
          profileObj[c.name] = Number(c['#text']);
        }
        // Weapons
        const weaponSelections = model.selections?.selection || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weapons = (weaponSelections as any[]).map((w): WeaponProfile => {
          const wProfile = w.profiles?.profile?.characteristics?.characteristic || [];
          const wProfileObj: Record<string, number> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const c of wProfile as any[]) {
            wProfileObj[c.name] = Number(c['#text']);
          }
          const keywords = w.categories?.category
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (w.categories.category as any[]).map((cat) => String(cat.name))
            : [];
          // Typ-Erkennung: Wenn kein BS, aber WS oder kein Range → melee
          let type: 'melee' | 'ranged' = 'ranged';
          if (!('BS' in wProfileObj) || wProfileObj['BS'] === undefined || wProfileObj['Range'] === undefined) {
            type = 'melee';
          }
          return {
            name: w.name,
            type,
            profile: {
              A: wProfileObj['A'],
              BS: wProfileObj['BS'],
              WS: wProfileObj['WS'],
              S: wProfileObj['S'],
              AP: wProfileObj['AP'],
              D: wProfileObj['D'],
              range: wProfileObj['Range'],
            },
            keywords,
          };
// Annahmen/Limitierungen:
// - Waffen-Typ wird anhand von Profilfeldern geraten (kein BS/Range → melee)
// - Es werden nur Modelle mit Profil und Waffen mit Profil gemappt
// - Fehlerhafte oder unklare XML-Strukturen führen zu Fehlern oder leeren Feldern
// - Siehe auch docs/assumptions.md für Mapping-Annahmen
        });
        return {
          name: model.name,
          count: Number(model.number ?? 1),
          profile: {
            M: profileObj['M'],
            T: profileObj['T'],
            Sv: profileObj['Sv'],
            W: profileObj['W'],
            Ld: profileObj['Ld'],
            OC: profileObj['OC'],
            Inv: profileObj['Inv'],
          },
          weapons,
        };
      });
      // Keywords
      const unitKeywords = unit.categories?.category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? (unit.categories.category as any[]).map((cat) => String(cat.name))
        : [];
      // Abilities
      const abilities = unit.rules?.rule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? (unit.rules.rule as any[]).map((r) => String(r.name))
        : [];
      return {
        name: unit.name,
        models,
        unitKeywords,
        abilities,
        auras: [],
        modifiers: [],
      };
    }),
  };
  return ir;
}
