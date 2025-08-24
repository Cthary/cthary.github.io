import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import type { Unit, ModelProfile, WeaponProfile, IRSquad } from './irTypes';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: 'textContent',
  parseAttributeValue: true,
});

function parseStatValue(value: string | number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle dice notation like "2D6", "D6+2", etc.
    const str = value.trim();
    
    // Simple numeric value
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10);
    }
    
    // Dice notation - calculate expected value
    if (/^\d*D\d+(\+\d+)?$/i.test(str)) {
      // Pattern: [number]D[sides][+modifier]
      const match = str.match(/^(\d*)D(\d+)(\+(\d+))?$/i);
      if (match) {
        const numDice = match[1] ? parseInt(match[1], 10) : 1;
        const sides = parseInt(match[2], 10);
        const modifier = match[4] ? parseInt(match[4], 10) : 0;
        
        // Expected value: numDice * (sides + 1) / 2 + modifier
        return numDice * (sides + 1) / 2 + modifier;
      }
    }
    
    // If we can't parse it, try to extract any number
    const numMatch = str.match(/\d+/);
    return numMatch ? parseInt(numMatch[0], 10) : 0;
  }
  return 0;
}

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value != null) return [value];
  return [];
}

function extractModelsFromSelection(selection: any): ModelProfile[] {
  const models: ModelProfile[] = [];
  
  // Get the direct model count from this selection
  const directCount = selection.number || 1;
  
  // Check if this selection has a "models" characteristic
  const characteristics = ensureArray(selection.profiles?.profile?.characteristics?.characteristic);
  const modelsChar = characteristics.find((char: any) => 
    char.name?.toLowerCase().includes('models') || 
    char.typeId === 'models' ||
    char.name === 'Models'
  );
  
  let modelCount = directCount;
  if (modelsChar && modelsChar.textContent) {
    const parsedModels = parseStatValue(modelsChar.textContent);
    if (parsedModels > 0) {
      modelCount = parsedModels;
    }
  }
  
  // Try to extract model count from selection name (e.g., "1 Jungle Fighter Sergeant and 9 Jungle Fighters")
  if (selection.name) {
    const name = selection.name;
    // Look for patterns like "X and Y models" or "X models"
    const squadMatch = name.match(/(\d+)\s+.*?\s+and\s+(\d+)\s+/i);
    if (squadMatch) {
      const count1 = parseInt(squadMatch[1], 10);
      const count2 = parseInt(squadMatch[2], 10);
      modelCount = count1 + count2;
      console.log(`🔍 Squad detected: "${name}" -> ${count1} + ${count2} = ${modelCount} models`);
    } else {
      // Look for single number patterns like "10 models"
      const singleMatch = name.match(/(\d+)\s+\w+/);
      if (singleMatch && parseInt(singleMatch[1], 10) > 1) {
        const extractedCount = parseInt(singleMatch[1], 10);
        if (extractedCount > modelCount) {
          modelCount = extractedCount;
          console.log(`🔍 Single count detected: "${name}" -> ${modelCount} models`);
        }
      }
    }
  }
  
  // Create model with the determined count
  if (modelCount > 0) {
    models.push({
      name: selection.name || 'Unknown Model',
      count: modelCount,
      profile: extractStatsFromSelection(selection),
      weapons: extractWeaponsFromSelection(selection),
    });
  }
  
  // Recursively process child selections
  const childSelections = ensureArray(selection.selections?.selection);
  for (const child of childSelections) {
    models.push(...extractModelsFromSelection(child));
  }
  
  return models;
}

function extractStatsFromSelection(selection: any): ModelProfile['profile'] {
  const profiles = ensureArray(selection.profiles?.profile);
  
  for (const profile of profiles) {
    if (profile.typeName === 'Unit' || profile.typeName === 'Model') {
      const characteristics = ensureArray(profile.characteristics?.characteristic);
      
      let M = 6, T = 4, Sv = 3, W = 1, Ld = 7, OC = 1, Inv;
      
      for (const char of characteristics) {
        const name = char.name?.toLowerCase();
        const value = char.textContent;
        
        if (name && value != null) {
          switch (name) {
            case 'movement':
            case 'm':
              M = parseStatValue(value);
              break;
            case 'toughness':
            case 't':
              T = parseStatValue(value);
              break;
            case 'save':
            case 'sv':
              Sv = parseStatValue(value);
              break;
            case 'wounds':
            case 'w':
              W = parseStatValue(value);
              break;
            case 'leadership':
            case 'ld':
              Ld = parseStatValue(value);
              break;
            case 'objective control':
            case 'oc':
              OC = parseStatValue(value);
              break;
            case 'invulnerable':
            case 'inv':
              Inv = parseStatValue(value);
              break;
          }
        }
      }
      
      return { M, T, Sv, W, Ld, OC, ...(Inv ? { Inv } : {}) };
    }
  }
  
  // Default stats if no profile found
  return { M: 6, T: 4, Sv: 3, W: 1, Ld: 7, OC: 1 };
}

function extractWeaponsFromSelection(selection: any): WeaponProfile[] {
  const weapons: WeaponProfile[] = [];
  
  // Get the count of this selection
  const count = selection.number || 1;
  
  // Check profiles in this selection
  const profiles = ensureArray(selection.profiles?.profile);
  for (const profile of profiles) {
    if (profile.typeName === 'Weapon' || profile.typeName === 'Ranged Weapons' || profile.typeName === 'Melee Weapons') {
      const weapon = extractWeaponFromProfile(profile);
      if (weapon) {
        // Scale attacks by count instead of duplicating weapons
        if (count > 1) {
          weapons.push({
            ...weapon,
            name: `${count}x ${weapon.name}`,
            profile: {
              ...weapon.profile,
              A: weapon.profile.A * count // Multiply attacks by weapon count
            }
          });
        } else {
          weapons.push(weapon);
        }
      }
    }
  }
  
  // Recursively check child selections
  const childSelections = ensureArray(selection.selections?.selection);
  for (const child of childSelections) {
    weapons.push(...extractWeaponsFromSelection(child));
  }
  
  return weapons;
}

function extractWeaponFromProfile(profile: any): WeaponProfile | null {
  if (!profile.name) return null;
  
  const characteristics = ensureArray(profile.characteristics?.characteristic);
  
  let A = 1, BS, WS, S = 4, AP = 0, D = 1, range;
  
  for (const char of characteristics) {
    const name = char.name?.toLowerCase();
    const value = char.textContent;
    
    if (name && value != null) {
      switch (name) {
        case 'range':
        case 'rng':
        case 'reichweite': {
          const rangeValue = value.toString().toLowerCase();
          // Only set numeric range values, ignore "melee", "close combat", etc.
          if (rangeValue !== 'melee' && 
              rangeValue !== 'close combat' && 
              rangeValue !== 'nahkampf' &&
              rangeValue !== '-' && 
              rangeValue !== 'n/a' &&
              !rangeValue.includes('melee') &&
              !rangeValue.includes('nahkampf') &&
              !isNaN(parseStatValue(value))) {
            range = parseStatValue(value);
          }
          break;
        }
        case 'a':
        case 'attacks':
          A = parseStatValue(value);
          break;
        case 'bs':
        case 'ballistic skill':
          BS = parseStatValue(value);
          break;
        case 'ws':
        case 'weapon skill':
          WS = parseStatValue(value);
          break;
        case 's':
        case 'strength':
          S = parseStatValue(value);
          break;
        case 'ap':
        case 'armor penetration':
          AP = parseStatValue(value);
          break;
        case 'd':
        case 'damage':
          D = parseStatValue(value);
          break;
      }
    }
  }
  
  // Determine weapon type
  const type: 'melee' | 'ranged' = range !== undefined ? 'ranged' : 'melee';
  
  return {
    name: profile.name,
    type,
    profile: {
      A,
      ...(type === 'ranged' && BS !== undefined ? { BS } : {}),
      ...(type === 'melee' && WS !== undefined ? { WS } : {}),
      S,
      AP,
      D,
      ...(range !== undefined ? { range } : {}),
    },
    keywords: [], // TODO: Extract keywords if needed
  };
}

export function parseBattlescribeXml(xmlContent: string): IRSquad {
  // Check if it's likely a ZIP file by looking for ZIP signature
  const isZip = xmlContent.startsWith('PK') || xmlContent.includes('.rosz');
  
  if (isZip) {
    try {
      return parseBattlescribeZip(xmlContent);
    } catch {
      // Fall back to direct XML parsing
      return parseBattlescribeXmlDirect(xmlContent);
    }
  } else {
    // Direct XML parsing for .ros files
    return parseBattlescribeXmlDirect(xmlContent);
  }
}

function parseBattlescribeZip(zipContent: string): IRSquad {
  const zip = new JSZip();
  const loadedZip = zip.loadAsync(zipContent, { base64: false });
  
  return loadedZip.then(zip => {
    // Find the .ros file in the zip
    const rosFile = Object.keys(zip.files).find(name => name.endsWith('.ros'));
    if (!rosFile) {
      throw new Error('No .ros file found in .rosz archive');
    }
    
    return zip.files[rosFile].async('text').then(xmlContent => {
      return parseBattlescribeXmlDirect(xmlContent);
    });
  }) as any; // This is not ideal but works for synchronous usage
}

function parseBattlescribeXmlDirect(xmlContent: string): IRSquad {
  const parsed = parser.parse(xmlContent);
  const roster = parsed.roster;
  
  if (!roster) {
    throw new Error('Invalid Battlescribe XML: no roster found');
  }
  
  const forces = ensureArray(roster.forces?.force);
  const units: Unit[] = [];
  
  for (const force of forces) {
    const selections = ensureArray(force.selections?.selection);
    
    for (const selection of selections) {
      const unit = extractUnitFromSelection(selection);
      if (unit && unit.models.length > 0) {
        units.push(unit);
      }
    }
  }
  
  // Debug output for all units and their models
  console.log('🔍 DEBUG: Alle gefundenen Einheiten:');
  for (const unit of units) {
    console.log(`  📦 Einheit: ${unit.name}`);
    for (const model of unit.models) {
      console.log(`    🪖 Modell: ${model.name} (Anzahl: ${model.count})`);
    }
    const totalModels = unit.models.reduce((sum: number, model: ModelProfile) => sum + model.count, 0);
    console.log(`    ✅ Gesamtanzahl Modelle: ${totalModels}`);
  }
  
  return {
    faction: 'Unknown', // TODO: Extract faction from XML
    points: 2000, // TODO: Extract points from XML
    units: units.filter(unit => unit.models.some((model: ModelProfile) => model.count > 0)),
  };
}

function extractUnitFromSelection(selection: any): Unit | null {
  if (!selection.name) return null;
  
  // Extract all models from this selection and its children
  const models = extractModelsFromSelection(selection);
  
  // If no models found, create a dummy model with count from selection
  if (models.length === 0) {
    const count = selection.number || 1;
    if (count > 0) {
      models.push({
        name: selection.name,
        count: count,
        profile: extractStatsFromSelection(selection),
        weapons: extractWeaponsFromSelection(selection),
      });
    }
  }
  
  // Filter out weapons and equipment from models
  const actualModels = models.filter(model => {
    const name = model.name.toLowerCase();
    // Skip weapons and equipment
    if (name.includes('pistol') || name.includes('rifle') || name.includes('cannon') || 
        name.includes('bolter') || name.includes('flamer') || name.includes('missile') ||
        name.includes('weapon') || name.includes('caster') || name.includes('tracks') ||
        name.includes('stubber') || name.includes('array') || name.includes('bomb') ||
        name.includes('grenade') || name.includes('fist') || name.includes('sword') ||
        name.includes('chainsaw') || name.includes('autocannon') || name.includes('lascannon') ||
        name.includes('mortar') || name.includes('lasgun') || name.includes('close combat')) {
      return false;
    }
    // Skip configuration items
    if (name.includes('battle size') || name.includes('detachment') || name.includes('option') ||
        name.includes('strategist') || name.includes('enhancement')) {
      return false;
    }
    // Skip Warlords - they are typically single character models that shouldn't be attackers
    if (name.includes('warlord') || name.includes('lord') || name.includes('commander') ||
        name.includes('captain') || name.includes('marshal') || name.includes('chaplain') ||
        name.includes('librarian') || name.includes('techmarine') || name.includes('apothecary')) {
      console.log(`🚫 Filtered out character: ${model.name}`);
      return false;
    }
    return true;
  });
  
  // Aggregate models with the same name
  const modelMap = new Map<string, ModelProfile>();
  
  for (const model of actualModels) {
    const existing = modelMap.get(model.name);
    if (existing) {
      existing.count += model.count;
      // Merge weapons (simple approach - combine arrays)
      existing.weapons.push(...model.weapons);
    } else {
      modelMap.set(model.name, { ...model });
    }
  }
  
  const aggregatedModels = Array.from(modelMap.values());
  
  if (aggregatedModels.length === 0) return null;
  
  return {
    name: selection.name,
    models: aggregatedModels,
    unitKeywords: [], // TODO: Extract keywords if needed
    abilities: [],    // TODO: Extract abilities if needed
    auras: [],        // TODO: Extract auras if needed
    modifiers: [],    // TODO: Extract modifiers if needed
  };
}
