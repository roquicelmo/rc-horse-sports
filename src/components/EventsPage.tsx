import React, { useState } from 'react';
import { CalendarDays, ClipboardList, Info, MapPin, Pencil, Plus, Trophy, Users, X } from 'lucide-react';
import type { EventSummary } from '../types/events';

interface EventsPageProps {
  events: EventSummary[];
  arenas: ArenaOption[];
  onOpenEvent: (event: EventSummary) => void;
  onCreate: (input: EventFormInput) => Promise<void>;
  onUpdate: (eventId: string, input: Pick<EventFormInput, 'name' | 'eventDate'>) => Promise<void>;
  onDelete: (event: EventSummary) => Promise<void>;
}

export interface EventFormInput {
  name: string;
  eventDate: string;
  arenaId?: string;
  arenaName: string;
  city: string;
  state: string;
}

export interface ArenaOption {
  id: string;
  name: string;
  city: string;
  state: string;
}

const emptyForm: EventFormInput = { name: '', eventDate: '', arenaName: '', city: '', state: '' };

export const EventsPage: React.FC<EventsPageProps> = ({ events, arenas, onOpenEvent, onCreate, onUpdate, onDelete }) => {
  const [form, setForm] = useState<EventFormInput>(emptyForm);
  const [editing, setEditing] = useState<EventSummary | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFeedback('');
    setIsFormOpen(true);
  };

  const openEdit = (event: EventSummary) => {
    setEditing(event);
    setForm({ name: event.name, eventDate: event.date.split('/').reverse().join('-'), arenaName: event.arena, city: '', state: '' });
    setFeedback('');
    setIsFormOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      if (editing) await onUpdate(editing.id, { name: form.name, eventDate: form.eventDate });
      else await onCreate(form);
      setEditing(null);
      setForm(emptyForm);
      setIsFormOpen(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar a prova.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (event: EventSummary) => {
    try {
      await onDelete(event);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível cancelar a prova.');
    }
  };

  return (
  <section className="space-y-5">
    <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Operação</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">Provas e arenas</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b788b]">
          Cadastre torneios, acompanhe inscrições e acesse cada etapa da prova.
        </p>
      </div>
      <button
        type="button"
        onClick={openCreate}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e87900] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#cf6900]"
      >
        <Plus className="h-4 w-4" />
        Nova prova / arena
      </button>
    </div>

    <div className="space-y-4">
      {events.map((event) => (
        <article key={event.id} className="rounded-2xl border border-[#dfe6ed] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#eef1f4] pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#2f3b4f]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef3f6] px-3 py-1.5">
                <CalendarDays className="h-4 w-4 text-[#8290a1]" />
                {event.date}
              </span>
              <span className="rounded-full bg-[#d8f2ed] px-3 py-1.5 text-[#176f67]">{event.format}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                event.status === 'SORTEADA' ? 'bg-[#d8f2ed] text-[#176f67]' : 'bg-[#eef3f6] text-[#526276]'
              }`}>
                {event.status}
              </span>
              <button type="button" onClick={() => openEdit(event)} aria-label={`Editar ${event.name}`} className="rounded-lg p-2 text-[#8290a1] transition hover:bg-[#eef3f6] hover:text-[#172036]">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => void remove(event)} aria-label={`Excluir ${event.name}`} className="rounded-lg p-2 text-[#8290a1] transition hover:bg-red-50 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-[#172036]">{event.name}</h3>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6b788b]">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#8290a1]" />{event.arena}</span>
                {event.steward && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#8290a1]" />Mesário: {event.steward}</span>}
              </div>
            </div>
            <button type="button" onClick={() => onOpenEvent(event)} className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-1 text-sm font-bold text-[#176f67] transition hover:bg-[#e5f5f2]">
              <Info className="h-4 w-4" /> Detalhes
            </button>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#eef1f4] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-[#526276]">
              <Users className="h-5 w-5 text-[#218f83]" />
              {event.fixedPairs ? `${event.fixedPairs} duplas fixas` : `${event.registeredAthletes} atletas inscritos`}
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#e5f5f2] px-3 py-1.5 text-sm font-extrabold text-[#176f67] sm:self-auto">
              <Trophy className="h-4 w-4" /> {event.runs} corridas
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => onOpenEvent(event)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#eef3f6] px-4 py-3 text-sm font-bold text-[#172036] transition hover:bg-[#e3eaf0]">
              <ClipboardList className="h-4 w-4" /> Inscrições
            </button>
            <button type="button" onClick={() => onOpenEvent(event)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#218f83] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#176f67]">
              <Trophy className="h-4 w-4" /> Sorteio e pista
            </button>
          </div>
        </article>
      ))}
    </div>
    {isFormOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111a31]/40 p-4" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
        <form onSubmit={(event) => void save(event)} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">{editing ? 'Editar prova' : 'Nova prova'}</p>
              <h3 id="event-form-title" className="mt-2 text-xl font-extrabold text-[#172036]">{editing ? 'Atualizar dados da prova' : 'Cadastrar uma prova'}</h3>
            </div>
            <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); setIsFormOpen(false); }} className="rounded-lg px-2 py-1 text-xl text-[#8290a1] hover:bg-[#eef3f6]" aria-label="Fechar formulário">×</button>
          </div>
          {feedback && <p className="mt-4 rounded-xl bg-[#fff8e9] px-4 py-3 text-sm font-semibold text-[#8b5a00]">{feedback}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#526276]">Nome da prova</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]" /></label>
            <label><span className="mb-2 block text-xs font-bold text-[#526276]">Data</span><input required type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]" /></label>
            <label><span className="mb-2 block text-xs font-bold text-[#526276]">Arena</span>{editing ? <input disabled value={form.arenaName} className="w-full rounded-xl border border-[#dfe6ed] bg-[#f6f8fa] px-3 py-3 text-sm outline-none" /> : <select value={form.arenaId ?? ''} onChange={(event) => { const selected = arenas.find((arena) => arena.id === event.target.value); setForm({ ...form, arenaId: selected?.id || undefined, arenaName: selected?.name ?? '', city: selected?.city ?? '', state: selected?.state ?? '' }); }} className="w-full rounded-xl border border-[#dfe6ed] bg-white px-3 py-3 text-sm outline-none focus:border-[#218f83]"><option value="">Cadastrar nova arena</option>{arenas.map((arena) => <option key={arena.id} value={arena.id}>{arena.name} · {arena.city}/{arena.state}</option>)}</select>}</label>
            {!editing && !form.arenaId && <><label><span className="mb-2 block text-xs font-bold text-[#526276]">Nome da nova arena</span><input required value={form.arenaName} onChange={(event) => setForm({ ...form, arenaName: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]" /></label><label><span className="mb-2 block text-xs font-bold text-[#526276]">Cidade</span><input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]" /></label><label><span className="mb-2 block text-xs font-bold text-[#526276]">UF</span><input required maxLength={2} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm uppercase outline-none focus:border-[#218f83]" /></label></>}
          </div>
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => { setEditing(null); setForm(emptyForm); setIsFormOpen(false); }} className="rounded-xl px-4 py-3 text-sm font-bold text-[#526276] hover:bg-[#eef3f6]">Cancelar</button><button type="submit" disabled={saving} className="rounded-xl bg-[#218f83] px-5 py-3 text-sm font-bold text-white hover:bg-[#176f67] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar prova'}</button></div>
        </form>
      </div>
    )}
  </section>
  );
};
