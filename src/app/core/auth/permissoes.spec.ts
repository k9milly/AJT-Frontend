import { Perfil } from '../models/auth.model';
import { podeAlterarStatusParada, podeEscrever, podeExcluir, podeLer } from './permissoes';

/*
 * o que testa: a matriz de permissoes do front (permissoes.ts), que decide quais botoes, itens
 * de menu e rotas aparecem pra cada perfil (ADMIN, GERENTE, ATENDENTE, MOTORISTA).
 *
 * como rodar: teste unitario puro, sem TestBed. roda com "npm test".
 *
 * por que existe: essa matriz e uma copia do SecurityConfig do backend. o backend continua
 * protegendo tudo (responde 403), mas se as duas matrizes divergirem o usuario ve botao que nao
 * funciona ou deixa de ver um que deveria. cada caso abaixo espelha uma linha da tabela do
 * README do backend; se a regra mudar la, este teste mostra exatamente o que atualizar aqui.
 */
describe('permissoes por perfil', () => {

  const todos: Perfil[] = ['ADMIN', 'GERENTE', 'ATENDENTE', 'MOTORISTA'];

  it('usuarios: tudo so pro ADMIN', () => {
    expect(podeLer('ADMIN', 'usuarios')).toBeTrue();
    expect(podeEscrever('ADMIN', 'usuarios')).toBeTrue();
    expect(podeExcluir('ADMIN', 'usuarios')).toBeTrue();

    for (const perfil of ['GERENTE', 'ATENDENTE', 'MOTORISTA'] as Perfil[]) {
      expect(podeLer(perfil, 'usuarios')).withContext(perfil).toBeFalse();
      expect(podeEscrever(perfil, 'usuarios')).withContext(perfil).toBeFalse();
    }
  });

  it('motoristas, veiculos e os: todos leem, so ADMIN e GERENTE escrevem e excluem', () => {
    for (const recurso of ['motoristas', 'veiculos', 'ordens-servico'] as const) {
      for (const perfil of todos) {
        expect(podeLer(perfil, recurso)).withContext(`${perfil} le ${recurso}`).toBeTrue();
      }
      expect(podeEscrever('GERENTE', recurso)).toBeTrue();
      expect(podeEscrever('ATENDENTE', recurso)).withContext(recurso).toBeFalse();
      expect(podeExcluir('MOTORISTA', recurso)).withContext(recurso).toBeFalse();
    }
  });

  it('passageiros, transfers e pontos de coleta: ATENDENTE escreve mas nao exclui', () => {
    for (const recurso of ['passageiros', 'transfers', 'pontos-coleta'] as const) {
      expect(podeEscrever('ATENDENTE', recurso)).withContext(recurso).toBeTrue();
      expect(podeExcluir('ATENDENTE', recurso)).withContext(recurso).toBeFalse();
      expect(podeExcluir('GERENTE', recurso)).withContext(recurso).toBeTrue();
      expect(podeEscrever('MOTORISTA', recurso)).withContext(recurso).toBeFalse();
    }
  });

  it('paradas: MOTORISTA nao edita, mas pode trocar o status', () => {
    expect(podeEscrever('MOTORISTA', 'paradas-os')).toBeFalse();
    expect(podeAlterarStatusParada('MOTORISTA')).toBeTrue();
    expect(podeAlterarStatusParada('ATENDENTE')).toBeFalse();
  });

  it('sem perfil (deslogado) nao pode nada', () => {
    expect(podeLer(null, 'transfers')).toBeFalse();
    expect(podeEscrever(undefined, 'transfers')).toBeFalse();
    expect(podeAlterarStatusParada(null)).toBeFalse();
  });
});
