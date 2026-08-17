import { Motorista } from '../models/motorista.model';

export const MOTORISTAS_MOCK: Motorista[] = [
  { id: 1, nome: 'José Almeida', cnh: '01234567890', categoriaCnh: 'D', telefone: '(31) 99123-4567', ativo: true },
  { id: 2, nome: 'Paulo Ferreira', cnh: '09876543210', categoriaCnh: 'AB', telefone: '(31) 98888-1122', ativo: true },
  { id: 3, nome: 'Ricardo Lima', cnh: '11223344556', categoriaCnh: 'E', telefone: '(31) 97777-3344', ativo: false },
];
