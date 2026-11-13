import React, { useMemo, useState } from 'react';
import { MapPin, Search, Trash2, UserPlus, Users } from 'lucide-react';
import type { Competitor } from '../types/roping';

interface AthletesPageProps {
  athletes: Competitor[];
  owners?: Array<{ id: string; name: string | null; email: string }>;
  canFilterOwners?: boolean;
  onAdd: () => void;
  onRemove: (athlete: Competitor) => void;
}

export const AthletesPage: React.FC<AthletesPageProps> = ({ athletes, owners = [], canFilterOwners = false, onAdd, onRemove }) => {
  const [search, setSearch] = useState('');
  const [ownerId, setOwnerId] = useState('');

  const filteredAthletes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const scoped = ownerId ? athletes.filter((athlete) => athlete.ownerId === ownerId) : athletes;
    if (!normalizedSearch) return scoped;

    return scoped.filter((athlete) =>
      [athlete.nome, athlete.apelido, athlete.cidade]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
    );
  }, [athletes, ownerId, search]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#dfe6ed] bg-white px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Base de atletas</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">Cadastro de atletas</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b788b]">
            Organize os laçadores que poderão participar das próximas provas.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e87900] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#cf6900]"
        >
          <UserPlus className="h-4 w-4" />
          Novo atleta
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f5f2] text-[#218f83]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#2f3b4f]">{athletes.length} atletas cadastrados</p>
            <p className="text-xs text-[#6b788b]">Disponíveis para novas inscrições</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {canFilterOwners && <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="rounded-xl border border-[#dfe6ed] bg-white px-3 py-2.5 text-sm text-[#172036] outline-none focus:border-[#218f83]"><option value="">Todos os proprietários</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name ?? owner.email}</option>)}</select>}
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290a1]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar atleta..."
            className="w-full rounded-xl border border-[#dfe6ed] bg-white py-2.5 pl-9 pr-3 text-sm text-[#172036] outline-none transition focus:border-[#218f83] focus:ring-2 focus:ring-[#218f83]/15"
          />
        </label>
        </div>
      </div>

      {filteredAthletes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dfe6ed] bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-[#8290a1]" />
          <h3 className="mt-3 text-base font-bold text-[#2f3b4f]">Nenhum atleta encontrado</h3>
          <p className="mt-1 text-sm text-[#6b788b]">Ajuste a busca ou cadastre um novo atleta.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredAthletes.map((athlete) => (
            <article key={athlete.id} className="rounded-2xl border border-[#dfe6ed] bg-white p-4 transition hover:border-[#b8dcd7] hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-extrabold text-[#172036]">{athlete.nome}</h3>
                  {athlete.apelido && <p className="mt-1 text-xs text-[#6b788b]">{athlete.apelido}</p>}
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${athlete.nome}`}
                  onClick={() => onRemove(athlete)}
                  className="rounded-lg p-2 text-[#9aa8b7] transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#eef1f4] pt-3">
                <span className="rounded-lg bg-[#fff1df] px-2.5 py-1 font-mono text-xs font-bold text-[#bd5f00]">
                  HC {athlete.handicap.toFixed(1)}
                </span>
                {athlete.cidade && (
                  <span className="flex min-w-0 items-center gap-1 text-xs text-[#6b788b]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{athlete.cidade}</span>
                  </span>
                )}
              </div>
              {canFilterOwners && <p className="mt-3 text-xs font-semibold text-[#6b788b]">Proprietário: {athlete.ownerName ?? 'Sem atribuição'}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
