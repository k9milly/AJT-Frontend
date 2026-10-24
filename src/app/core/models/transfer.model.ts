// status aceitos pelo backend (enum StatusTransfer); qualquer outro valor devolve 400
export type StatusTransfer = 'AGUARDANDO_OS' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export const STATUS_TRANSFER: StatusTransfer[] = ['AGUARDANDO_OS', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];

// o status acompanha o vinculo com a os: sem os o transfer esta aguardando (ou foi cancelado);
// com os ele ja foi confirmado e pode andar ate concluido
export const STATUS_TRANSFER_SEM_OS: StatusTransfer[] = ['AGUARDANDO_OS', 'CANCELADO'];
export const STATUS_TRANSFER_COM_OS: StatusTransfer[] = ['CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];

export function statusPermitidoParaVinculo(status: StatusTransfer, temOs: boolean): boolean {
  return (temOs ? STATUS_TRANSFER_COM_OS : STATUS_TRANSFER_SEM_OS).includes(status);
}

// ao entrar ou sair de uma os, leva o status pro equivalente (igual o backend faz com AGUARDANDO_OS/CONFIRMADO)
export function ajustarStatusAoVinculo(status: StatusTransfer, temOs: boolean): StatusTransfer {
  if (statusPermitidoParaVinculo(status, temOs)) {
    return status;
  }
  return temOs ? 'CONFIRMADO' : 'AGUARDANDO_OS';
}

// moeda base do sistema; valores em outra moeda sao convertidos pelo backend
export const MOEDA_BASE = 'BRL';

// moedas oferecidas no formulario (o backend aceita qualquer codigo iso de 3 letras)
export const MOEDAS: string[] = ['BRL', 'USD', 'EUR', 'ARS', 'PYG'];

// transfer como o backend devolve (TransferResponseDTO)
// datas sem fuso: dataTransfer "2026-09-20", horaTransfer "14:30:00"
// valorBase e sempre em brl; com moeda estrangeira o backend calcula a partir do valorOriginal
// (se a api de cambio estiver fora do ar, o transfer e salvo com valorBase nulo)
// osId fica nulo ate o transfer ser agrupado numa ordem de servico
// (com osId o backend marca o transfer como CONFIRMADO; ao sair da os volta pra AGUARDANDO_OS)
// versao: lock otimista do backend; reenviar na edicao pra receber 409 se outra pessoa salvou antes
export interface Transfer {
  id: number;
  dataTransfer: string;
  horaTransfer: string;
  origem: string;
  destino: string;
  status: StatusTransfer;
  valorBase: number | null;
  valorOriginal: number | null;
  moedaOrigem: string | null;
  osId: number | null;
  passageiroIds: number[];
  versao: number;
}

// na criacao nao existe versao; na edicao ela vai junto
export type TransferRequest = Omit<Transfer, 'id' | 'versao'> & { versao?: number };

// filtros de GET /api/transfers (RF015); todos opcionais e somados (E)
// datas no formato da api (AAAA-MM-DD); busca = parte da origem ou do destino
export interface FiltroTransfer {
  status?: StatusTransfer;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  osId?: number;
  semOs?: boolean;
}
