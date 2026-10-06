import React, { useMemo } from 'react';
import type { Competitor, DrawConfig, BatteryMode } from '../types/roping';
import { assignCompetitorsToGroups, calculateBois } from '../utils/drawAlgorithm';
import {
  Shuffle,
  ArrowLeft,
  Info,
  Clock,
  Award,
  Layers,
  Sparkles,
  GitBranch,
  Flame,
  Sliders,
  CheckCircle2,
  Wand2,
  ThumbsUp,
} from 'lucide-react';

interface DrawConfigurationProps {
  config: DrawConfig;
  onChangeConfig: (newConfig: DrawConfig) => void;
  pezeiros: Competitor[];
  cabeceiros: Competitor[];
  onGenerateDraw: () => void;
  onBack: () => void;
}

export const DrawConfiguration: React.FC<DrawConfigurationProps> = ({
  config,
  onChangeConfig,
  pezeiros,
  cabeceiros,
  onGenerateDraw,
  onBack,
}) => {
  // Calcula preview dos grupos A, B, C em tempo real
  const groupedPreview = useMemo(() => {
    return assignCompetitorsToGroups(
      cabeceiros,
      pezeiros,
      config.numGroups,
      config.balanceGroups
    );
  }, [cabeceiros, pezeiros, config.numGroups, config.balanceGroups]);

  // Cálculos de cruzamento (com validação estrita anti-auto-cruzamento: c.id !== p.id)
  const totalPossibleRuns = useMemo(() => {
    return cabeceiros.reduce(
      (acc, c) => acc + pezeiros.filter((p) => p.id !== c.id).length,
      0
    );
  }, [cabeceiros, pezeiros]);

  // Quantidade total de fases de cruzamento base (ex: 3x3 = 9, ou 2x2 = 4)
  const totalCrossPhases = config.numGroups * config.numGroups;

  // Quantidade efetiva de baterias configurada pelo operador
  const effectiveNumBatteries =
    config.numBatteries ?? (totalCrossPhases === 9 ? 9 : totalCrossPhases);

  // Modo ativo de bateria
  const currentBatteryMode =
    config.batteryMode ??
    (effectiveNumBatteries === 1
      ? 'single'
      : effectiveNumBatteries === 3 && totalCrossPhases === 9
      ? 'major3'
      : effectiveNumBatteries === totalCrossPhases
      ? 'phases'
      : 'custom');

  // Distribuição estimada de bois (1, 2 ou 3) com base nas somatórias de todas as duplas válidas (sem auto-cruzamento)
  const boisDistribution = useMemo(() => {
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;

    for (const c of cabeceiros) {
      for (const p of pezeiros) {
        if (c.id === p.id) continue; // Laçador não faz dupla com ele mesmo
        const shc = Number((c.handicap + p.handicap).toFixed(1));
        const bois = calculateBois(shc);
        if (bois === 1) b1++;
        else if (bois === 2) b2++;
        else b3++;
      }
    }

    return { b1, b2, b3 };
  }, [cabeceiros, pezeiros]);

  // Opção de Grandes Baterias adaptada dinamicamente ao número de grupos (ex: 3 grupos -> 3 baterias, 2 grupos -> 2 baterias, 4 grupos -> 4 baterias)
  const majorOption = useMemo(() => {
    if (config.numGroups === 2) {
      return {
        num: 2,
        mode: 'custom' as BatteryMode,
        label: '2 Baterias',
        tag: 'Arena (2)',
        sub: 'Diretos (1) e Cruzados (2)',
      };
    }
    if (config.numGroups === 4) {
      return {
        num: 4,
        mode: 'custom' as BatteryMode,
        label: '4 Baterias',
        tag: 'Arena (4)',
        sub: '4 Grandes Sessões',
      };
    }
    return {
      num: 3,
      mode: 'major3' as BatteryMode,
      label: '3 Baterias',
      tag: 'Arena (3)',
      sub: 'Diretos (1), Cruzados (2 e 3)',
    };
  }, [config.numGroups]);

  // Recomendação Inteligente do melhor número e formato de baterias para a arena
  const batteryRecommendation = useMemo(() => {
    const runs = totalPossibleRuns;
    const groups = config.numGroups;

    let recBatteries: number;
    let recMode: BatteryMode;
    let title: string;
    let presetKey: 'phases' | 'major3' | 'single' | 'custom';
    let reason: string;
    let restLabel: string;

    if (runs <= 25) {
      // Evento muito pequeno (até 25 corridas)
      recBatteries = 1;
      recMode = 'single';
      presetKey = 'single';
      title = '1 Bateria Única';
      restLabel = 'Sem paradas';
      reason = `Com apenas ${runs} corridas no total, dividir em várias baterias deixaria cada uma excessivamente curta. Uma bateria contínua proporciona ritmo ágil e dinâmico na arena.`;
    } else if (groups === 3) {
      if (runs >= 90) {
        // Padrão oficial clássico: 9 baterias (fases de cruzamento isoladas)
        recBatteries = 9;
        recMode = 'phases';
        presetKey = 'phases';
        title = '9 Baterias (Padrão Oficial)';
        restLabel = 'Excelente (2/3 da prova em descanso)';
        const avg = Math.ceil(runs / 9);
        reason = `Com ${runs} corridas em 3 chaves, 9 baterias dividem o evento em lotes ideais de ~${avg} corridas (tamanho perfeito de lote de gado para troca e descanso dos cavalos), isolando cada fase (A×A, B×B, A×B...).`;
      } else {
        // Evento intermediário com 3 chaves (entre 26 e 89 corridas)
        recBatteries = 3;
        recMode = 'major3';
        presetKey = 'major3';
        title = '3 Grandes Baterias';
        restLabel = 'Muito Bom (Pausa a cada bloco)';
        const avg = Math.ceil(runs / 3);
        reason = `Com ${runs} corridas, 9 baterias ficariam muito fragmentadas (~${Math.ceil(runs / 9)} corridas cada). 3 baterias agrupam as fases em sessões de ~${avg} corridas (Diretos, Cruzados 1 e Cruzados 2), garantindo fluidez e pausas programadas.`;
      }
    } else if (groups === 2) {
      if (runs >= 50) {
        recBatteries = 4;
        recMode = 'phases';
        presetKey = 'phases';
        title = '4 Baterias (Por Cruzamento)';
        restLabel = 'Excelente (Descanso alternado)';
        const avg = Math.ceil(runs / 4);
        reason = `Com ${runs} corridas em 2 chaves, 4 baterias (A×A, B×B, A×B, B×A) distribuem ~${avg} laçadas por lote, permitindo rodízio ordenado do gado.`;
      } else {
        recBatteries = 2;
        recMode = 'custom';
        presetKey = 'major3';
        title = '2 Baterias (Diretos e Cruzados)';
        restLabel = 'Muito Bom';
        const avg = Math.ceil(runs / 2);
        reason = `Com ${runs} corridas, 2 baterias de ~${avg} corridas dividem o evento em duas sessões equilibradas, mantendo a pista em ritmo constante.`;
      }
    } else {
      // 4 grupos
      if (runs >= 120) {
        recBatteries = 8;
        recMode = 'custom';
        presetKey = 'custom';
        title = '8 Baterias';
        restLabel = 'Excelente';
        const avg = Math.ceil(runs / 8);
        reason = `Distribui as ${runs} corridas em 8 lotes equilibrados de ~${avg} corridas, ideal para o manejo de 4 grupos sem sobrecarregar os laçadores.`;
      } else {
        recBatteries = 4;
        recMode = 'custom';
        presetKey = 'major3';
        title = '4 Grandes Baterias';
        restLabel = 'Muito Bom';
        const avg = Math.ceil(runs / 4);
        reason = `Agrupa as ${runs} corridas em 4 sessões de ~${avg} laçadas, mantendo o evento ágil com 4 chaves.`;
      }
    }

    const runsPerBattery = Math.ceil(runs / recBatteries);
    const isApplied =
      effectiveNumBatteries === recBatteries &&
      (currentBatteryMode === recMode ||
        (recMode === 'custom' && config.numBatteries === recBatteries));

    return {
      numBatteries: recBatteries,
      batteryMode: recMode,
      presetKey,
      title,
      reason,
      restLabel,
      runsPerBattery,
      isApplied,
    };
  }, [
    totalPossibleRuns,
    config.numGroups,
    effectiveNumBatteries,
    currentBatteryMode,
    config.numBatteries,
  ]);

  const handleApplyRecommendation = () => {
    onChangeConfig({
      ...config,
      numBatteries: batteryRecommendation.numBatteries,
      batteryMode: batteryRecommendation.batteryMode,
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Etapa 3
            </span>
            <span className="text-xs text-slate-400">Somatória Livre • Todos contra Todos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Configuração do Sorteio por Baterias (A, B, C...)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Sem teto de handicap: <strong>todos os cabeceiros laçam com todos os pezeiros</strong>,
            com quantidade de bois (1, 2 ou 3) definida automaticamente pela somatória de cada dupla.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">Cabeceiros</div>
            <div className="text-base font-bold text-blue-400 font-mono">{cabeceiros.length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">Pezeiros</div>
            <div className="text-base font-bold text-amber-400 font-mono">{pezeiros.length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">Total Corridas</div>
            <div className="text-base font-bold text-emerald-400 font-mono">{totalPossibleRuns}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Columns (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Divisão em Grupos de Bateria (A, B, C...) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-sm font-bold text-white block">
                    Divisão das Chaves de Bateria
                  </label>
                  <span className="text-xs text-slate-400">
                    Define em quantas baterias base os competidores serão distribuídos
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                {config.numGroups} Chaves ({groupedPreview.groupLetters.join(', ')})
              </span>
            </div>

            {/* Selector for 2, 3 or 4 groups */}
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map((num) => {
                const letters = ['A', 'B', 'C', 'D'].slice(0, num).join(', ');
                const isSelected = config.numGroups === num;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, numGroups: num })}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-extrabold">{num} Grupos</div>
                    <div className="text-xs opacity-80 mt-0.5 font-mono">Baterias {letters}</div>
                    {num === 3 && (
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                        Padrão Arena
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Toggle de Balanceamento por Handicap */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Balanceamento Snake Draft</div>
                  <div className="text-[11px] text-slate-400">
                    Equilibra automaticamente a média de handicap entre as baterias A, B e C
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.balanceGroups}
                onChange={(e) => onChangeConfig({ ...config, balanceGroups: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Visual preview of assigned competitors per group */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-slate-300">
                Composição das Baterias ({groupedPreview.groupLetters.length} Chaves):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {groupedPreview.groupLetters.map((letter) => {
                  const cabs = groupedPreview.cabeceirosByGroup[letter] || [];
                  const pezs = groupedPreview.pezeirosByGroup[letter] || [];
                  const cabAvg =
                    cabs.length > 0
                      ? (cabs.reduce((acc, c) => acc + c.handicap, 0) / cabs.length).toFixed(1)
                      : '0.0';
                  const pezAvg =
                    pezs.length > 0
                      ? (pezs.reduce((acc, p) => acc + p.handicap, 0) / pezs.length).toFixed(1)
                      : '0.0';

                  return (
                    <div
                      key={letter}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-extrabold text-white text-sm">Chave {letter}</span>
                        <span className="text-[10px] text-slate-400">
                          {cabs.length} Cab. / {pezs.length} Pez.
                        </span>
                      </div>

                      {/* Cabeceiros da Bateria */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-blue-400 font-semibold mb-1">
                          <span>Cabeceiros ({letter})</span>
                          <span className="font-mono text-[10px]">Méd. {cabAvg}</span>
                        </div>
                        <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
                          {cabs.map((c) => (
                            <div
                              key={c.id}
                              className="text-[11px] text-slate-300 flex items-center justify-between truncate"
                            >
                              <span className="truncate">{c.nome}</span>
                              <span className="font-mono text-slate-500 shrink-0 ml-1">
                                {c.handicap.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pezeiros da Bateria */}
                      <div className="pt-1 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold mb-1">
                          <span>Pezeiros ({letter})</span>
                          <span className="font-mono text-[10px]">Méd. {pezAvg}</span>
                        </div>
                        <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
                          {pezs.map((p) => (
                            <div
                              key={p.id}
                              className="text-[11px] text-slate-300 flex items-center justify-between truncate"
                            >
                              <span className="truncate">{p.nome}</span>
                              <span className="font-mono text-slate-500 shrink-0 ml-1">
                                {p.handicap.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card Novo: Seleção e Organização de Baterias pelo Operador */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-sm font-bold text-white block">
                    Quantidade e Formato das Baterias
                  </label>
                  <span className="text-xs text-slate-400">
                    Defina quantas baterias o evento terá (1, 3, 9 ou personalizado)
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {effectiveNumBatteries} {effectiveNumBatteries === 1 ? 'Bateria' : 'Baterias'}
              </span>
            </div>

            {/* Banner de Recomendação Inteligente para o Operador */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                batteryRecommendation.isApplied
                  ? 'bg-emerald-950/25 border-emerald-500/35 shadow-lg shadow-emerald-950/30'
                  : 'bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-amber-500/10 border-amber-500/40 shadow-xl shadow-amber-500/5'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      batteryRecommendation.isApplied
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {batteryRecommendation.isApplied ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> Recomendação do Sistema:
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        {batteryRecommendation.title}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700">
                        ~{batteryRecommendation.runsPerBattery} corridas/bateria
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      {batteryRecommendation.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-slate-400">
                      <span>
                        Lote de Gado:{' '}
                        <strong className="text-slate-200 font-mono">
                          ~{batteryRecommendation.runsPerBattery} bois/bateria
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Descanso dos Animais:{' '}
                        <strong className="text-emerald-400 font-semibold">
                          {batteryRecommendation.restLabel}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 md:self-center">
                  {batteryRecommendation.isApplied ? (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Recomendação Ativa</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyRecommendation}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>Aplicar {batteryRecommendation.title}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Opção 1: Baterias por Cruzamento (Oficial) */}
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    numBatteries: totalCrossPhases,
                    batteryMode: 'phases',
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  currentBatteryMode === 'phases' && effectiveNumBatteries === totalCrossPhases
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">{totalCrossPhases} Baterias</span>
                  <div className="flex items-center gap-1">
                    {batteryRecommendation.presetKey === 'phases' && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-sm flex items-center gap-0.5">
                        ★ Recomendado
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Oficial
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">Por Cruzamento</div>
                <div className="text-[10px] text-slate-500 mt-0.5">1 fase por bateria (A×A, B×B...)</div>
              </button>

              {/* Opção 2: Grandes Baterias (Adaptável ao número de grupos) */}
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    numBatteries: majorOption.num,
                    batteryMode: majorOption.mode,
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  currentBatteryMode === majorOption.mode && effectiveNumBatteries === majorOption.num
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">{majorOption.label}</span>
                  <div className="flex items-center gap-1">
                    {batteryRecommendation.presetKey === 'major3' && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-sm flex items-center gap-0.5">
                        ★ Recomendado
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      {majorOption.tag}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">Grandes Baterias</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{majorOption.sub}</div>
              </button>

              {/* Opção 3: 1 Bateria Única */}
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    numBatteries: 1,
                    batteryMode: 'single',
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  currentBatteryMode === 'single' || effectiveNumBatteries === 1
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">1 Bateria</span>
                  <div className="flex items-center gap-1">
                    {batteryRecommendation.presetKey === 'single' && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-sm flex items-center gap-0.5">
                        ★ Recomendado
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-400/20 text-blue-300 border border-blue-400/30">
                      Contínua
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">Bateria Única</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sem quebras, corrida geral</div>
              </button>

              {/* Opção 4: Personalizado */}
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    batteryMode: 'custom',
                    numBatteries: config.numBatteries || 6,
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  currentBatteryMode === 'custom' &&
                  effectiveNumBatteries !== 1 &&
                  effectiveNumBatteries !== totalCrossPhases &&
                  effectiveNumBatteries !== majorOption.num
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">Personalizar</span>
                  <div className="flex items-center gap-1">
                    {batteryRecommendation.presetKey === 'custom' && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-sm flex items-center gap-0.5">
                        ★ Recomendado
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-300 border border-purple-400/30">
                      Livre
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">Nº de Baterias</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Defina qualquer quantidade</div>
              </button>
            </div>

            {/* Stepper & Botões Rápidos para Seleção Fina */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Ajuste Fino da Quantidade de Baterias
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Distribuirá as {totalPossibleRuns} corridas em blocos equilibrados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(1, effectiveNumBatteries - 1);
                      onChangeConfig({
                        ...config,
                        numBatteries: next,
                        batteryMode:
                          next === 1
                            ? 'single'
                            : next === 3 && totalCrossPhases === 9
                            ? 'major3'
                            : next === totalCrossPhases
                            ? 'phases'
                            : 'custom',
                      });
                    }}
                    disabled={effectiveNumBatteries <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-base transition cursor-pointer"
                  >
                    -
                  </button>

                  <div className="w-16 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono font-black text-amber-400 text-sm">
                    {effectiveNumBatteries}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(16, effectiveNumBatteries + 1);
                      onChangeConfig({
                        ...config,
                        numBatteries: next,
                        batteryMode:
                          next === totalCrossPhases
                            ? 'phases'
                            : next === 3 && totalCrossPhases === 9
                            ? 'major3'
                            : 'custom',
                      });
                    }}
                    disabled={effectiveNumBatteries >= 16}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-base transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botões de atalho rápido de números de bateria */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 mr-1">Atalhos rápidos:</span>
                {[1, 2, 3, 4, 5, 6, 8, 9, 12].map((n) => {
                  const isCur = effectiveNumBatteries === n;
                  const isRec = batteryRecommendation.numBatteries === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          numBatteries: n,
                          batteryMode:
                            n === 1
                              ? 'single'
                              : n === 3 && totalCrossPhases === 9
                              ? 'major3'
                              : n === totalCrossPhases
                              ? 'phases'
                              : 'custom',
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                        isCur
                          ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 ring-1 ring-amber-300'
                          : isRec
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>{n} {n === 1 ? 'bateria' : 'bat'}</span>
                      {isRec && !isCur && (
                        <span className="text-[10px] text-amber-400 font-sans" title="Número recomendado pelo sistema">
                          ★
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Info da distribuição */}
              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span>
                  Média por bateria:{' '}
                  <strong className="text-white font-mono">
                    ~{Math.ceil(totalPossibleRuns / effectiveNumBatteries)} corridas
                  </strong>
                </span>
                <span className="text-amber-400 font-medium">
                  {effectiveNumBatteries === 9 && 'Formato Oficial (9 fases)'}
                  {effectiveNumBatteries === 3 && '3 Grandes Baterias (Diretos + Cruzamentos)'}
                  {effectiveNumBatteries === 1 && 'Bateria Única (sem interrupções)'}
                  {![1, 3, 9].includes(effectiveNumBatteries) &&
                    `${effectiveNumBatteries} baterias equilibradas`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Regra dos Bois por Somatória (SHC) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white block">
                    Critério de Bois por Somatória (SHC)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Define automaticamente quais campos de laçada serão liberados na súmula
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                Regra Automática
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                  <span>1 Boi</span>
                  <span className="font-mono">SHC &le; 3.5</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Apenas o campo Boi 1 liberado. Bois 2 e 3 ficam bloqueados.
                </div>
                <div className="mt-2 text-xs font-extrabold text-white font-mono">
                  {boisDistribution.b1} duplas
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                  <span>2 Bois</span>
                  <span className="font-mono">4.0 a 5.5</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Campos Boi 1 e Boi 2 liberados. Boi 3 fica bloqueado.
                </div>
                <div className="mt-2 text-xs font-extrabold text-white font-mono">
                  {boisDistribution.b2} duplas
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-1">
                  <span>3 Bois</span>
                  <span className="font-mono">SHC &ge; 6.0</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Todos os 3 campos (Boi 1, 2 e 3) liberados para digitação.
                </div>
                <div className="mt-2 text-xs font-extrabold text-white font-mono">
                  {boisDistribution.b3} duplas
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Distanciamento Mínimo (Gap) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <label htmlFor="minGapInput" className="text-sm font-bold text-white block">
                    Distanciamento Mínimo (Gap Interno)
                  </label>
                  <span className="text-xs text-slate-400">
                    Distância entre corridas do mesmo competidor dentro de cada bateria
                  </span>
                </div>
              </div>

              <input
                id="minGapInput"
                type="number"
                min="1"
                max="15"
                value={config.minGap}
                onChange={(e) =>
                  onChangeConfig({ ...config, minGap: parseInt(e.target.value, 10) || 5 })
                }
                className="w-16 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Nas baterias cruzadas, os competidores dos outros grupos descansam por rodadas inteiras,
                garantindo recuperação excelente dos animais de arena.
              </span>
            </div>
          </div>
        </div>

        {/* Live Simulation Card & Cross-Matrix (1 Col) */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Fluxo de Cruzamento Oficial</h3>
            </div>

            {/* Sequence flow of batteries based on selected mode */}
            <div className="space-y-3 text-xs">
              {currentBatteryMode === 'major3' ? (
                <>
                  <div>
                    <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Bateria 1 (Fases Diretas):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                        A × A
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                        B × B
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                        C × C
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Bateria 2 (Cruzamentos 1):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono font-bold">
                        C × B
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono font-bold">
                        A × C
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono font-bold">
                        B × A
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Bateria 3 (Cruzamentos 2):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                        A × B
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                        B × C
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                        C × A
                      </span>
                    </div>
                  </div>
                </>
              ) : currentBatteryMode === 'single' ? (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="text-white font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Bateria Única Geral
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Todas as {totalPossibleRuns} corridas serão disputadas sequencialmente em uma
                    única bateria contínua, organizadas por rodadas.
                  </p>
                </div>
              ) : currentBatteryMode === 'custom' ? (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-white font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    {effectiveNumBatteries} Baterias Personalizadas
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: effectiveNumBatteries }, (_, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono text-center"
                      >
                        Bateria {i + 1} (~{Math.ceil(totalPossibleRuns / effectiveNumBatteries)} corr.)
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Fase 1 (Intra-grupo / Diretos):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupedPreview.groupLetters.map((l) => (
                        <span
                          key={l}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold"
                        >
                          {l} × {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  {groupedPreview.groupLetters.length >= 2 && (
                    <div>
                      <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Fase 2 (Cruzamentos 1):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {groupedPreview.groupLetters.map((l, idx) => {
                          const other =
                            groupedPreview.groupLetters[
                              (idx + 1) % groupedPreview.groupLetters.length
                            ];
                          return (
                            <span
                              key={l}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono font-bold"
                            >
                              {l} × {other}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {groupedPreview.groupLetters.length >= 3 && (
                    <div>
                      <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        Fase 3 (Cruzamentos 2):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {groupedPreview.groupLetters.map((l, idx) => {
                          const other =
                            groupedPreview.groupLetters[
                              (idx + 2) % groupedPreview.groupLetters.length
                            ];
                          return (
                            <span
                              key={l}
                              className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold"
                            >
                              {l} × {other}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Summary metrics */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total de Baterias</span>
                <span className="font-bold text-white font-mono">
                  {effectiveNumBatteries}{' '}
                  {effectiveNumBatteries === 1 ? 'bateria' : 'baterias'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Recomendado p/ Arena</span>
                <span className="font-bold text-amber-400 font-mono text-[11px] flex items-center gap-1">
                  <span>{batteryRecommendation.numBatteries} {batteryRecommendation.numBatteries === 1 ? 'bateria' : 'baterias'}</span>
                  {batteryRecommendation.isApplied ? (
                    <span className="text-emerald-400 font-sans text-[10px] bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      (Ativa)
                    </span>
                  ) : (
                    <span className="text-slate-500 font-sans text-[10px]">
                      (Sugestão)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total de Corridas</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {totalPossibleRuns} corridas
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cobertura de Duplas</span>
                <span className="font-bold text-amber-400 font-mono">100% (Todos x Todos)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Somatória de Handicap</span>
                <span className="font-bold text-emerald-400 font-mono">Livre (Sem Limite)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Auto-cruzamento</span>
                <span className="font-bold text-sky-400 font-mono text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span>
                  Bloqueado (Backtracking)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Award className="w-3.5 h-3.5" />
                Regra Oficial de Arena
              </div>
              <p className="leading-relaxed">
                Cada cabeceiro corre exatamente 1 vez com cada pezeiro do evento, sem exclusão por limite,
                e os tempos são apurados conforme os bois liberados para cada dupla.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Cabeceiros
        </button>

        <button
          type="button"
          onClick={onGenerateDraw}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 cursor-pointer"
        >
          <Shuffle className="w-5 h-5 stroke-[2.5]" />
          <span>Gerar Sorteio Oficial (Somatória Livre)</span>
        </button>
      </div>
    </div>
  );
};
