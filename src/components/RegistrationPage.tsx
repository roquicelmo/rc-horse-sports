import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, MapPin, Plus, Trash2, UserRound } from 'lucide-react';
import type { Competitor } from '../types/roping';
import type { EventSummary } from '../types/events';

type RegistrationRole = 'CABECEIRO' | 'PEZEIRO';

interface RegistrationPageProps {
  event: EventSummary;
  athletes: Competitor[];
  onBack: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ event, athletes, onBack }) => {
  const [role, setRole] = useState<RegistrationRole>('CABECEIRO');
  const [athleteId, setAthleteId] = useState('');
  const [headIds, setHeadIds] = useState(() => athletes.slice(0, 18).map((athlete) => athlete.id));
  const [heelIds, setHeelIds] = useState(() => athletes.slice(18, 32).map((athlete) => athlete.id));
  const [registrationIds, setRegistrationIds] = useState<Record<string, string>>({});
  const [persistence, setPersistence] = useState<'loading' | 'connected' | 'local'>('loading');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    const loadRegistrations = async () => {
      try {
        const response = await fetch(`/api/events/${event.id}/registrations`);
        if (!response.headers.get('content-type')?.includes('application/json')) {
          if (active) {
            setPersistence('local');
            setFeedback('Modo local: a API ainda não está disponível neste ambiente.');
          }
          return;
        }
        if (!response.ok) {
          if (response.status === 401 || response.status === 404 || response.status === 503) {
            if (active) {
              setPersistence('local');
              setFeedback('Modo local: conecte sua conta e o banco de dados para persistir as alterações.');
            }
            return;
          }
          throw new Error('Não foi possível carregar as inscrições.');
        }
        const registrations = await response.json() as Array<{ id: string; athleteId: string; category: RegistrationRole }>;
        if (!active) return;
        setHeadIds(registrations.filter((registration) => registration.category === 'CABECEIRO').map((registration) => registration.athleteId));
        setHeelIds(registrations.filter((registration) => registration.category === 'PEZEIRO').map((registration) => registration.athleteId));
        setRegistrationIds(Object.fromEntries(registrations.map((registration) => [registration.athleteId, registration.id])));
        setPersistence('connected');
        setFeedback('');
      } catch (error) {
        if (active) {
          setPersistence('local');
          setFeedback(error instanceof Error ? `${error.message} As alterações permanecerão locais.` : 'Não foi possível carregar as inscrições. As alterações permanecerão locais.');
        }
      }
    };
    void loadRegistrations();
    return () => {
      active = false;
    };
  }, [event.id]);

  const enrolledIds = useMemo(() => new Set([...headIds, ...heelIds]), [headIds, heelIds]);
  const availableAthletes = athletes.filter((athlete) => !enrolledIds.has(athlete.id));
  const headAthletes = headIds.map((id) => athletes.find((athlete) => athlete.id === id)).filter(Boolean) as Competitor[];
  const heelAthletes = heelIds.map((id) => athletes.find((athlete) => athlete.id === id)).filter(Boolean) as Competitor[];

  const handleAdd = async () => {
    if (!athleteId) return;
    setFeedback('');
    if (persistence === 'connected') {
      const response = await fetch(`/api/events/${event.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, category: role }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        setFeedback(body?.message ?? 'Não foi possível adicionar a inscrição.');
        return;
      }
      const registration = await response.json() as { id: string };
      setRegistrationIds((current) => ({ ...current, [athleteId]: registration.id }));
    }
    if (role === 'CABECEIRO') setHeadIds((current) => [...current, athleteId]);
    else setHeelIds((current) => [...current, athleteId]);
    setAthleteId('');
  };

  const removeAthlete = async (athlete: Competitor, athleteRole: RegistrationRole) => {
    setFeedback('');
    if (persistence === 'connected') {
      const registrationId = registrationIds[athlete.id];
      if (!registrationId) {
        setFeedback('Não foi possível identificar a inscrição para remoção.');
        return;
      }
      const response = await fetch(`/api/events/${event.id}/registrations/${registrationId}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        setFeedback(body?.message ?? 'Não foi possível remover a inscrição.');
        return;
      }
      setRegistrationIds((current) => {
        const next = { ...current };
        delete next[athlete.id];
        return next;
      });
    }
    if (athleteRole === 'CABECEIRO') setHeadIds((current) => current.filter((id) => id !== athlete.id));
    else setHeelIds((current) => current.filter((id) => id !== athlete.id));
  };

  const renderList = (items: Competitor[], listRole: RegistrationRole) => (
    <div className="space-y-2">
      {items.map((athlete, index) => (
        <div key={athlete.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef1f4] bg-white px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eef3f6] text-xs font-bold text-[#526276]">{index + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#2f3b4f]">{athlete.nome}</p>
              <p className="truncate text-xs text-[#6b788b]">{athlete.cidade ?? 'Cidade não informada'}</p>
            </div>
          </div>
          <button type="button" onClick={() => removeAthlete(athlete, listRole)} aria-label={`Remover ${athlete.nome}`} className="rounded-lg p-2 text-[#9aa8b7] transition hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <section className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-[#6b788b] transition hover:bg-[#eef3f6] hover:text-[#172036]">
        <ArrowLeft className="h-4 w-4" /> Voltar para detalhes
      </button>

      <div className="rounded-2xl border border-[#dfe6ed] bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Inscrições</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">{event.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-[#6b788b]"><MapPin className="h-4 w-4" />{event.arena} · {event.date}</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6ed] px-4 py-2.5 text-sm font-bold text-[#2f3b4f] transition hover:bg-[#eef3f6]">
            <ClipboardList className="h-4 w-4" /> Lista de inscritos
          </button>
        </div>

        {feedback && (
          <div className="mt-4 rounded-xl border border-[#f1d8a8] bg-[#fff8e9] px-4 py-3 text-sm font-semibold text-[#8b5a00]" role="status">
            {feedback}
          </div>
        )}

        <div className="mt-7 rounded-2xl bg-[#f6f8fa] p-4">
          <h3 className="text-base font-extrabold text-[#172036]">Inscrever atleta na prova</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#526276]">Selecione o atleta</span>
              <select value={athleteId} onChange={(event) => setAthleteId(event.target.value)} className="w-full rounded-xl border border-[#dfe6ed] bg-white px-3 py-3 text-sm text-[#172036] outline-none focus:border-[#218f83]">
                <option value="">-- Selecione o atleta --</option>
                {availableAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.nome}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#526276]">Categoria / função</span>
              <select value={role} onChange={(event) => setRole(event.target.value as RegistrationRole)} className="w-full rounded-xl border border-[#dfe6ed] bg-white px-3 py-3 text-sm text-[#172036] outline-none focus:border-[#218f83]">
                <option value="CABECEIRO">Cabeceiro</option>
                <option value="PEZEIRO">Pezeiro</option>
              </select>
            </label>
            <button type="button" disabled={!athleteId || persistence === 'loading'} onClick={() => void handleAdd()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#218f83] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#176f67] disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#dfe6ed] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-[#172036]"><UserRound className="h-5 w-5 text-[#218f83]" /> Cabeceiros inscritos</h3>
            <span className="rounded-full bg-[#e5f5f2] px-3 py-1 text-xs font-extrabold text-[#176f67]">{headAthletes.length}</span>
          </div>
          {renderList(headAthletes, 'CABECEIRO')}
        </section>
        <section className="rounded-2xl border border-[#dfe6ed] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-[#172036]"><UserRound className="h-5 w-5 text-[#e87900]" /> Pezeiros inscritos</h3>
            <span className="rounded-full bg-[#fff1df] px-3 py-1 text-xs font-extrabold text-[#bd5f00]">{heelAthletes.length}</span>
          </div>
          {renderList(heelAthletes, 'PEZEIRO')}
        </section>
      </div>
    </section>
  );
};
