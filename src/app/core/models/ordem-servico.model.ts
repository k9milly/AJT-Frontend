export type StatusOrdemServico = 'ABERTA' | 'EM_ANDAMENTO' | 'FINALIZADA';

export interface OrdemServico {
  id: number;
  motoristaId: number;
  veiculoId: number;
  data: string;
  transferIds: number[];
  status: StatusOrdemServico;
  observacoes: string;
}
