import React from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  completedSteps: boolean[];
}

const steps = [
  { id: 1, title: 'Armeeliste hochladen', description: 'Battlescribe Datei auswählen' },
  { id: 2, title: 'Angreifer wählen', description: 'Angreifer und Waffen auswählen' },
  { id: 3, title: 'Verteidiger wählen', description: 'Verteidiger festlegen' },
  { id: 4, title: 'Simulation starten', description: 'Kampf simulieren und Ergebnisse anzeigen' }
];

export function StepNavigation({ currentStep, completedSteps }: StepNavigationProps) {
  return (
    <nav className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Warhammer 40k Simulator
            </h1>
          </div>
        </div>
        
        <div className="pb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                      ${completedSteps[index] 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : currentStep === step.id
                        ? 'border-primary-600 text-primary-600 bg-white dark:bg-dark-800'
                        : 'border-gray-300 dark:border-dark-600 text-gray-400 dark:text-gray-500'
                      }
                    `}>
                      {completedSteps[index] ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        currentStep >= step.id 
                          ? 'text-gray-900 dark:text-gray-100' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
