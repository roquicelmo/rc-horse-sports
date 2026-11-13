import React, { useMemo, useState } from 'react';
import { CalendarDays, MapPin, Trophy } from 'lucide-react';
import type { EventSummary } from '../types/events';

interface AgendaPageProps {
  events: EventSummary[];
  owners?: Array<{ id: string; name: string | null; email: string }>;
  canFilterOwners?: boolean;
}

export const AgendaPage: React.FC<AgendaPageProps> = ({ events, owners = [], canFilterOwners = false }) => {
  const [ownerId, setOwnerId] = useState('');
  const upcoming = useMemo(() => events
    .filter((event) => event.status !== 'CANCELADA' && (!ownerId || event.ownerId === ownerId))
    .sort((a, b) => a.date.split('/').reverse().join('').localeCompare(b.date.split('/').reverse().join(''))), [events, ownerId]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Programação</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">Agenda de provas</h2><p className="mt-1 text-sm text-[#6b788b]">Datas, arenas e status de todas as provas cadastradas.</p></div>
        {canFilterOwners && <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="rounded-xl border border-[#dfe6ed] bg-white px-3 py-2.5 text-sm text-[#172036] outline-none focus:border-[#218f83]"><option value="">Todos os proprietários</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name ?? owner.email}</option>)}</select>}
      </div>
      {upcoming.length ? <div className="grid gap-3 md:grid-cols-2">{upcoming.map((event) => <article key={event.id} className="rounded-2xl border border-[#dfe6ed] bg-white p-5"><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-[#e5f5f2] text-[#176f67]"><span className="text-[10px] font-black uppercase">{event.date.split('/')[1]}</span><span className="text-lg font-black leading-none">{event.date.split('/')[0]}</span></div><span className="rounded-full bg-[#eef3f6] px-3 py-1.5 text-xs font-extrabold text-[#526276]">{event.status}</span></div><h3 className="mt-4 text-lg font-extrabold text-[#172036]">{event.name}</h3><div className="mt-3 space-y-2 text-sm text-[#6b788b]"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#218f83]" />{event.date}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#218f83]" />{event.arena}</p><p className="flex items-center gap-2"><Trophy className="h-4 w-4 text-[#218f83]" />{event.runs} corridas · {event.registeredAthletes ?? 0} inscritos</p></div>{canFilterOwners && <p className="mt-4 border-t border-[#eef3f6] pt-3 text-xs font-semibold text-[#6b788b]">Proprietário: {event.ownerName ?? 'Sem atribuição'}</p>}</article>)}</div> : <div className="rounded-2xl border border-dashed border-[#dfe6ed] bg-white p-12 text-center"><CalendarDays className="mx-auto h-8 w-8 text-[#8290a1]" /><p className="mt-3 font-bold text-[#172036]">Nenhuma prova na agenda</p><p className="mt-1 text-sm text-[#6b788b]">Crie uma prova para ela aparecer aqui.</p></div>}
    </section>
  );
};
