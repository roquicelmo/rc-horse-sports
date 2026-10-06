import React, { useState, useMemo } from 'react';
import type { Run, DrawConfig } from '../types/roping';
import {
  Search,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Lock,
  Trophy,
  CheckCircle2,
  LayoutGrid,
  List,
  Wand2,
  Medal,
  Activity,
  User,
  Hash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RunsTableProps {
  runs: Run[];
  config: DrawConfig;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onReDraw: () => void;
  onBackToConfig: () => void;
  onUpdateTime: (runId: string, boi: 1 | 2 | 3, value: string, isNt?: boolean) => void;
  onFillSampleTimes?: () => void;
  onClearAllTimes?: () => void;
}

export const RunsTable: React.FC<RunsTableProps> = ({
  runs,
  config,
  searchTerm,
  onSearchChange,
  onReDraw,
  onBackToConfig,
  onUpdateTime,
  onFillSampleTimes,
  onClearAllTimes,
}) => {
  // Mode: 'grouped_batteries' (Todas as baterias na tela em cards/seções) ou 'single_table'
  const [viewMode, setViewMode] = useState<'grouped_batteries' | 'single_table'>('grouped_batteries');
  // Se deve filtrar a visualização para exibir apenas os resultados da busca (true) ou mostrar todos com destaque
  const [filterOnlyMatches, setFilterOnlyMatches] = useState(true);
  // Accordion das Baterias: Set de baterias recolhidas (por padrão vazio, ou seja, TODAS abertas por padrão)
  const [collapsedBatteries, setCollapsedBatteries] = useState<Set<number>>(new Set());

  const toggleBattery = (num: number) => {
    setCollapsedBatteries((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  const expandAllBatteries = () => setCollapsedBatteries(new Set());
  const collapseAllBatteries = () => {
    setCollapsedBatteries(new Set(batteries.map((b) => b.num)));
  };

  // Map batteries with their cross labels
  const batteries = useMemo(() => {
    const map = new Map<number, string>();
    runs.forEach((r) => {
      if (!map.has(r.bateria)) {
        map.set(r.bateria, r.cruzamento);
      }
    });
    return Array.from(map.entries())
      .map(([num, cruzamento]) => ({ num, cruzamento }))
      .sort((a, b) => a.num - b.num);
  }, [runs]);

  // Lista dinâmica de todas as Rodadas existentes no sorteio (1, 2, 3... R)
  const availableRodadas = useMemo(() => {
    const set = new Set<number>();
    runs.forEach((r) => set.add(r.rodada));
    return Array.from(set).sort((a, b) => a - b);
  }, [runs]);

  // Função auxiliar para normalização de texto (remove acentos, caixa alta, caracteres de multiplicação)
  const normalize = (str: string): string => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[×xX]/g, 'x')
      .trim();
  };

  const cleanTerm = searchTerm.trim();
  const hasSearch = cleanTerm.length > 0;

  // Identifica o tipo de busca baseado no input do usuário:
  // Se for Número: trata como Nº da Corrida
  // Se for Rodada: trata como Rodada X
  // Se for Cruzamento: trata como A x B
  // Se for Texto: trata como Nome do Laçador
  const searchDetection = useMemo(() => {
    if (!cleanTerm) return { type: 'empty' as const, label: '' };

    // Regra do Número: dígitos puros ou com prefixos (n, nº, corrida, #)
    const numberPattern = /^(?:(?:corrida|número|numero|num[º°\.]?|no[º°\.]?|n[º°\.]?|#|c)\s*#?\s*)?(\d+)$/i;
    const numMatch = cleanTerm.match(numberPattern);
    if (numMatch) {
      return {
        type: 'number' as const,
        label: `Corrida #${parseInt(numMatch[1], 10)}`,
        targetNum: parseInt(numMatch[1], 10),
      };
    }

    // Regra da Rodada (ex: Rodada 1, R1, r 2)
    const rodadaPattern = /^(?:rodada|r)\s*(\d+)$/i;
    const rodMatch = cleanTerm.match(rodadaPattern);
    if (rodMatch) {
      const rodNum = parseInt(rodMatch[1], 10);
      return {
        type: 'rodada' as const,
        label: `Rodada ${rodNum}`,
        targetRodada: rodNum,
      };
    }

    // Formato de cruzamento (ex: A x B)
    const cruzPattern = /^([a-zA-Z])\s*[xX×]\s*([a-zA-Z])$/i;
    const cruzMatch = cleanTerm.match(cruzPattern);
    if (cruzMatch) {
      return {
        type: 'cross' as const,
        label: `Cruzamento ${cruzMatch[1].toUpperCase()} × ${cruzMatch[2].toUpperCase()}`,
        cruzamento: `${cruzMatch[1].toUpperCase()} × ${cruzMatch[2].toUpperCase()}`,
      };
    }

    // Regra do Texto: Nome do laçador
    return {
      type: 'name' as const,
      label: `Laçador "${cleanTerm}"`,
    };
  }, [cleanTerm]);

  // Lógica de busca refinada conforme a regra:
  // 1. Se digitar número -> Pesquisar pelo número da corrida
  // 2. Se digitar rodada (ex: "rodada 1", "r1") -> Pesquisar pela rodada
  // 3. Se for texto -> Pesquisar pelo nome do laçador (cabeceiro ou pezeiro)
  const isRunMatchingSearch = (run: Run): boolean => {
    if (!cleanTerm) return false;

    // 1. REGRA DO NÚMERO: Se digitar número, considerar que é o número da corrida
    const numberPattern = /^(?:(?:corrida|número|numero|num[º°\.]?|no[º°\.]?|n[º°\.]?|#|c)\s*#?\s*)?(\d+)$/i;
    const numMatch = cleanTerm.match(numberPattern);
    if (numMatch) {
      const targetNum = parseInt(numMatch[1], 10);
      return run.numero === targetNum;
    }

    const q = normalize(cleanTerm);
    if (!q) return false;

    // 2. REGRA DA RODADA: "rodada 1", "r1", "r 2"
    const rodadaPattern = /^(?:rodada|r)\s*(\d+)$/i;
    const rodMatch = q.match(rodadaPattern);
    if (rodMatch) {
      return run.rodada === parseInt(rodMatch[1], 10);
    }

    // 3. Cruzamento explícito (ex: "A x B", "AxB")
    const cruzPattern = /^([a-zA-Z])\s*x\s*([a-zA-Z])$/i;
    const cruzMatch = q.match(cruzPattern);
    if (cruzMatch) {
      const expected = `${cruzMatch[1].toUpperCase()} × ${cruzMatch[2].toUpperCase()}`;
      return run.cruzamento === expected;
    }

    // 4. REGRA DO TEXTO: Se for Texto, pesquisar considerando que seja nome do laçador (cabeceiro ou pezeiro)
    const cabNome = normalize(run.cabeceiro.nome);
    const pezNome = normalize(run.pezeiro.nome);
    const combinedNames = `${cabNome} ${pezNome}`;

    const words = q.split(/\s+/).filter(Boolean);
    return words.every((word) => combinedNames.includes(word));
  };

  const totalSearchMatches = useMemo(() => {
    if (!cleanTerm) return runs.length;
    return runs.filter(isRunMatchingSearch).length;
  }, [runs, cleanTerm]);

  // Overall statistics & Leaders ranking
  const stats = useMemo(() => {
    const totalRuns = runs.length;
    if (totalRuns === 0) {
      return { totalRuns: 0, avgShc: '0.0', bois1: 0, bois2: 0, bois3: 0, batteriesCount: 0, completedRuns: 0 };
    }
    const sumShc = runs.reduce((acc, r) => acc + r.shc, 0);
    const avgShc = (sumShc / totalRuns).toFixed(1);
    const bois1 = runs.filter((r) => r.bois === 1).length;
    const bois2 = runs.filter((r) => r.bois === 2).length;
    const bois3 = runs.filter((r) => r.bois === 3).length;
    const completedRuns = runs.filter((r) => r.mediaFinal !== null && r.mediaFinal !== undefined).length;

    return {
      totalRuns,
      avgShc,
      bois1,
      bois2,
      bois3,
      batteriesCount: batteries.length,
      completedRuns,
    };
  }, [runs, batteries]);

  // Leaderboard: classificados ordenados por MENOR MÉDIA FINAL (quanto menor a média, melhor a classificação)
  const leaders = useMemo(() => {
    return runs
      .filter((r) => r.mediaFinal !== null && r.mediaFinal !== undefined && !r.isNt)
      .sort((a, b) => (a.mediaFinal || 0) - (b.mediaFinal || 0))
      .slice(0, 5);
  }, [runs]);

  const handleExportCSV = () => {
    const headers = [
      'Nº Corrida',
      'Fase',
      'Rodada',
      'Cruzamento',
      'Bateria',
      'Cabeceiro',
      'Chave Cab.',
      'Hcp Cab.',
      'Pezeiro',
      'Chave Pez.',
      'Hcp Pez.',
      'SHC (Soma)',
      'Bois da Dupla',
      'T1 (s)',
      'T2 (s)',
      'T3 (s)',
      'Tempo Total (s)',
      'Média Final (s)',
      'Status',
    ];
    const rows = runs.map((r) => [
      r.numero,
      `Fase ${r.fase}`,
      `Rodada ${r.rodada}`,
      `"${r.cruzamento}"`,
      `Bateria ${r.bateria}`,
      `"${r.cabeceiro.nome}"`,
      r.cabeceiroGrupo,
      r.cabeceiro.handicap.toFixed(1),
      `"${r.pezeiro.nome}"`,
      r.pezeiroGrupo,
      r.pezeiro.handicap.toFixed(1),
      r.shc.toFixed(1),
      `${r.bois} ${r.bois === 1 ? 'Boi' : 'Bois'}`,
      r.times.boi1Nt ? 'NT' : r.times.boi1 || '',
      r.bois >= 2 ? (r.times.boi2Nt ? 'NT' : r.times.boi2 || '') : 'BLOQUEADO',
      r.bois >= 3 ? (r.times.boi3Nt ? 'NT' : r.times.boi3 || '') : 'BLOQUEADO',
      r.isNt ? 'NT' : r.totalTime ? r.totalTime.toFixed(2) : '',
      r.isNt ? 'NT' : r.mediaFinal ? r.mediaFinal.toFixed(2) : '',
      r.isNt ? 'ZERADO (NT)' : r.mediaFinal ? 'CONCLUÍDO' : 'PENDENTE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sumula_tempos_e_medias_laco.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderHighlightedName = (name: string) => {
    if (!cleanTerm) return name;

    const qClean = cleanTerm
      .replace(/^(corrida|bateria|bat|chave|cruzamento|cruz|n[º°\.]?|no[º°\.]?|num[º°\.]?|#)\s*/i, '')
      .trim();

    const normName = normalize(name);
    const normQ = normalize(qClean);

    if (!normQ) return name;

    const tokens = normQ.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      const idx = normName.indexOf(token);
      if (idx !== -1) {
        const before = name.substring(0, idx);
        const match = name.substring(idx, idx + token.length);
        const after = name.substring(idx + token.length);
        return (
          <>
            {before}
            <mark className="bg-amber-400 text-slate-950 font-black px-0.5 rounded shadow-sm">
              {match}
            </mark>
            {after}
          </>
        );
      }
    }
    return name;
  };

  // Render table column header row (placed immediately after each Rodada description)
  const renderTableHeader = (keyPrefix = 'th') => (
    <tr
      key={`${keyPrefix}-header-row`}
      className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 select-none"
    >
      <th className="py-2.5 px-3 w-16 text-center">Nº</th>
      <th className="py-2.5 px-3 w-32 text-slate-300 font-bold">Bateria</th>
      <th className="py-2.5 px-3 min-w-[190px]">Cabeceiro</th>
      <th className="py-2.5 px-2 w-14 min-w-[56px] text-center text-slate-500 font-mono text-xs"></th>
      <th className="py-2.5 px-3 min-w-[190px]">Pezeiro</th>
      <th className="py-2.5 px-2 w-16 text-center text-slate-400">SHC</th>
      <th className="py-2.5 px-2 w-24 text-center text-slate-400 font-bold">Qtd Bois</th>
      <th className="py-2.5 px-1.5 w-24 text-center text-slate-300 font-bold">
        <div>T1</div>
        <div className="text-[9px] font-normal text-slate-500">Tempo 1</div>
      </th>
      <th className="py-2.5 px-1.5 w-24 text-center text-slate-300 font-bold">
        <div>T2</div>
        <div className="text-[9px] font-normal text-slate-500">Tempo 2</div>
      </th>
      <th className="py-2.5 px-1.5 w-24 text-center text-slate-300 font-bold">
        <div>T3</div>
        <div className="text-[9px] font-normal text-slate-500">Tempo 3</div>
      </th>
      <th className="py-2.5 px-2 w-20 text-center text-slate-300 font-bold">
        <div>Total (s)</div>
        <div className="text-[9px] font-normal text-slate-500">Soma</div>
      </th>
      <th className="py-2.5 px-3 w-40 min-w-[150px] whitespace-nowrap text-center text-slate-200 bg-slate-900/40">
        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Média Final</span>
        </div>
        <div className="text-[9px] font-normal text-slate-400 whitespace-nowrap">Classificação</div>
      </th>
    </tr>
  );

  // Render individual run row (reused in both single table and grouped view)
  const renderRunRow = (run: Run) => {
    const isMatching = isRunMatchingSearch(run);
    const boi2Allowed = run.bois >= 2;
    const boi3Allowed = run.bois >= 3;
    const isCompleted = run.mediaFinal !== null && run.mediaFinal !== undefined && !run.isNt;
    const isNt = run.isNt;

    return (
      <tr
        key={run.id}
        className={`transition-colors duration-150 ${
          isMatching
            ? 'bg-amber-500/20 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/10 font-medium border-b border-amber-500/40'
            : isCompleted
            ? 'bg-emerald-950/25 border-b border-emerald-500/30 border-l-4 border-l-emerald-500 hover:bg-emerald-950/35'
            : isNt
            ? 'bg-rose-950/20 border-b border-rose-500/30 border-l-4 border-l-rose-500 hover:bg-rose-950/30'
            : 'border-b border-slate-800/60 even:bg-slate-950/40 odd:bg-slate-900/50 hover:bg-slate-800/60'
        }`}
      >
        {/* Nº Coluna */}
        <td className="py-3 px-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            {isCompleted && (
              <span title="Corrida Concluída com Sucesso">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </span>
            )}
            <span
              className={`inline-block w-9 py-1 rounded-lg font-mono font-bold text-xs text-center transition-all ${
                isMatching
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : isCompleted
                  ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/50 shadow-sm'
                  : isNt
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              #{run.numero < 10 ? `0${run.numero}` : run.numero}
            </span>
          </div>
        </td>

        {/* BATERIA EM DESTAQUE COM CRUZAMENTO DISCRETO */}
        <td className="py-3 px-3">
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-extrabold font-mono bg-slate-800 text-slate-100 border border-slate-700 shadow-sm">
              Bateria {run.bateria}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="px-1.5 py-0.2 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                {run.cruzamento}
              </span>
              <span className="text-slate-400 font-semibold">
                R{run.rodada}
              </span>
            </div>
          </div>
        </td>

        {/* Cabeceiro */}
        <td className="py-3 px-3 min-w-[190px]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">
              {run.cabeceiroGrupo}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-100 text-xs sm:text-sm truncate">
                {renderHighlightedName(run.cabeceiro.nome)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Hcp {run.cabeceiro.handicap.toFixed(1)} • Chave {run.cabeceiroGrupo}
              </div>
            </div>
          </div>
        </td>

        {/* COLUNA INTERMEDIÁRIA X (CRUZAMENTO ENTRE LAÇADORES - CENTRALIZADO E MAIOR) */}
        <td className="py-3 px-2 text-center w-14 min-w-[56px] select-none align-middle">
          <div className="flex items-center justify-center">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/80 text-amber-400 font-mono font-black text-sm shadow-sm"
              title="Cruzamento Cabeceiro × Pezeiro"
            >
              ×
            </span>
          </div>
        </td>

        {/* Pezeiro */}
        <td className="py-3 px-3 min-w-[190px]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">
              {run.pezeiroGrupo}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-100 text-xs sm:text-sm truncate">
                {renderHighlightedName(run.pezeiro.nome)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Hcp {run.pezeiro.handicap.toFixed(1)} • Chave {run.pezeiroGrupo}
              </div>
            </div>
          </div>
        </td>

        {/* SHC (Soma) - Neutro e elegante */}
        <td className="py-3 px-2 text-center">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border bg-slate-800/80 border-slate-700 text-slate-300">
            {run.shc.toFixed(1)}
          </span>
        </td>

        {/* Qtd Bois da Dupla - Discreto */}
        <td className="py-3 px-2 text-center">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border font-mono bg-slate-800/60 border-slate-700 text-slate-300"
            title={`Somatória ${run.shc.toFixed(1)} dá direito a ${run.bois} boi(s)`}
          >
            {run.bois} {run.bois === 1 ? 'Boi' : 'Bois'}
          </span>
        </td>

        {/* CAMPO DE TEMPO: T1 (Sempre Liberado - Neutro) */}
        <td className="py-3 px-1.5 text-center w-24">
          <div className="flex items-center justify-center gap-1">
            {run.times.boi1Nt ? (
              <button
                type="button"
                onClick={() => onUpdateTime(run.id, 1, '', false)}
                className="w-14 py-1 rounded-md bg-rose-950/50 border border-rose-600/60 text-rose-300 font-mono font-bold text-xs hover:bg-rose-900/60"
                title="Clique para destravar e digitar tempo"
              >
                NT ✕
              </button>
            ) : (
              <input
                type="text"
                value={run.times.boi1}
                onChange={(e) => onUpdateTime(run.id, 1, e.target.value)}
                placeholder="0.00"
                className="w-14 py-1 px-1 text-center font-mono font-bold text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition"
              />
            )}
            <button
              type="button"
              onClick={() => onUpdateTime(run.id, 1, '', !run.times.boi1Nt)}
              className={`px-1 py-1 text-[9px] font-bold rounded border transition ${
                run.times.boi1Nt
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-400'
              }`}
              title="Marcar No Time"
            >
              NT
            </button>
          </div>
        </td>

        {/* CAMPO DE TEMPO: T2 (Liberado se Qtd Bois >= 2; Bloqueado se Qtd Bois == 1 - Neutro) */}
        <td className="py-3 px-1.5 text-center w-24">
          {boi2Allowed ? (
            <div className="flex items-center justify-center gap-1">
              {run.times.boi2Nt ? (
                <button
                  type="button"
                  onClick={() => onUpdateTime(run.id, 2, '', false)}
                  className="w-14 py-1 rounded-md bg-rose-950/50 border border-rose-600/60 text-rose-300 font-mono font-bold text-xs hover:bg-rose-900/60"
                  title="Clique para destravar e digitar tempo"
                >
                  NT ✕
                </button>
              ) : (
                <input
                  type="text"
                  value={run.times.boi2}
                  onChange={(e) => onUpdateTime(run.id, 2, e.target.value)}
                  placeholder="0.00"
                  className="w-14 py-1 px-1 text-center font-mono font-bold text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition"
                />
              )}
              <button
                type="button"
                onClick={() => onUpdateTime(run.id, 2, '', !run.times.boi2Nt)}
                className={`px-1 py-1 text-[9px] font-bold rounded border transition ${
                  run.times.boi2Nt
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-400'
                }`}
                title="Marcar No Time"
              >
                NT
              </button>
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-1 py-1 px-1 rounded-md bg-slate-950/40 border border-slate-800/40 text-slate-600 select-none cursor-not-allowed"
              title="Bloqueado: Dupla com SHC <= 3.5 corre apenas 1 Boi"
            >
              <Lock className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] font-mono">1b max</span>
            </div>
          )}
        </td>

        {/* CAMPO DE TEMPO: T3 (Liberado se Qtd Bois == 3; Bloqueado se Qtd Bois <= 2 - Neutro) */}
        <td className="py-3 px-1.5 text-center w-24">
          {boi3Allowed ? (
            <div className="flex items-center justify-center gap-1">
              {run.times.boi3Nt ? (
                <button
                  type="button"
                  onClick={() => onUpdateTime(run.id, 3, '', false)}
                  className="w-14 py-1 rounded-md bg-rose-950/50 border border-rose-600/60 text-rose-300 font-mono font-bold text-xs hover:bg-rose-900/60"
                  title="Clique para destravar e digitar tempo"
                >
                  NT ✕
                </button>
              ) : (
                <input
                  type="text"
                  value={run.times.boi3}
                  onChange={(e) => onUpdateTime(run.id, 3, e.target.value)}
                  placeholder="0.00"
                  className="w-14 py-1 px-1 text-center font-mono font-bold text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition"
                />
              )}
              <button
                type="button"
                onClick={() => onUpdateTime(run.id, 3, '', !run.times.boi3Nt)}
                className={`px-1 py-1 text-[9px] font-bold rounded border transition ${
                  run.times.boi3Nt
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-400'
                }`}
                title="Marcar No Time"
              >
                NT
              </button>
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-1 py-1 px-1 rounded-md bg-slate-950/40 border border-slate-800/40 text-slate-600 select-none cursor-not-allowed"
              title="Bloqueado: Dupla com SHC <= 5.5 corre no máximo 2 Bois"
            >
              <Lock className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] font-mono">2b max</span>
            </div>
          )}
        </td>

        {/* TEMPO TOTAL ACUMULADO */}
        <td className="py-3 px-2 text-center">
          {run.isNt ? (
            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-slate-800 text-rose-400 border border-slate-700">
              NT
            </span>
          ) : run.totalTime !== null && run.totalTime !== undefined ? (
            <span className="font-mono text-xs font-bold text-slate-200">
              {run.totalTime.toFixed(2)}s
            </span>
          ) : (
            <span className="text-xs text-slate-600 font-mono">—</span>
          )}
        </td>

        {/* COLUNA MÉDIA FINAL (LARGURA AUMENTADA PARA CABER EM UMA ÚNICA LINHA) */}
        <td className="py-3 px-3 text-center w-40 min-w-[150px] whitespace-nowrap">
          {run.isNt ? (
            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap">
              ZEROU (NT)
            </span>
          ) : run.mediaFinal !== null && run.mediaFinal !== undefined ? (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10 whitespace-nowrap"
              title={`Média calculada: ${run.totalTime?.toFixed(2)}s / ${run.bois} boi(s) = ${run.mediaFinal.toFixed(2)}s`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {run.mediaFinal.toFixed(2)}s
            </span>
          ) : (
            <span className="text-xs text-slate-600 font-mono">—</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Event Statistics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Etapa 4: Oficial
            </span>
            <span className="text-xs text-slate-400">Classificação por Menor Média Final</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Ordem de Corrida & Lançamento de Tempos (T1, T2, T3)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Baterias organizadas por Rodadas • Média Final calculada por{' '}
            <code className="text-amber-400 font-mono font-bold">&Sigma;(Tempos) / Qtd Bois</code>{' '}
            para definir a classificação da prova.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onFillSampleTimes && (
            <button
              onClick={onFillSampleTimes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer"
              title="Simula o preenchimento automático de tempos realistas para demonstração e apuração da média"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Simular Tempos
            </button>
          )}

          {onClearAllTimes && (
            <button
              onClick={onClearAllTimes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Limpar todos os tempos preenchidos"
            >
              Limpar Tempos
            </button>
          )}

          <button
            onClick={onBackToConfig}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            Ajustar Regras
          </button>

          <button
            onClick={onReDraw}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sortear
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>
      </div>

      {/* KPI Cards & Live Podium (Sorted strictly by Menor Média Final) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400 font-medium">Progresso da Prova</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {stats.completedRuns} / {stats.totalRuns}
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${stats.totalRuns > 0 ? (stats.completedRuns / stats.totalRuns) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400 font-medium">Critério de Classificação</div>
          <div className="text-base font-extrabold text-amber-400 mt-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            Menor Média Final
          </div>
          <div className="text-[11px] text-slate-400 mt-1 leading-tight">
            Tempo dividido pela Qtd de Bois da dupla. Quanto menor a média, maior a classificação.
          </div>
        </div>

        {/* Live Podium Leaderboard (Sorted by Menor Média Final) */}
        <div className="md:col-span-2 p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Trophy className="w-4 h-4" /> Classificação Geral (Líderes por Menor Média Final)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">Top 5 Duplas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {leaders.length === 0 ? (
              <div className="col-span-3 text-xs text-slate-500 py-1 text-center font-medium">
                Nenhum tempo lançado ainda. Digite os tempos T1, T2 e T3 ou clique em &quot;Simular Tempos&quot;
                para apurar os líderes da prova.
              </div>
            ) : (
              leaders.map((lead, idx) => (
                <div
                  key={lead.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    idx === 0
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : idx === 1
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="truncate min-w-0 pr-1">
                    <div className="font-bold text-white flex items-center gap-1 truncate">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">
                        #{lead.numero} {lead.cabeceiro.nome.split(' ')[0]}/{lead.pezeiro.nome.split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate">
                      {lead.cruzamento} • {lead.bois}b ({lead.totalTime?.toFixed(2)}s)
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Média</div>
                    <div className="font-mono font-black text-amber-300 text-sm">
                      {lead.mediaFinal?.toFixed(2)}s
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SEARCH AND VIEW TOGGLE BAR */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Digite o Nº da corrida (ex: 15, #15) ou o Nome do laçador (ex: Marcio, Garcia)..."
              className="w-full pl-10 pr-24 py-2.5 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                title="Limpar busca"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>

          {hasSearch && (
            <div className="flex flex-wrap items-center gap-2">
              {searchDetection.type === 'number' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold shrink-0">
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  <span>Corrida #{searchDetection.targetNum} ({totalSearchMatches} {totalSearchMatches === 1 ? 'encontrada' : 'encontradas'})</span>
                </div>
              )}

              {searchDetection.type === 'name' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs font-bold shrink-0">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Laçador: &quot;{cleanTerm}&quot; ({totalSearchMatches} {totalSearchMatches === 1 ? 'corrida' : 'corridas'})</span>
                </div>
              )}

              {searchDetection.type === 'cross' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{searchDetection.cruzamento} ({totalSearchMatches} {totalSearchMatches === 1 ? 'corrida' : 'corridas'})</span>
                </div>
              )}

              {searchDetection.type === 'rodada' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold shrink-0">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rodada {searchDetection.targetRodada} ({totalSearchMatches} {totalSearchMatches === 1 ? 'corrida' : 'corridas'})</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setFilterOnlyMatches(!filterOnlyMatches)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                  filterOnlyMatches
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Alternar entre filtrar apenas resultados ou mostrar toda a lista destacada"
              >
                {filterOnlyMatches ? 'Filtrando apenas resultados' : 'Mostrando lista completa'}
              </button>
            </div>
          )}

          {/* View Mode Toggle: All Batteries stacked on screen vs Single Table */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grouped_batteries')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'grouped_batteries'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Exibir todas as baterias na tela em blocos separados com cruzamento destacado"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Todas as Baterias</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('single_table')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'single_table'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Exibir lista de corridas contínua em tabela"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabela Contínua</span>
            </button>
          </div>
        </div>

        {/* Quick Example Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <span className="font-semibold text-slate-500">Exemplos rápidos:</span>
          <button
            type="button"
            onClick={() => onSearchChange('15')}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono transition cursor-pointer"
          >
            Corrida 15
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('nº 1')}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono transition cursor-pointer"
          >
            nº 1
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('Rodada 1')}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono transition cursor-pointer"
          >
            Rodada 1
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('Ahmed')}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 transition cursor-pointer"
          >
            Ahmed
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('Daniel')}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 transition cursor-pointer"
          >
            Daniel
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('A x B')}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono transition cursor-pointer"
          >
            Cruzamento A × B
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('Fase 2')}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono transition cursor-pointer"
          >
            Fase 2
          </button>
        </div>
      </div>

      {/* Accordion Controls for Grouped Batteries View */}
      {viewMode === 'grouped_batteries' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400 no-print">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-300">Todas as Baterias</span>
            <span className="text-slate-500">• Baterias em Accordion (todas abertas por padrão)</span>
            <span className="text-slate-500 font-mono">({batteries.length - collapsedBatteries.size} de {batteries.length} abertas)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAllBatteries}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition cursor-pointer shadow-sm"
              title="Expandir todas as baterias"
            >
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              Expandir Todas
            </button>
            <button
              type="button"
              onClick={collapseAllBatteries}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition cursor-pointer shadow-sm"
              title="Recolher todas as baterias"
            >
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              Recolher Todas
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: ALL BATTERIES ON SCREEN (CARDS POR BATERIA COM ACCORDIONS EXPANSÍVEIS) */}
      {viewMode === 'grouped_batteries' ? (
        <div className="space-y-6">
          {(() => {
            const visibleBatteries = batteries.filter(({ num }) => {
              const batteryRuns = runs.filter((r) => r.bateria === num);
              if (batteryRuns.length === 0) return false;
              if (!hasSearch || !filterOnlyMatches) return true;
              return batteryRuns.some(isRunMatchingSearch);
            });

            if (hasSearch && visibleBatteries.length === 0) {
              return (
                <div className="p-8 text-center bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Nenhuma corrida encontrada para &quot;{searchTerm}&quot;
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                    Tente buscar pelo número da corrida (ex: <strong className="text-amber-300">15</strong>, <strong className="text-amber-300">#15</strong>) ou nome do competidor.
                  </p>
                  <button
                    onClick={() => onSearchChange('')}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Limpar Busca
                  </button>
                </div>
              );
            }

            return visibleBatteries.map(({ num, cruzamento }) => {
              const batteryRuns = runs.filter((r) => r.bateria === num);
              const matchingRuns = batteryRuns.filter(isRunMatchingSearch);
              const hasMatches = matchingRuns.length > 0;
              const runsToRender = hasSearch && filterOnlyMatches ? matchingRuns : batteryRuns;
              const isCollapsed = collapsedBatteries.has(num);

              return (
                <div
                  key={num}
                  className={`bg-slate-900/90 border rounded-2xl overflow-hidden shadow-xl transition-all duration-200 ${
                    hasMatches && cleanTerm
                      ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Battery Header: ACCORDION EXPANSÍVEL (BATERIA EM DESTAQUE COM CRUZAMENTO DISCRETO) */}
                  <div
                    onClick={() => toggleBattery(num)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleBattery(num);
                      }
                    }}
                    className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 select-none transition"
                    title={isCollapsed ? `Clique para expandir Bateria ${num}` : `Clique para recolher Bateria ${num}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/80 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      </div>

                      <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10 flex items-center gap-2 font-mono font-black text-base sm:text-lg">
                        <Layers className="w-4 h-4 text-amber-400" />
                        BATERIA {num}
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/80 text-xs font-mono font-semibold">
                        {batteries.length === 9 ? (
                          <>
                            <span className="text-slate-500">Cruzamento:</span>
                            <span className="text-slate-200 font-bold">{cruzamento}</span>
                            <span className="text-slate-500 text-[10px]">• Fase {num}</span>
                          </>
                        ) : (
                          <span className="text-slate-200 font-bold">
                            {batteryRuns[0]?.bateriaLabel || `Bateria ${num}`}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 hidden lg:block">
                        {(() => {
                          const batRodadas = new Set(batteryRuns.map((r) => r.rodada));
                          return hasSearch && filterOnlyMatches
                            ? `Exibindo ${runsToRender.length} de ${batteryRuns.length} corridas filtradas nesta bateria`
                            : `${batteryRuns.length} corridas • ${batRodadas.size} ${batRodadas.size === 1 ? 'Rodada' : 'Rodadas'}`;
                        })()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>Concluídas: <strong className="text-slate-200">{batteryRuns.filter((r) => r.mediaFinal !== null).length}</strong>/{batteryRuns.length}</span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline font-sans">
                        {isCollapsed ? '(Clique para expandir)' : '(Clique para recolher)'}
                      </span>
                    </div>
                  </div>

                  {/* Table for this battery (Accordion Content) */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-800/40">
                          {(() => {
                            const rodadaMap = new Map<number, Run[]>();
                            runsToRender.forEach((r) => {
                              const list = rodadaMap.get(r.rodada) || [];
                              list.push(r);
                              rodadaMap.set(r.rodada, list);
                            });
                            const sortedRodadas = Array.from(rodadaMap.entries()).sort((a, b) => a[0] - b[0]);

                            return sortedRodadas.map(([rodadaNum, runsInRodada]) => {
                              const completedInRodada = runsInRodada.filter((r) => r.mediaFinal !== null).length;
                              const firstNum = runsInRodada[0]?.numero;
                              const lastNum = runsInRodada[runsInRodada.length - 1]?.numero;

                              return (
                                <React.Fragment key={`rodada-section-${num}-${rodadaNum}`}>
                                  {/* 1. Subheader / Descrição da Rodada */}
                                  <tr className="bg-slate-950/95 border-y-2 border-indigo-500/40">
                                    <td colSpan={12} className="py-2.5 px-4 bg-gradient-to-r from-indigo-950/50 via-slate-900/80 to-slate-950/50">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black font-mono bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-md shadow-indigo-500/10">
                                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                            RODADA {rodadaNum}
                                          </span>
                                          <span className="text-xs font-mono text-slate-200 font-bold">
                                            Corridas #{firstNum} a #{lastNum}
                                          </span>
                                        </div>

                                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                                          <span>
                                            Concluídas: <strong className="text-slate-200">{completedInRodada}</strong>/{runsInRodada.length}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* 2. Header das Colunas da Tabela (Logo após a Descrição da Rodada) */}
                                  {renderTableHeader(`battery-${num}-rodada-${rodadaNum}`)}

                                  {/* 3. Linhas de Corridas da Rodada */}
                                  {runsInRodada.map(renderRunRow)}
                                </React.Fragment>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      ) : (
        /* VIEW MODE 2: SINGLE CONTINUOUS TABLE */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {(() => {
            const singleTableRuns = runs
              .filter((r) => (!hasSearch || !filterOnlyMatches ? true : isRunMatchingSearch(r)));

            if (hasSearch && singleTableRuns.length === 0) {
              return (
                <div className="p-8 text-center bg-slate-900/90 border border-slate-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Nenhuma corrida encontrada para &quot;{searchTerm}&quot;
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                    Tente buscar pelo número exato da corrida (ex: 15, #15, nº 15), pelo nome de qualquer competidor ou pelo cruzamento.
                  </p>
                  <button
                    onClick={() => onSearchChange('')}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Limpar Busca
                  </button>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-print">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3 w-16 text-center">Nº</th>
                      <th className="py-3 px-3 w-32 text-slate-300 font-bold">Bateria</th>
                      <th className="py-3 px-3 min-w-[190px]">Cabeceiro</th>
                      <th className="py-3 px-2 w-14 min-w-[56px] text-center text-slate-500 font-mono text-xs select-none"></th>
                      <th className="py-3 px-3 min-w-[190px]">Pezeiro</th>
                      <th className="py-3 px-2 w-16 text-center text-slate-400">SHC</th>
                      <th className="py-3 px-2 w-24 text-center text-slate-400 font-bold">Qtd Bois</th>
                      <th className="py-3 px-1.5 w-24 text-center text-slate-300 font-bold">
                        <div>T1</div>
                        <div className="text-[9px] font-normal text-slate-500">Tempo 1</div>
                      </th>
                      <th className="py-3 px-1.5 w-24 text-center text-slate-300 font-bold">
                        <div>T2</div>
                        <div className="text-[9px] font-normal text-slate-500">Tempo 2</div>
                      </th>
                      <th className="py-3 px-1.5 w-24 text-center text-slate-300 font-bold">
                        <div>T3</div>
                        <div className="text-[9px] font-normal text-slate-500">Tempo 3</div>
                      </th>
                      <th className="py-3 px-2 w-20 text-center text-slate-300 font-bold">
                        <div>Total (s)</div>
                        <div className="text-[9px] font-normal text-slate-500">Soma</div>
                      </th>
                      <th className="py-3 px-3 w-40 min-w-[150px] whitespace-nowrap text-center text-slate-200 bg-slate-900/40">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Média Final</span>
                        </div>
                        <div className="text-[9px] font-normal text-slate-400 whitespace-nowrap">Classificação</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {singleTableRuns.map(renderRunRow)}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Classificação Oficial: <strong>Menor Média Final</strong> vence a prova. Bois por SHC: <strong>&le; 3.5</strong> corre 1 Boi (T2 e T3 bloqueados) •{' '}
            <strong>4.0 a 5.5</strong> corre 2 Bois (T3 bloqueado) •{' '}
            <strong>&ge; 6.0</strong> corre 3 Bois.
          </span>
        </div>
        <div className="font-mono text-slate-400">
          Total de {runs.length} corridas em {batteries.length} fases ({availableRodadas.length} rodadas por fase) • Gap Mínimo: {config.minGap}
        </div>
      </div>
    </div>
  );
};
