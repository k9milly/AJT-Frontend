import { montarParametros } from './parametros';

/*
 * o que testa: montarParametros, que monta a query string das listagens paginadas
 * (?page=0&size=20&sort=campo,asc) junto com os filtros de cada tela.
 *
 * como rodar: teste unitario puro, sem TestBed. roda com "npm test".
 *
 * por que existe: o backend responde 400 pra enum invalido. se o front mandar "?status="
 * (vazio) quando o filtro "todos" esta selecionado, a listagem quebra. o teste garante que
 * valores vazios/nulos nunca viram parametro e que a ordenacao chega no formato do spring.
 */
describe('montarParametros', () => {

  it('monta paginacao e ordenacao no formato do spring', () => {
    const params = montarParametros({ page: 2, size: 20, sort: 'dataTransfer,desc' });

    expect(params.get('page')).toBe('2');
    expect(params.get('size')).toBe('20');
    expect(params.get('sort')).toBe('dataTransfer,desc');
  });

  it('inclui filtros extras junto com a paginacao', () => {
    const params = montarParametros({ page: 0 }, { status: 'AGUARDANDO_OS' });

    expect(params.get('page')).toBe('0');
    expect(params.get('status')).toBe('AGUARDANDO_OS');
  });

  it('ignora filtros vazios, nulos e indefinidos', () => {
    const params = montarParametros({}, { status: '', nacionalidade: null, cnh: undefined });

    expect(params.keys()).toEqual([]);
  });

  it('mantem o zero (pagina 0 e valida)', () => {
    expect(montarParametros({ page: 0 }).get('page')).toBe('0');
  });
});
