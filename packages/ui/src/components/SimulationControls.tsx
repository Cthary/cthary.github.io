import { useState } from 'react';
import { Play, Settings, BarChart3 } from 'lucide-react';
import type { Unit } from '../irTypes';

interface SimulationControlsProps {
  attacker: Unit;
  defender: Unit;
  onStartSimulation: (config: SimulationConfig) => void;
  isRunning: boolean;
  progress: number;
}

export interface SimulationConfig {
  runs: number;
  modifiers?: {
    coverSave?: number;
    rerollOnes?: boolean;
    extraAp?: number;
  };
}

export function SimulationControls({ 
  attacker, 
  defender, 
  onStartSimulation, 
  isRunning, 
  progress 
}: SimulationControlsProps) {
  const [runs, setRuns] = useState(1000);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modifiers, setModifiers] = useState({
    coverSave: 0,
    rerollOnes: false,
    extraAp: 0
  });

  const handleStart = () => {
    onStartSimulation({
      runs,
      modifiers: {
        coverSave: modifiers.coverSave || undefined,
        rerollOnes: modifiers.rerollOnes || undefined,
        extraAp: modifiers.extraAp || undefined
      }
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Simulation konfigurieren
        </h2>
        <BarChart3 className="w-5 h-5 text-primary-600" />
      </div>

      {/* Unit Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700 dark:text-red-300">Angreifer</span>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100">{attacker.name}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-700 dark:text-blue-300">Verteidiger</span>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100">{defender.name}</p>
        </div>
      </div>

      {/* Simulation Count */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Anzahl Simulationen
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[100, 1000, 5000, 10000].map(count => (
            <button
              key={count}
              onClick={() => setRuns(count)}
              className={`
                py-2 px-3 text-sm rounded-lg border transition-colors
                ${runs === count 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-600 hover:border-primary-400'
                }
              `}
              disabled={isRunning}
            >
              {count.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <input
            type="number"
            value={runs}
            onChange={(e) => setRuns(Math.max(1, parseInt(e.target.value) || 1))}
            className="input-field text-sm py-1 px-2 w-32"
            min="1"
            max="50000"
            disabled={isRunning}
          />
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            (1-50.000)
          </span>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
          disabled={isRunning}
        >
          <Settings className="w-4 h-4" />
          <span>Erweiterte Optionen</span>
        </button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deckung (zusätzlicher Rettungswurf)
              </label>
              <select
                value={modifiers.coverSave}
                onChange={(e) => setModifiers(prev => ({ ...prev, coverSave: parseInt(e.target.value) }))}
                className="input-field text-sm py-1"
                disabled={isRunning}
              >
                <option value={0}>Keine Deckung</option>
                <option value={6}>6+ Deckungsrettung</option>
                <option value={5}>5+ Deckungsrettung</option>
                <option value={4}>4+ Deckungsrettung</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={modifiers.rerollOnes}
                  onChange={(e) => setModifiers(prev => ({ ...prev, rerollOnes: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={isRunning}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Einsen bei Trefferwürfen wiederholen
                </span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zusätzliche Rüstungsdurchdringung
              </label>
              <input
                type="number"
                value={modifiers.extraAp}
                onChange={(e) => setModifiers(prev => ({ ...prev, extraAp: parseInt(e.target.value) || 0 }))}
                className="input-field text-sm py-1 px-2 w-20"
                min="0"
                max="6"
                disabled={isRunning}
              />
            </div>
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="space-y-4">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`
            w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors
            ${isRunning 
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'btn-primary hover:shadow-lg transform hover:-translate-y-0.5'
            }
          `}
        >
          <Play className="w-5 h-5" />
          <span>{isRunning ? 'Simulation läuft...' : 'Simulation starten'}</span>
        </button>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Fortschritt</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {runs.toLocaleString()} Simulationen werden berechnet...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
