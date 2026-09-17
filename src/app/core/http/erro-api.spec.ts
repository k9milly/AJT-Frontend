import { HttpErrorResponse } from '@angular/common/http';
import { MENSAGENS_ERRO, mensagemDeErro, statusDoErro } from './erro-api';

/*
 * o que testa: a funcao mensagemDeErro, que transforma qualquer erro vindo do subscribe
 * (HttpErrorResponse do angular, Error comum ou valor desconhecido) no texto mostrado na tela.
 * cobre cada status que o backend documenta: 0, 400, 401, 403, 404, 409, 429 e 502.
 *
 * como rodar: teste unitario puro, sem TestBed e sem http real.
 * roda com "npm test" (ou "npx ng test --watch=false" pra rodar uma vez so).
 *
 * por que existe: todas as telas dependem dessa traducao. se ela quebrar, o usuario passa a ver
 * "erro inesperado" no lugar de "cnh ja cadastrada" ou, pior, a mensagem tecnica do navegador.
 * tambem protege regras que nao sao obvias: no 400 os detalhes de validacao precisam aparecer,
 * no 429 o texto e do front (o backend so diz "too many requests") e no login o 401 usa a
 * mensagem do backend ("usuario ou senha invalidos") e nao "sessao expirada".
 */
describe('mensagemDeErro', () => {

  // monta um erro http no formato que o HttpClient entrega pro subscribe
  function erroHttp(status: number, corpo: unknown = null): HttpErrorResponse {
    return new HttpErrorResponse({ status, error: corpo });
  }

  // corpo padrao do backend (ErroResponseDTO)
  function corpoApi(mensagem: string, detalhes: string[] | null = null) {
    return { timestamp: '2026-09-17T10:30:00', status: 400, erro: 'Erro', mensagem, detalhes };
  }

  it('status 0 (backend fora do ar ou cors) vira mensagem de conexao', () => {
    expect(mensagemDeErro(erroHttp(0))).toBe(MENSAGENS_ERRO.semConexao);
  });

  it('400 junta a mensagem geral com os detalhes de cada campo', () => {
    const erro = erroHttp(400, corpoApi('Um ou mais campos estão inválidos', ['origem: Origem é obrigatória', 'destino: Destino é obrigatório']));

    expect(mensagemDeErro(erro)).toBe(
      'Um ou mais campos estão inválidos: origem: Origem é obrigatória; destino: Destino é obrigatório',
    );
  });

  it('400 sem detalhes mostra so a mensagem de regra de negocio', () => {
    expect(mensagemDeErro(erroHttp(400, corpoApi('CNH já cadastrada')))).toBe('CNH já cadastrada');
  });

  it('401 usa a mensagem do backend quando existe (caso do login)', () => {
    expect(mensagemDeErro(erroHttp(401, corpoApi('Usuário ou senha inválidos')))).toBe('Usuário ou senha inválidos');
  });

  it('401 sem corpo vira "sessao expirada"', () => {
    expect(mensagemDeErro(erroHttp(401))).toBe(MENSAGENS_ERRO.sessaoExpirada);
  });

  it('403 sempre usa o texto do front, mesmo com corpo', () => {
    expect(mensagemDeErro(erroHttp(403, corpoApi('Access Denied')))).toBe(MENSAGENS_ERRO.semPermissao);
  });

  it('404 e 409 preferem a mensagem do backend e tem texto padrao', () => {
    expect(mensagemDeErro(erroHttp(404, corpoApi('Motorista não encontrado: 7')))).toBe('Motorista não encontrado: 7');
    expect(mensagemDeErro(erroHttp(404))).toBe(MENSAGENS_ERRO.naoEncontrado);
    expect(mensagemDeErro(erroHttp(409))).toBe(MENSAGENS_ERRO.emUso);
  });

  it('429 avisa que o login esta bloqueado por tentativas', () => {
    expect(mensagemDeErro(erroHttp(429, corpoApi('Too many requests')))).toBe(MENSAGENS_ERRO.muitasTentativas);
  });

  it('502 avisa que a cotacao de cambio esta fora do ar', () => {
    expect(mensagemDeErro(erroHttp(502))).toBe(MENSAGENS_ERRO.cambioIndisponivel);
  });

  it('status desconhecido sem corpo usa o texto padrao passado pela tela', () => {
    expect(mensagemDeErro(erroHttp(500), 'Não foi possível salvar o motorista.')).toBe('Não foi possível salvar o motorista.');
  });

  it('erro que nao e http usa a mensagem do Error ou o padrao', () => {
    expect(mensagemDeErro(new Error('falhou'))).toBe('falhou');
    expect(mensagemDeErro('qualquer coisa', 'padrão')).toBe('padrão');
  });

  it('statusDoErro so devolve numero pra erro http', () => {
    expect(statusDoErro(erroHttp(404))).toBe(404);
    expect(statusDoErro(new Error('x'))).toBeNull();
  });
});
