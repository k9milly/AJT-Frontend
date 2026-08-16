export type StatusTransfer = 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface Transfer {
  id: number;
  passageiroId: number;
  origemId: number;
  destinoId: number;
  motoristaId: number | null;
  veiculoId: number | null;
  dataHora: string;
  valor: number;
  status: StatusTransfer;
}
