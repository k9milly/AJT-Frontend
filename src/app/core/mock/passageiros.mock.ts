import { Passageiro } from '../models/passageiro.model';

export const PASSAGEIROS_MOCK: Passageiro[] = [
  { id: 1, nome: 'Maria Souza', tipoDocumento: 'CPF', numeroDocumento: '123.456.789-00', nacionalidade: 'Brasileira' },
  { id: 2, nome: 'John Smith', tipoDocumento: 'PASSAPORTE', numeroDocumento: 'US4839201', nacionalidade: 'Americana' },
  { id: 3, nome: 'Carlos Pereira', tipoDocumento: 'RG', numeroDocumento: 'MG-18.222.333', nacionalidade: 'Brasileira' },
];
