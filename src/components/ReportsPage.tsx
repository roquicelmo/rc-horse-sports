import React, { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, Download, MapPin, Trophy, Users, type LucideIcon } from 'lucide-react';

interface ReportEvent { id: string; name: string; eventDate: string; status: string; createdBy: { id: string; name: string | null; email: string }; _count: { registrations: number; draws: number } }
interface ReportsPageProps { owners?: Array<{ id: string; name: string | null; email: string }>; canFilterOwners?: boolean }

export const ReportsPage: React.FC<ReportsPageProps> = ({ owners = [], canFilterOwners = false }) => {
  const [ownerId, setOwnerId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [totals, setTotals] = useState({ events: 0, athletes: 0, arenas: 0, draws: 0, runs: 0 });
  const [events, setEvents] = useState<ReportEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (ownerId) params.set('ownerId', ownerId);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    void fetch(`/api/reports/overview?${params}`).then(async (response) => {
      const body = await response.json() as { totals?: typeof totals; recentEvents?: ReportEvent[]; message?: string };
      if (!response.ok || !body.totals) throw new Error(body.message ?? 'Não foi possível carregar o relatório.');
      setTotals(body.totals);
      setEvents(body.recentEvents ?? []);
      setError(null);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o relatório.'));
  }, [from, ownerId, status, to]);

  return (
    <section className="space-y-5">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Visão administrativa</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">Relatórios</h2><p className="mt-1 text-sm text-[#6b788b]">Acompanhe a operação consolidada por usuário e período.</p></div><button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe6ed] bg-white px-4 py-3 text-sm font-bold text-[#2f3b4f] hover:bg-[#eef3f6]"><Download className="h-4 w-4 text-[#218f83]" /> Imprimir / salvar PDF</button></div>
      <div className="no-print grid gap-3 rounded-2xl border border-[#dfe6ed] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">{canFilterOwners && <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="rounded-xl border border-[#dfe6ed] px-3 py-2.5 text-sm outline-none focus:border-[#218f83]"><option value="">Todos os proprietários</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name ?? owner.email}</option>)}</select>}<select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[#dfe6ed] px-3 py-2.5 text-sm outline-none focus:border-[#218f83]"><option value="">Todos os status</option><option value="DRAFT">Aberta</option><option value="DRAWN">Sorteada</option><option value="IN_PROGRESS">Em andamento</option><option value="FINISHED">Finalizada</option><option value="CANCELLED">Cancelada</option></select><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-xl border border-[#dfe6ed] px-3 py-2.5 text-sm outline-none focus:border-[#218f83]" /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-xl border border-[#dfe6ed] px-3 py-2.5 text-sm outline-none focus:border-[#218f83]" /></div>
      {error && <div role="alert" className="rounded-xl border border-[#f2c7c2] bg-[#fff4f2] px-4 py-3 text-sm font-semibold text-[#a33d32]">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{([
        ['Provas', totals.events, CalendarDays],
        ['Atletas', totals.athletes, Users],
        ['Arenas', totals.arenas, MapPin],
        ['Sorteios', totals.draws, BarChart3],
        ['Corridas', totals.runs, Trophy],
      ] as Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-[#dfe6ed] bg-white p-5"><Icon className="h-5 w-5 text-[#218f83]" /><p className="mt-3 text-3xl font-black text-[#172036]">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#6b788b]">{label}</p></div>)}</div>
      <div className="rounded-2xl border border-[#dfe6ed] bg-white"><div className="border-b border-[#dfe6ed] px-5 py-4"><h3 className="font-extrabold text-[#172036]">Provas no período</h3></div><div className="divide-y divide-[#eef3f6]">{events.length ? events.map((event) => <div key={event.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#172036]">{event.name}</p><p className="mt-1 text-xs text-[#6b788b]">{new Intl.DateTimeFormat('pt-BR').format(new Date(event.eventDate))} · {event.createdBy.name ?? event.createdBy.email}</p></div><div className="flex items-center gap-3 text-xs font-bold text-[#526276]"><span>{event._count.registrations} inscritos</span><span>{event._count.draws} sorteio(s)</span><span className="rounded-full bg-[#eef3f6] px-2.5 py-1">{event.status}</span></div></div>) : <p className="px-5 py-10 text-center text-sm text-[#6b788b]">Nenhuma prova encontrada para os filtros atuais.</p>}</div></div>
    </section>
  );
};
