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
  // lock otimista do backend: reenviar na edicao pra receber 409 se outra pessoa salvou antes
  versao: number;
}

// so os abertas ou em andamento recebem transfers (o backend responde 400 nas outras)
export const STATUS_OS_RECEBE_TRANSFER: StatusOrdemServico[] = ['ABERTA', 'EM_ANDAMENTO'];

export type OrdemServicoRequest = Omit<OrdemServico, 'id' | 'versao'> & { versao?: number };
