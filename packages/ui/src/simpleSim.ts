import type { Unit } from './irTypes';

// Minimaler Dummy-Simulator für das UI
export function runSimpleSimulation(attacker: Unit, defender: Unit, runs = 1000) {
  // Nimm die erste Waffe des Angreifers und die Profile
  const weapon = attacker.models[0]?.weapons[0];
  const attackProfile = weapon?.profile;
  const defenderProfile = defender.models[0]?.profile;
  if (!attackProfile || !defenderProfile) return { error: 'Profile unvollständig' };

  // Dummy: Schaden = (A * Trefferchance * Woundchance * FailedSaveChance * D) * runs
  const A = attackProfile.A;
  const BS = attackProfile.BS ?? 4;
  const S = attackProfile.S;
  const AP = attackProfile.AP;
  const D = attackProfile.D;
  const T = defenderProfile.T;
  const Sv = defenderProfile.Sv;
  const W = defenderProfile.W;

  // Trefferchance (vereinfachtes 40k: 7-BS auf W6)
  const hitChance = Math.max(0, Math.min(1, (7 - BS) / 6));
  // Woundchance (S vs T Matrix, stark vereinfacht)
  let woundTarget = 4;
  if (S >= 2 * T) woundTarget = 2;
  else if (S > T) woundTarget = 3;
  else if (S < T) woundTarget = 5;
  else if (S <= T / 2) woundTarget = 6;
  const woundChance = Math.max(0, Math.min(1, (7 - woundTarget) / 6));
  // Save (AP abziehen, mind. 2+ bis 6+)
  const saveTarget = Math.max(2, Math.min(6, Sv - AP));
  const failedSaveChance = Math.max(0, Math.min(1, (saveTarget - 1) / 6));

  // Erwartungsschaden pro Angriff
  const expectedDamage = A * hitChance * woundChance * failedSaveChance * D;
  // Gesamtschaden über alle Runs
  const totalDamage = expectedDamage * runs;
  // Kills (wie viele Modelle mit Wounds)
  const kills = Math.floor(totalDamage / W);

  return {
    runs,
    weapon: weapon.name,
    expectedDamage: Math.round(expectedDamage * 100) / 100,
    totalDamage: Math.round(totalDamage * 100) / 100,
    kills,
    defenderWounds: W,
    notes: 'Vereinfachte Simulation (kein RNG, keine Sonderregeln)',
  };
}
