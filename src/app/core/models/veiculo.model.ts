// tipos sugeridos no formulario; no backend o campo e texto livre (ate 50 caracteres)
export const TIPOS_VEICULO: string[] = ['VAN', 'SEDAN', 'SUV', 'MICRO_ONIBUS', 'ONIBUS'];

// veiculo como o backend devolve (VeiculoResponseDTO)
// "label" e o apelido interno do veiculo, ex: "Van 01"
export interface Veiculo {
  id: number;
  label: string;
  placa: string;
  capacidade: number;
  tipo: string | null;
  marca: string | null;
}

export type VeiculoRequest = Omit<Veiculo, 'id'>;
