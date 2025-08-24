// simpleSim.worker.ts: Dummy Web Worker für Simulation

import { monteCarlo } from './montecarlo';


self.onmessage = function (e) {
  const { attacker, defender, runs } = e.data;
  // Extrahiere das erste Waffenprofil und die Profile
  const weapon = attacker.models[0]?.weapons[0];
  const attackProfile = weapon?.profile;
  const defenderProfile = defender.models[0]?.profile;
  if (!attackProfile || !defenderProfile) {
    self.postMessage({ type: 'done', result: { error: 'Profile unvollständig' } });
    return;
  }
  // Monte-Carlo Simulation mit Progress
  const batch = Math.max(1, Math.floor(runs / 20));
  let done = 0;
  let allResults: import('./montecarlo').MonteCarloResult[] = [];
  let stats = null;
  function runBatch() {
    const thisBatch = Math.min(batch, runs - done);
    const { results, stats: s } = monteCarlo(
      thisBatch,
      attackProfile,
      defenderProfile,
      42 + done // Seed offset für Varianz
    );
    allResults = allResults.concat(results);
    stats = s;
    done += thisBatch;
    self.postMessage({ type: 'progress', value: done / runs });
    if (done < runs) {
      setTimeout(runBatch, 0);
    } else {
      // Endresultat aggregieren
      self.postMessage({ type: 'done', result: { runs, stats, allResults } });
    }
  }
  runBatch();
};
