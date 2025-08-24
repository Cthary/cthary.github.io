import { DamageChart } from './DamageChart';

import React, { useState } from 'react';
import { parseBattlescribeFile } from './battlescribeParser';
import type { IRSquad, Unit } from './irTypes';
import SimpleSimWorker from './simpleSim.worker?worker';

export default function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parserResult, setParserResult] = useState<IRSquad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<Unit | null>(null);
  const [selectedDefender, setSelectedDefender] = useState<Unit | null>(null);
  const [simResult, setSimResult] = useState<
    | null
    | {
        runs: number;
        stats: import('./montecarlo').MonteCarloStats;
        allResults: import('./montecarlo').MonteCarloResult[];
      }
    | { error: string }
  >(null);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simRunning, setSimRunning] = useState<boolean>(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setParserResult(null);
    try {
      const result = await parseBattlescribeFile(file);
  setParserResult(result as IRSquad);
  setSelectedAttacker(null);
    } catch (err) {
      setError('Fehler beim Parsen der Datei: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Warhammer 40k Simulator</h1>
      <label style={{ display: 'block', marginBottom: 16 }}>
        <b>1. Battlescribe-Liste hochladen (.ros/.rosz):</b><br />
        <input type="file" accept=".ros,.rosz" onChange={handleFileChange} />
      </label>
      {fileName && <div>Datei: <b>{fileName}</b></div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {parserResult && (
        <div style={{ marginTop: 24 }}>
          <h2>Parser-Report</h2>
          <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 4 }}>
            {JSON.stringify(parserResult, null, 2)}
          </pre>
          <div style={{ marginTop: 24 }}>
            <h2>2. Angreifer wählen</h2>
            <select
              value={selectedAttacker?.name || ''}
              onChange={e => {
                const unit = parserResult.units.find(u => u.name === e.target.value) || null;
                setSelectedAttacker(unit);
                setSelectedDefender(null);
                setSimResult(null);
              }}
            >
              <option value="">Bitte wählen…</option>
              {parserResult.units.map(u => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>
            {selectedAttacker && (
              <div style={{ marginTop: 16 }}>
                <b>Angreifer:</b> {selectedAttacker.name}
                <pre style={{ background: '#f4f4f4', padding: 8, borderRadius: 4 }}>
                  {JSON.stringify(selectedAttacker, null, 2)}
                </pre>
                <div style={{ marginTop: 24 }}>
                  <h2>3. Verteidiger wählen</h2>
                  <select
                    value={selectedDefender?.name || ''}
                    onChange={e => {
                      const unit = parserResult.units.find(u => u.name === e.target.value) || null;
                      setSelectedDefender(unit);
                      setSimResult(null);
                    }}
                  >
                    <option value="">Bitte wählen…</option>
                    {parserResult.units
                      .filter(u => u.name !== selectedAttacker.name)
                      .map(u => (
                        <option key={u.name} value={u.name}>{u.name}</option>
                      ))}
                  </select>
                  {selectedDefender && (
                    <div style={{ marginTop: 16 }}>
                      <b>Verteidiger:</b> {selectedDefender.name}
                      <pre style={{ background: '#f4f4f4', padding: 8, borderRadius: 4 }}>
                        {JSON.stringify(selectedDefender, null, 2)}
                      </pre>
                      <button
                        style={{ marginTop: 16, padding: '8px 16px', fontWeight: 'bold' }}
                        disabled={simRunning}
                        onClick={() => {
                          if (selectedAttacker && selectedDefender) {
                            setSimResult(null);
                            setSimProgress(0);
                            setSimRunning(true);
                            const worker = new SimpleSimWorker();
                            worker.postMessage({ attacker: selectedAttacker, defender: selectedDefender, runs: 1000 });
                            worker.onmessage = (e: MessageEvent) => {
                              if (e.data.type === 'progress') setSimProgress(e.data.value);
                              if (e.data.type === 'done') {
                                setSimResult(e.data.result);
                                setSimRunning(false);
                                setSimProgress(1);
                                worker.terminate();
                              }
                            };
                          }
                        }}
                      >
                        {simRunning ? 'Simulation läuft…' : 'Simulation starten'}
                      </button>
                      {simRunning && (
                        <div style={{ marginTop: 8 }}>
                          <progress value={simProgress} max={1} style={{ width: 200 }} />
                          <span style={{ marginLeft: 8 }}>{Math.round(simProgress * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  {simResult && (
                    <div style={{ marginTop: 24 }}>
                      <h2>Simulationsergebnis</h2>
                      {('error' in simResult) ? (
                        <div style={{ color: 'red' }}>{simResult.error}</div>
                      ) : (
                        <pre style={{ background: '#f4f4f4', padding: 8, borderRadius: 4 }}>
                          {JSON.stringify(simResult.stats, null, 2)}
                        </pre>
                      )}
                      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
                        <button onClick={() => {
                          const blob = new Blob([JSON.stringify(simResult, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'simulation.json';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}>Export JSON</button>
                        <button onClick={() => {
                          // Exportiere Histogramm als CSV
                          if ('allResults' in simResult) {
                            const rows = [
                              'totalDamage,kills,survived,woundsLeft',
                              ...simResult.allResults.map((r: import('./montecarlo').MonteCarloResult) => `${r.totalDamage},${r.kills},${r.survived},${r.woundsLeft}`)
                            ];
                            const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'simulation.csv';
                            a.click();
                            URL.revokeObjectURL(url);
                          }
                        }}>Export CSV</button>
                      </div>
                      <h3 style={{ marginTop: 16 }}>Schadens-Histogramm</h3>
                      <DamageChart
                        data={(() => {
                          if (!('allResults' in simResult)) return [];
                          // Histogram: Schaden -> Häufigkeit
                          const hist: Record<number, number> = {};
                          for (const r of simResult.allResults) {
                            hist[r.totalDamage] = (hist[r.totalDamage] || 0) + 1;
                          }
                          return Object.entries(hist).map(([k, v]) => ({ label: k, value: v }));
                        })()}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
