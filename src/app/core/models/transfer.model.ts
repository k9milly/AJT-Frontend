// status aceitos pelo backend (enum StatusTransfer); qualquer outro valor devolve 400
export type StatusTransfer = 'AGUARDANDO_OS' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export const STATUS_TRANSFER: StatusTransfer[] = ['AGUARDANDO_OS', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];

// moeda base do sistema; valores em outra moeda sao convertidos pelo backend
export const MOEDA_BASE = 'BRL';

// moedas oferecidas no formulario (o backend aceita qualquer codigo iso de 3 letras)
export const MOEDAS: string[] = ['BRL', 'USD', 'EUR', 'ARS', 'PYG'];

// transfer como o backend devolve (TransferResponseDTO)
// datas sem fuso: dataTransfer "2026-09-20", horaTransfer "14:30:00"
// valorBase e sempre em brl; com moeda estrangeira o backend calcula a partir do valorOriginal
// (se a api de cambio estiver fora do ar, o transfer e salvo com valorBase nulo)
// osId fica nulo ate o transfer ser agrupado numa ordem de servico
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
}

export type TransferRequest = Omit<Transfer, 'id'>;
