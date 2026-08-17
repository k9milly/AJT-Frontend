export type CategoriaCnh = 'A' | 'B' | 'AB' | 'D' | 'E';

export interface Motorista {
  id: number;
  nome: string;
  cnh: string;
  categoriaCnh: CategoriaCnh;
  telefone: string;
  ativo: boolean;
}
