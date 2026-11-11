import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type {
  Competitor,
  DrawConfig,
  Run,
  WizardStep,
} from './types/roping';
import { INITIAL_COMPETITORS } from './data/referenceAthletes';
import { executeGroupCrossDraw, calculateRunTotal } from './utils/drawAlgorithm';
import { Dashboard } from './components/Dashboard';
import { SectionPlaceholder } from './components/SectionPlaceholder';
import { Sidebar, type AppSection } from './components/Sidebar';
import { WizardHeader } from './components/WizardHeader';
import { TransferList } from './components/TransferList';
import { DrawConfiguration } from './components/DrawConfiguration';
import { RunsTable } from './components/RunsTable';
import { NewCompetitorModal } from './components/NewCompetitorModal';
import { LoginPage } from './components/LoginPage';
import { AthletesPage } from './components/AthletesPage';
import { EventsPage } from './components/EventsPage';
import { REFERENCE_EVENTS } from './data/referenceEvents';
import type { EventSummary } from './types/events';
import { EventDetailsPage } from './components/EventDetailsPage';
import { RegistrationPage } from './components/RegistrationPage';
import type { ArenaOption, EventFormInput } from './components/EventsPage';
import { Menu, Trophy } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Wizard Current Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [showDashboard, setShowDashboard] = useState(true);
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<EventSummary | null>(null);

  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [events, setEvents] = useState<EventSummary[]>(REFERENCE_EVENTS);
  const [arenas, setArenas] = useState<ArenaOption[]>([]);

  useEffect(() => {
    let active = true;
    const loadApiData = async () => {
      const [athletesResponse, eventsResponse, arenasResponse] = await Promise.all([
        fetch('/api/athletes'),
        fetch('/api/events'),
        fetch('/api/arenas'),
      ]);

      if (!active) return;

      if (athletesResponse.ok && athletesResponse.headers.get('content-type')?.includes('application/json')) {
        const athletes = await athletesResponse.json() as Array<{
          id: string;
          registrationNo: string | null;
          name: string;
          city: string | null;
          headHandicap: number | string;
          heelHandicap: number | string;
        }>;
        setCompetitors(athletes.map((athlete) => ({
          id: athlete.id,
          registrationNo: athlete.registrationNo ?? undefined,
          nome: athlete.name,
          cidade: athlete.city ?? undefined,
          handicap: Number(athlete.headHandicap),
          headHandicap: Number(athlete.headHandicap),
          heelHandicap: Number(athlete.heelHandicap),
        })));
      }

      if (eventsResponse.ok && eventsResponse.headers.get('content-type')?.includes('application/json')) {
        const apiEvents = await eventsResponse.json() as Array<{
          id: string;
          name: string;
          eventDate: string;
          status: 'DRAFT' | 'OPEN' | 'DRAWN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
          arena: { name: string; city: string; state: string };
          createdBy: { name: string | null };
          _count: { registrations: number; draws: number };
        }>;
        const statusLabels: Record<typeof apiEvents[number]['status'], EventSummary['status']> = {
          DRAFT: 'ABERTA',
          OPEN: 'ABERTA',
          DRAWN: 'SORTEADA',
          IN_PROGRESS: 'EM ANDAMENTO',
          FINISHED: 'FINALIZADA',
          CANCELLED: 'CANCELADA',
        };
        setEvents(apiEvents.map((event) => ({
          id: event.id,
          name: event.name,
          date: new Intl.DateTimeFormat('pt-BR').format(new Date(event.eventDate)),
          format: 'Todos x Todos',
          arena: event.arena.name,
          status: statusLabels[event.status],
          registeredAthletes: event._count.registrations,
          runs: event._count.draws,
          steward: event.createdBy.name ?? undefined,
        })));
      }

      if (arenasResponse.ok && arenasResponse.headers.get('content-type')?.includes('application/json')) {
        const apiArenas = await arenasResponse.json() as ArenaOption[];
        setArenas(apiArenas);
      }
    };

    void loadApiData();
    return () => {
      active = false;
    };
  }, []);

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

  const handleRemoveCompetitor = (competitor: Competitor) => {
    setCompetitors((prev) => prev.filter((item) => item.id !== competitor.id));
    setSelectedCabeceiros((prev) => prev.filter((item) => item.id !== competitor.id));
    setSelectedPezeiros((prev) => prev.filter((item) => item.id !== competitor.id));
  };

  const formatEventDate = (value: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));

  const handleCreateEvent = async (input: EventFormInput) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, eventDate: new Date(`${input.eventDate}T12:00:00`).toISOString() }),
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (response.ok && isJson) {
      const event = await response.json() as { id: string; name: string; eventDate: string; status: 'DRAFT'; arena: { id: string; name: string; city: string; state: string }; createdBy: { name: string | null }; _count: { registrations: number; draws: number } };
      setArenas((current) => current.some((arena) => arena.id === event.arena.id) ? current : [...current, event.arena]);
      setEvents((current) => [{
        id: event.id,
        name: event.name,
        date: formatEventDate(event.eventDate),
        format: 'Todos x Todos',
        arena: event.arena.name,
        status: 'ABERTA',
        registeredAthletes: event._count.registrations,
        runs: event._count.draws,
        steward: event.createdBy.name ?? undefined,
      }, ...current]);
      return;
    }
    if (response.status !== 401 && response.status !== 404 && isJson) {
      const body = await response.json() as { message?: string };
      throw new Error(body.message ?? 'Não foi possível criar a prova.');
    }
    setEvents((current) => [{
      id: `local-${Date.now()}`,
      name: input.name,
      date: formatEventDate(input.eventDate),
      format: 'Todos x Todos',
      arena: input.arenaName,
      status: 'ABERTA',
      registeredAthletes: 0,
      runs: 0,
      steward: 'Henrique Lagoa',
    }, ...current]);
    if (!input.arenaId) {
      setArenas((current) => [...current, { id: `local-arena-${Date.now()}`, name: input.arenaName, city: input.city, state: input.state }]);
    }
  };

  const handleUpdateEvent = async (eventId: string, input: Pick<EventFormInput, 'name' | 'eventDate'>) => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, eventDate: new Date(`${input.eventDate}T12:00:00`).toISOString() }),
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!response.ok && response.status !== 401 && response.status !== 404) {
      const body = isJson ? await response.json() as { message?: string } : null;
      throw new Error(body?.message ?? 'Não foi possível atualizar a prova.');
    }
    setEvents((current) => current.map((event) => event.id === eventId ? { ...event, name: input.name, date: formatEventDate(input.eventDate) } : event));
  };

  const handleDeleteEvent = async (event: EventSummary) => {
    if (!window.confirm(`Cancelar a prova "${event.name}"?`)) return;
    const response = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!response.ok && response.status !== 401 && response.status !== 404) {
      const body = isJson ? await response.json() as { message?: string } : null;
      throw new Error(body?.message ?? 'Não foi possível cancelar a prova.');
    }
    setEvents((current) => current.map((item) => item.id === event.id ? { ...item, status: 'CANCELADA' } : item));
  };

  const handleStartNewDraw = () => {
    setSelectedCabeceiros([]);
    setSelectedPezeiros([]);
    setDrawResults([]);
    setSearchTerm('');
    setCurrentStep(1);
    setShowDashboard(false);
    setActiveSection('draw');
  };

  const handleNavigate = (section: AppSection) => {
    if (section === 'draw') {
      handleStartNewDraw();
      return;
    }

    setActiveSection(section);
    setSelectedEvent(null);
    setRegistrationEvent(null);
    setShowDashboard(section === 'dashboard');
  };

  return (
    isLoginOpen ? (
      <LoginPage
        onCancel={() => setIsLoginOpen(false)}
        onAuthenticated={() => setIsLoginOpen(false)}
      />
    ) : (
    <div className="flex min-h-screen bg-[#f6f8fa] text-[#2f3b4f]">
      <Sidebar
        activeSection={activeSection}
        isOpen={isSidebarOpen}
        onNavigate={handleNavigate}
        onClose={() => setIsSidebarOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#1e2942] bg-[#111a31] no-print">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menu"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl p-2 text-[#c8d2df] transition hover:bg-[#24304b] hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#e87900] text-[#111a31] shadow-sm sm:flex">
                <Trophy className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold tracking-tight text-[#ffffff]">
                  {showDashboard ? 'Painel geral' : activeSection === 'draw' ? 'Novo sorteio' : 'Gestão de provas'}
                </h1>
                <p className="truncate text-xs text-[#b8c2d0]">
                  Team Roping Pro • Henrique Lagoa
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-xs md:flex">
              <span className="text-[#b8c2d0]">Atletas cadastrados</span>
              <span className="rounded-lg bg-[#d8f2ed] px-2.5 py-1 font-mono font-bold text-[#176f67]">
                {competitors.length}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1720px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {showDashboard ? (
          <Dashboard
            athleteCount={competitors.length}
            selectedPezeiros={selectedPezeiros.length}
            selectedCabeceiros={selectedCabeceiros.length}
            runs={drawResults}
            onStartDraw={() => setShowDashboard(false)}
          />
        ) : activeSection === 'events' ? (
          registrationEvent ? (
            <RegistrationPage event={registrationEvent} athletes={competitors} onBack={() => setRegistrationEvent(null)} />
          ) : selectedEvent ? (
            <EventDetailsPage
              event={selectedEvent}
              onBack={() => setSelectedEvent(null)}
              onOpenRegistrations={() => setRegistrationEvent(selectedEvent)}
            />
          ) : (
            <EventsPage events={events} arenas={arenas} onOpenEvent={setSelectedEvent} onCreate={handleCreateEvent} onUpdate={handleUpdateEvent} onDelete={handleDeleteEvent} />
          )
        ) : activeSection === 'athletes' ? (
          <AthletesPage
            athletes={competitors}
            onAdd={() => setIsModalOpen(true)}
            onRemove={handleRemoveCompetitor}
          />
        ) : activeSection !== 'draw' && activeSection !== 'dashboard' ? (
          <SectionPlaceholder
            section={activeSection}
            onStartDraw={handleStartNewDraw}
          />
        ) : (
          <>
            <div className="no-print">
              <WizardHeader
                currentStep={currentStep}
                onStepClick={(step) => setCurrentStep(step)}
                pezeirosCount={selectedPezeiros.length}
                cabeceirosCount={selectedCabeceiros.length}
                hasDrawResults={drawResults.length > 0}
              />
            </div>

            {currentStep === 1 && (
              <TransferList
                title="Seleção de Pezeiros"
                role="pezeiro"
                availableItems={availablePezeiros}
                selectedItems={selectedPezeiros}
                onSelect={handleSelectPezeiro}
                onDeselect={handleDeselectPezeiro}
                onSelectAll={handleSelectAllPezeiros}
                onClearAll={handleClearAllPezeiros}
                onNext={() => setCurrentStep(2)}
                nextButtonLabel="Avançar para cabeceiros"
                onOpenAddModal={() => setIsModalOpen(true)}
              />
            )}

            {currentStep === 2 && (
              <TransferList
                title="Seleção de Cabeceiros"
                role="cabeceiro"
                availableItems={availableCabeceiros}
                selectedItems={selectedCabeceiros}
                onSelect={handleSelectCabeceiro}
                onDeselect={handleDeselectCabeceiro}
                onSelectAll={handleSelectAllCabeceiros}
                onClearAll={handleClearAllCabeceiros}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
                nextButtonLabel="Avançar para configuração"
                onOpenAddModal={() => setIsModalOpen(true)}
              />
            )}

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

            {currentStep === 4 && (
              <RunsTable
                runs={drawResults}
                config={drawConfig}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onReDraw={handleGenerateDraw}
                onBackToConfig={() => setCurrentStep(3)}
                onUpdateTime={handleUpdateTime}
                onClearAllTimes={handleClearAllTimes}
              />
            )}
          </>
        )}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 no-print">
          <p>Sistema de gestão de provas de laço em dupla • Henrique Lagoa</p>
        </footer>

        <NewCompetitorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddNewCompetitor}
        />
      </div>
    </div>
    )
  );
};

export default App;
