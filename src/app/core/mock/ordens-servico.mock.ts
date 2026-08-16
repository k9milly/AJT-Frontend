import { OrdemServico } from '../models/ordem-servico.model';

export const ORDENS_SERVICO_MOCK: OrdemServico[] = [
  {
    id: 1,
    motoristaId: 1,
    veiculoId: 1,
    data: '2026-08-20',
    transferIds: [1],
    status: 'ABERTA',
    observacoes: 'Confirmar horário do voo antes de sair.',
  },
  {
    id: 2,
    motoristaId: 2,
    veiculoId: 2,
    data: '2026-08-21',
    transferIds: [2],
    status: 'FINALIZADA',
    observacoes: '',
  },
];
