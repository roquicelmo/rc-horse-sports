import React, { useMemo } from 'react';
import { ArrowLeft, ChevronRight, Flag, Mic2, Radio, Users } from 'lucide-react';
import type { EventSummary } from '../types/events';
import type { Run } from '../types/roping';

interface AnnouncerPageProps {
  event: EventSummary;
  runs: Run[];
  onBack: () => void;
  onOpenRun: (run: Run) => void;
}

export const AnnouncerPage: React.FC<AnnouncerPageProps> = ({ event, runs, onBack, onOpenRun }) => {
  const nextRun = useMemo(
    () => runs.find((run) => run.totalTime === null && !run.isNt) ?? runs[runs.length - 1],
    [runs]
  );
  const completed = runs.filter((run) => run.totalTime !== null || run.isNt).length;

  return (
    <section className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-[#6b788b] transition hover:bg-[#eef3f6] hover:text-[#172036]">
        <ArrowLeft className="h-4 w-4" /> Voltar para detalhes
      </button>

      <div className="rounded-2xl bg-[#111a31] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8de0d4]">
              <Radio className="h-4 w-4" /> Operação de pista
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{event.name}</h2>
            <p className="mt-1 text-sm text-[#b8c2d0]">Tela do locutor · {event.arena}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-[#b8c2d0]">Progresso</p>
            <p className="mt-1 text-2xl font-black">{completed}/{runs.length}</p>
          </div>
        </div>
      </div>

      {nextRun ? (
        <button type="button" onClick={() => onOpenRun(nextRun)} className="group w-full rounded-2xl border-2 border-[#218f83] bg-[#e5f5f2] p-6 text-left transition hover:border-[#176f67] hover:shadow-md">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#176f67]">Próxima corrida</p>
              <p className="mt-2 text-4xl font-black text-[#172036]">#{nextRun.numero}</p>
              <p className="mt-2 text-sm font-bold text-[#526276]">Bateria {nextRun.bateria} · Rodada {nextRun.rodada}</p>
            </div>
            <div className="space-y-2 sm:min-w-[280px]">
              <p className="flex items-center gap-2 text-lg font-extrabold text-[#172036]"><Users className="h-5 w-5 text-[#218f83]" />{nextRun.cabeceiro.nome}</p>
              <p className="flex items-center gap-2 text-lg font-extrabold text-[#172036]"><Flag className="h-5 w-5 text-[#e87900]" />{nextRun.pezeiro.nome}</p>
            </div>
            <ChevronRight className="hidden h-7 w-7 text-[#218f83] sm:block" />
          </div>
          <p className="mt-5 border-t border-[#b9e3dc] pt-4 text-sm font-semibold text-[#176f67]">Selecionar corrida para lançar o tempo</p>
        </button>
      ) : (
        <div className="rounded-2xl border border-[#dfe6ed] bg-white p-8 text-center">
          <Mic2 className="mx-auto h-8 w-8 text-[#218f83]" />
          <p className="mt-3 text-lg font-extrabold text-[#172036]">Nenhuma corrida disponível</p>
          <p className="mt-1 text-sm text-[#6b788b]">Gere o sorteio antes de abrir a tela do locutor.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#6b788b]">Total de corridas</p><p className="mt-1 text-2xl font-black text-[#172036]">{runs.length}</p></div>
        <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#6b788b]">Finalizadas</p><p className="mt-1 text-2xl font-black text-[#176f67]">{completed}</p></div>
        <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#6b788b]">Pendentes</p><p className="mt-1 text-2xl font-black text-[#bd5f00]">{Math.max(0, runs.length - completed)}</p></div>
      </div>
    </section>
  );
};
