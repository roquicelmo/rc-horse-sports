export type EventStatus = 'ABERTA' | 'SORTEADA' | 'EM ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';

export interface EventSummary {
  id: string;
  name: string;
  date: string;
  format: string;
  arena: string;
  status: EventStatus;
  registeredAthletes?: number;
  fixedPairs?: number;
  runs: number;
  steward?: string;
}
