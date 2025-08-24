import { Target, Check, Sword, Crosshair } from 'lucide-react';
import type { Unit, WeaponProfile } from '../irTypes';

interface WeaponSelectorProps {
  unit: Unit;
  selectedWeapons: WeaponProfile[];
  onWeaponToggle: (weapon: WeaponProfile) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

interface WeaponCardProps {
  weapon: WeaponProfile;
  isSelected: boolean;
  onToggle: () => void;
}

function WeaponCard({ weapon, isSelected, onToggle }: WeaponCardProps) {
  const profile = weapon.profile;
  
  return (
    <div
      onClick={onToggle}
      className={`
        relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
        ${isSelected 
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:shadow-sm'
        }
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Weapon Name */}
      <div className="flex items-center space-x-2 mb-3">
        {weapon.type === 'melee' ? (
          <Sword className="w-4 h-4 text-red-600" />
        ) : (
          <Crosshair className="w-4 h-4 text-blue-600" />
        )}
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {weapon.name}
        </h4>
      </div>

      {/* Weapon Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Angriffe</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {profile?.A || 'N/A'}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Treffer</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {weapon.type === 'melee' 
              ? (profile?.WS ? `${profile.WS}+` : 'N/A')
              : (profile?.BS ? `${profile.BS}+` : 'N/A')
            }
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Stärke</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {profile?.S || 'N/A'}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">AP</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {profile?.AP || '0'}
          </span>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-3 mt-3 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Schaden</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {profile?.D || '1'}
          </span>
        </div>
      </div>

      {/* Selection Status */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className={`text-xs font-medium ${
          isSelected 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {isSelected ? '✓ Ausgewählt' : 'Klicken zum Auswählen'}
        </div>
      </div>
    </div>
  );
}

export function WeaponSelector({ 
  unit, 
  selectedWeapons, 
  onWeaponToggle, 
  onSelectAll, 
  onSelectNone 
}: WeaponSelectorProps) {
  // Use combined weapons if available, otherwise fall back to individual model weapons
  const allWeapons = unit.combinedWeapons?.length 
    ? unit.combinedWeapons 
    : (unit.models?.flatMap(model => model.weapons || []) || []);
  
  // Remove duplicates based on weapon name and profile (mainly for fallback case)
  const uniqueWeapons = allWeapons.filter((weapon, index, arr) => {
    return arr.findIndex(w => 
      w.name === weapon.name && 
      JSON.stringify(w.profile) === JSON.stringify(weapon.profile)
    ) === index;
  });

  if (uniqueWeapons.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Keine Waffen verfügbar</p>
          <p className="text-sm mt-1">
            Diese Einheit hat keine erkannten Waffen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Waffen auswählen für {unit.name}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={onSelectAll}
            className="text-sm px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md transition-colors"
          >
            Alle auswählen
          </button>
          <button
            onClick={onSelectNone}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
          >
            Keine auswählen
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>{selectedWeapons.length}</strong> von <strong>{uniqueWeapons.length}</strong> Waffen ausgewählt
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueWeapons.map((weapon, index) => (
          <WeaponCard
            key={`${weapon.name}-${index}`}
            weapon={weapon}
            isSelected={selectedWeapons.some(w => 
              w.name === weapon.name && 
              JSON.stringify(w.profile) === JSON.stringify(weapon.profile)
            )}
            onToggle={() => onWeaponToggle(weapon)}
          />
        ))}
      </div>

      {selectedWeapons.length === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠ Bitte wähle mindestens eine Waffe aus, um die Simulation zu starten
          </p>
        </div>
      )}
    </div>
  );
}
