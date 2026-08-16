import { Veiculo } from '../models/veiculo.model';

export const VEICULOS_MOCK: Veiculo[] = [
  { id: 1, placa: 'ABC1D23', modelo: 'Mercedes Sprinter', tipo: 'VAN', capacidade: 15, motoristaId: 1 },
  { id: 2, placa: 'XYZ9K87', modelo: 'Volkswagen Voyage', tipo: 'CARRO', capacidade: 4, motoristaId: 2 },
  { id: 3, placa: 'JKL4M56', modelo: 'Marcopolo Volare', tipo: 'MICRO_ONIBUS', capacidade: 28, motoristaId: null },
];
