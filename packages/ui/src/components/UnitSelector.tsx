import { Sword, Shield, Users, Zap } from 'lucide-react';
import type { Unit } from '../irTypes';

interface UnitCardProps {
  unit: Unit;
  isSelected: boolean;
  onClick: () => void;
  role: 'attacker' | 'defender';
  index: number;
}

export function UnitCard({ unit, isSelected, onClick, role, index }: UnitCardProps) {
  const Icon = role === 'attacker' ? Sword : Shield;
  const bgColor = role === 'attacker' 
    ? 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700'
    : 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700';
  
  const selectedColor = role === 'attacker'
    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';

  // Get basic unit info
  const modelCount = Array.isArray(unit.models) ? unit.models.length : 0;
  const hasWeapons = Array.isArray(unit.models) && 
    unit.models.some(m => Array.isArray(m.weapons) && m.weapons.length > 0);
  const firstModel = Array.isArray(unit.models) && unit.models.length > 0 ? unit.models[0] : null;
  const wounds = firstModel?.profile?.W || 'N/A';
  const save = firstModel?.profile?.Sv || 'N/A';

  return (
    <div
      className={`
        card cursor-pointer transition-all duration-200 border-2
        ${isSelected ? selectedColor : bgColor}
        hover:shadow-lg transform hover:-translate-y-1
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${
            role === 'attacker' ? 'text-red-600' : 'text-blue-600'
          }`} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {unit.name}
            {index > 0 && <span className="text-sm text-gray-500"> ({index + 1})</span>}
          </h3>
        </div>
        {isSelected && (
          <div className={`
            w-3 h-3 rounded-full
            ${role === 'attacker' ? 'bg-red-500' : 'bg-blue-500'}
          `} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {modelCount} Modelle
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded border border-gray-400 flex items-center justify-center text-xs">
            W
          </div>
          <span className="text-gray-600 dark:text-gray-400">
            {wounds}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded border border-gray-400 flex items-center justify-center text-xs">
            Sv
          </div>
          <span className="text-gray-600 dark:text-gray-400">
            {save}
          </span>
        </div>
      </div>

      {hasWeapons && (
        <div className="mt-3 flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
          <Zap className="w-3 h-3" />
          <span>Bewaffnet</span>
        </div>
      )}

      {!hasWeapons && (
        <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
          ⚠ Keine Waffen erkannt
        </div>
      )}
    </div>
  );
}

interface UnitSelectorProps {
  units: Unit[];
  selectedUnit: Unit | null;
  onUnitSelect: (unit: Unit | null) => void;
  role: 'attacker' | 'defender';
  title: string;
  excludeUnit?: Unit | null;
}

export function UnitSelector({ 
  units, 
  selectedUnit, 
  onUnitSelect, 
  role, 
  title,
  excludeUnit 
}: UnitSelectorProps) {
  // Filter units that have valid combat data
  const validUnits = units.filter(u =>
    Array.isArray(u.models) &&
    u.models.length > 0 &&
    u.models.some(m =>
      m.profile && Object.keys(m.profile).length > 0 &&
      Array.isArray(m.weapons) && m.weapons.length > 0 &&
      m.weapons[0].profile && Object.keys(m.weapons[0].profile).length > 0
    )
  ).filter(u => !excludeUnit || u !== excludeUnit);

  // Group units by name for handling duplicates
  const unitGroups = validUnits.reduce((groups, unit) => {
    if (!groups[unit.name]) {
      groups[unit.name] = [];
    }
    groups[unit.name].push(unit);
    return groups;
  }, {} as Record<string, Unit[]>);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h2>
      
      {validUnits.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Keine geeigneten Einheiten gefunden</p>
          <p className="text-sm mt-1">
            Einheiten benötigen vollständige Profile und Waffen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(unitGroups).map(([unitName, unitsWithSameName]) =>
            unitsWithSameName.map((unit, index) => (
              <UnitCard
                key={`${unitName}-${role}-${index}`}
                unit={unit}
                isSelected={selectedUnit === unit}
                onClick={() => onUnitSelect(selectedUnit === unit ? null : unit)}
                role={role}
                index={unitsWithSameName.length > 1 ? index : 0}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
