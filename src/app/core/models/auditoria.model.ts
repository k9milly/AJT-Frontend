// registro da trilha de auditoria como o backend devolve (AuditoriaResponseDTO, GET /api/auditoria)
// a mensagem ja vem pronta do backend, terminando com o autor:
// "Transfer atualizado: status AGUARDANDO_OS -> CONFIRMADO; valor 150.00 -> 180.00 (por maria)"
export interface RegistroAuditoria {
  id: number;
  tabelaAfetada: string;
  registroId: number;
  mensagem: string;
  dataHora: string;
}

// tabelas que o backend audita (valor do filtro ?tabela=)
export type TabelaAuditada = 'transfers' | 'ordens_servico';

export const ROTULO_TABELA_AUDITADA: Record<TabelaAuditada, string> = {
  transfers: 'Transfer',
  ordens_servico: 'Ordem de serviço',
};
