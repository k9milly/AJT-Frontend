// motorista como o backend devolve (MotoristaResponseDTO)
// latitude/longitude sao a posicao atual (vem do app do motorista, nao e editada pelo painel)
export interface Motorista {
  id: number;
  nome: string;
  cnh: string;
  telefone: string | null;
  latitudeAtual: number | null;
  longitudeAtual: number | null;
}

// corpo de criacao/edicao (MotoristaRequestDTO)
// atencao: o PUT sobrescreve latitude/longitude, entao a edicao reenvia os valores que ja existiam
export type MotoristaRequest = Omit<Motorista, 'id'>;
