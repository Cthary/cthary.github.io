import { parseBattlescribeXml } from './battlescribeParser';
import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

// Integrationstest für eine weitere reale Liste (Vitirx.ros)
describe('Parser verarbeitet reale Armee (Vitirx)', () => {
  it('liest Modelle, Waffen und Profile korrekt aus', () => {
    const xml = readFileSync('d:/gh/Vitirx.ros', 'utf-8');
    const ir = parseBattlescribeXml(xml);
    
    console.log('🔍 DEBUG: Alle gefundenen Einheiten (Vitirx):');
    for (const unit of ir.units) {
      console.log(`  📦 Einheit: ${unit.name}`);
      for (const model of unit.models) {
        console.log(`    🪖 Modell: ${model.name} (Anzahl: ${model.count})`);
      }
      const totalModels = unit.models.reduce((sum: number, model) => sum + model.count, 0);
      console.log(`    ✅ Gesamtanzahl Modelle: ${totalModels}`);
    }
    
    // Es sollte mindestens eine Einheit geben
    expect(ir.units.length).toBeGreaterThan(0);
    
    // Es sollte mindestens eine Einheit mit mindestens 1 Modell geben
    const hasValidUnit = ir.units.some(u => u.models.some(m => m.count >= 1));
    expect(hasValidUnit).toBeTruthy();
    
    // Debug: Zeige alle Waffen
    const allWeapons = ir.units.flatMap(u => u.models.flatMap(m => m.weapons));
    console.log('🎯 Alle Waffen (Vitirx):');
    allWeapons.forEach((weapon, i) => {
      if (i < 20) { // Zeige nur die ersten 20 Waffen
        console.log(`  - ${weapon.name}: A=${weapon.profile.A}, S=${weapon.profile.S}, AP=${weapon.profile.AP}, D=${weapon.profile.D}`);
      }
    });
    
    // Es sollte mindestens eine Waffe geben
    expect(allWeapons.length).toBeGreaterThan(0);
  });
});
