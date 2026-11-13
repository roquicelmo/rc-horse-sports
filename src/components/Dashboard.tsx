import React from 'react';
import { ArrowRight, CalendarDays, ClipboardList, Plus, Trophy, Users } from 'lucide-react';
import type { Run } from '../types/roping';
import type { EventSummary } from '../types/events';

interface DashboardProps {
  athleteCount: number;
  selectedPezeiros: number;
  selectedCabeceiros: number;
  runs: Run[];
  onStartDraw: () => void;
  events?: EventSummary[];
  owners?: Array<{ id: string; name: string | null; email: string }>;
  canFilterOwners?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  athleteCount,
  selectedPezeiros,
  selectedCabeceiros,
  runs,
  onStartDraw,
  events = [],
  owners = [],
  canFilterOwners = false,
}) => {
  const [ownerId, setOwnerId] = React.useState('');
  const visibleEvents = events.filter((event) => !ownerId || event.ownerId === ownerId);
  const hasActiveDraw = runs.length > 0;
  const totalSelected = selectedPezeiros + selectedCabeceiros;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="rounded-2xl border border-teal-100 bg-teal-800 px-6 py-7 text-white shadow-sm sm:px-8">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-teal-100">
            <Trophy className="h-4 w-4" />
            Gestão de provas e sorteios
          </div>
          {canFilterOwners && <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm text-white outline-none"><option value="">Todos os proprietários</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name ?? owner.email}</option>)}</select>}
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Organize sua próxima prova com clareza.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-teal-50/90 sm:text-base">
            Cadastre os participantes, monte as duplas e acompanhe a ordem de corrida em um único
            fluxo.
          </p>
          <button
            type="button"
            onClick={onStartDraw}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-800"
          >
            <Plus className="h-4 w-4" />
            Começar um sorteio
          </button>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <CalendarDays className="h-4 w-4 text-amber-700" />
            Próxima ação
          </div>
          <p className="mt-4 text-2xl font-extrabold tracking-tight text-amber-950">
            {hasActiveDraw ? 'Conferir a ordem de corrida' : 'Criar a primeira prova'}
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-900/75">
            {hasActiveDraw
              ? `${runs.length} corridas aguardam conferência e lançamento de tempos.`
              : 'O painel ficará completo quando as provas persistidas forem conectadas ao banco de dados.'}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-teal-900">Atletas cadastrados</span>
            <Users className="h-5 w-5 text-teal-700" />
          </div>
          <p className="mt-4 text-3xl font-extrabold text-teal-950">{athleteCount}</p>
          <p className="mt-1 text-xs text-teal-800/70">Disponíveis para novas inscrições</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-900">Participantes escolhidos</span>
            <ClipboardList className="h-5 w-5 text-amber-700" />
          </div>
          <p className="mt-4 text-3xl font-extrabold text-amber-950">{totalSelected}</p>
          <p className="mt-1 text-xs text-amber-900/70">
            {selectedCabeceiros} cabeceiros e {selectedPezeiros} pezeiros
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Corridas geradas</span>
            <Trophy className="h-5 w-5 text-slate-600" />
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">{runs.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            {hasActiveDraw ? 'Sorteio atual em andamento' : 'Nenhum sorteio gerado ainda'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#dfe6ed] bg-[#ffffff]">
        <div className="flex flex-col gap-3 border-b border-[#dfe6ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-[#172036]">Provas recentes</h3>
            <p className="mt-1 text-sm text-[#6b788b]">
              {visibleEvents.length ? `${visibleEvents.length} prova(s) no contexto selecionado.` : 'Crie uma prova para acompanhar inscrições, sorteio e resultado.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onStartDraw}
            className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 hover:text-teal-950"
          >
            Abrir fluxo de sorteio
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {visibleEvents.length ? <div className="divide-y divide-[#eef3f6]">{visibleEvents.slice(0, 5).map((event) => <div key={event.id} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="font-bold text-[#172036]">{event.name}</p><p className="mt-1 text-xs text-[#6b788b]">{event.date} · {event.arena}</p></div><span className="rounded-full bg-[#e5f5f2] px-3 py-1 text-xs font-extrabold text-[#176f67]">{event.status}</span></div>)}</div> : <div className="px-6 py-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-amber-600" />
          <h4 className="mt-3 text-base font-bold text-[#2f3b4f]">Nenhuma prova cadastrada</h4>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#6b788b]">
            Este estado vazio é intencional: o sistema não apresenta dados fictícios. Crie uma prova
            para acompanhar inscrições, sorteio e resultado neste painel.
          </p>
        </div>}
      </section>
    </div>
  );
};
