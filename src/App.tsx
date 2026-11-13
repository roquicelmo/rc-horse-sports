'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type {
  Competitor,
  DrawConfig,
  Run,
  WizardStep,
} from './types/roping';
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
import type { EventSummary } from './types/events';
import { EventDetailsPage } from './components/EventDetailsPage';
import { RegistrationPage } from './components/RegistrationPage';
import { AnnouncerPage } from './components/AnnouncerPage';
import { ResultsPage } from './components/ResultsPage';
import { AgendaPage } from './components/AgendaPage';
import { ReportsPage } from './components/ReportsPage';
import { UsersPage } from './components/UsersPage';
import type { ArenaOption, EventFormInput } from './components/EventsPage';
import { authClient, type AuthSession } from './auth/session';
import { Menu, Trophy } from 'lucide-react';

interface PersistedAthlete {
  id: string;
  registrationNo: string | null;
  name: string;
  city: string | null;
  headHandicap: number | string;
  heelHandicap: number | string;
  ownerId?: string | null;
  owner?: { name: string | null };
}

interface PersistedRun {
  id: string;
  runNumber: number;
  phase: number;
  round: number;
  battery: number;
  headGroup: string | null;
  heelGroup: string | null;
  combinedHandicap: number | string;
  numberOfBulls: number;
  totalTime: number | string | null;
  averageTime: number | string | null;
  isNt: boolean;
  headAthlete: PersistedAthlete;
  heelAthlete: PersistedAthlete;
  times: Array<{ bullNumber: number; timeSeconds: number | string | null; isNt: boolean }>;
}

const persistedAthleteToCompetitor = (athlete: PersistedAthlete, role: 'head' | 'heel'): Competitor => {
  const headHandicap = Number(athlete.headHandicap);
  const heelHandicap = Number(athlete.heelHandicap);
  return {
    id: athlete.id,
    registrationNo: athlete.registrationNo ?? undefined,
    nome: athlete.name,
    cidade: athlete.city ?? undefined,
    handicap: role === 'head' ? headHandicap : heelHandicap,
    headHandicap,
    heelHandicap,
  };
};

const mapPersistedRuns = (runs: PersistedRun[]): Run[] => runs.map((run) => {
  const headGroup = run.headGroup ?? '?';
  const heelGroup = run.heelGroup ?? '?';
  const persistedTimes = new Map(run.times.map((time) => [time.bullNumber, time]));
  const boiTime = (bullNumber: number) => persistedTimes.get(bullNumber);
  const first = boiTime(1);
  const second = boiTime(2);
  const third = boiTime(3);
  return {
    id: run.id,
    numero: run.runNumber,
    fase: run.phase,
    faseLabel: `Fase ${run.phase}: Cabeceiros ${headGroup} × Pezeiros ${heelGroup}`,
    bateria: run.battery,
    bateriaLabel: `Bateria ${run.battery}`,
    cruzamento: `${headGroup} × ${heelGroup}`,
    rodada: run.round,
    cabeceiro: persistedAthleteToCompetitor(run.headAthlete, 'head'),
    pezeiro: persistedAthleteToCompetitor(run.heelAthlete, 'heel'),
    cabeceiroGrupo: headGroup,
    pezeiroGrupo: heelGroup,
    shc: Number(run.combinedHandicap),
    bois: Math.min(3, Math.max(1, run.numberOfBulls)) as 1 | 2 | 3,
    times: {
      boi1: first?.timeSeconds === null || first?.timeSeconds === undefined ? '' : String(first.timeSeconds),
      boi2: second?.timeSeconds === null || second?.timeSeconds === undefined ? '' : String(second.timeSeconds),
      boi3: third?.timeSeconds === null || third?.timeSeconds === undefined ? '' : String(third.timeSeconds),
      boi1Nt: first?.isNt ?? false,
      boi2Nt: second?.isNt ?? false,
      boi3Nt: third?.isNt ?? false,
    },
    totalTime: run.totalTime === null ? null : Number(run.totalTime),
    mediaFinal: run.averageTime === null ? null : Number(run.averageTime),
    isNt: run.isNt,
  };
});

export const App: React.FC = () => {
  const [authSession, setAuthSession] = useState<AuthSession | null | undefined>(undefined);
  // 1. Wizard Current Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [showDashboard, setShowDashboard] = useState(true);
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<EventSummary | null>(null);
  const [drawEvent, setDrawEvent] = useState<EventSummary | null>(null);
  const [announcerEvent, setAnnouncerEvent] = useState<EventSummary | null>(null);
  const [resultsEvent, setResultsEvent] = useState<EventSummary | null>(null);
  const [resultsPublished, setResultsPublished] = useState(false);

  useEffect(() => {
    void authClient.getSession()
      .then((session) => setAuthSession(session))
      .catch(() => setAuthSession(null));
  }, []);

  const [drawError, setDrawError] = useState<string | null>(null);

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [arenas, setArenas] = useState<ArenaOption[]>([]);
  const [managedUsers, setManagedUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);

  useEffect(() => {
    if (!authSession || !['ADMIN', 'MANAGER', 'ORGANIZER'].includes(authSession.user.role)) return;
    void fetch('/api/users')
      .then(async (response) => response.ok ? response.json() as Promise<Array<{ id: string; name: string | null; email: string }>> : [])
      .then(setManagedUsers)
      .catch(() => setManagedUsers([]));
  }, [authSession]);

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
          ownerId?: string | null;
          owner?: { name: string | null };
        }>;
        setCompetitors(athletes.map((athlete) => ({
          id: athlete.id,
          registrationNo: athlete.registrationNo ?? undefined,
          nome: athlete.name,
          cidade: athlete.city ?? undefined,
          handicap: Number(athlete.headHandicap),
          headHandicap: Number(athlete.headHandicap),
          heelHandicap: Number(athlete.heelHandicap),
          ownerId: athlete.ownerId ?? undefined,
          ownerName: athlete.owner?.name ?? undefined,
        })));
      }

      if (eventsResponse.ok && eventsResponse.headers.get('content-type')?.includes('application/json')) {
        const apiEvents = await eventsResponse.json() as Array<{
          id: string;
          name: string;
          eventDate: string;
          status: 'DRAFT' | 'OPEN' | 'DRAWN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
          arena: { name: string; city: string; state: string };
          createdBy: { id: string; name: string | null; email: string };
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
          ownerId: event.createdBy.id,
          ownerName: event.createdBy.name ?? event.createdBy.email,
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
  const handleGenerateDraw = async () => {
    if (drawEvent?.id && !drawEvent.id.startsWith('local-')) {
      const response = await fetch(`/api/events/${drawEvent.id}/draws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawConfig),
      });
      const isJson = response.headers.get('content-type')?.includes('application/json');
      if (response.ok && isJson) {
        const persisted = await response.json() as { runs: PersistedRun[] };
        setDrawResults(mapPersistedRuns(persisted.runs));
        setDrawError(null);
        setSearchTerm('');
        setCurrentStep(4);
        return;
      }
      if (isJson) {
        const body = await response.json() as { message?: string };
        setDrawError(body.message ?? 'Não foi possível persistir o sorteio.');
        return;
      }
    }

    const { runs } = executeGroupCrossDraw(selectedCabeceiros, selectedPezeiros, drawConfig);
    setDrawResults(runs);
    setDrawError(null);
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

  const handleOpenDraw = async (event: EventSummary) => {
    setAnnouncerEvent(null);
    setDrawEvent(event);
    setSelectedEvent(null);
    setRegistrationEvent(null);
    setDrawError(null);
    setActiveSection('draw');
    setShowDashboard(false);

    if (event.id.startsWith('local-')) {
      setSelectedCabeceiros([]);
      setSelectedPezeiros([]);
      setDrawResults([]);
      setCurrentStep(1);
      return;
    }

    const [registrationsResponse, drawsResponse] = await Promise.all([
      fetch(`/api/events/${event.id}/registrations`),
      fetch(`/api/events/${event.id}/draws`),
    ]);
    const isRegistrationJson = registrationsResponse.headers.get('content-type')?.includes('application/json');
    if (!registrationsResponse.ok || !isRegistrationJson) {
      setDrawError('Não foi possível carregar as inscrições desta prova.');
      return;
    }

    const athleteById = new Map(competitors.map((competitor) => [competitor.id, competitor]));
    const registrations = await registrationsResponse.json() as Array<{ category: 'CABECEIRO' | 'PEZEIRO'; athlete: { id: string } }>;
    setSelectedCabeceiros(registrations.filter((item) => item.category === 'CABECEIRO').map((item) => athleteById.get(item.athlete.id)).filter((item): item is Competitor => Boolean(item)));
    setSelectedPezeiros(registrations.filter((item) => item.category === 'PEZEIRO').map((item) => athleteById.get(item.athlete.id)).filter((item): item is Competitor => Boolean(item)));

    if (drawsResponse.ok && drawsResponse.headers.get('content-type')?.includes('application/json')) {
      const draws = await drawsResponse.json() as Array<{ configuration: DrawConfig; runs: PersistedRun[] }>;
      const latest = draws[0];
      if (latest) {
        setDrawConfig(latest.configuration);
        setDrawResults(mapPersistedRuns(latest.runs));
        setCurrentStep(4);
        return;
      }
    }
    setDrawResults([]);
    setCurrentStep(3);
  };

  const handleOpenAnnouncer = async (event: EventSummary) => {
    setDrawError(null);
    if (event.id.startsWith('local-')) {
      setDrawError('A tela do locutor precisa de um sorteio persistido.');
      return;
    }
    const response = await fetch(`/api/events/${event.id}/draws`);
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      setDrawError('Não foi possível carregar o sorteio desta prova.');
      return;
    }
    const draws = await response.json() as Array<{ runs: PersistedRun[] }>;
    if (!draws[0]?.runs.length) {
      setDrawError('Gere o sorteio antes de abrir a tela do locutor.');
      return;
    }
    setDrawResults(mapPersistedRuns(draws[0].runs));
    setDrawEvent(event);
    setAnnouncerEvent(event);
    setSelectedEvent(null);
    setActiveSection('events');
    setShowDashboard(false);
  };

  const handleOpenResults = async (event: EventSummary) => {
    setDrawError(null);
    if (event.id.startsWith('local-')) {
      setDrawError('O resultado final precisa de um sorteio persistido.');
      return;
    }
    const response = await fetch(`/api/events/${event.id}/draws`);
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      setDrawError('Não foi possível carregar o resultado desta prova.');
      return;
    }
    const draws = await response.json() as Array<{ status: string; runs: PersistedRun[] }>;
    if (!draws[0]?.runs.length) {
      setDrawError('Ainda não há corridas geradas para esta prova.');
      return;
    }
    setDrawResults(mapPersistedRuns(draws[0].runs));
    setResultsPublished(draws[0].status === 'PUBLISHED');
    setResultsEvent(event);
    setSelectedEvent(null);
    setActiveSection('events');
    setShowDashboard(false);
  };

  const handlePublishResults = async () => {
    if (!resultsEvent) return;
    const response = await fetch(`/api/events/${resultsEvent.id}/results/publish`, { method: 'POST' });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!response.ok) {
      const body = isJson ? await response.json() as { message?: string } : null;
      setDrawError(body?.message ?? 'Não foi possível publicar os resultados.');
      return;
    }
    setResultsPublished(true);
    setEvents((current) => current.map((event) => event.id === resultsEvent.id ? { ...event, status: 'FINALIZADA' } : event));
    setDrawError(null);
  };

  // Atualização em tempo real do tempo de uma corrida por Boi (1, 2 ou 3)
  const handleUpdateTime = async (runId: string, boi: 1 | 2 | 3, value: string, isNt?: boolean) => {
    const currentRun = drawResults.find((run) => run.id === runId);
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
    if (drawEvent?.id && !drawEvent.id.startsWith('local-') && currentRun) {
      const response = await fetch(`/api/runs/${runId}/times`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullNumber: boi,
          timeSeconds: value.trim() === '' ? null : Number(value),
          isNt: isNt ?? Boolean(boi === 1 ? currentRun.times.boi1Nt : boi === 2 ? currentRun.times.boi2Nt : currentRun.times.boi3Nt),
        }),
      });
      if (!response.ok) {
        setDrawError('O tempo foi alterado localmente, mas não pôde ser salvo no banco.');
      } else {
        setDrawError(null);
      }
    }
  };

  // Limpar todos os tempos
  const handleClearAllTimes = async () => {
    const persistentRunIds = drawEvent?.id && !drawEvent.id.startsWith('local-')
      ? drawResults.map((run) => run.id)
      : [];
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
    await Promise.all(persistentRunIds.flatMap((runId) =>
      [1, 2, 3].map((bullNumber) => fetch(`/api/runs/${runId}/times`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullNumber, timeSeconds: null, isNt: false }),
      }))
    ));
  };

  // Reseta ou adiciona novo competidor
  const handleAddNewCompetitor = async (newComp: Competitor) => {
    const response = await fetch('/api/athletes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newComp.nome,
        city: newComp.cidade,
        headHandicap: newComp.headHandicap ?? newComp.handicap,
        heelHandicap: newComp.heelHandicap ?? newComp.handicap,
        ownerId: newComp.ownerId,
      }),
    });
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const athlete = await response.json() as { id: string; registrationNo?: string | null; name: string; city?: string | null; headHandicap: number | string; heelHandicap: number | string; ownerId?: string | null; owner?: { name: string | null } };
      setCompetitors((prev) => [{
        id: athlete.id,
        registrationNo: athlete.registrationNo ?? undefined,
        nome: athlete.name,
        cidade: athlete.city ?? undefined,
        handicap: Number(athlete.headHandicap),
        headHandicap: Number(athlete.headHandicap),
        heelHandicap: Number(athlete.heelHandicap),
        ownerId: athlete.ownerId ?? undefined,
        ownerName: athlete.owner?.name ?? undefined,
      }, ...prev]);
      return;
    }
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
      const event = await response.json() as { id: string; name: string; eventDate: string; status: 'DRAFT'; arena: { id: string; name: string; city: string; state: string }; createdBy: { id: string; name: string | null; email: string }; _count: { registrations: number; draws: number } };
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
        ownerId: event.createdBy.id,
        ownerName: event.createdBy.name ?? event.createdBy.email,
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
    setAnnouncerEvent(null);
    setResultsEvent(null);
    setShowDashboard(section === 'dashboard');
  };

  const handleLogout = async () => {
    await authClient.logout();
    setAuthSession(null);
  };

  return (
    authSession === undefined ? (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fa] text-sm font-semibold text-[#6b788b]">Carregando sessão...</div>
    ) : !authSession ? (
      <LoginPage
        onAuthenticated={() => {
          void authClient.getSession().then((session) => {
            setAuthSession(session);
          });
        }}
      />
    ) : (
    <div className="flex min-h-screen bg-[#f6f8fa] text-[#2f3b4f]">
      <Sidebar
        activeSection={activeSection}
        isOpen={isSidebarOpen}
        onNavigate={handleNavigate}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={() => void handleLogout()}
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
              <button type="button" onClick={() => void handleLogout()} className="ml-3 rounded-lg px-2.5 py-1.5 font-bold text-[#dce5ef] transition hover:bg-[#24304b] hover:text-white">
                Sair
              </button>
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
            events={events}
            owners={managedUsers}
            canFilterOwners={['ADMIN', 'MANAGER', 'ORGANIZER'].includes(authSession.user.role)}
            onStartDraw={() => setShowDashboard(false)}
          />
        ) : activeSection === 'events' ? (
          resultsEvent ? (
            <ResultsPage
              event={resultsEvent}
              runs={drawResults}
              published={resultsPublished}
              onBack={() => { setResultsEvent(null); setSelectedEvent(resultsEvent); }}
              onPublish={() => void handlePublishResults()}
            />
          ) : announcerEvent ? (
            <AnnouncerPage
              event={announcerEvent}
              runs={drawResults}
              onBack={() => { setAnnouncerEvent(null); setSelectedEvent(announcerEvent); }}
              onOpenRun={() => { setAnnouncerEvent(null); setCurrentStep(4); setActiveSection('draw'); setDrawEvent(announcerEvent); }}
            />
          ) : registrationEvent ? (
            <RegistrationPage event={registrationEvent} athletes={competitors} onBack={() => setRegistrationEvent(null)} />
          ) : selectedEvent ? (
            <EventDetailsPage
              event={selectedEvent}
              onBack={() => setSelectedEvent(null)}
              onOpenRegistrations={() => setRegistrationEvent(selectedEvent)}
              onOpenDraw={() => void handleOpenDraw(selectedEvent)}
              onOpenAnnouncer={() => void handleOpenAnnouncer(selectedEvent)}
              onOpenResults={() => void handleOpenResults(selectedEvent)}
            />
          ) : (
            <EventsPage events={events} arenas={arenas} owners={managedUsers} defaultOwnerId={authSession.user.id} canFilterOwners={['ADMIN', 'MANAGER', 'ORGANIZER'].includes(authSession.user.role)} onOpenEvent={setSelectedEvent} onCreate={handleCreateEvent} onUpdate={handleUpdateEvent} onDelete={handleDeleteEvent} />
          )
        ) : activeSection === 'athletes' ? (
          <AthletesPage
            athletes={competitors}
            owners={managedUsers}
            canFilterOwners={['ADMIN', 'MANAGER', 'ORGANIZER'].includes(authSession.user.role)}
            onAdd={() => setIsModalOpen(true)}
            onRemove={handleRemoveCompetitor}
          />
        ) : activeSection === 'agenda' ? (
          <AgendaPage events={events} owners={managedUsers} canFilterOwners={['ADMIN', 'MANAGER', 'ORGANIZER'].includes(authSession.user.role)} />
        ) : activeSection === 'reports' ? (
          <ReportsPage owners={managedUsers} canFilterOwners={['ADMIN', 'MANAGER', 'ORGANIZER'].includes(authSession.user.role)} />
        ) : activeSection === 'users' && (authSession.user.role === 'ADMIN' || authSession.user.role === 'MANAGER' || authSession.user.role === 'ORGANIZER') ? (
            <UsersPage role={authSession.user.role} />
        ) : activeSection !== 'draw' && activeSection !== 'dashboard' ? (
          <SectionPlaceholder
            section={activeSection}
            onStartDraw={handleStartNewDraw}
          />
        ) : (
          <>
            {drawError && (
              <div role="alert" className="mb-5 rounded-xl border border-[#f2c7c2] bg-[#fff4f2] px-4 py-3 text-sm font-semibold text-[#a33d32]">
                {drawError}
              </div>
            )}
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
          owners={managedUsers}
          defaultOwnerId={authSession?.user.id}
          canAssignOwner={['ADMIN', 'MANAGER', 'ORGANIZER'].includes(authSession?.user.role ?? '')}
        />
      </div>
    </div>
    )
  );
};

export default App;
