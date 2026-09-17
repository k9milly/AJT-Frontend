// status aceitos pelo backend (enum StatusOrdemServico)
export type StatusOrdemServico = 'ABERTA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';

export const STATUS_ORDEM_SERVICO: StatusOrdemServico[] = ['ABERTA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'];

// ordem de servico como o backend devolve (OrdemServicoResponseDTO)
// agrupa transfers de um motorista + veiculo num dia; o vinculo fica no transfer (transfer.osId)
export interface OrdemServico {
  id: number;
  dataServico: string;
  motoristaId: number | null;
  veiculoId: number | null;
  status: StatusOrdemServico;
}

export type OrdemServicoRequest = Omit<OrdemServico, 'id'>;
