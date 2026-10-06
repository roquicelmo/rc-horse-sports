import type { Competitor, DrawConfig, Run, BatteryMode } from '../types/roping';

export function calculateBois(shc: number): 1 | 2 | 3 {
  // Regra de Exibição dos Bois:
  // Se o SHC (Soma) for até 3.5, exiba "1".
  // Se for de 4.0 a 5.5, exiba "2".
  // Se for 6.0 ou mais, exiba "3".
  if (shc <= 3.5) return 1;
  if (shc <= 5.5) return 2;
  return 3;
}

export const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export interface GroupedCompetitors {
  cabeceirosByGroup: Record<string, Competitor[]>;
  pezeirosByGroup: Record<string, Competitor[]>;
  groupLetters: string[];
}

/**
 * Distribui os inscritos nos grupos (A, B, C...) de forma balanceada por handicap
 * (usando algoritmo de Snake Draft para manter médias de handicap similares)
 */
export function assignCompetitorsToGroups(
  cabeceiros: Competitor[],
  pezeiros: Competitor[],
  numGroups: number,
  balanceByHandicap: boolean = true
): GroupedCompetitors {
  const safeNumGroups = Math.max(2, Math.min(numGroups, 8, cabeceiros.length, pezeiros.length));
  const letters = GROUP_LETTERS.slice(0, safeNumGroups);

  const cabeceirosByGroup: Record<string, Competitor[]> = {};
  const pezeirosByGroup: Record<string, Competitor[]> = {};

  letters.forEach((l) => {
    cabeceirosByGroup[l] = [];
    pezeirosByGroup[l] = [];
  });

  if (balanceByHandicap) {
    // Snake draft para manter médias de handicap similares
    const sortedCab = [...cabeceiros].sort((a, b) => b.handicap - a.handicap);
    const sortedPez = [...pezeiros].sort((a, b) => b.handicap - a.handicap);

    sortedCab.forEach((cab, index) => {
      const cycle = Math.floor(index / safeNumGroups);
      const pos = index % safeNumGroups;
      const groupIdx = cycle % 2 === 0 ? pos : safeNumGroups - 1 - pos;
      const letter = letters[groupIdx];
      cabeceirosByGroup[letter].push({ ...cab, grupo: letter });
    });

    sortedPez.forEach((pez, index) => {
      const cycle = Math.floor(index / safeNumGroups);
      const pos = index % safeNumGroups;
      const groupIdx = cycle % 2 === 0 ? pos : safeNumGroups - 1 - pos;
      const letter = letters[groupIdx];
      pezeirosByGroup[letter].push({ ...pez, grupo: letter });
    });
  } else {
    // Distribuição sequencial em blocos equilibrados para qualquer N e M:
    // Garante que N e M sejam sempre distribuídos proporcionalmente entre todas as Chaves (A, B, C...)
    // evitando que uma chave fique vazia ou concentre participantes de forma assimétrica.
    const n = cabeceiros.length;
    cabeceiros.forEach((cab, index) => {
      const groupIdx = Math.min(Math.floor((index * safeNumGroups) / n), safeNumGroups - 1);
      const letter = letters[groupIdx];
      cabeceirosByGroup[letter].push({ ...cab, grupo: letter });
    });

    const m = pezeiros.length;
    pezeiros.forEach((pez, index) => {
      const groupIdx = Math.min(Math.floor((index * safeNumGroups) / m), safeNumGroups - 1);
      const letter = letters[groupIdx];
      pezeirosByGroup[letter].push({ ...pez, grupo: letter });
    });
  }

  return {
    cabeceirosByGroup,
    pezeirosByGroup,
    groupLetters: letters,
  };
}


/**
 * Resolve uma rodada de laçadas usando Backtracking (Busca com Retrocesso):
 * - Regra Crítica de Validação: NUNCA permite auto-cruzamento (cab.id !== pez.id em 100% das corridas).
 * - Garante que cada laçador corra no máximo uma vez como cabeceiro nesta rodada.
 * - Garante que cada laçador corra no máximo uma vez como pezeiro nesta rodada.
 * - Lógica Crítica de Backtracking: caso os últimos restantes na lista sejam a mesma pessoa
 *   (ou fiquem sem opções válidas), a função retrocede recursivamente, desfazendo a dupla anterior
 *   para realocar os parceiros de forma 100% válida.
 */
export function solveRoundWithBacktracking(
  activeCabs: Competitor[],
  allPezs: Competitor[],
  remainingPairsSet: Set<string>
): { cab: Competitor; pez: Competitor }[] {
  // Grau restante de cada cabeceiro e pezeiro na fase (quantas corridas ainda faltam fazer)
  const cabDegree = new Map<string, number>();
  const pezDegree = new Map<string, number>();
  for (const c of activeCabs) cabDegree.set(c.id, 0);
  for (const p of allPezs) pezDegree.set(p.id, 0);

  for (const c of activeCabs) {
    for (const p of allPezs) {
      if (remainingPairsSet.has(`${c.id}_${p.id}`)) {
        cabDegree.set(c.id, (cabDegree.get(c.id) || 0) + 1);
        pezDegree.set(p.id, (pezDegree.get(p.id) || 0) + 1);
      }
    }
  }

  // Monta lista de cabeceiros com seus candidatos válidos a pezeiro (estritamente cab.id !== pez.id)
  const cabsWithCandidates = activeCabs
    .map((cab) => {
      const candidates = allPezs.filter(
        (pez) => pez.id !== cab.id && remainingPairsSet.has(`${cab.id}_${pez.id}`)
      );
      // Prioriza pezeiros que têm mais corridas pendentes (grau decrescente)
      candidates.sort((a, b) => (pezDegree.get(b.id) || 0) - (pezDegree.get(a.id) || 0));
      return { cab, candidates, degree: cabDegree.get(cab.id) || 0 };
    })
    .filter((item) => item.candidates.length > 0);

  if (cabsWithCandidates.length === 0) return [];

  // Ordena cabeceiros: quem tem maior grau de pendência corre primeiro.
  // Desempate: quem tem menos candidatos disponíveis (heurística MRV)
  cabsWithCandidates.sort((a, b) => {
    if (b.degree !== a.degree) return b.degree - a.degree;
    return a.candidates.length - b.candidates.length;
  });

  // Tenta encontrar um emparelhamento de tamanho máximo para esta rodada
  const maxPossible = Math.min(cabsWithCandidates.length, allPezs.length);
  const targetSizes: number[] = [];
  for (let s = maxPossible; s >= 1; s--) {
    targetSizes.push(s);
  }

  for (const targetSize of targetSizes) {
    const result: { cab: Competitor; pez: Competitor }[] = [];
    const usedPezIds = new Set<string>();
    const usedCabIds = new Set<string>();

    function backtrack(cabIndex: number): boolean {
      if (result.length === targetSize) {
        return true;
      }
      if (cabIndex >= cabsWithCandidates.length) {
        return false;
      }

      // Poda: se as vagas restantes não conseguem mais atingir o tamanho alvo
      const remainingCabsCount = cabsWithCandidates.length - cabIndex;
      if (result.length + remainingCabsCount < targetSize) {
        return false;
      }

      const { cab, candidates } = cabsWithCandidates[cabIndex];

      // Opção 1: Tentar casar `cab` com cada um dos pezeiros candidatos válidos
      for (const pez of candidates) {
        // Regra Crítica de Validação: Um laçador NUNCA pode fazer dupla com ele mesmo
        if (cab.id === pez.id) continue;
        if (usedPezIds.has(pez.id)) continue;

        // Pareia provisoriamente
        usedPezIds.add(pez.id);
        usedCabIds.add(cab.id);
        result.push({ cab, pez });

        // Tenta emparelhar o próximo cabeceiro da lista
        if (backtrack(cabIndex + 1)) {
          return true; // Sucesso global encontrado para a rodada!
        }

        // BACKTRACKING: Se os laçadores subsequentes falharem (ex: sobrou ele mesmo como único parceiro),
        // desfaz a dupla imediatamente anterior e tenta a próxima alternativa!
        result.pop();
        usedCabIds.delete(cab.id);
        usedPezIds.delete(pez.id);
      }

      // Opção 2: Pular este cabeceiro (caso esta rodada não comporte todos simultaneamente)
      if (result.length + (cabsWithCandidates.length - (cabIndex + 1)) >= targetSize) {
        if (backtrack(cabIndex + 1)) {
          return true;
        }
      }

      return false;
    }

    if (backtrack(0)) {
      return result;
    }
  }

  return [];
}

/**
 * Escala todas as corridas de uma fase (cruzamento) agrupadas em rodadas
 * utilizando o resolvedor de backtracking, garantindo 100% de exclusão de auto-cruzamento.
 */
export function schedulePhaseWithBacktracking(
  cabs: Competitor[],
  pezs: Competitor[]
): { roundNum: number; pairs: { cab: Competitor; pez: Competitor }[] }[] {
  // 1. Constrói conjunto de todas as combinações válidas da fase (excluindo estritamente cab.id === pez.id)
  const remainingPairsSet = new Set<string>();

  for (const c of cabs) {
    for (const p of pezs) {
      if (c.id !== p.id) {
        remainingPairsSet.add(`${c.id}_${p.id}`);
      }
    }
  }

  const rounds: { roundNum: number; pairs: { cab: Competitor; pez: Competitor }[] }[] = [];
  let roundNum = 1;

  while (remainingPairsSet.size > 0) {
    const activeCabs = cabs.filter((c) =>
      pezs.some((p) => remainingPairsSet.has(`${c.id}_${p.id}`))
    );

    const roundPairs = solveRoundWithBacktracking(activeCabs, pezs, remainingPairsSet);

    if (roundPairs.length === 0) {
      console.error(
        'Aviso: Não foi possível agendar mais duplas válidas nesta fase. Restantes:',
        remainingPairsSet.size
      );
      break;
    }

    // Valida que nenhum auto-cruzamento ocorreu e remove dos pendentes
    for (const pair of roundPairs) {
      if (pair.cab.id === pair.pez.id) {
        throw new Error(
          `ERRO CRÍTICO: Auto-cruzamento detectado no sorteio! O competidor ${pair.cab.nome} (id: ${pair.cab.id}) não pode laçar consigo mesmo.`
        );
      }
      remainingPairsSet.delete(`${pair.cab.id}_${pair.pez.id}`);
    }

    rounds.push({
      roundNum,
      pairs: roundPairs,
    });
    roundNum++;
  }

  return rounds;
}

/**
 * Gera o sorteio COMPLETO onde todos os cabeceiros laçam com todos os pezeiros
 * dividido em baterias com cruzamento sequencial e validação estrita anti-auto-cruzamento:
 *
 * Exemplo com Grupos A, B e C:
 * - Fase 1 (Diretos / Intra): A × A, B × B, C × C
 * - Fase 2 (Cruzamentos Shift 1): A × B, B × C, C × A
 * - Fase 3 (Cruzamentos Shift 2): A × C, B × A, C × B
 *
 * Ao final, 100% dos pares válidos (cabeceiro.id !== pezeiro.id) são realizados.
 */
export function executeGroupCrossDraw(
  cabeceiros: Competitor[],
  pezeiros: Competitor[],
  config: DrawConfig
): {
  runs: Run[];
  grouped: GroupedCompetitors;
} {
  const grouped = assignCompetitorsToGroups(
    cabeceiros,
    pezeiros,
    config.numGroups,
    config.balanceGroups
  );

  const { groupLetters, cabeceirosByGroup, pezeirosByGroup } = grouped;
  const K = groupLetters.length;

  // Lista de Cruzamentos (Fases) do torneio:
  // 1. Fases Intra-grupos (A×A, B×B, C×C...)
  // 2. Fases Inter-grupos (com a ordem oficial do regulamento quando K=3 ou permutação cíclica para qualquer K)
  const faseGroupPairs: [string, string][] = [];

  // 1. Intra-grupos primeiro
  for (let i = 0; i < K; i++) {
    faseGroupPairs.push([groupLetters[i], groupLetters[i]]);
  }

  // 2. Inter-grupos
  if (K === 3) {
    // Ordem oficial exata das 9 Fases do documento de Team Roping para 3 Chaves (A, B, C):
    // Fase 4: C x B, Fase 5: A x C, Fase 6: B x A, Fase 7: A x B, Fase 8: B x C, Fase 9: C x A
    faseGroupPairs.push(
      ['C', 'B'],
      ['A', 'C'],
      ['B', 'A'],
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A']
    );
  } else {
    // Fórmula universal para qualquer quantidade de grupos K
    for (let s = 1; s < K; s++) {
      for (let i = 0; i < K; i++) {
        faseGroupPairs.push([groupLetters[i], groupLetters[(i + s) % K]]);
      }
    }
  }

  // Monta a lista final de Runs com a rotação por Rodadas resolvida com Backtracking
  // Válido para qualquer N Cabeceiros e M Pezeiros:
  // Garante que NENHUM competidor faça dupla com ele mesmo (cab.id !== pez.id).
  // Garante que nenhum competidor repita como cabeceiro ou pezeiro na mesma rodada.
  // 1. Gera os dados de rodadas de cada fase com o algoritmo de backtracking
  interface PhaseData {
    faseNum: number;
    faseLabel: string;
    cruzamento: string;
    cabLetter: string;
    pezLetter: string;
    rounds: { roundNum: number; pairs: { cab: Competitor; pez: Competitor }[] }[];
  }

  const phasesData: PhaseData[] = [];
  faseGroupPairs.forEach(([cabLetter, pezLetter], faseIndex) => {
    const faseNum = faseIndex + 1;
    const cruzamento = `${cabLetter} × ${pezLetter}`;
    const faseLabel = `Fase ${faseNum}: Cabeceiros ${cabLetter} × Pezeiros ${pezLetter}`;

    const cabs = cabeceirosByGroup[cabLetter] || [];
    const pezs = pezeirosByGroup[pezLetter] || [];

    if (cabs.length === 0 || pezs.length === 0) return;

    const scheduledRounds = schedulePhaseWithBacktracking(cabs, pezs);
    phasesData.push({
      faseNum,
      faseLabel,
      cruzamento,
      cabLetter,
      pezLetter,
      rounds: scheduledRounds,
    });
  });

  // 2. Determina a estratégia de agrupamento de baterias selecionada pelo operador:
  const totalPhases = faseGroupPairs.length;
  const targetBatteries = config.numBatteries ?? (totalPhases === 9 ? 9 : totalPhases);
  const mode: BatteryMode =
    config.batteryMode ??
    (targetBatteries === 1
      ? 'single'
      : targetBatteries === 3 && totalPhases === 9
      ? 'major3'
      : targetBatteries === totalPhases
      ? 'phases'
      : 'custom');

  // 3. Monta a lista final de Runs com bateria, bateriaLabel e rodadas
  const allRuns: Run[] = [];
  let currentRunNum = 1;
  const lastIndexSeen = new Map<string, number>();

  const createRun = (
    cab: Competitor,
    pez: Competitor,
    faseNum: number,
    faseLabel: string,
    cruzamento: string,
    cabLetter: string,
    pezLetter: string,
    bateria: number,
    bateriaLabel: string,
    rodada: number
  ) => {
    if (cab.id === pez.id) return;

    const numero = currentRunNum++;
    const shc = Number((cab.handicap + pez.handicap).toFixed(1));
    const bois = calculateBois(shc);

    const cabLast = lastIndexSeen.get(cab.id);
    const pezLast = lastIndexSeen.get(pez.id);
    const cabGap = cabLast !== undefined ? numero - cabLast : Infinity;
    const pezGap = pezLast !== undefined ? numero - pezLast : Infinity;
    const hasGapViolation = cabGap < config.minGap || pezGap < config.minGap;

    lastIndexSeen.set(cab.id, numero);
    lastIndexSeen.set(pez.id, numero);

    allRuns.push({
      id: `run-${numero}-${cab.id}-${pez.id}`,
      numero,
      fase: faseNum,
      faseLabel,
      bateria,
      bateriaLabel,
      cruzamento,
      rodada,
      cabeceiro: cab,
      pezeiro: pez,
      cabeceiroGrupo: cabLetter,
      pezeiroGrupo: pezLetter,
      shc,
      bois,
      hasGapViolation,
      times: {
        boi1: '',
        boi2: '',
        boi3: '',
        boi1Nt: false,
        boi2Nt: false,
        boi3Nt: false,
      },
      totalTime: null,
      mediaFinal: null,
      isNt: false,
    });
  };

  if (mode === 'phases') {
    phasesData.forEach((phase) => {
      for (const round of phase.rounds) {
        for (const pair of round.pairs) {
          createRun(
            pair.cab,
            pair.pez,
            phase.faseNum,
            phase.faseLabel,
            phase.cruzamento,
            phase.cabLetter,
            phase.pezLetter,
            phase.faseNum,
            `Fase ${phase.faseNum}: ${phase.cruzamento}`,
            round.roundNum
          );
        }
      }
    });
  } else if (mode === 'major3' && totalPhases === 9) {
    // 3 Grandes Baterias oficiais
    const batteryOffsets: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    phasesData.forEach((phase) => {
      const batNum = phase.faseNum <= 3 ? 1 : phase.faseNum <= 6 ? 2 : 3;
      const batLabel =
        batNum === 1
          ? 'Bateria 1: Fases Diretas (A×A, B×B, C×C)'
          : batNum === 2
          ? 'Bateria 2: Cruzamento 1 (C×B, A×C, B×A)'
          : 'Bateria 3: Cruzamento 2 (A×B, B×C, C×A)';

      const offset = batteryOffsets[batNum];
      let maxRoundInThisPhase = 0;
      for (const round of phase.rounds) {
        maxRoundInThisPhase = Math.max(maxRoundInThisPhase, round.roundNum);
        const actualRound = offset + round.roundNum;
        for (const pair of round.pairs) {
          createRun(
            pair.cab,
            pair.pez,
            phase.faseNum,
            phase.faseLabel,
            phase.cruzamento,
            phase.cabLetter,
            phase.pezLetter,
            batNum,
            batLabel,
            actualRound
          );
        }
      }
      batteryOffsets[batNum] += maxRoundInThisPhase;
    });
  } else if (mode === 'single') {
    // Bateria Única: Geral
    let globalOffset = 0;
    phasesData.forEach((phase) => {
      let maxRound = 0;
      for (const round of phase.rounds) {
        maxRound = Math.max(maxRound, round.roundNum);
        const actualRound = globalOffset + round.roundNum;
        for (const pair of round.pairs) {
          createRun(
            pair.cab,
            pair.pez,
            phase.faseNum,
            phase.faseLabel,
            phase.cruzamento,
            phase.cabLetter,
            phase.pezLetter,
            1,
            'Bateria Única: Geral',
            actualRound
          );
        }
      }
      globalOffset += maxRound;
    });
  } else {
    // Modo Customizado: Distribui as corridas em B baterias
    const B = Math.max(1, targetBatteries);
    interface FlatRunItem {
      phase: PhaseData;
      cab: Competitor;
      pez: Competitor;
    }
    const flatItems: FlatRunItem[] = [];
    phasesData.forEach((phase) => {
      for (const round of phase.rounds) {
        for (const pair of round.pairs) {
          flatItems.push({
            phase,
            cab: pair.cab,
            pez: pair.pez,
          });
        }
      }
    });

    const total = flatItems.length;
    const batteryBuckets = new Map<number, FlatRunItem[]>();
    for (let b = 1; b <= B; b++) batteryBuckets.set(b, []);

    flatItems.forEach((item, idx) => {
      const batNum = Math.min(Math.floor((idx * B) / total), B - 1) + 1;
      batteryBuckets.get(batNum)!.push(item);
    });

    batteryBuckets.forEach((bItems, batNum) => {
      let currentBatRodada = 1;
      const cabsInRodada = new Set<string>();
      const pezsInRodada = new Set<string>();

      bItems.forEach((item) => {
        if (cabsInRodada.has(item.cab.id) || pezsInRodada.has(item.pez.id)) {
          currentBatRodada++;
          cabsInRodada.clear();
          pezsInRodada.clear();
        }
        cabsInRodada.add(item.cab.id);
        pezsInRodada.add(item.pez.id);

        createRun(
          item.cab,
          item.pez,
          item.phase.faseNum,
          item.phase.faseLabel,
          item.phase.cruzamento,
          item.phase.cabLetter,
          item.phase.pezLetter,
          batNum,
          `Bateria ${batNum}`,
          currentBatRodada
        );
      });
    });
  }

  return {
    runs: allRuns,
    grouped,
  };
}

/**
 * Recalcula o tempo total e a média final de uma corrida:
 * Média Final = (soma dos tempos dos X bois) / X
 * Quanto menor a média, maior a classificação.
 */
export function calculateRunTotal(run: Run): {
  totalTime: number | null;
  mediaFinal: number | null;
  isNt: boolean;
} {
  const { times, bois } = run;

  // Boi 1 (T1)
  if (times.boi1Nt) {
    return { totalTime: null, mediaFinal: null, isNt: true };
  }
  const t1 = times.boi1 && times.boi1.trim() !== '' ? parseFloat(times.boi1) : null;

  if (bois === 1) {
    if (t1 !== null && !isNaN(t1)) {
      const val = Number(t1.toFixed(2));
      return { totalTime: val, mediaFinal: val, isNt: false };
    }
    return { totalTime: null, mediaFinal: null, isNt: false };
  }

  // Boi 2 (T2 para duplas com 2 ou 3 bois)
  if (times.boi2Nt) {
    return { totalTime: null, mediaFinal: null, isNt: true };
  }
  const t2 = times.boi2 && times.boi2.trim() !== '' ? parseFloat(times.boi2) : null;

  if (bois === 2) {
    if (t1 !== null && t2 !== null && !isNaN(t1) && !isNaN(t2)) {
      const sum = Number((t1 + t2).toFixed(2));
      const media = Number(((t1 + t2) / 2).toFixed(2));
      return { totalTime: sum, mediaFinal: media, isNt: false };
    }
    return { totalTime: null, mediaFinal: null, isNt: false };
  }

  // Boi 3 (T3 para duplas com 3 bois)
  if (times.boi3Nt) {
    return { totalTime: null, mediaFinal: null, isNt: true };
  }
  const t3 = times.boi3 && times.boi3.trim() !== '' ? parseFloat(times.boi3) : null;

  if (t1 !== null && t2 !== null && t3 !== null && !isNaN(t1) && !isNaN(t2) && !isNaN(t3)) {
    const sum = Number((t1 + t2 + t3).toFixed(2));
    const media = Number(((t1 + t2 + t3) / 3).toFixed(2));
    return { totalTime: sum, mediaFinal: media, isNt: false };
  }
  return { totalTime: null, mediaFinal: null, isNt: false };
}

