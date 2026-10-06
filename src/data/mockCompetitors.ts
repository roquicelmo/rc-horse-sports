import type { Competitor } from '../types/roping';

export const INITIAL_COMPETITORS: Competitor[] = [
  // 15 Cabeceiros Oficiais do Documento (Chaves A, B, C)
  { id: 'c1', nome: 'Ahmed', handicap: 4.5, cidade: 'Goiânia - GO', grupo: 'A' },
  { id: 'c2', nome: 'Márcio Vieira', handicap: 3.5, cidade: 'Ribeirão Preto - SP', grupo: 'A' },
  { id: 'c3', nome: 'Thiagao', handicap: 4.0, cidade: 'Barretos - SP', grupo: 'A' },
  { id: 'c4', nome: 'Murilo Carvalho', handicap: 3.0, cidade: 'Presidente Prudente - SP', grupo: 'A' },
  { id: 'c5', nome: 'Naudimar', handicap: 2.5, cidade: 'Campinas - SP', grupo: 'A' },
  { id: 'c6', nome: 'Gilson Garcia', handicap: 4.5, cidade: 'Uberaba - MG', grupo: 'B' },
  { id: 'c7', nome: 'Paulo Franco', handicap: 3.0, cidade: 'São José do Rio Preto - SP', grupo: 'B' },
  { id: 'c8', nome: 'Kristiann', handicap: 5.0, cidade: 'Campo Grande - MS', grupo: 'B' },
  { id: 'c9', nome: 'Vítim Ipora', handicap: 2.0, cidade: 'Iporá - GO', grupo: 'B' },
  { id: 'c10', nome: 'Hugo Vilela', handicap: 3.5, cidade: 'Franca - SP', grupo: 'B' },
  { id: 'c11', nome: 'Abner Nery', handicap: 4.0, cidade: 'Americana - SP', grupo: 'C' },
  { id: 'c12', nome: 'Carlos Eduardo', handicap: 2.5, cidade: 'Bauru - SP', grupo: 'C' },
  { id: 'c13', nome: 'Salvanir Júnior', handicap: 3.0, cidade: 'Araçatuba - SP', grupo: 'C' },
  { id: 'c14', nome: 'Tacio Filho', handicap: 1.5, cidade: 'Piracicaba - SP', grupo: 'C' },
  { id: 'c15', nome: 'Renato', handicap: 2.0, cidade: 'Londrina - PR', grupo: 'C' },

  // 15 Pezeiros Oficiais do Documento (Chaves A, B, C)
  { id: 'p1', nome: 'Daniel', handicap: 2.0, cidade: 'Barretos - SP', grupo: 'A' },
  { id: 'p2', nome: 'Rodrigo JM', handicap: 4.5, cidade: 'Maringá - PR', grupo: 'A' },
  { id: 'p3', nome: 'Wesley Castro', handicap: 3.0, cidade: 'Ribeirão Preto - SP', grupo: 'A' },
  { id: 'p4', nome: 'Baiano', handicap: 2.5, cidade: 'Presidente Prudente - SP', grupo: 'A' },
  { id: 'p5', nome: 'Antonio Carlos', handicap: 3.5, cidade: 'Goiânia - GO', grupo: 'A' },
  { id: 'p6', nome: 'Bruno Castro', handicap: 3.5, cidade: 'Uberaba - MG', grupo: 'B' },
  { id: 'p7', nome: 'Gustavo', handicap: 4.0, cidade: 'Franca - SP', grupo: 'B' },
  { id: 'p8', nome: 'Adolfo Montividiu', handicap: 2.5, cidade: 'Montividiu - GO', grupo: 'B' },
  { id: 'p9', nome: 'Alvim Ipora', handicap: 1.5, cidade: 'Iporá - GO', grupo: 'B' },
  { id: 'p10', nome: 'João Gabriel', handicap: 3.0, cidade: 'Campinas - SP', grupo: 'B' },
  { id: 'p11', nome: 'Leonardo Almeida', handicap: 4.0, cidade: 'Americana - SP', grupo: 'C' },
  { id: 'p12', nome: 'Jeovany Vilela', handicap: 2.5, cidade: 'Araçatuba - SP', grupo: 'C' },
  { id: 'p13', nome: 'Walley', handicap: 3.0, cidade: 'Botucatu - SP', grupo: 'C' },
  { id: 'p14', nome: 'Felipe', handicap: 1.5, cidade: 'Piracicaba - SP', grupo: 'C' },
  { id: 'p15', nome: 'Sandro Filho', handicap: 2.0, cidade: 'São José do Rio Preto - SP', grupo: 'C' },

  // Competidores extras para permitir testar variações de N e M
  { id: 'e1', nome: 'Marcio Garcia', handicap: 4.5, cidade: 'Presidente Prudente - SP' },
  { id: 'e2', nome: 'Jaiminho', handicap: 2.0, cidade: 'Barretos - SP' },
  { id: 'e3', nome: 'Heriton Dover', handicap: 5.0, cidade: 'Campinas - SP' },
  { id: 'e4', nome: 'Renan Toledo', handicap: 2.5, cidade: 'São José do Rio Preto - SP' },
  { id: 'e5', nome: 'Fernando Cabelo', handicap: 3.0, cidade: 'Araçatuba - SP' },
];
