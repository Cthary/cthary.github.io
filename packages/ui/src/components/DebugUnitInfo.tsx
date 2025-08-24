import type { Unit } from '../irTypes';

interface DebugUnitInfoProps {
  unit: Unit;
}

export function DebugUnitInfo({ unit }: DebugUnitInfoProps) {
  const totalModels = unit.models.reduce((sum, model) => sum + model.count, 0);
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border text-xs">
      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
        DEBUG: {unit.name}
      </h4>
      
      <div className="space-y-1 text-gray-700 dark:text-gray-300">
        <div><strong>Gesamtmodelle:</strong> {totalModels}</div>
        
        <div className="mt-2">
          <strong>Model-Details:</strong>
          {unit.models.map((model, index) => (
            <div key={index} className="ml-2">
              • {model.name}: {model.count}x (W{model.profile.W}, Sv{model.profile.Sv}+
              {model.profile.Inv ? `, Inv${model.profile.Inv}+` : ''})
            </div>
          ))}
        </div>
        
        <div className="mt-2">
          <strong>Weapons:</strong>
          {unit.models.flatMap(model => model.weapons).map((weapon, index) => (
            <div key={index} className="ml-2">
              • {weapon.name} ({weapon.type})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
