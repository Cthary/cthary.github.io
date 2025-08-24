import { BarChart3, Target, TrendingUp, Zap, Sword, Crosshair } from 'lucide-react';
import type { WeaponProfile } from '../irTypes';
import type { WeaponModifiers } from '../types/modifiers';

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
    // Keyword breakdowns
    baseAttacks: number;
    blastBonusAttacks: number;
    sustainedHitsBonusHits: number;
    lethalHitsAutoWounds: number;
    devastatingWoundsCount: number;
    normalWounds: number;
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
    // Keyword breakdowns
    baseAttacks: number;
    blastBonusAttacks: number;
    sustainedHitsBonusHits: number;
    lethalHitsAutoWounds: number;
    devastatingWoundsCount: number;
    normalWounds: number;
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
              {stats.sustainedHitsBonusHits > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                  (+{stats.sustainedHitsBonusHits.toFixed(1)})
                </span>
              )}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ø Wunden:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {stats.averageWounds.toFixed(1)}
              {stats.lethalHitsAutoWounds > 0 && (
                <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">
                  (+{stats.lethalHitsAutoWounds.toFixed(1)} auto)
                </span>
              )}
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
      
      {/* Keyword Effects Breakdown */}
      {(stats.blastBonusAttacks > 0 || stats.sustainedHitsBonusHits > 0 || stats.lethalHitsAutoWounds > 0 || stats.devastatingWoundsCount > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Keyword-Effekte:
          </h5>
          <div className="space-y-1 text-xs">
            {stats.blastBonusAttacks > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">• Blast Bonus-Angriffe:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{stats.blastBonusAttacks.toFixed(1)}
                </span>
              </div>
            )}
            
            {stats.sustainedHitsBonusHits > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">• Sustained Hits (aus {(stats.baseAttacks * (1/6)).toFixed(1)} Crits):</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  +{stats.sustainedHitsBonusHits.toFixed(1)} Treffer
                </span>
              </div>
            )}
            
            {stats.lethalHitsAutoWounds > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">• Lethal Hits (aus {(stats.baseAttacks * (1/6)).toFixed(1)} Crits):</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {stats.lethalHitsAutoWounds.toFixed(1)} Auto-Wunden
                </span>
              </div>
            )}
            
            {stats.devastatingWoundsCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">• Devastating Wounds:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {stats.devastatingWoundsCount.toFixed(1)} Mortal
                </span>
              </div>
            )}
            
            {stats.normalWounds > 0 && stats.lethalHitsAutoWounds > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">• Normale Wunden:</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {stats.normalWounds.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
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
  // For now, we'll calculate theoretical values based on weapon profiles with modifiers
  const baseAttacks = weapon.profile.A || 1;
  let averageAttacks = baseAttacks;
  
  // Apply Blast keyword - adds 1 attack per 5 models (assuming 10 model unit for calculation)
  const hasBlast = weapon.modifiers?.keywords?.some(k => k.type === 'Blast');
  const blastBonusAttacks = hasBlast ? Math.floor(10 / 5) : 0; // +2 attacks for 10-model unit
  averageAttacks += blastBonusAttacks;
  
  // Use appropriate skill based on weapon type
  let baseHitValue = 4; // Default to 4+
  if (weapon.type === 'melee' && weapon.profile.WS) {
    baseHitValue = weapon.profile.WS;
  } else if (weapon.type === 'ranged' && weapon.profile.BS) {
    baseHitValue = weapon.profile.BS;
  }
  
  // Apply hit modifications
  const modifiedHitValue = Math.max(2, Math.min(6, baseHitValue - (weapon.modifiers?.modifications?.hit || 0)));
  const baseHitRate = (7 - modifiedHitValue) / 6;
  let critHitRate = 1/6; // Unmodified 6s are always crits
  
  // Apply rerolls for hits
  const hitReroll = weapon.modifiers?.rerolls?.hit;
  let hitRate = baseHitRate;
  
  if (hitReroll === '1') {
    // Reroll 1s: P(hit after reroll) = P(hit) + P(miss on 1) * P(hit on reroll)
    hitRate = baseHitRate + (1/6) * baseHitRate;
  } else if (hitReroll === 'Miss') {
    // Reroll all misses: P(hit after reroll) = P(hit) + P(miss) * P(hit on reroll)
    hitRate = baseHitRate + (1 - baseHitRate) * baseHitRate;
  } else if (hitReroll === 'NonCrit') {
    // Reroll non-critical hits (1-5): Much more complex calculation
    // Original hits: 1/6 crits + baseHitRate non-crits
    // Reroll non-crits (1-5), get: additional crits (1/6 of rerolls) + additional hits
    const nonCritRate = baseHitRate - critHitRate; // Non-crit hits (2-5 if WS3+)
    const rerollRate = 5/6; // Reroll everything except 6s
    
    // After reroll: keep original crits + get new crits from rerolls + get new non-crit hits
    critHitRate = critHitRate + (rerollRate * (1/6)); // Original crits + new crits from rerolls
    hitRate = critHitRate + (rerollRate * nonCritRate); // Total hit rate after rerolls
  }
  
  // Calculate base hits (without sustained hits bonus)
  const baseHits = averageAttacks * hitRate;
  
  // Apply Sustained Hits - only critical hits generate bonus hits
  const sustainedHits = weapon.modifiers?.keywords?.find(k => k.type === 'SustainedHits');
  const criticalHits = averageAttacks * critHitRate;
  const sustainedHitsBonusHits = sustainedHits && sustainedHits.value ? 
    criticalHits * sustainedHits.value : 0;
  
  const averageHits = baseHits + sustainedHitsBonusHits;
  
  // Wound calculations
  const baseWoundValue = 4; // Simplified assumption
  const modifiedWoundValue = Math.max(2, Math.min(6, baseWoundValue - (weapon.modifiers?.modifications?.wound || 0)));
  const baseWoundRate = (7 - modifiedWoundValue) / 6;
  let woundRate = baseWoundRate;
  
  // Apply rerolls for wounds
  const woundReroll = weapon.modifiers?.rerolls?.wound;
  if (woundReroll === '1') {
    woundRate = baseWoundRate + (1/6) * baseWoundRate;
  } else if (woundReroll === 'Miss') {
    woundRate = baseWoundRate + (1 - baseWoundRate) * baseWoundRate;
  } else if (woundReroll === 'NonCrit') {
    // Reroll non-critical wounds (similar to hit rerolls)
    const rerollRate = 5/6; // Reroll everything except 6s
    woundRate = baseWoundRate + (rerollRate * baseWoundRate);
  }
  
  // Lethal Hits - critical hits auto-wound
  const hasLethalHits = weapon.modifiers?.keywords?.some(k => k.type === 'LethalHits');
  const lethalHitsAutoWounds = hasLethalHits ? criticalHits : 0;
  
  // Calculate wounds from non-critical hits
  const nonCriticalHits = baseHits - criticalHits; // Base hits minus critical hits
  const normalWounds = nonCriticalHits * woundRate;
  const averageWounds = normalWounds + lethalHitsAutoWounds;
  
  // Damage calculations
  let baseDamage = weapon.profile.D || 1;
  baseDamage += weapon.modifiers?.modifications?.damage || 0;
  
  // Devastating Wounds - critical wounds (6+ to wound) deal mortal wounds
  const hasDevastatingWounds = weapon.modifiers?.keywords?.some(k => k.type === 'DevastatingWounds');
  let averageDamage = averageWounds * baseDamage;
  let devastatingWoundsCount = 0;
  
  if (hasDevastatingWounds) {
    // In this interpretation: ALL wounds can potentially be Devastating Wounds
    // This includes both Lethal Hits (auto-wounds) and normal wound successes
    // 1/6 of all wounds become critical wounds (Devastating Wounds)
    const critWoundRate = 1/6;
    devastatingWoundsCount = averageWounds * critWoundRate;
    
    // Regular wounds are the remaining wounds that aren't critical
    const regularWounds = averageWounds * (1 - critWoundRate);
    averageDamage = (regularWounds * baseDamage) + (devastatingWoundsCount * baseDamage); // Mortal wounds bypass saves
  }
  
  const damagePerAttack = averageDamage / baseAttacks;

  return {
    averageAttacks,
    averageHits,
    averageWounds,
    averageDamage,
    hitRate,
    woundRate,
    damagePerAttack,
    // Keyword breakdowns
    baseAttacks,
    blastBonusAttacks,
    sustainedHitsBonusHits,
    lethalHitsAutoWounds,
    devastatingWoundsCount,
    normalWounds,
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
