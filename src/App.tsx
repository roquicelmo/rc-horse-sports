import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type {
  Competitor,
  DrawConfig,
  Run,
  WizardStep,
} from './types/roping';
import { INITIAL_COMPETITORS } from './data/mockCompetitors';
import { executeGroupCrossDraw, calculateRunTotal } from './utils/drawAlgorithm';
import { WizardHeader } from './components/WizardHeader';
import { TransferList } from './components/TransferList';
import { DrawConfiguration } from './components/DrawConfiguration';
import { RunsTable } from './components/RunsTable';
import { NewCompetitorModal } from './components/NewCompetitorModal';
import { Trophy, RefreshCw, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Wizard Current Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // 2. State: Lista global de inscritos (mock)
  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);

  // 3. State: Lista de Pezeiros selecionados (inicia vazia para seleção manual)
  const [selectedPezeiros, setSelectedPezeiros] = useState<Competitor[]>([]);

  // 4. State: Lista de Cabeceiros selecionados (inicia vazia para seleção manual)
  const [selectedCabeceiros, setSelectedCabeceiros] = useState<Competitor[]>([]);

  // 5. State: Configurações do Sorteio (Baterias A, B, C; Somatória Livre; Seleção de Baterias)
  const [drawConfig, setDrawConfig] = useState<DrawConfig>({
    numGroups: 3, // Padrão: 3 Grupos de Baterias (A, B e C)
    minGap: 5,
    balanceGroups: false, // Por padrão mantém as Chaves A, B e C oficiais
    batteryMode: 'phases',
    numBatteries: 9,
  });

  // 6. State: Resultado do Sorteio (inicia vazio até ser gerado na Etapa 3)
  const [drawResults, setDrawResults] = useState<Run[]>([]);

  // 7. State: Termo de busca (Search global)
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para adicionar novo competidor
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Available Pezeiros: Todos os inscritos menos os já selecionados na lista de pezeiros
  const availablePezeiros = competitors.filter(
    (c) => !selectedPezeiros.some((sp) => sp.id === c.id)
  );

  // Available Cabeceiros: Todos os inscritos menos os já selecionados na lista de cabeceiros
  const availableCabeceiros = competitors.filter(
    (c) => !selectedCabeceiros.some((sc) => sc.id === c.id)
  );

  // Handlers para Pezeiros
  const handleSelectPezeiro = (comp: Competitor) => {
    setSelectedPezeiros((prev) => [...prev, comp]);
  };

  const handleDeselectPezeiro = (comp: Competitor) => {
    setSelectedPezeiros((prev) => prev.filter((p) => p.id !== comp.id));
  };

  const handleSelectAllPezeiros = () => {
    setSelectedPezeiros([...competitors]);
  };

  const handleClearAllPezeiros = () => {
    setSelectedPezeiros([]);
  };

  // Handlers para Cabeceiros
  const handleSelectCabeceiro = (comp: Competitor) => {
    setSelectedCabeceiros((prev) => [...prev, comp]);
  };

  const handleDeselectCabeceiro = (comp: Competitor) => {
    setSelectedCabeceiros((prev) => prev.filter((c) => c.id !== comp.id));
  };

  const handleSelectAllCabeceiros = () => {
    setSelectedCabeceiros([...competitors]);
  };

  const handleClearAllCabeceiros = () => {
    setSelectedCabeceiros([]);
  };

  // Disparo do Sorteio Oficial com Cruzamento Todos contra Todos (A, B, C...)
  const handleGenerateDraw = () => {
    const { runs } = executeGroupCrossDraw(selectedCabeceiros, selectedPezeiros, drawConfig);
    setDrawResults(runs);
    setSearchTerm('');
    setCurrentStep(4);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#a855f7'],
      });
    } catch {
      // ignore
    }
  };

  // Atualização em tempo real do tempo de uma corrida por Boi (1, 2 ou 3)
  const handleUpdateTime = (runId: string, boi: 1 | 2 | 3, value: string, isNt?: boolean) => {
    setDrawResults((prev) =>
      prev.map((run) => {
        if (run.id !== runId) return run;

        const newTimes = { ...run.times };
        if (boi === 1) {
          if (isNt !== undefined) newTimes.boi1Nt = isNt;
          if (value !== undefined) newTimes.boi1 = value;
        } else if (boi === 2) {
          if (isNt !== undefined) newTimes.boi2Nt = isNt;
          if (value !== undefined) newTimes.boi2 = value;
        } else if (boi === 3) {
          if (isNt !== undefined) newTimes.boi3Nt = isNt;
          if (value !== undefined) newTimes.boi3 = value;
        }

        const candidateRun: Run = { ...run, times: newTimes };
        const { totalTime, mediaFinal, isNt: runNt } = calculateRunTotal(candidateRun);

        return {
          ...candidateRun,
          totalTime,
          mediaFinal,
          isNt: runNt,
        };
      })
    );
  };

  // Preenchimento simulado de tempos para demonstração da apuração
  const handleFillSampleTimes = () => {
    setDrawResults((prev) =>
      prev.map((run, idx) => {
        const base = 5.9 + (idx % 6) * 0.45;
        const b1 = (base + (idx % 3) * 0.25).toFixed(2);
        const b2 = run.bois >= 2 ? (base + 0.35 + (idx % 2) * 0.3).toFixed(2) : '';
        const b3 = run.bois >= 3 ? (base + 0.65).toFixed(2) : '';

        // Simula ocasionalmente um NT (ex: corrida 5)
        const hasNt = idx === 4;

        const newTimes = {
          boi1: hasNt ? '' : b1,
          boi2: run.bois >= 2 && !hasNt ? b2 : '',
          boi3: run.bois >= 3 && !hasNt ? b3 : '',
          boi1Nt: hasNt,
          boi2Nt: false,
          boi3Nt: false,
        };

        const updatedRun: Run = { ...run, times: newTimes };
        const { totalTime, mediaFinal, isNt } = calculateRunTotal(updatedRun);

        return {
          ...updatedRun,
          totalTime,
          mediaFinal,
          isNt,
        };
      })
    );
  };

  // Limpar todos os tempos
  const handleClearAllTimes = () => {
    setDrawResults((prev) =>
      prev.map((run) => ({
        ...run,
        times: {
          boi1: '',
          boi2: '',
          boi3: '',
          boi1Nt: false,
          boi2Nt: false,
          boi3Nt: false,
        },
        totalTime: null,
        mediaFinal: null,
        isNt: false,
      }))
    );
  };

  // Reseta ou adiciona novo competidor
  const handleAddNewCompetitor = (newComp: Competitor) => {
    setCompetitors((prev) => [newComp, ...prev]);
  };

  const handleResetToDefaultMock = () => {
    if (window.confirm('Deseja limpar as seleções e reiniciar o fluxo do sorteio?')) {
      setCompetitors(INITIAL_COMPETITORS);
      setSelectedCabeceiros([]);
      setSelectedPezeiros([]);
      setDrawResults([]);
      setCurrentStep(1);
    }
  };

  const handleLoadDemoMock = () => {
    const defaultCabs = INITIAL_COMPETITORS.slice(0, 15);
    const defaultPezs = INITIAL_COMPETITORS.slice(15, 30);
    setCompetitors(INITIAL_COMPETITORS);
    setSelectedCabeceiros(defaultCabs);
    setSelectedPezeiros(defaultPezs);
    const { runs } = executeGroupCrossDraw(defaultCabs, defaultPezs, drawConfig);
    setDrawResults(runs);
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 no-print">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white m-0">
                  Team Roping Pro
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Henrique Lagoa
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Sorteio Todos x Todos • Baterias A, B e C • Súmula de Tempos
              </p>
            </div>
          </div>

          {/* Quick Info & Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLoadDemoMock}
              className="text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 transition cursor-pointer"
              title="Carregar demonstração completa com 15 cabeceiros e 15 pezeiros"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Exemplo (15×15)</span>
            </button>

            <button
              onClick={handleResetToDefaultMock}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition cursor-pointer"
              title="Limpar seleções e reiniciar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar / Reiniciar</span>
            </button>

            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
              <span className="text-slate-500">Inscritos:</span>
              <span className="font-mono font-bold text-slate-300">{competitors.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Wizard Stepper Navigation */}
        <div className="no-print">
          <WizardHeader
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
            pezeirosCount={selectedPezeiros.length}
            cabeceirosCount={selectedCabeceiros.length}
            hasDrawResults={drawResults.length > 0}
          />
        </div>

        {/* Step 1: Seleção de Pezeiros */}
        {currentStep === 1 && (
          <TransferList
            title="Seleção de Pezeiros (Heelers)"
            role="pezeiro"
            availableItems={availablePezeiros}
            selectedItems={selectedPezeiros}
            onSelect={handleSelectPezeiro}
            onDeselect={handleDeselectPezeiro}
            onSelectAll={handleSelectAllPezeiros}
            onClearAll={handleClearAllPezeiros}
            onNext={() => setCurrentStep(2)}
            nextButtonLabel="Avançar para Cabeceiros"
            onOpenAddModal={() => setIsModalOpen(true)}
          />
        )}

        {/* Step 2: Seleção de Cabeceiros */}
        {currentStep === 2 && (
          <TransferList
            title="Seleção de Cabeceiros (Headers)"
            role="cabeceiro"
            availableItems={availableCabeceiros}
            selectedItems={selectedCabeceiros}
            onSelect={handleSelectCabeceiro}
            onDeselect={handleDeselectCabeceiro}
            onSelectAll={handleSelectAllCabeceiros}
            onClearAll={handleClearAllCabeceiros}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            nextButtonLabel="Avançar para Configuração"
            onOpenAddModal={() => setIsModalOpen(true)}
          />
        )}

        {/* Step 3: Configuração do Sorteio (Baterias A, B, C...) */}
        {currentStep === 3 && (
          <DrawConfiguration
            config={drawConfig}
            onChangeConfig={setDrawConfig}
            pezeiros={selectedPezeiros}
            cabeceiros={selectedCabeceiros}
            onGenerateDraw={handleGenerateDraw}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {/* Step 4: Ordem de Corrida Final com Entrada de Tempos dos Bois */}
        {currentStep === 4 && (
          <RunsTable
            runs={drawResults}
            config={drawConfig}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onReDraw={handleGenerateDraw}
            onBackToConfig={() => setCurrentStep(3)}
            onUpdateTime={handleUpdateTime}
            onFillSampleTimes={handleFillSampleTimes}
            onClearAllTimes={handleClearAllTimes}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 no-print">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          <p>
            Sistema de Sorteios e Gestão de Provas de Laço em Dupla • Desenvolvido com React, TypeScript
            & Tailwind CSS
          </p>
        </div>
      </footer>

      {/* Modal para Adicionar Novo Competidor */}
      <NewCompetitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddNewCompetitor}
      />
    </div>
  );
};

export default App;
