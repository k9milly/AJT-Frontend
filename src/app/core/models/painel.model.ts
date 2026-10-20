import { StatusOrdemServico } from './ordem-servico.model';
import { StatusTransfer } from './transfer.model';

// resumo do painel como o backend devolve (PainelResumoDTO, GET /api/painel/resumo)
// todos os numeros sao de um dia so (data); os mapas trazem todos os status, com 0 quando nao ha nada
// faturamento (em brl, sem os cancelados) vem null pra quem nao e ADMIN nem GERENTE
export interface PainelResumo {
  data: string;
  totalTransfers: number;
  transfersPorStatus: Record<StatusTransfer, number>;
  totalOrdensServico: number;
  ordensServicoPorStatus: Record<StatusOrdemServico, number>;
  faturamentoDia: number | null;
  faturamentoMes: number | null;
}
