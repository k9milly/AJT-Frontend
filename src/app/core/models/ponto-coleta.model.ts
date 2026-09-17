// ponto de coleta como o backend devolve (PontoColetaResponseDTO)
// cada ponto pertence a um transfer; um transfer pode ter varios pontos ordenados por ordemParada
export interface PontoColeta {
  id: number;
  transferId: number;
  localColeta: string;
  ordemParada: number | null;
  horarioPrevisto: string | null;
  latitude: number;
  longitude: number;
}

export type PontoColetaRequest = Omit<PontoColeta, 'id'>;
