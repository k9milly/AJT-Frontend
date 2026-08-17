export type TipoDocumento = 'CPF' | 'RG' | 'CNH' | 'PASSAPORTE';

export interface Passageiro {
  id: number;
  nome: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nacionalidade: string;
}
