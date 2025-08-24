import { BarChart3, Target, TrendingUp, Zap, Sword, Crosshair } from 'lucide-react';
import type { WeaponProfile } from '../irTypes';

interface WeaponStatsProps {
  weapon: WeaponProfile;
  stats: {
    averageAttacks: number;
    averageHits: number;
    averageWounds: number;
    averageDamage: number;
    hitRate: number;
    woundRate: number;
    damagePerAttack: number;
  };
}

interface DetailedWeaponStatsProps {
  selectedWeapons: WeaponProfile[];
}

interface WeaponWithStats {
  weapon: WeaponProfile;
  stats: {
    averageAttacks: number;
    averageHits: number;
    averageWounds: number;
    averageDamage: number;
    hitRate: number;
    woundRate: number;
    damagePerAttack: number;
  };
}

function WeaponStatCard({ weapon, stats }: WeaponStatsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ø Angriffe:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {stats.averageAttacks.toFixed(1)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ø Treffer:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {stats.averageHits.toFixed(1)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ø Wunden:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {stats.averageWounds.toFixed(1)}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ø Schaden:</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              {stats.averageDamage.toFixed(1)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Trefferrate:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(stats.hitRate * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Wundrate:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(stats.woundRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Schaden pro Angriff:
          </span>
          <span className="text-sm font-bold text-red-600 dark:text-red-400">
            {stats.damagePerAttack.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate weapon statistics
function calculateWeaponStats(weapon: WeaponProfile) {
  // For simulation, these values would come from actual combat simulation
  // For now, we'll calculate theoretical values based on weapon profiles
  const averageAttacks = weapon.profile.A || 1;
  
  // Use appropriate skill based on weapon type
  let hitRate = 0.5; // Default fallback
  if (weapon.type === 'melee' && weapon.profile.WS) {
    hitRate = (7 - Math.max(1, weapon.profile.WS)) / 6;
  } else if (weapon.type === 'ranged' && weapon.profile.BS) {
    hitRate = (7 - Math.max(1, weapon.profile.BS)) / 6;
  }
  
  const woundRate = 0.5; // Simplified - would depend on target toughness
  const averageHits = averageAttacks * hitRate;
  const averageWounds = averageHits * woundRate;
  const averageDamage = averageWounds * (weapon.profile.D || 1);
  const damagePerAttack = averageDamage / averageAttacks;

  return {
    averageAttacks,
    averageHits,
    averageWounds,
    averageDamage,
    hitRate,
    woundRate,
    damagePerAttack,
  };
}

export function DetailedWeaponStats({ selectedWeapons }: DetailedWeaponStatsProps) {
  if (!selectedWeapons || selectedWeapons.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detaillierte Waffenstatistiken
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Wählen Sie Waffen aus, um detaillierte Statistiken anzuzeigen.
        </p>
      </div>
    );
  }

  // Calculate stats for each weapon
  const weaponStats: WeaponWithStats[] = selectedWeapons.map(weapon => ({
    weapon,
    stats: calculateWeaponStats(weapon)
  }));

  const totalDamage = weaponStats.reduce((sum: number, ws) => sum + ws.stats.averageDamage, 0);
  const mostEffectiveWeapon = weaponStats.reduce((best, current) => 
    current.stats.damagePerAttack > best.stats.damagePerAttack ? current : best
  );

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Detaillierte Waffenstatistiken
        </h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Waffen im Einsatz
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            {weaponStats.length}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Gesamtschaden (Ø)
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
            {totalDamage.toFixed(1)}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Effektivste Waffe
            </span>
          </div>
          <p className="text-sm font-bold text-green-900 dark:text-green-100 mt-1">
            {mostEffectiveWeapon.weapon.name}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            {mostEffectiveWeapon.stats.damagePerAttack.toFixed(2)} Schaden/Angriff
          </p>
        </div>
      </div>

      {/* Individual Weapon Stats */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
          Einzelne Waffenperformance
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weaponStats
            .sort((a: WeaponWithStats, b: WeaponWithStats) => b.stats.damagePerAttack - a.stats.damagePerAttack)
            .map((weaponStat: WeaponWithStats, index: number) => (
              <WeaponStatCard
                key={`${weaponStat.weapon.name}-${index}`}
                weapon={weaponStat.weapon}
                stats={weaponStat.stats}
              />
            ))}
        </div>
      </div>

      {/* Performance Ranking */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
          Effizienz-Ranking
        </h4>
        
        <div className="space-y-2">
          {weaponStats
            .sort((a: WeaponWithStats, b: WeaponWithStats) => b.stats.damagePerAttack - a.stats.damagePerAttack)
            .map((weaponStat: WeaponWithStats, index: number) => (
              <div 
                key={`ranking-${weaponStat.weapon.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-yellow-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-300 text-gray-700'}
                  `}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {weaponStat.weapon.name}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {weaponStat.stats.damagePerAttack.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Schaden/Angriff
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
