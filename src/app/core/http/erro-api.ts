import { HttpErrorResponse } from '@angular/common/http';
import { ErroApi } from '../models/api.model';

// ---------------------------------------------------------------
// traducao de erro http -> mensagem pra mostrar na tela
// ---------------------------------------------------------------
// o backend sempre devolve { timestamp, status, erro, mensagem, detalhes[] },
// entao da pra ter um tratamento unico em vez de repetir switch em cada tela.
// regra: quando o backend manda uma mensagem de negocio (400, 404, 409) ela e mostrada como veio;
// pros status "tecnicos" (0, 403, 429, 5xx) o front usa um texto proprio, mais claro pro usuario.

// mensagens fixas por status
export const MENSAGENS_ERRO = {
  semConexao: 'Não foi possível conectar ao servidor. Verifique se o backend está no ar.',
  sessaoExpirada: 'Sua sessão expirou. Entre novamente.',
  semPermissao: 'Você não tem permissão para realizar esta ação.',
  naoEncontrado: 'Registro não encontrado.',
  emUso: 'Este registro está em uso e não pode ser removido.',
  muitasTentativas: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
  cambioIndisponivel: 'A cotação de câmbio está indisponível no momento. Tente novamente mais tarde.',
  inesperado: 'Ocorreu um erro inesperado. Tente novamente.',
} as const;

// verifica se o corpo do erro segue o formato ErroApi do backend
function ehErroApi(corpo: unknown): corpo is ErroApi {
  return !!corpo && typeof corpo === 'object' && 'mensagem' in corpo;
}

// monta a mensagem de validacao: "mensagem geral" + os detalhes de cada campo
function mensagemComDetalhes(corpo: ErroApi): string {
  if (!corpo.detalhes?.length) {
    return corpo.mensagem;
  }
  return `${corpo.mensagem}: ${corpo.detalhes.join('; ')}`;
}

// ponto unico usado pelas telas: recebe qualquer erro do subscribe e devolve um texto legivel
// "padrao" permite trocar a mensagem generica por uma do contexto (ex: "erro ao salvar motorista")
export function mensagemDeErro(erro: unknown, padrao: string = MENSAGENS_ERRO.inesperado): string {
  if (!(erro instanceof HttpErrorResponse)) {
    return erro instanceof Error && erro.message ? erro.message : padrao;
  }

  const corpo = ehErroApi(erro.error) ? erro.error : null;

  switch (erro.status) {
    case 0:
      return MENSAGENS_ERRO.semConexao;
    case 400:
      return corpo ? mensagemComDetalhes(corpo) : padrao;
    case 401:
      // no login o 401 e "usuario ou senha invalidos" e a mensagem do backend e a certa
      return corpo?.mensagem ?? MENSAGENS_ERRO.sessaoExpirada;
    case 403:
      return MENSAGENS_ERRO.semPermissao;
    case 404:
      return corpo?.mensagem ?? MENSAGENS_ERRO.naoEncontrado;
    case 409:
      return corpo?.mensagem ?? MENSAGENS_ERRO.emUso;
    case 429:
      return MENSAGENS_ERRO.muitasTentativas;
    case 502:
      return MENSAGENS_ERRO.cambioIndisponivel;
    default:
      return corpo?.mensagem ?? padrao;
  }
}

// atalho pra saber o status sem precisar importar HttpErrorResponse na tela
export function statusDoErro(erro: unknown): number | null {
  return erro instanceof HttpErrorResponse ? erro.status : null;
}
