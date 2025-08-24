import { parseBattlescribeXml } from './battlescribeParser';
import { readFileSync } from 'fs';
import { expect, test } from 'vitest';

test('New Recruit Export: Skarbrand und Bloodthirster werden erkannt', () => {
  const xml = readFileSync('d:/gh/Tag Team.ros', 'utf-8');
  const ir = parseBattlescribeXml(xml);
  const unitNames = ir.units.map(u => u.name);
  expect(unitNames.some(n => n.includes('Skarbrand'))).toBe(true);
  expect(unitNames.some(n => n.toLowerCase().includes('bloodthirster'))).toBe(true);
  // Modelle und Waffen vorhanden?
  const skar = ir.units.find(u => u.name.includes('Skarbrand'));
  expect(skar).toBeTruthy();
  expect(skar?.models[0]?.weapons.length).toBeGreaterThan(0);
  expect(Object.keys(skar?.models[0]?.profile ?? {}).length).toBeGreaterThan(0);
});
