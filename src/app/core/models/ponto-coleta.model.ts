export type TipoPontoColeta = 'HOTEL' | 'AEROPORTO' | 'RODOVIARIA' | 'OUTRO';

export interface PontoColeta {
  id: number;
  nome: string;
  tipo: TipoPontoColeta;
  endereco: string;
  cidade: string;
}
