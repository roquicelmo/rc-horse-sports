export interface Competitor {
  id: string;
  nome: string;
  handicap: number; // 1.0 to 5.0 (step 0.5)
  apelido?: string;
  cidade?: string;
  grupo?: string; // 'A', 'B', 'C', etc.
}

export type BatteryMode = 'phases' | 'major3' | 'single' | 'custom';

export interface DrawConfig {
  numGroups: number; // Quantidade de grupos de baterias (ex: 2 para A e B; 3 para A, B e C; etc.)
  minGap: number; // Distanciamento mínimo entre a corrida do mesmo competidor dentro da mesma bateria
  balanceGroups: boolean; // Balancear grupos por handicap (snake draft / alternado)
  batteryMode?: BatteryMode; // Modo de organização das baterias ('phases' = 1 por cruzamento, 'major3' = 3 grandes baterias, 'single' = bateria única, 'custom' = número personalizado)
  numBatteries?: number; // Quantidade de baterias selecionada pelo operador (1, 2, 3, 4, 6, 9...)
}

export interface RunTimes {
  boi1: string; // T1 (em segundos, ex: '6.45')
  boi2: string; // T2
  boi3: string; // T3
  boi1Nt?: boolean;
  boi2Nt?: boolean;
  boi3Nt?: boolean;
}

export interface Run {
  id: string;
  numero: number;
  fase: number; // Fase 1 a K*K (ex: Fase 1 a 9 no PDF)
  faseLabel: string; // Ex: 'Fase 1: Cabeceiros A × Pezeiros A'
  bateria: number; // Mantido por compatibilidade (igual a fase)
  bateriaLabel: string; // Ex: 'Fase 1: A × A'
  cruzamento: string; // Ex: 'A × A', 'B × B', 'C × B', etc.
  rodada: number; // Subseparação por Rodada dentro da Fase (ex: Rodada 1 a 5)
  cabeceiro: Competitor;
  pezeiro: Competitor;
  cabeceiroGrupo: string;
  pezeiroGrupo: string;
  shc: number; // Soma de handicap (Cabeceiro + Pezeiro)
  bois: 1 | 2 | 3; // <=3.5 = 1, 4.0 a 5.5 = 2, >=6.0 = 3
  hasGapViolation?: boolean;
  times: RunTimes;
  totalTime?: number | null; // Soma dos tempos dos bois permitidos
  mediaFinal?: number | null; // Média final: (Tempo1 + ... + TempoX) / X (menor média = melhor classificação)
  isNt?: boolean; // Se tomou NT em algum boi válido
}

export type WizardStep = 1 | 2 | 3 | 4;
