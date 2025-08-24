import { useState } from 'react';
import { BarChart3, Table, Download, TrendingUp, Target, Skull } from 'lucide-react';
import { DamageChart } from '../DamageChart';
import { DetailedWeaponStats } from './DetailedWeaponStats';
import type { WeaponProfile } from '../irTypes';

interface SimulationResult {
  runs: number;
  stats: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    killChance: number;
  };
  allResults: Array<{
    totalDamage: number;
    kills: number;
    survived: number;
    woundsLeft: number;
  }>;
}

interface ResultsDisplayProps {
  result: SimulationResult;
  attackerName: string;
  defenderName: string;
  selectedWeapons?: WeaponProfile[];
  onExport: (format: 'json' | 'csv') => void;
}

export function ResultsDisplay({ 
  result, 
  attackerName, 
  defenderName, 
  selectedWeapons = [],
  onExport 
}: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'weapons' | 'details'>('overview');

  const { stats } = result;

  // Calculate additional statistics
  const effectiveness = (stats.mean / result.runs * 100);
  const consistency = Math.max(0, 100 - (stats.std / stats.mean * 100));
  const averageKills = result.allResults.reduce((sum, r) => sum + r.kills, 0) / result.runs;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Simulationsergebnisse
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onExport('json')}
            className="btn-secondary text-sm py-1 px-3"
          >
            <Download className="w-4 h-4 mr-1" />
            JSON
          </button>
          <button
            onClick={() => onExport('csv')}
            className="btn-secondary text-sm py-1 px-3"
          >
            <Download className="w-4 h-4 mr-1" />
            CSV
          </button>
        </div>
      </div>

      {/* Combat Summary */}
      <div className="bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium">{attackerName}</span>
          </div>
          <div className="text-gray-500 dark:text-gray-400">VS</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium">{defenderName}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Übersicht', icon: TrendingUp },
          { id: 'chart', label: 'Diagramm', icon: BarChart3 },
          { id: 'weapons', label: 'Waffen', icon: Target },
          { id: 'details', label: 'Details', icon: Table }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'chart' | 'weapons' | 'details')}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'bg-white dark:bg-dark-800 text-primary-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Ø Schaden
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.mean.toFixed(1)}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <Skull className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  Ø Kills
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {averageKills.toFixed(1)}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Effektivität
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {effectiveness.toFixed(1)}%
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Konsistenz
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {consistency.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Range Information */}
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Schadensspanne</h3>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Minimum:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {stats.min} Schaden
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Maximum:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {stats.max} Schaden
                </span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Standardabweichung:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                ±{stats.std.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chart' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Schadens-Verteilung ({result.runs.toLocaleString()} Simulationen)
          </h3>
          <DamageChart
            data={(() => {
              // Create histogram from all results
              const histogram: Record<number, number> = {};
              for (const r of result.allResults) {
                histogram[r.totalDamage] = (histogram[r.totalDamage] || 0) + 1;
              }
              const totalRuns = result.runs;
              return Object.entries(histogram)
                .map(([damage, count]) => ({ 
                  label: damage, 
                  value: Number(((count / totalRuns) * 100).toFixed(1)) // Convert to percentage
                }))
                .sort((a, b) => parseInt(a.label) - parseInt(b.label));
            })()}
          />
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Detaillierte Statistiken
          </h3>
          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Simulationen:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {result.runs.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Durchschn. Schaden:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {stats.mean.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Durchschn. Kills:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {averageKills.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Kill-Prozentsatz:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {(stats.killChance * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weapons' && (
        <div className="space-y-4">
          <DetailedWeaponStats selectedWeapons={selectedWeapons} />
        </div>
      )}
    </div>
  );
}
