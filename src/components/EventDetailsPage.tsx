import React from 'react';
import { ArrowLeft, CalendarDays, ClipboardList, FileText, MapPin, Mic2, Trophy, Users } from 'lucide-react';
import type { EventSummary } from '../types/events';

interface EventDetailsPageProps {
  event: EventSummary;
  onBack: () => void;
  onOpenRegistrations: () => void;
}

export const EventDetailsPage: React.FC<EventDetailsPageProps> = ({ event, onBack, onOpenRegistrations }) => (
  <section className="space-y-5">
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-[#6b788b] transition hover:bg-[#eef3f6] hover:text-[#172036]"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar para provas
    </button>

    <div className="rounded-2xl border border-[#dfe6ed] bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Detalhes da prova</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">{event.name}</h2>
        </div>
        <span className="w-fit rounded-full bg-[#d8f2ed] px-3 py-1.5 text-xs font-extrabold text-[#176f67]">
          {event.status}
        </span>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-[#526276] sm:grid-cols-2 lg:grid-cols-3">
        <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#218f83]" />{event.date}</span>
        <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#218f83]" />{event.arena}</span>
        <span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#218f83]" />{event.format}</span>
        {event.steward && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#218f83]" />Mesário: {event.steward}</span>}
        <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-[#218f83]" />Rodadas automáticas por handicap</span>
        <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-[#218f83]" />Sem duplas fixas</span>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#eef3f6] px-4 py-4">
          <p className="text-2xl font-extrabold text-[#172036]">{event.fixedPairs ?? event.registeredAthletes ?? 0}</p>
          <p className="mt-1 text-xs text-[#6b788b]">{event.fixedPairs ? 'Duplas fixas' : 'Atletas inscritos'}</p>
        </div>
        <div className="rounded-xl bg-[#e5f5f2] px-4 py-4">
          <p className="text-2xl font-extrabold text-[#176f67]">{event.runs}</p>
          <p className="mt-1 text-xs text-[#6b788b]">Corridas geradas</p>
        </div>
        <div className="rounded-xl bg-[#fff1df] px-4 py-4">
          <p className="text-2xl font-extrabold text-[#bd5f00]">0</p>
          <p className="mt-1 text-xs text-[#6b788b]">Corridas finalizadas</p>
        </div>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button type="button" onClick={onOpenRegistrations} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#eef3f6] px-4 py-3 text-sm font-bold text-[#172036] transition hover:bg-[#e3eaf0]">
        <ClipboardList className="h-4 w-4" /> Inscrições
      </button>
      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#218f83] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#176f67]">
        <Trophy className="h-4 w-4" /> Sorteio e pista
      </button>
      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e87900] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#cf6900]">
        <Mic2 className="h-4 w-4" /> Tela do locutor
      </button>
      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe6ed] bg-white px-4 py-3 text-sm font-bold text-[#2f3b4f] transition hover:bg-[#eef3f6]">
        <FileText className="h-4 w-4" /> Resultado final
      </button>
    </div>
  </section>
);
