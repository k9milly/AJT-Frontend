export type TipoVeiculo = 'VAN' | 'MICRO_ONIBUS' | 'ONIBUS' | 'CARRO';

export interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  tipo: TipoVeiculo;
  capacidade: number;
  motoristaId: number | null;
}
