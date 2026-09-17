// tipos sugeridos no formulario; no backend o campo e texto livre (ate 20 caracteres)
export const TIPOS_DOCUMENTO: string[] = ['CPF', 'RG', 'CNH', 'PASSAPORTE'];

// passageiro como o backend devolve (PassageiroResponseDTO)
// o documento e cifrado no banco, mas a api devolve legivel; tratar como dado sensivel na tela
export interface Passageiro {
  id: number;
  nome: string;
  tipoDocumento: string;
  documento: string;
  nacionalidade: string | null;
}

export type PassageiroRequest = Omit<Passageiro, 'id'>;
