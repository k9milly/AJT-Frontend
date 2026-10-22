// tipos sugeridos no formulario; no backend o campo e texto livre (ate 20 caracteres)
export const TIPOS_DOCUMENTO: string[] = ['CPF', 'RG', 'CNH', 'PASSAPORTE'];

// passageiro como o backend devolve (PassageiroResponseDTO)
// o documento e cifrado no banco, mas a api devolve legivel; tratar como dado sensivel na tela
// (pro motorista o backend devolve o documento mascarado, ex.: "************25")
export interface Passageiro {
  id: number;
  nome: string;
  tipoDocumento: string;
  documento: string;
  nacionalidade: string | null;
  // lock otimista do backend (RNF008): reenviar na edicao pra receber 409 se outra pessoa salvou antes
  versao: number;
}

// na criacao nao existe versao; na edicao ela vai junto
export type PassageiroRequest = Omit<Passageiro, 'id' | 'versao'> & { versao?: number };

// filtros de GET /api/passageiros (RF015): parte do texto, sem diferenciar maiusculas
export interface FiltroPassageiro {
  nome?: string;
  nacionalidade?: string;
}
