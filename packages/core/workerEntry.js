// Entry für Worker: nimmt params entgegen, führt Monte-Carlo aus, sendet Progress/Done
import { parentPort, workerData } from 'worker_threads';
import { monteCarlo } from './montecarlo.js';

const params = workerData;
const runs = params.runs || 10000;
const chunk = Math.max(100, Math.floor(runs / 100));
let results = [];
for (let i = 0; i < runs; i += chunk) {
  const part = monteCarlo(Math.min(chunk, runs - i), params.attack, params.defender, params.seed + i);
  results = results.concat(part.results);
  parentPort?.postMessage({ type: 'progress', value: Math.min(runs, i + chunk) / runs });
}
// Statistiken aus den Ergebnissen berechnen
function computeStats(results) {
  const damages = results.map(r => r.totalDamage).sort((a, b) => a - b);
  const runs = results.length;
  const mean = damages.reduce((a, b) => a + b, 0) / runs;
  const median = damages[Math.floor(runs / 2)];
  const std = Math.sqrt(damages.reduce((a, b) => a + (b - mean) ** 2, 0) / runs);
  const min = damages[0];
  const max = damages[damages.length - 1];
  const p25 = damages[Math.floor(runs * 0.25)];
  const p75 = damages[Math.floor(runs * 0.75)];
  const p90 = damages[Math.floor(runs * 0.9)];
  const p95 = damages[Math.floor(runs * 0.95)];
  const killChance = results.filter(r => r.kills > 0).length / runs;
  return { mean, median, std, min, max, p25, p75, p90, p95, killChance };
}
const stats = computeStats(results);
parentPort?.postMessage({ type: 'done', result: { results, stats } });
