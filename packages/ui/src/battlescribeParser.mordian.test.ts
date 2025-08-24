import { parseBattlescribeXml } from './battlescribeParser';
import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

// Integrationstest für eine weitere reale Liste (Mordian.ros)
describe('Parser verarbeitet reale Astra Militarum Armee (Mordian)', () => {
  it('liest Modelle, Waffen und Profile korrekt aus', () => {
    const xml = readFileSync('d:/gh/Mordian.ros', 'utf-8');
    const ir = parseBattlescribeXml(xml);
    
    // Es sollte mindestens eine Einheit mit 10+ Modellen geben (z.B. Infantry Squad)
    const hasBigUnit = ir.units.some(u => u.models.some(m => m.count >= 10));
    console.log('🎯 Units with models >= 10:', ir.units.filter(u => u.models.some(m => m.count >= 10)).map(u => ({ name: u.name, models: u.models.filter(m => m.count >= 10) })));
    expect(hasBigUnit).toBeTruthy();
    
    // Es sollte einen Leman Russ geben mit W > 10
    const russ = ir.units.find(u => u.name.toLowerCase().includes('leman russ'));
    console.log('🎯 Leman Russ units:', ir.units.filter(u => u.name.toLowerCase().includes('leman russ')).map(u => ({ name: u.name, models: u.models.map(m => ({ name: m.name, profile: m.profile })) })));
    expect(russ).toBeTruthy();
    if (russ) {
      console.log('🎯 Leman Russ first model profile:', russ.models[0]?.profile);
      expect(russ.models[0].profile.W).toBeGreaterThan(10);
    }
    
    // Es sollte mindestens eine Waffe mit D6 Schuss geben (z.B. Battle Cannon)
    const allWeapons = ir.units.flatMap(u => u.models.flatMap(m => m.weapons));
    const battleCannons = allWeapons.filter(w => w.name.toLowerCase().includes('battle cannon'));
    console.log('🎯 Battle cannons found:', battleCannons);
    const hasD6 = ir.units.some(u => u.models.some(m => m.weapons.some(w => w.profile.A && w.profile.A > 3 && (w.name.toLowerCase().includes('battle cannon') || w.name.toLowerCase().includes('executioner')))));
    expect(hasD6).toBeTruthy();
  });
});
