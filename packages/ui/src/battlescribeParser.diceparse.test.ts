import { parseBattlescribeXml } from './battlescribeParser';
import { expect, test } from 'vitest';

const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<roster>
  <forces>
    <force catalogueName="Test Faction">
      <selections>
        <selection name="TestUnit" type="model">
          <profiles>
            <profile typeName="Unit">
              <characteristics>
                <characteristic name="M">6"</characteristic>
                <characteristic name="T">4</characteristic>
                <characteristic name="Sv">3+</characteristic>
                <characteristic name="W">2</characteristic>
                <characteristic name="Ld">7</characteristic>
                <characteristic name="OC">1</characteristic>
              </characteristics>
            </profile>
          </profiles>
          <selections>
            <selection name="TestGun" type="upgrade">
              <profiles>
                <profile typeName="Ranged Weapons">
                  <characteristics>
                    <characteristic name="A">2D6</characteristic>
                    <characteristic name="BS">4+</characteristic>
                    <characteristic name="S">5</characteristic>
                    <characteristic name="AP">-1</characteristic>
                    <characteristic name="D">D6+2</characteristic>
                    <characteristic name="Range">24"</characteristic>
                  </characteristics>
                </profile>
              </profiles>
            </selection>
          </selections>
        </selection>
      </selections>
    </force>
  </forces>
</roster>
`;

test('Parser erkennt und wandelt D6-Notation korrekt um', () => {
  const ir = parseBattlescribeXml(testXml);
  const unit = ir.units[0];
  expect(unit.name).toBe('TestUnit');
  expect(unit.models[0].profile.M).toBe(6);
  expect(unit.models[0].profile.Sv).toBe(3);
  expect(unit.models[0].weapons[0].profile.A).toBe(7); // 2D6 -> 7
  expect(unit.models[0].weapons[0].profile.D).toBe(5.5); // D6+2 -> 5.5
});
