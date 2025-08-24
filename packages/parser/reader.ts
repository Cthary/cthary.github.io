import { IRSquad, IRSquadSchema } from './ir.js';
import { parseStringPromise } from 'xml2js';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';

/**
 * Reads a Battlescribe .ros or .rosz file and returns the canonical IR.
 * @param filePath Path to .ros or .rosz file
 */
export async function readBattlescribe(filePath: string): Promise<IRSquad> {
  let xml: string;
  if (filePath.endsWith('.rosz')) {
    const zip = new AdmZip(await fs.readFile(filePath));
    const entry = zip.getEntry('roster.xml');
    if (!entry) throw new Error('roster.xml not found in .rosz');
    xml = entry.getData().toString('utf-8');
  } else if (filePath.endsWith('.ros')) {
    xml = (await fs.readFile(filePath)).toString();
  } else {
    throw new Error('Unsupported file type');
  }
  const parsed = await parseStringPromise(xml, { explicitArray: true });
  // Minimal Mapping für Intercessor-Beispiel (angepasst an xml2js-Output)
  const roster = parsed.roster;
  const force = roster.forces[0].force[0];
  const units = force.selections[0].selection;

  const ir: IRSquad = {
    faction: force.$.catalogueName,
    points: Number(roster.$.points ?? force.$.points ?? 0),
    units: units.map((unit: any) => {
      // Models
      const modelSelections = unit.selections?.[0]?.selection || [];
      const models = modelSelections.map((model: any) => {
        // Model Profile
        const profile = model.profiles?.[0]?.profile?.[0]?.characteristics?.[0]?.characteristic || [];
        const profileObj: Record<string, number> = {};
        for (const c of profile) {
          profileObj[c.$.name] = Number(c._);
        }
        // Weapons
        const weaponSelections = model.selections?.[0]?.selection || [];
        const weapons = weaponSelections.map((w: any) => {
          const wProfile = w.profiles?.[0]?.profile?.[0]?.characteristics?.[0]?.characteristic || [];
          const wProfileObj: Record<string, number> = {};
          for (const c of wProfile) {
            wProfileObj[c.$.name] = Number(c._);
          }
          const keywords = w.categories?.[0]?.category
            ? w.categories[0].category.map((cat: any) => cat.$.name)
            : [];
          
          // Determine weapon type based on profile and keywords
          const isMelee = !wProfileObj['Range'] || 
                         wProfileObj['Range'] === 0 || 
                         keywords.some((k: string) => k.toLowerCase().includes('melee')) ||
                         w.$.name.toLowerCase().includes('close combat') ||
                         w.$.name.toLowerCase().includes('combat knife') ||
                         w.$.name.toLowerCase().includes('chainsword') ||
                         w.$.name.toLowerCase().includes('power') ||
                         w.$.name.toLowerCase().includes('sword') ||
                         w.$.name.toLowerCase().includes('axe') ||
                         w.$.name.toLowerCase().includes('hammer') ||
                         w.$.name.toLowerCase().includes('claw') ||
                         w.$.name.toLowerCase().includes('fist');
          
          return {
            name: w.$.name,
            type: isMelee ? 'melee' : 'ranged',
            profile: {
              A: wProfileObj['A'],
              BS: isMelee ? undefined : wProfileObj['BS'],
              WS: isMelee ? wProfileObj['WS'] : undefined,
              S: wProfileObj['S'],
              AP: wProfileObj['AP'],
              D: wProfileObj['D'],
              range: wProfileObj['Range'],
            },
            keywords,
          };
        });
        return {
          name: model.$.name,
          count: Number(model.$.number ?? 1),
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
      const unitKeywords = unit.categories?.[0]?.category
        ? unit.categories[0].category.map((cat: any) => cat.$.name)
        : [];
      // Abilities
      const abilities = unit.rules?.[0]?.rule
        ? unit.rules[0].rule.map((r: any) => r.$.name)
        : [];
      return {
        name: unit.$.name,
        models,
        unitKeywords,
        abilities,
        auras: [],
        modifiers: [],
      };
    }),
  };
  // Validierung
  IRSquadSchema.parse(ir);
  return ir;
}
