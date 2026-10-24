import { STATUS_TRANSFER, ajustarStatusAoVinculo, statusPermitidoParaVinculo } from './transfer.model';

/*
 * o que testa: a regra que liga o status do transfer ao vinculo com uma ordem de servico
 * (sem OS: Aguardando OS ou Cancelado | com OS: Confirmado em diante).
 *
 * como rodar: teste unitario puro, sem TestBed. roda com "npm test".
 *
 * por que existe: o formulario de transfer usa essa regra pra montar as opcoes do status e
 * pra ajustar o status quando a OS entra ou sai. se ela quebrar, volta a ser possivel salvar
 * um transfer "Confirmado" sem OS, que some da lista "Aguardando OS" do painel.
 */
describe('regra de status x vinculo com a OS', () => {

  it('sem OS so aceita Aguardando OS e Cancelado', () => {
    const permitidos = STATUS_TRANSFER.filter(status => statusPermitidoParaVinculo(status, false));
    expect(permitidos).toEqual(['AGUARDANDO_OS', 'CANCELADO']);
  });

  it('com OS aceita de Confirmado em diante, mas nao Aguardando OS', () => {
    const permitidos = STATUS_TRANSFER.filter(status => statusPermitidoParaVinculo(status, true));
    expect(permitidos).toEqual(['CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']);
  });

  it('ao entrar numa OS, Aguardando OS vira Confirmado', () => {
    expect(ajustarStatusAoVinculo('AGUARDANDO_OS', true)).toBe('CONFIRMADO');
  });

  it('ao sair da OS, qualquer status de andamento volta pra Aguardando OS', () => {
    expect(ajustarStatusAoVinculo('CONFIRMADO', false)).toBe('AGUARDANDO_OS');
    expect(ajustarStatusAoVinculo('EM_ANDAMENTO', false)).toBe('AGUARDANDO_OS');
    expect(ajustarStatusAoVinculo('CONCLUIDO', false)).toBe('AGUARDANDO_OS');
  });

  it('cancelado continua cancelado com ou sem OS', () => {
    expect(ajustarStatusAoVinculo('CANCELADO', true)).toBe('CANCELADO');
    expect(ajustarStatusAoVinculo('CANCELADO', false)).toBe('CANCELADO');
  });
});
