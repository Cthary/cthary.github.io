import { useState } from 'react';
import { X, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import type { WeaponModifiers, Keyword } from '../types/modifiers';
import { AVAILABLE_KEYWORDS } from '../types/modifiers';

interface WeaponModifiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (modifiers: WeaponModifiers) => void;
  weaponName: string;
  initialModifiers?: WeaponModifiers;
}

export function WeaponModifiersModal({
  isOpen,
  onClose,
  onConfirm,
  weaponName,
  initialModifiers
}: WeaponModifiersModalProps) {
  const [modifiers, setModifiers] = useState<WeaponModifiers>(
    initialModifiers || {
      modifications: { hit: 0, wound: 0, damage: 0, crit: 0 },
      rerolls: { hit: 'N/A', wound: 'N/A', damage: 'N/A' },
      keywords: []
    }
  );

  const [expandedSections, setExpandedSections] = useState({
    modifications: false,
    rerolls: false,
    keywords: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleModificationChange = (type: keyof typeof modifiers.modifications, value: number) => {
    setModifiers(prev => ({
      ...prev,
      modifications: {
        ...prev.modifications,
        [type]: value
      }
    }));
  };

  const handleRerollChange = (type: keyof typeof modifiers.rerolls, value: string) => {
    setModifiers(prev => ({
      ...prev,
      rerolls: {
        ...prev.rerolls,
        [type]: value as typeof prev.rerolls[typeof type]
      }
    }));
  };

  const handleKeywordToggle = (keyword: Keyword) => {
    setModifiers(prev => {
      const exists = prev.keywords.find(k => k.name === keyword.name);
      if (exists) {
        return {
          ...prev,
          keywords: prev.keywords.filter(k => k.name !== keyword.name)
        };
      } else {
        return {
          ...prev,
          keywords: [...prev.keywords, keyword]
        };
      }
    });
  };

  const handleKeywordValueChange = (keywordName: string, value: number) => {
    setModifiers(prev => ({
      ...prev,
      keywords: prev.keywords.map(k => 
        k.name === keywordName ? { ...k, value } : k
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Waffen-Modifikatoren
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{weaponName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Modifications Section */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => toggleSection('modifications')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={expandedSections.modifications}
                  onChange={() => toggleSection('modifications')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">Modifications</span>
              </div>
              {expandedSections.modifications ? 
                <ChevronDown className="w-5 h-5" /> : 
                <ChevronRight className="w-5 h-5" />
              }
            </button>
            
            {expandedSections.modifications && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 gap-4">
                {(['hit', 'wound', 'damage', 'crit'] as const).map(type => (
                  <div key={type}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                    <select
                      value={modifiers.modifications[type]}
                      onChange={(e) => handleModificationChange(type, parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    >
                      <option value={1}>+1</option>
                      <option value={0}>0</option>
                      <option value={-1}>-1</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rerolls Section */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => toggleSection('rerolls')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={expandedSections.rerolls}
                  onChange={() => toggleSection('rerolls')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">Rerolls</span>
              </div>
              {expandedSections.rerolls ? 
                <ChevronDown className="w-5 h-5" /> : 
                <ChevronRight className="w-5 h-5" />
              }
            </button>
            
            {expandedSections.rerolls && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                {/* Hit & Wound Rerolls */}
                <div className="grid grid-cols-2 gap-4">
                  {(['hit', 'wound'] as const).map(type => (
                    <div key={type}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                      <select
                        value={modifiers.rerolls[type]}
                        onChange={(e) => handleRerollChange(type, e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      >
                        <option value="N/A">N/A</option>
                        <option value="1">1</option>
                        <option value="Miss">Miss</option>
                        <option value="NonCrit">NonCrit</option>
                      </select>
                    </div>
                  ))}
                </div>
                
                {/* Damage Reroll */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Damage
                  </label>
                  <select
                    value={modifiers.rerolls.damage}
                    onChange={(e) => handleRerollChange('damage', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="N/A">N/A</option>
                    <option value="1">1</option>
                    <option value="< 50%">{'< 50%'}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Keywords Section */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => toggleSection('keywords')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={expandedSections.keywords}
                  onChange={() => toggleSection('keywords')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">Keywords</span>
              </div>
              {expandedSections.keywords ? 
                <ChevronDown className="w-5 h-5" /> : 
                <ChevronRight className="w-5 h-5" />
              }
            </button>
            
            {expandedSections.keywords && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                {AVAILABLE_KEYWORDS.map(keyword => {
                  const isSelected = modifiers.keywords.some(k => k.name === keyword.name);
                  const selectedKeyword = modifiers.keywords.find(k => k.name === keyword.name);
                  
                  return (
                    <div key={keyword.name} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleKeywordToggle(keyword)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {keyword.name}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {keyword.description}
                          </p>
                        </div>
                      </div>
                      
                      {isSelected && keyword.type === 'SustainedHits' && (
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-700 dark:text-gray-300">X:</label>
                          <input
                            type="number"
                            min="1"
                            max="6"
                            value={selectedKeyword?.value || 1}
                            onChange={(e) => handleKeywordValueChange(keyword.name, parseInt(e.target.value))}
                            className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirm(modifiers)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}
