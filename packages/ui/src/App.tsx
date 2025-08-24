import { useState } from 'react';
import { parseBattlescribeXml } from './battlescribeParser';
import type { IRSquad, Unit, WeaponProfile } from './irTypes';
import SimpleSimWorker from './simpleSim.worker?worker';

// Modern UI Components
import { StepNavigation } from './components/StepNavigation';
import { FileUpload } from './components/FileUpload';
import { UnitSelector } from './components/UnitSelector';
import { WeaponSelectionModal } from './components/WeaponSelectionModal';
import { AttackerSummary } from './components/AttackerSummary';
import { SimulationControls, type SimulationConfig } from './components/SimulationControls';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ToastProvider } from './components/ToastProvider';
import { DarkModeToggle } from './components/DarkModeToggle';
import { useToast } from './hooks/useToast';

function AppContent() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parserResult, setParserResult] = useState<IRSquad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<Unit | null>(null);
  const [selectedDefender, setSelectedDefender] = useState<Unit | null>(null);
  const [selectedAttackerWeapons, setSelectedAttackerWeapons] = useState<WeaponProfile[]>([]);
  const [isWeaponModalOpen, setIsWeaponModalOpen] = useState(false);
  const [simResult, setSimResult] = useState<
    | null
    | {
        runs: number;
        stats: import('./montecarlo').MonteCarloStats;
        allResults: import('./montecarlo').MonteCarloResult[];
      }
    | { error: string }
  >(null);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { showToast } = useToast();

  // Determine current step and completion status
  // Step 1: File upload
  // Step 2: Select attacker (triggers weapon modal)
  // Step 3: Select defender (after weapons are chosen)
  // Step 4: Run simulation
  const currentStep = !parserResult ? 1 : 
                      !selectedAttacker ? 2 : 
                      !selectedDefender ? 3 : 4;
  const completedSteps = [
    !!parserResult && !error,                                    // Step 1: File uploaded
    !!selectedAttacker,                                          // Step 2: Attacker selected 
    !!selectedDefender,                                          // Step 3: Defender selected
    !!simResult && !('error' in simResult)                      // Step 4: Simulation complete
  ];

  async function handleFileUpload(file: File) {
    setFileName(file.name);
    setError(null);
    setParserResult(null);
    setSelectedAttacker(null);
    setSelectedDefender(null);
    setSimResult(null);
    setIsLoading(true);
    
    try {
      const text = await file.text();
      const result = parseBattlescribeXml(text);
      setParserResult(result);
      
      showToast({
        type: 'success',
        title: 'Datei erfolgreich geladen',
        message: `${result.units.length} Einheiten aus ${result.faction} gefunden`
      });
    } catch (err) {
      const errorMsg = 'Fehler beim Parsen der Datei: ' + (err instanceof Error ? err.message : String(err));
      setError(errorMsg);
      
      showToast({
        type: 'error',
        title: 'Fehler beim Laden',
        message: 'Bitte überprüfe, ob es sich um eine gültige Battlescribe-Datei handelt'
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleAttackerSelect(unit: Unit | null) {
    setSelectedAttacker(unit);
    setSelectedDefender(null);
    setSelectedAttackerWeapons([]);
    setSimResult(null);
    
    if (unit) {
      // Open weapon selection modal automatically
      setIsWeaponModalOpen(true);
      showToast({
        type: 'success',
        title: 'Angreifer ausgewählt',
        message: `${unit.name} ist bereit für den Kampf`
      });
    } else {
      showToast({
        type: 'success',
        title: 'Auswahl aufgehoben',
        message: 'Angreifer-Auswahl wurde entfernt'
      });
    }
  }

  function handleDefenderSelect(unit: Unit | null) {
    setSelectedDefender(unit);
    setSimResult(null);
    
    if (unit) {
      showToast({
        type: 'success',
        title: 'Verteidiger ausgewählt',
        message: `${unit.name} bereitet sich auf die Verteidigung vor`
      });
    } else {
      showToast({
        type: 'success',
        title: 'Auswahl aufgehoben',
        message: 'Verteidiger-Auswahl wurde entfernt'
      });
    }
  }

  function handleWeaponToggle(weapon: WeaponProfile) {
    setSelectedAttackerWeapons(prev => {
      const isSelected = prev.some(w => 
        w.name === weapon.name && 
        JSON.stringify(w.profile) === JSON.stringify(weapon.profile)
      );
      
      if (isSelected) {
        // Remove weapon
        return prev.filter(w => 
          !(w.name === weapon.name && 
            JSON.stringify(w.profile) === JSON.stringify(weapon.profile))
        );
      } else {
        // Add weapon
        return [...prev, weapon];
      }
    });
  }

  function handleSelectAllWeapons() {
    if (!selectedAttacker) return;
    
    const allWeapons = selectedAttacker.models?.flatMap(model => model.weapons || []) || [];
    const uniqueWeapons = allWeapons.filter((weapon, index, arr) => {
      return arr.findIndex(w => 
        w.name === weapon.name && 
        JSON.stringify(w.profile) === JSON.stringify(weapon.profile)
      ) === index;
    });
    
    setSelectedAttackerWeapons(uniqueWeapons);
  }

  function handleSelectNoWeapons() {
    setSelectedAttackerWeapons([]);
  }

  function handleWeaponModalConfirm() {
    setIsWeaponModalOpen(false);
    if (selectedAttackerWeapons.length > 0) {
      showToast({
        type: 'success',
        title: 'Waffen bestätigt',
        message: `${selectedAttackerWeapons.length} Waffen wurden ausgewählt`
      });
    }
  }

  function handleWeaponModalClose() {
    setIsWeaponModalOpen(false);
  }

  function handleEditWeapons() {
    setIsWeaponModalOpen(true);
  }

  function handleStartSimulation(config: SimulationConfig) {
    if (!selectedAttacker || !selectedDefender) return;
    
    setSimResult(null);
    setSimProgress(0);
    setSimRunning(true);
    
    showToast({
      type: 'success',
      title: 'Simulation gestartet',
      message: `${config.runs.toLocaleString()} Kämpfe werden simuliert...`
    });
    
    const worker = new SimpleSimWorker();
    worker.postMessage({ 
      attacker: selectedAttacker, 
      defender: selectedDefender,
      selectedWeapons: selectedAttackerWeapons,
      runs: config.runs 
    });
    
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'progress') {
        setSimProgress(e.data.value);
      }
      if (e.data.type === 'done') {
        setSimResult(e.data.result);
        setSimRunning(false);
        setSimProgress(1);
        worker.terminate();
        
        if ('error' in e.data.result) {
          showToast({
            type: 'error',
            title: 'Simulation fehlgeschlagen',
            message: e.data.result.error
          });
        } else {
          showToast({
            type: 'success',
            title: 'Simulation abgeschlossen',
            message: `${config.runs.toLocaleString()} Kämpfe erfolgreich simuliert`
          });
        }
      }
    };
  }

  function handleExport(format: 'json' | 'csv') {
    if (!simResult || 'error' in simResult) return;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(simResult, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'simulation.json';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const rows = [
        'totalDamage,kills,survived,woundsLeft',
        ...simResult.allResults.map(r => `${r.totalDamage},${r.kills},${r.survived},${r.woundsLeft}`)
      ];
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'simulation.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
    
    showToast({
      type: 'success',
      title: 'Export erfolgreich',
      message: `Daten als ${format.toUpperCase()} exportiert`
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header with Dark Mode Toggle */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Warhammer 40k Battle Simulator
            </h1>
            <DarkModeToggle />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <StepNavigation currentStep={currentStep} completedSteps={completedSteps} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="space-y-8">
          {/* Step 1: File Upload */}
          <FileUpload
            onFileUpload={handleFileUpload}
            fileName={fileName}
            error={error}
            title="Battlescribe Armeeliste hochladen"
            description="Wähle eine .ros oder .rosz Datei aus, um deine Armee zu laden"
            isLoading={isLoading}
          />

          {/* Step 2: Attacker Selection */}
          {parserResult && !error && (
            <UnitSelector
              units={parserResult.units}
              selectedUnit={selectedAttacker}
              onUnitSelect={handleAttackerSelect}
              role="attacker"
              title="Angreifer wählen"
            />
          )}

          {/* Step 3: Attacker Summary and Defender Selection */}
          {selectedAttacker && (
            <div className="space-y-6">
              <AttackerSummary
                attacker={selectedAttacker}
                selectedWeapons={selectedAttackerWeapons}
                onEditWeapons={handleEditWeapons}
              />
              
              <UnitSelector
                units={parserResult?.units || []}
                selectedUnit={selectedDefender}
                onUnitSelect={handleDefenderSelect}
                role="defender"
                title="Verteidiger wählen"
                excludeUnit={selectedAttacker}
              />
            </div>
          )}

          {/* Step 4: Simulation */}
          {selectedAttacker && selectedDefender && (
            <SimulationControls
              attacker={selectedAttacker}
              defender={selectedDefender}
              onStartSimulation={handleStartSimulation}
              isRunning={simRunning}
              progress={simProgress}
            />
          )}

          {/* Results */}
          {simResult && !('error' in simResult) && selectedAttacker && selectedDefender && (
            <ResultsDisplay
              result={simResult}
              attackerName={selectedAttacker.name}
              defenderName={selectedDefender.name}
              selectedWeapons={selectedAttackerWeapons}
              onExport={handleExport}
            />
          )}
        </div>
      </div>

      {/* Weapon Selection Modal */}
      {selectedAttacker && (
        <WeaponSelectionModal
          isOpen={isWeaponModalOpen}
          onClose={handleWeaponModalClose}
          unit={selectedAttacker}
          selectedWeapons={selectedAttackerWeapons}
          onWeaponToggle={handleWeaponToggle}
          onSelectAll={handleSelectAllWeapons}
          onSelectNone={handleSelectNoWeapons}
          onConfirm={handleWeaponModalConfirm}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
