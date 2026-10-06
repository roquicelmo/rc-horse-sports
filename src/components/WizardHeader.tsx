import React, { useState, useEffect } from 'react';
import type { WizardStep } from '../types/roping';
import { Users, UserCheck, Sliders, ListOrdered, Check } from 'lucide-react';

interface WizardHeaderProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  pezeirosCount: number;
  cabeceirosCount: number;
  hasDrawResults: boolean;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  currentStep,
  onStepClick,
  pezeirosCount,
  cabeceirosCount,
  hasDrawResults,
}) => {
  // Rastreia a etapa máxima alcançada para manter concluídas as etapas previamente visitadas
  const [maxStepReached, setMaxStepReached] = useState<WizardStep>(currentStep);

  useEffect(() => {
    if (currentStep > maxStepReached) {
      setMaxStepReached(currentStep);
    }
  }, [currentStep, maxStepReached]);

  const steps = [
    {
      id: 1 as WizardStep,
      title: 'Pezeiros',
      subtitle: `${pezeirosCount} selecionados`,
      icon: Users,
      isAccessible: true,
    },
    {
      id: 2 as WizardStep,
      title: 'Cabeceiros',
      subtitle: `${cabeceirosCount} selecionados`,
      icon: UserCheck,
      isAccessible: pezeirosCount > 0,
    },
    {
      id: 3 as WizardStep,
      title: 'Configuração',
      subtitle: 'Regras & Baterias',
      icon: Sliders,
      isAccessible: pezeirosCount > 0 && cabeceirosCount > 0,
    },
    {
      id: 4 as WizardStep,
      title: 'Ordem de Corrida',
      subtitle: hasDrawResults ? 'Sorteio Gerado' : 'Aguardando Sorteio',
      icon: ListOrdered,
      isAccessible: hasDrawResults,
    },
  ];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = !isActive && (step.id < currentStep || step.id < maxStepReached);

          return (
            <button
              key={step.id}
              onClick={() => step.isAccessible && onStepClick(step.id)}
              disabled={!step.isAccessible}
              className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left border relative overflow-hidden ${
                isActive
                  ? 'bg-blue-950/40 border-blue-500/60 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10 cursor-default'
                  : isDone
                  ? 'bg-emerald-950/35 border-emerald-500/50 hover:bg-emerald-950/50 hover:border-emerald-400 cursor-pointer shadow-sm shadow-emerald-950/30'
                  : 'bg-slate-950/40 border-slate-900/60 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Highlight superior da etapa ativa ou concluída */}
              {(isActive || isDone) && (
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isActive ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-emerald-500/80'
                  }`}
                />
              )}

              {/* Step Icon Badge */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-blue-500/25 text-blue-300 border border-blue-400/50 shadow-sm shadow-blue-500/20'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                }`}
              >
                {isDone ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-300' : 'text-slate-500'}`} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs uppercase tracking-wider ${
                      isActive
                        ? 'font-bold text-blue-400'
                        : isDone
                        ? 'font-semibold text-emerald-400'
                        : 'font-semibold text-slate-500'
                    }`}
                  >
                    Etapa {step.id}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Atual
                    </span>
                  )}
                  {isDone && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </div>
                <h3
                  className={`text-sm truncate ${
                    isActive
                      ? 'font-extrabold text-white'
                      : isDone
                      ? 'font-bold text-emerald-100 group-hover:text-white'
                      : 'font-bold text-slate-400'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-xs truncate ${
                    isActive
                      ? 'text-blue-200/90 font-medium'
                      : isDone
                      ? 'text-emerald-300/80 font-mono'
                      : 'text-slate-500'
                  }`}
                >
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
