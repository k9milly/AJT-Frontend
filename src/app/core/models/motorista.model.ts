// motorista como o backend devolve (MotoristaResponseDTO)
// latitude/longitude sao a posicao atual (vem do app do motorista, nao e editada pelo painel)
export interface Motorista {
  id: number;
  nome: string;
  cnh: string;
  telefone: string | null;
  latitudeAtual: number | null;
  longitudeAtual: number | null;
  // lock otimista do backend (RNF008): reenviar na edicao pra receber 409 se outra pessoa salvou antes
  versao: number;
}

// corpo de criacao/edicao (MotoristaRequestDTO)
// atencao: o PUT sobrescreve latitude/longitude, entao a edicao reenvia os valores que ja existiam
export type MotoristaRequest = Omit<Motorista, 'id' | 'versao'> & { versao?: number };

// filtros de GET /api/motoristas (RF015): parte do texto, sem diferenciar maiusculas
export interface FiltroMotorista {
  nome?: string;
  cnh?: string;
}
