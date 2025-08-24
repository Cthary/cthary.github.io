import { describe, it, expect } from 'vitest';
import { runSimulationInWorkerNode } from './workerBridge.js';


const params = {
  runs: 1000,
  attack: { A: 2, BS: 3, S: 4, AP: 0, D: 1 },
  defender: { T: 4, Sv: 3, W: 2 },
  seed: 42,
};

describe('workerBridge', () => {
  it('runs simulation in worker and receives progress/done', async () => {
    let progress = 0;
    let done = false;
    await new Promise<void>((resolve, reject) => {
      runSimulationInWorkerNode(
        params,
        (p: number) => { progress = p; },
        (result: any) => {
          expect(result.stats.mean).toBeGreaterThan(0);
          done = true;
          resolve();
        },
        (err: any) => reject(err)
      );
    });
    expect(done).toBe(true);
    expect(progress).toBeGreaterThan(0);
  });
});
