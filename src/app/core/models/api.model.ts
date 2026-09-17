// ---------------------------------------------------------------
// contratos genericos da api (valem pra todos os recursos)
// ---------------------------------------------------------------

// envelope das listagens paginadas do backend (PaginaResponseDTO)
// os itens ficam em "conteudo"; o resto e metadado pra montar a paginacao na tela
export interface Pagina<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  primeira: boolean;
  ultima: boolean;
}

// formato unico de erro devolvido pelo backend (ErroResponseDTO)
// "detalhes" traz as mensagens de validacao campo a campo, ex: "origem: Origem é obrigatória"
export interface ErroApi {
  timestamp: string;
  status: number;
  erro: string;
  mensagem: string;
  detalhes: string[] | null;
}

// parametros aceitos por qualquer listagem paginada (?page=0&size=20&sort=campo,asc)
export interface ParametrosPagina {
  page?: number;
  size?: number;
  sort?: string;
}

// tamanho maximo de pagina aceito pelo backend
// usado pra carregar opcoes de selects (ex: motoristas no formulario de os)
export const TAMANHO_MAXIMO_PAGINA = 100;

// embrulha uma lista simples num envelope de pagina unica
// usado quando a tela mostra o resultado de uma busca que nao e paginada (ex: busca por cnh)
export function paginaUnica<T>(itens: T[]): Pagina<T> {
  return {
    conteudo: itens,
    pagina: 0,
    tamanho: itens.length,
    totalElementos: itens.length,
    totalPaginas: itens.length ? 1 : 0,
    primeira: true,
    ultima: true,
  };
}
