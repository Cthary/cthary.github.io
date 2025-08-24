import { useState } from 'react';
import { X } from 'lucide-react';
import { WeaponSelector } from './WeaponSelector';
import { WeaponModifiersModal } from './WeaponModifiersModal';
import type { Unit, WeaponProfile } from '../irTypes';
import type { WeaponModifiers } from '../types/modifiers';

interface WeaponSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit;
  selectedWeapons: WeaponProfile[];
  onWeaponToggle: (weapon: WeaponProfile) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onConfirm: () => void;
  onWeaponModify: (weapon: WeaponProfile, modifiers: WeaponModifiers) => void;
}

export function WeaponSelectionModal({
  isOpen,
  onClose,
  unit,
  selectedWeapons,
  onWeaponToggle,
  onSelectAll,
  onSelectNone,
  onConfirm,
  onWeaponModify
}: WeaponSelectionModalProps) {
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponProfile | null>(null);

  const handleWeaponToggle = (weapon: WeaponProfile) => {
    if (selectedWeapons.includes(weapon)) {
      // Weapon is already selected, toggle it off
      onWeaponToggle(weapon);
    } else {
      // Weapon is not selected, select it and open modifier modal
      onWeaponToggle(weapon);
      setCurrentWeapon(weapon);
      setModifierModalOpen(true);
    }
  };

  const handleModifiersConfirm = (modifiers: WeaponModifiers) => {
    if (currentWeapon) {
      onWeaponModify(currentWeapon, modifiers);
    }
    setModifierModalOpen(false);
    setCurrentWeapon(null);
  };

  const handleModifiersClose = () => {
    // If user cancels modifiers, remove the weapon from selection
    if (currentWeapon) {
      onWeaponToggle(currentWeapon);
    }
    setModifierModalOpen(false);
    setCurrentWeapon(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Waffen auswählen - {unit.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <WeaponSelector
              unit={unit}
              selectedWeapons={selectedWeapons}
              onWeaponToggle={handleWeaponToggle}
              onSelectAll={onSelectAll}
              onSelectNone={onSelectNone}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Waffen bestätigen ({selectedWeapons.length})
            </button>
          </div>
        </div>
      </div>

      {/* Modifiers Modal */}
      {modifierModalOpen && currentWeapon && (
        <WeaponModifiersModal
          isOpen={modifierModalOpen}
          onClose={handleModifiersClose}
          onConfirm={handleModifiersConfirm}
          weaponName={currentWeapon.name}
          initialModifiers={currentWeapon.modifiers}
        />
      )}
    </div>
  );
}
