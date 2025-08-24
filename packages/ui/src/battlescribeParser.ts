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
  
  // FIRST: Check if this selection is actually a weapon or equipment
  const profiles = ensureArray(selection.profiles?.profile);
  const isWeapon = profiles.some(profile => 
    profile.typeName === 'Weapon' || 
    profile.typeName === 'Ranged Weapon' || 
    profile.typeName === 'Melee Weapon' ||
    profile.typeName === 'Psychic Power'
  );
  
  console.log(`🔍 Analyzing ${selection.name}: profiles=[${profiles.map(p => p.typeName).join(', ')}], isWeapon=${isWeapon}`);
  
  if (isWeapon) {
    console.log(`🚫 Skipping weapon selection: ${selection.name}`);
    // Still recurse into children
    const childSelections = ensureArray(selection.selections?.selection);
    for (const child of childSelections) {
      models.push(...extractModelsFromSelection(child));
    }
    return models;
  }
  
  // Check if this has model-like characteristics even without Unit/Model profile
  const hasModelProfile = profiles.some(p => p.typeName === 'Unit' || p.typeName === 'Model');
  const hasCharacteristics = profiles.some(p => {
    const chars = ensureArray(p.characteristics?.characteristic);
    return chars.some(c => c.name === 'M' || c.name === 'T' || c.name === 'W' || c.name === 'Movement' || c.name === 'Toughness' || c.name === 'Wounds');
  });
  
  // Also check if this selection has a count > 0 and looks like a model name
  const hasCount = (selection.number || 0) > 0;
  const looksLikeModel = hasCount && selection.name && 
    !selection.name.toLowerCase().includes('weapon') &&
    !selection.name.toLowerCase().includes('pistol') &&
    !selection.name.toLowerCase().includes('rifle') &&
    !selection.name.toLowerCase().includes('launcher') &&
    !selection.name.toLowerCase().includes('grenade') &&
    !selection.name.toLowerCase().includes('fist') &&
    !selection.name.toLowerCase().includes('sword') &&
    !selection.name.toLowerCase().includes('combat') &&
    !selection.name.toLowerCase().includes('battle size') &&
    !selection.name.toLowerCase().includes('detachment') &&
    !selection.name.toLowerCase().includes('options') &&
    !selection.name.toLowerCase().includes('visible') &&
    !selection.name.toLowerCase().includes('warlord');
  
  console.log(`   hasModelProfile=${hasModelProfile}, hasCharacteristics=${hasCharacteristics}, hasCount=${hasCount}, looksLikeModel=${looksLikeModel}`);
  
  // If this looks like a model (has characteristics) but no explicit Model/Unit profile, treat it as a model
  const shouldTreatAsModel = hasModelProfile || hasCharacteristics || looksLikeModel;
  
  if (shouldTreatAsModel) {
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
    
    // Create model with the determined count ONLY if this selection has its own profile
    // Don't create a model from parent selections that represent mixed units
    // Use the broader shouldTreatAsModel logic instead of just Unit/Model profiles
    const hasOwnProfile = shouldTreatAsModel;
  const childSelections = ensureArray(selection.selections?.selection);
  const hasModelChildren = childSelections.some(child => {
    const childProfiles = ensureArray(child.profiles?.profile);
    return childProfiles.some(p => p.typeName === 'Unit' || p.typeName === 'Model');
  });
  
  // Only create a model if:
  // 1. This selection has its own profile AND
  // 2. It doesn't have child selections with their own profiles (to avoid duplication)
  // EXCEPTION: Character units (like Calgar) should create both character and bodyguards
  if (hasOwnProfile && !hasModelChildren && modelCount > 0) {
    console.log(`✅ Creating model: ${selection.name} (count: ${modelCount})`);
    models.push({
      name: selection.name || 'Unknown Model',
      count: modelCount,
      profile: extractStatsFromSelection(selection),
      weapons: extractWeaponsFromSelection(selection),
    });
  } else if (hasModelChildren) {
    // Check if this looks like a character with bodyguards
    const isCharacterUnit = selection.name?.toLowerCase().includes('calgar') || 
                            selection.name?.toLowerCase().includes('captain') ||
                            selection.name?.toLowerCase().includes('librarian') ||
                            selection.name?.toLowerCase().includes('chaplain') ||
                            selection.name?.toLowerCase().includes('sergeant') ||
                            selection.name?.toLowerCase().includes('lieutenant');
    
    if (isCharacterUnit && hasOwnProfile) {
      console.log(`� Character with bodyguards detected: ${selection.name} - creating character model`);
      models.push({
        name: selection.name || 'Unknown Character',
        count: 1, // Characters are usually single models
        profile: extractStatsFromSelection(selection),
        weapons: extractWeaponsFromSelection(selection),
      });
    } else {
      console.log(`�🔄 Skipping parent model creation for ${selection.name} - has model children`);
    }
    
    console.log(`   Child selections with profiles:`, childSelections
      .filter(child => {
        const childProfiles = ensureArray(child.profiles?.profile);
        return childProfiles.some(p => p.typeName === 'Unit' || p.typeName === 'Model');
      })
      .map(child => child.name)
    );
  } else if (!hasOwnProfile) {
    console.log(`⚠️ No profile found for ${selection.name}`);
  } else {
    console.log(`⚠️ Unknown skip reason for ${selection.name} (hasProfile: ${hasOwnProfile}, hasChildren: ${hasModelChildren}, count: ${modelCount})`);
  }
  
  } // End of if (shouldTreatAsModel)
  
  // Recursively process child selections
  const childSelections = ensureArray(selection.selections?.selection);
  for (const child of childSelections) {
    console.log(`🔄 Processing child: ${child.name}`);
    const childModels = extractModelsFromSelection(child);
    console.log(`   Child ${child.name} produced ${childModels.length} models:`, childModels.map(m => `${m.name}(${m.count})`));
    models.push(...childModels);
  }
  
  return models;
}

function extractStatsFromSelection(selection: any): ModelProfile['profile'] {
  const profiles = ensureArray(selection.profiles?.profile);
  
  console.log(`🔍 Extracting stats for: ${selection.name}`);
  console.log(`   Found ${profiles.length} profiles:`, profiles.map(p => p.typeName));
  
  for (const profile of profiles) {
    if (profile.typeName === 'Unit' || profile.typeName === 'Model') {
      const characteristics = ensureArray(profile.characteristics?.characteristic);
      
      console.log(`   Processing ${profile.typeName} profile with ${characteristics.length} characteristics`);
      
      let M = 6, T = 4, Sv = 3, W = 1, Ld = 7, OC = 1, Inv;
      
      for (const char of characteristics) {
        const name = char.name?.toLowerCase();
        const value = char.textContent;
        
        console.log(`     Characteristic: ${char.name} = ${value}`);
        
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
              console.log(`     ✅ Found Wounds: ${value} -> ${W}`);
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
      
      const result = { M, T, Sv, W, Ld, OC, ...(Inv ? { Inv } : {}) };
      console.log(`   ✅ Final stats for ${selection.name}:`, result);
      return result;
    }
  }
  
  // Default stats if no profile found
  console.log(`   ⚠️ No Unit/Model profile found for ${selection.name}, using defaults`);
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
  
  console.log(`🏗️ Processing unit selection: ${selection.name} (type: ${selection.type})`);
  
  // Extract all models from this selection and its children
  const models = extractModelsFromSelection(selection);
  
  // If no models found, create a dummy model with count from selection
  // This handles vehicles and single-model units
  if (models.length === 0) {
    const count = selection.number || 1;
    if (count > 0) {
      console.log(`🚗 Creating vehicle/single model: ${selection.name} (count: ${count})`);
      models.push({
        name: selection.name,
        count: count,
        profile: extractStatsFromSelection(selection),
        weapons: extractWeaponsFromSelection(selection),
      });
    }
  } else {
    console.log(`👥 Found ${models.length} model types for unit: ${selection.name}`);
  }
  
  // Filter out weapons and equipment from models
  const actualModels = models.filter(model => {
    const name = model.name.toLowerCase();
    
    // Skip the unit container itself ONLY if we have multiple model types
    // For single-model units (like vehicles), keep the model even if it matches the unit name
    if (model.name === selection.name && models.length > 1) {
      console.log(`🚫 Filtered out unit container: ${model.name} (multiple models present)`);
      return false;
    }
    
    // Enhanced weapon detection - this is now redundant since we filter at the source
    // but keeping as backup for edge cases
    
    // Skip common weapon names and equipment, but be more specific
    // Don't filter out model names that happen to contain weapon words
    const isActualWeapon = (
      (name.includes('pistol') && !name.includes('intercessor')) ||
      (name.includes('rifle') && !name.includes('intercessor') && !name.includes('squad')) ||
      (name.includes('cannon') && !name.includes('intercessor')) ||
      name.includes('bolter') || name.includes('flamer') || name.includes('missile') ||
      (name.includes('weapon') && !name.includes('intercessor')) || 
      name.includes('caster') || name.includes('tracks') ||
      name.includes('stubber') || name.includes('array') || name.includes('bomb') ||
      name.includes('grenade') || 
      (name.includes('fist') && !name.includes('intercessor')) || 
      (name.includes('sword') && !name.includes('intercessor')) ||
      name.includes('chainsaw') || name.includes('autocannon') || name.includes('lascannon') ||
      name.includes('mortar') || name.includes('lasgun') || 
      (name.includes('close combat') && !name.includes('intercessor')) ||
      name.includes('launcher') || name.includes('blaster') || name.includes('melta') ||
      name.includes('plasma') && !name.includes('intercessor') ||
      name.includes('heavy') && !name.includes('intercessor') || 
      name.includes('assault') && !name.includes('intercessor') ||
      name.includes('rapid fire') || name.includes('combi-') || name.includes('master-crafted') ||
      name.includes('twin') || name.includes('hunter-killer') || name.includes('storm') ||
      name.includes('power ') && !name.includes('intercessor') || 
      name.includes('chainfist') || name.includes('thunder hammer') ||
      name.includes('relic') || name.includes('special issue') || name.includes('artificer')
    );
    
    if (isActualWeapon) {
      console.log(`🚫 Filtered out weapon by name: ${model.name}`);
      return false;
    }
    
    // Skip configuration items
    if (name.includes('battle size') || name.includes('detachment') || name.includes('option') ||
        name.includes('strategist') || name.includes('enhancement') || name.includes('upgrade') ||
        name.includes('wargear') || name.includes('equipment')) {
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
      
      // Merge weapons properly - combine identical weapons
      const weaponMap = new Map<string, WeaponProfile & { count?: number }>();
      
      // Add existing weapons to map
      for (const weapon of existing.weapons) {
        const profile = weapon.profile;
        const key = `${weapon.name}-${weapon.type}-${profile.range || 0}-${profile.A}-${profile.BS || profile.WS || 0}-${profile.S}-${profile.AP}-${profile.D}`;
        const existingWeapon = weaponMap.get(key);
        if (existingWeapon) {
          existingWeapon.count = (existingWeapon.count || 1) + 1;
        } else {
          weaponMap.set(key, { ...weapon, count: 1 } as WeaponProfile & { count?: number });
        }
      }
      
      // Add new weapons to map
      for (const weapon of model.weapons) {
        const profile = weapon.profile;
        const key = `${weapon.name}-${weapon.type}-${profile.range || 0}-${profile.A}-${profile.BS || profile.WS || 0}-${profile.S}-${profile.AP}-${profile.D}`;
        const existingWeapon = weaponMap.get(key);
        if (existingWeapon) {
          existingWeapon.count = (existingWeapon.count || 1) + 1;
        } else {
          weaponMap.set(key, { ...weapon, count: 1 } as WeaponProfile & { count?: number });
        }
      }
      
      existing.weapons = Array.from(weaponMap.values()).map(w => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { count, ...weaponWithoutCount } = w;
        if (count && count > 1) {
          console.log(`🔫 Combined ${count}x ${weaponWithoutCount.name} for ${model.name}`);
        }
        return weaponWithoutCount;
      });
    } else {
      modelMap.set(model.name, { ...model });
    }
  }
  
  const aggregatedModels = Array.from(modelMap.values());
  
  // Aggregate weapons across all model types for the unit
  const unitWeaponMap = new Map<string, WeaponProfile & { totalCount: number }>();
  
  for (const model of aggregatedModels) {
    for (const weapon of model.weapons) {
      const profile = weapon.profile;
      
      // Clean up the weapon name (remove count prefixes for comparison)
      const cleanName = weapon.name.replace(/^\d+x\s/, '');
      
      // Extract total count from weapon name if present, otherwise use model count
      let totalWeapons;
      
      const countMatch = weapon.name.match(/^(\d+)x\s/);
      if (countMatch) {
        // "4x Bolt Pistol" means 4 weapons total for this model group
        totalWeapons = parseInt(countMatch[1], 10);
      } else {
        // No count prefix means 1 weapon per model
        totalWeapons = model.count;
      }
      
      // Calculate base attacks per weapon by dividing total attacks by weapon count
      const baseAttacks = Math.round(profile.A / totalWeapons);
      
      // Create key based on base weapon characteristics (per-weapon, not total)
      const key = `${cleanName}-${weapon.type}-${profile.range || 0}-${baseAttacks}-${profile.BS || profile.WS || 0}-${profile.S}-${profile.AP}-${profile.D}`;
      
      console.log(`🔍 Weapon: ${weapon.name} (${totalWeapons} weapons, ${baseAttacks} attacks each) -> key: ${key}`);
      
      const existingWeapon = unitWeaponMap.get(key);
      if (existingWeapon) {
        existingWeapon.totalCount += totalWeapons;
        console.log(`🔗 Combining ${totalWeapons}x ${cleanName} with existing ${existingWeapon.totalCount - totalWeapons}x = ${existingWeapon.totalCount}x total`);
      } else {
        unitWeaponMap.set(key, { 
          ...weapon, 
          name: cleanName,
          totalCount: totalWeapons 
        } as WeaponProfile & { totalCount: number });
        console.log(`➕ Adding new weapon: ${totalWeapons}x ${cleanName}`);
      }
    }
  }
  
  // Create a combined weapons list for the unit
  const unitWeapons = Array.from(unitWeaponMap.values()).map(w => {
    const { totalCount, ...weaponWithoutCount } = w;
    
    // Calculate base attacks per weapon from the original profile
    const countMatch = w.name.match(/^(\d+)x\s/);
    const originalWeaponCount = countMatch ? parseInt(countMatch[1], 10) : 1;
    const baseAttacks = Math.round(w.profile.A / originalWeaponCount);
    
    return {
      ...weaponWithoutCount,
      name: totalCount > 1 ? `${totalCount}x ${weaponWithoutCount.name}` : weaponWithoutCount.name,
      profile: {
        ...weaponWithoutCount.profile,
        A: baseAttacks * totalCount // Update total attacks for combined weapons
      }
    };
  });
  
  console.log(`🔫 Unit weapons summary for ${selection.name}:`, 
    unitWeapons.map(w => w.name));
  
  // Store combined weapons as a property (for future use)
  // For now, this is mainly for debugging
  
  console.log(`📊 Final result for ${selection.name}: ${aggregatedModels.length} model types`);
  aggregatedModels.forEach(model => {
    console.log(`   - ${model.name}: ${model.count} models, W=${model.profile.W}, ${model.weapons.length} weapons:`, 
      model.weapons.map(w => w.name));
  });
  
  if (aggregatedModels.length === 0) {
    console.log(`❌ No models left after filtering for ${selection.name}`);
    return null;
  }
  
  return {
    name: selection.name,
    models: aggregatedModels,
    unitKeywords: [], // TODO: Extract keywords if needed
    abilities: [],    // TODO: Extract abilities if needed
    auras: [],        // TODO: Extract auras if needed
    modifiers: [],    // TODO: Extract modifiers if needed
    combinedWeapons: unitWeapons, // Kombinierte Waffen für die UI
  };
}
