import { parseBattlescribeXml } from './battlescribeParser';
import { expect, test } from 'vitest';
import { readFileSync } from 'fs';

const xml = readFileSync('d:/gh/Smelly Chosen.ros', 'utf-8');

test('Parser verarbeitet reale Death Guard Armee (Smelly Chosen)', () => {
  const ir = parseBattlescribeXml(xml);
  // Debug-Ausgabe: Alle Einheiten und Modellanzahlen
  for (const unit of ir.units) {
    for (const model of unit.models) {
      // eslint-disable-next-line no-console
      console.log(`Unit: ${unit.name}, Model: ${model.name}, Count: ${model.count}`);
    }
  }
  // Es sollten viele Einheiten erkannt werden
  expect(ir.units.length).toBeGreaterThan(5);
  // Mortarion sollte enthalten sein
  const mortarion = ir.units.find(u => u.name.toLowerCase().includes('mortarion'));
  expect(mortarion).toBeTruthy();
  expect(mortarion?.models[0].profile.W).toBeGreaterThan(10);
  // Es sollte mindestens eine Waffe mit D6+2 Attacken geben (z.B. Hideous Mutations)
  const hasD6plus2 = ir.units.some(u => u.models.some(m => m.weapons.some(w => w.profile.A === 5))); // D6+2 = 5.5
  expect(hasD6plus2).toBeTruthy();
  // Es sollte mindestens eine Einheit mit 10+ Modellen geben (z.B. Poxwalkers)
  const hasBigUnit = ir.units.some(u => u.models.some(m => m.count >= 10));
  expect(hasBigUnit).toBeTruthy();
});
