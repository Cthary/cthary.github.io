import { User, Sword, Crosshair, Target } from 'lucide-react';
import type { Unit, WeaponProfile } from '../irTypes';

interface AttackerSummaryProps {
  attacker: Unit;
  selectedWeapons: WeaponProfile[];
  onEditWeapons: () => void;
}

export function AttackerSummary({ attacker, selectedWeapons, onEditWeapons }: AttackerSummaryProps) {
  const meleeWeapons = selectedWeapons.filter(w => w.type === 'melee');
  const rangedWeapons = selectedWeapons.filter(w => w.type === 'ranged');

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Angreifer-Zusammenfassung
          </h3>
        </div>
        <button
          onClick={onEditWeapons}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-600 hover:border-red-700 rounded-lg transition-colors"
        >
          Waffen bearbeiten
        </button>
      </div>

      {/* Unit Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          {attacker.name}
        </h4>
        <div className="space-y-2">
          {attacker.models.map((model, index) => (
            <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Anzahl:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {model.count}x {model.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Bewegung:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {model.profile.M}"
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Widerstand:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {model.profile.T}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Rettung:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {model.profile.Sv}+
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Weapons */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Ausgewählte Waffen ({selectedWeapons.length})
        </h4>

        {selectedWeapons.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Keine Waffen ausgewählt</p>
            <button
              onClick={onEditWeapons}
              className="mt-2 text-red-600 hover:text-red-700 transition-colors"
            >
              Waffen auswählen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meleeWeapons.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Sword className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nahkampfwaffen ({meleeWeapons.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {meleeWeapons.map((weapon, index) => (
                    <WeaponSummaryCard key={`melee-${index}`} weapon={weapon} />
                  ))}
                </div>
              </div>
            )}

            {rangedWeapons.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Crosshair className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fernkampfwaffen ({rangedWeapons.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rangedWeapons.map((weapon, index) => (
                    <WeaponSummaryCard key={`ranged-${index}`} weapon={weapon} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WeaponSummaryCard({ weapon }: { weapon: WeaponProfile }) {
  const hasModifiers = weapon.modifiers && (
    Object.values(weapon.modifiers.modifications).some(v => v !== 0) ||
    Object.values(weapon.modifiers.rerolls).some(v => v !== 'N/A') ||
    weapon.modifiers.keywords.length > 0
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-2">
        {weapon.type === 'melee' ? (
          <Sword className="w-3 h-3 text-red-600" />
        ) : (
          <Crosshair className="w-3 h-3 text-blue-600" />
        )}
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {weapon.name}
        </span>
        {hasModifiers && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Mod
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-xs mb-2">
        <div>
          <span className="text-gray-500 dark:text-gray-400">A:</span>
          <span className="ml-1 text-gray-900 dark:text-gray-100">{weapon.profile.A}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">S:</span>
          <span className="ml-1 text-gray-900 dark:text-gray-100">{weapon.profile.S}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">AP:</span>
          <span className="ml-1 text-gray-900 dark:text-gray-100">{weapon.profile.AP}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">D:</span>
          <span className="ml-1 text-gray-900 dark:text-gray-100">{weapon.profile.D}</span>
        </div>
      </div>

      {/* Display modifiers if present */}
      {hasModifiers && weapon.modifiers && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 space-y-1">
          {/* Keywords */}
          {weapon.modifiers.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {weapon.modifiers.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {keyword.name}{keyword.value ? ` ${keyword.value}` : ''}
                </span>
              ))}
            </div>
          )}
          
          {/* Modifications */}
          {Object.entries(weapon.modifiers.modifications).some(([, value]) => value !== 0) && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span>Mods: </span>
              {Object.entries(weapon.modifiers.modifications)
                .filter(([, value]) => value !== 0)
                .map(([key, value]) => `${key}${value > 0 ? '+' : ''}${value}`)
                .join(', ')}
            </div>
          )}
          
          {/* Rerolls */}
          {Object.entries(weapon.modifiers.rerolls).some(([, value]) => value !== 'N/A') && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span>Rerolls: </span>
              {Object.entries(weapon.modifiers.rerolls)
                .filter(([, value]) => value !== 'N/A')
                .map(([key, value]) => `${key}:${value}`)
                .join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
