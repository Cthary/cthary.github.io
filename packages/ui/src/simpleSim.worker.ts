// simpleSim.worker.ts: Dummy Web Worker für Simulation

import { monteCarlo } from './montecarlo';


self.onmessage = function (e) {
  const { attacker, defender, selectedWeapons, runs } = e.data;
  
  // Use selected weapons or fall back to all weapons from the first model
  const weapons = selectedWeapons && selectedWeapons.length > 0 
    ? selectedWeapons 
    : attacker.models[0]?.weapons || [];
    
  if (weapons.length === 0) {
    self.postMessage({ type: 'done', result: { error: 'Keine Waffen ausgewählt' } });
    return;
  }
  
  const defenderProfile = defender.models[0]?.profile;
  if (!defenderProfile) {
    self.postMessage({ type: 'done', result: { error: 'Verteidiger-Profil unvollständig' } });
    return;
  }
  
  // Monte-Carlo Simulation mit Progress
  const batch = Math.max(1, Math.floor(runs / 20));
  let done = 0;
  let allResults: import('./montecarlo').MonteCarloResult[] = [];
  let stats = null;
  
  // Determine number of models in the defending unit
  const modelCount = defender.models.length; // Use actual number of models in unit
  
  function runBatch() {
    const thisBatch = Math.min(batch, runs - done);
    
    // Combine results from all weapons
    const combinedResults: import('./montecarlo').MonteCarloResult[] = [];
    
    for (let i = 0; i < thisBatch; i++) {
      let totalDamage = 0;
      let totalKills = 0;
      let currentModelWounds = defenderProfile.W;
      let remainingModels = modelCount;
      
      // Simulate all weapons attacking the defending unit sequentially
      for (const weapon of weapons) {
        if (remainingModels <= 0) break; // All models dead
        
        const weaponProfile = weapon.profile;
        const { results } = monteCarlo(1, weaponProfile, 
          { 
            ...defenderProfile, 
            modelCount: remainingModels,
            W: currentModelWounds // Current wounds on the first model
          }, 
          weapon.modifiers, // Pass weapon modifiers to Monte Carlo
          42 + done + i);
        const result = results[0];
        
        totalDamage += result.totalDamage;
        totalKills += result.kills;
        
        // Update unit state after this weapon's attack
        remainingModels = result.survived;
        currentModelWounds = result.woundsLeft;
      }
      
      const survived = remainingModels;
      const finalWoundsLeft = remainingModels > 0 ? currentModelWounds : 0;
      
      combinedResults.push({
        totalDamage,
        kills: totalKills,
        survived,
        woundsLeft: finalWoundsLeft
      });
    }
    
    allResults = allResults.concat(combinedResults);
    done += thisBatch;
    self.postMessage({ type: 'progress', value: done / runs });
    
    if (done < runs) {
      setTimeout(runBatch, 0);
    } else {
      // Calculate final stats
      const damages = allResults.map(r => r.totalDamage).sort((a, b) => a - b);
      const mean = damages.reduce((a, b) => a + b, 0) / runs;
      const median = damages[Math.floor(runs / 2)];
      const std = Math.sqrt(damages.reduce((a, b) => a + (b - mean) ** 2, 0) / runs);
      const min = damages[0];
      const max = damages[damages.length - 1];
      const p25 = damages[Math.floor(runs * 0.25)];
      const p75 = damages[Math.floor(runs * 0.75)];
      const p90 = damages[Math.floor(runs * 0.9)];
      const p95 = damages[Math.floor(runs * 0.95)];
      const killChance = allResults.filter(r => r.kills > 0).length / runs;
      
      stats = { mean, median, std, min, max, p25, p75, p90, p95, killChance };
      
      self.postMessage({ type: 'done', result: { runs, stats, allResults } });
    }
  }
  runBatch();
};
