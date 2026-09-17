// valores aceitos pelo backend (enums AcaoParada e StatusParada)
export type AcaoParada = 'EMBARQUE' | 'DESEMBARQUE';
export type StatusParada = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export const ACOES_PARADA: AcaoParada[] = ['EMBARQUE', 'DESEMBARQUE'];
export const STATUS_PARADA: StatusParada[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];

// parada de uma ordem de servico (ParadaOsResponseDTO)
// junta embarques/desembarques de varios transfers no mesmo ponto e horario
export interface ParadaOs {
  id: number;
  osId: number;
  ordemParada: number;
  localParada: string;
  latitude: number | null;
  longitude: number | null;
  horarioPrevisto: string | null;
  acao: AcaoParada | null;
  statusParada: StatusParada;
  transferIds: number[];
}

export type ParadaOsRequest = Omit<ParadaOs, 'id'>;
