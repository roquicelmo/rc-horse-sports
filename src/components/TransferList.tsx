import React, { useState, useMemo } from 'react';
import type { Competitor } from '../types/roping';
import { Trash2, Search, ArrowRight, ArrowLeft, Plus, Check, Users, Sparkles, UserPlus } from 'lucide-react';

interface TransferListProps {
  title: string;
  role: 'pezeiro' | 'cabeceiro';
  availableItems: Competitor[];
  selectedItems: Competitor[];
  onSelect: (item: Competitor) => void;
  onDeselect: (item: Competitor) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  onNext: () => void;
  onBack?: () => void;
  nextButtonLabel: string;
  onOpenAddModal?: () => void;
}

export const TransferList: React.FC<TransferListProps> = ({
  title,
  role,
  availableItems,
  selectedItems,
  onSelect,
  onDeselect,
  onSelectAll,
  onClearAll,
  onNext,
  onBack,
  nextButtonLabel,
  onOpenAddModal,
}) => {
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchSelected, setSearchSelected] = useState('');

  const isPezeiro = role === 'pezeiro';

  // Theme tokens
  const theme = isPezeiro
    ? {
      roleLabel: 'Pezeiro',
      rolePlural: 'Pezeiros',
      accentBg: 'bg-amber-500/10',
      accentBorder: 'border-amber-500/30',
      accentText: 'text-amber-400',
      accentRing: 'focus-within:ring-amber-500/40',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      badgeHover: 'hover:border-amber-500/60 hover:bg-amber-500/20',
      primaryBtn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20',
      cardActive: 'hover:border-amber-500/50 hover:bg-slate-800/80',
      countPill: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    }
    : {
      roleLabel: 'Cabeceiro',
      rolePlural: 'Cabeceiros',
      accentBg: 'bg-blue-500/10',
      accentBorder: 'border-blue-500/30',
      accentText: 'text-blue-400',
      accentRing: 'focus-within:ring-blue-500/40',
      badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      badgeHover: 'hover:border-blue-500/60 hover:bg-blue-500/20',
      primaryBtn: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-blue-500/20',
      cardActive: 'hover:border-blue-500/50 hover:bg-slate-800/80',
      countPill: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    };

  // Filtered available
  const filteredAvailable = useMemo(() => {
    const term = searchAvailable.toLowerCase().trim();
    if (!term) return availableItems;
    return availableItems.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.handicap.toString().includes(term) ||
        (c.cidade && c.cidade.toLowerCase().includes(term))
    );
  }, [availableItems, searchAvailable]);

  // Filtered selected
  const filteredSelected = useMemo(() => {
    const term = searchSelected.toLowerCase().trim();
    if (!term) return selectedItems;
    return selectedItems.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.handicap.toString().includes(term) ||
        (c.cidade && c.cidade.toLowerCase().includes(term))
    );
  }, [selectedItems, searchSelected]);

  // Handicap averages
  const avgHandicap = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    const sum = selectedItems.reduce((acc, c) => acc + c.handicap, 0);
    return (sum / selectedItems.length).toFixed(1);
  }, [selectedItems]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.countPill}`}
            >
              {theme.roleLabel}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Clique nos competidores disponíveis à esquerda para escalá-los como{' '}
            <strong className={theme.accentText}>{theme.rolePlural}</strong>.
            {isPezeiro
              ? ' Você poderá selecioná-los também como Cabeceiros na próxima etapa.'
              : ' Competidores já escolhidos como Pezeiro podem correr aqui normalmente.'}
          </p>
        </div>

        {/* Action Header Stats */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Adicionar novo competidor à lista global"
            >
              <UserPlus className="w-4 h-4 text-slate-400" />
              <span>Novo Inscrito</span>
            </button>
          )}

          <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-right">
            <div className="text-xs text-slate-400 font-medium">Média Handicap</div>
            <div className="text-base font-bold text-white font-mono">
              {selectedItems.length > 0 ? `${avgHandicap}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer List Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* LEFT COLUMN: Disponíveis */}
        <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Column Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Inscritos Disponíveis
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {filteredAvailable.length}
                    </span>
                  </h3>
                </div>
              </div>

              {availableItems.length > 0 && onSelectAll && (
                <button
                  onClick={onSelectAll}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Todos
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                placeholder="Buscar por nome, handicap ou cidade..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition"
              />
              {searchAvailable && (
                <button
                  onClick={() => setSearchAvailable('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List Body */}
          <div className="p-3 sm:p-4 flex-1 min-h-[360px] max-h-[460px] overflow-y-auto space-y-2">
            {filteredAvailable.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Users className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Nenhum competidor disponível</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {searchAvailable
                    ? 'Nenhum inscrito corresponde aos termos pesquisados.'
                    : 'Todos os competidores foram selecionados para esta função.'}
                </p>
              </div>
            ) : (
              filteredAvailable.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`group flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer transition-all duration-150 ${theme.cardActive} hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:text-white group-hover:bg-slate-700 transition">
                      {item.nome
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                        {item.nome}
                      </div>
                      {item.cidade && (
                        <div className="text-xs text-slate-500 truncate">{item.cidade}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${theme.badgeBg} ${theme.badgeHover} transition`}
                    >
                      Hcp {item.handicap.toFixed(1)}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition`}
                      title="Adicionar à seleção"
                    >
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column Footer */}
          <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Clique no card para adicionar</span>
            <span className="font-mono text-slate-400">{availableItems.length} no total</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Selecionados */}
        <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Column Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${theme.countPill}`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {theme.rolePlural} Selecionados
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono ${theme.countPill}`}
                    >
                      {selectedItems.length}
                    </span>
                  </h3>
                </div>
              </div>

              {selectedItems.length > 0 && onClearAll && (
                <button
                  onClick={onClearAll}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Todos
                </button>
              )}
            </div>

            {/* Search Input in Selected */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchSelected}
                onChange={(e) => setSearchSelected(e.target.value)}
                placeholder={`Buscar entre os ${theme.rolePlural.toLowerCase()} selecionados...`}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition"
              />
              {searchSelected && (
                <button
                  onClick={() => setSearchSelected('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List Body */}
          <div className="p-3 sm:p-4 flex-1 min-h-[360px] max-h-[460px] overflow-y-auto space-y-2">
            {selectedItems.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${theme.accentBg} ${theme.accentBorder} border`}
                >
                  <Sparkles className={`w-7 h-7 ${theme.accentText}`} />
                </div>
                <h4 className="text-base font-bold text-slate-200 mb-1">
                  Nenhum {theme.roleLabel.toLowerCase()} selecionado
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                  Clique em um inscrito na coluna ao lado para adicioná-lo à lista oficial de{' '}
                  <span className={theme.accentText}>{theme.rolePlural.toLowerCase()}</span> da
                  prova.
                </p>
              </div>
            ) : filteredSelected.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Search className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium">Nenhum resultado para a busca</p>
                <p className="text-xs text-slate-500 mt-1">Limpe o termo de busca para rever a lista.</p>
              </div>
            ) : (
              filteredSelected.map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 transition-all duration-150 hover:border-slate-700`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border ${theme.badgeBg}`}
                    >
                      {item.nome
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{item.nome}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className={`font-semibold ${theme.accentText}`}>
                          {theme.roleLabel}
                        </span>
                        {item.cidade && <span>• {item.cidade}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${theme.badgeBg}`}
                    >
                      Hcp {item.handicap.toFixed(1)}
                    </span>

                    <button
                      onClick={() => onDeselect(item)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/40 transition-colors"
                      title={`Remover ${item.nome} e devolver aos disponíveis`}
                      aria-label="Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column Footer */}
          <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Ícone de lixeira devolve à esquerda
            </span>
            <span className="font-mono text-slate-300 font-semibold">
              {selectedItems.length} selecionado(s)
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <div>
          {onBack ? (
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : (
            <div className="text-xs text-slate-500 hidden sm:block">
              Etapa inicial: selecione os pezeiros para habilitar o avanço
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={selectedItems.length === 0}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${selectedItems.length > 0
              ? `${theme.primaryBtn} cursor-pointer`
              : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
            }`}
        >
          <span>{nextButtonLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
