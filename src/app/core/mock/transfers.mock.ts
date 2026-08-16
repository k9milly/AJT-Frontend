import { Transfer } from '../models/transfer.model';

export const TRANSFERS_MOCK: Transfer[] = [
  {
    id: 1,
    passageiroId: 1,
    origemId: 1,
    destinoId: 2,
    motoristaId: 1,
    veiculoId: 1,
    dataHora: '2026-08-20T09:30',
    valor: 120,
    status: 'AGENDADO',
  },
  {
    id: 2,
    passageiroId: 2,
    origemId: 2,
    destinoId: 3,
    motoristaId: 2,
    veiculoId: 2,
    dataHora: '2026-08-21T14:00',
    valor: 85,
    status: 'CONCLUIDO',
  },
  {
    id: 3,
    passageiroId: 3,
    origemId: 3,
    destinoId: 1,
    motoristaId: null,
    veiculoId: null,
    dataHora: '2026-08-22T18:15',
    valor: 150,
    status: 'CANCELADO',
  },
];
