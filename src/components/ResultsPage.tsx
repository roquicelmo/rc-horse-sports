import React, { useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Download, Medal, Trophy, XCircle } from 'lucide-react';
import type { EventSummary } from '../types/events';
import type { Run } from '../types/roping';

interface ResultsPageProps {
  event: EventSummary;
  runs: Run[];
  onBack: () => void;
  onPublish: () => void;
  published: boolean;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ event, runs, onBack, onPublish, published }) => {
  const ranked = useMemo(
    () => runs.filter((run) => !run.isNt && run.mediaFinal !== null).sort((a, b) => (a.mediaFinal ?? Infinity) - (b.mediaFinal ?? Infinity)),
    [runs]
  );
  const eliminated = runs.filter((run) => run.isNt);
  const pending = runs.filter((run) => !run.isNt && run.mediaFinal === null);

  return (
    <section className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-[#6b788b] transition hover:bg-[#eef3f6] hover:text-[#172036]">
        <ArrowLeft className="h-4 w-4" /> Voltar para detalhes
      </button>
      <div className="print-header rounded-2xl bg-[#111a31] p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8de0d4]">Resultado final</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-2xl font-extrabold">{event.name}</h2><p className="mt-1 text-sm text-[#b8c2d0]">{event.arena} · {event.date}</p></div>
          {published && <span className="rounded-full bg-[#d8f2ed] px-3 py-1.5 text-xs font-extrabold text-[#176f67]">Publicado</span>}
        </div>
        <div className="no-print flex justify-end">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6ed] bg-white px-4 py-2.5 text-sm font-bold text-[#2f3b4f] transition hover:bg-[#eef3f6]">
            <Download className="h-4 w-4 text-[#218f83]" /> Imprimir / salvar PDF
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-[#dfe6ed] bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-extrabold text-[#172036]">Classificação</h3><span className="text-sm font-bold text-[#6b788b]">{ranked.length} classificados</span></div>
        <div className="mt-4 divide-y divide-[#eef3f6]">
          {ranked.map((run, index) => (
            <div key={run.id} className="flex items-center gap-3 py-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${index === 0 ? 'bg-[#fff1df] text-[#bd5f00]' : 'bg-[#eef3f6] text-[#526276]'}`}>{index + 1}</span>
              <Medal className="h-4 w-4 text-[#218f83]" />
              <div className="min-w-0 flex-1"><p className="truncate font-bold text-[#172036]">{run.cabeceiro.nome} / {run.pezeiro.nome}</p><p className="text-xs text-[#6b788b]">Corrida #{run.numero} · {run.bois} boi(s)</p></div>
              <strong className="font-mono text-[#176f67]">{run.mediaFinal?.toFixed(2)}s</strong>
            </div>
          ))}
          {!ranked.length && <p className="py-8 text-center text-sm text-[#6b788b]">Ainda não há corridas classificadas.</p>}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#e5f5f2] p-4"><CheckCircle2 className="h-5 w-5 text-[#176f67]" /><p className="mt-2 text-2xl font-black text-[#176f67]">{ranked.length}</p><p className="text-xs font-bold text-[#6b788b]">Classificados</p></div>
        <div className="rounded-xl bg-[#fff4f2] p-4"><XCircle className="h-5 w-5 text-[#a33d32]" /><p className="mt-2 text-2xl font-black text-[#a33d32]">{eliminated.length}</p><p className="text-xs font-bold text-[#6b788b]">Eliminados / NT</p></div>
        <div className="rounded-xl bg-[#fff1df] p-4"><Trophy className="h-5 w-5 text-[#bd5f00]" /><p className="mt-2 text-2xl font-black text-[#bd5f00]">{pending.length}</p><p className="text-xs font-bold text-[#6b788b]">Pendentes</p></div>
      </div>
      {!published && (
        <button type="button" onClick={onPublish} disabled={pending.length > 0} className="w-full rounded-xl bg-[#218f83] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#176f67] disabled:cursor-not-allowed disabled:opacity-50">
          {pending.length ? `Finalize ${pending.length} corrida(s) para publicar` : 'Publicar resultado final'}
        </button>
      )}
    </section>
  );
};
