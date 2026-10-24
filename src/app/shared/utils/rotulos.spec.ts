import { Transfer } from '../../core/models/transfer.model';
import {
  cpfValido,
  dataHoraNoPassado,
  descreverTransfer,
  formatarData,
  formatarHora,
  formatarMoeda,
  formatarTelefone,
  hojeLocal,
  horaParaApi,
  horaParaInput,
  iniciais,
  normalizarPlaca,
  textoOuNulo,
  tomDoStatus,
} from './rotulos';

/*
 * o que testa: os formatadores e conversoes usados em todas as telas do painel
 * (datas, horas, moedas, telefone, cpf, placa, iniciais do avatar, cor dos status e limpeza de campos opcionais).
 *
 * como rodar: teste unitario puro, sem TestBed. roda com "npm test".
 *
 * por que existe: sao funcoes pequenas, mas com armadilhas reais:
 * - a api manda data sem fuso ("2026-09-20"); converter com new Date() joga a data pro dia
 *   anterior em fuso negativo (brasil). por isso a data e formatada sem Date.
 * - o <input type="time"> nao aceita segundos e a api devolve "14:30:00".
 * - campo opcional vazio precisa virar null; o backend valida "" como texto invalido.
 */
describe('rotulos e formatadores', () => {

  it('formatarData nao sofre com fuso horario', () => {
    expect(formatarData('2026-09-20')).toBe('20/09/2026');
    expect(formatarData('2026-01-01T00:30:00')).toBe('01/01/2026');
    expect(formatarData(null)).toBe('—');
  });

  it('hora da api vira hora de input e vice-versa', () => {
    expect(formatarHora('14:30:00')).toBe('14:30');
    expect(horaParaInput('14:30:00')).toBe('14:30');
    expect(horaParaInput(null)).toBe('');
    expect(horaParaApi('')).toBeNull();
    expect(horaParaApi('08:05')).toBe('08:05');
  });

  it('formatarTelefone poe mascara em celular e fixo e deixa o resto como veio', () => {
    expect(formatarTelefone('45999990000')).toBe('(45) 99999-0000');
    expect(formatarTelefone('(45) 3333-4444')).toBe('(45) 3333-4444');
    expect(formatarTelefone('4533334444')).toBe('(45) 3333-4444');
    expect(formatarTelefone('+595 981 123456')).toBe('+595 981 123456');
    expect(formatarTelefone(null)).toBe('—');
  });

  it('formatarMoeda usa o formato brasileiro pra qualquer moeda', () => {
    // o espaco entre simbolo e numero e um espaco "nao quebravel" no Intl; normaliza pra comparar
    const normalizar = (texto: string) => texto.replace(/\s/g, ' ');

    expect(normalizar(formatarMoeda(1234.5, 'BRL'))).toBe('R$ 1.234,50');
    expect(normalizar(formatarMoeda(10, 'USD'))).toBe('US$ 10,00');
    expect(formatarMoeda(null)).toBe('—');
  });

  it('iniciais pegam primeira e ultima palavra', () => {
    expect(iniciais('Maria da Silva Souza')).toBe('MS');
    expect(iniciais('admin')).toBe('AD');
    expect(iniciais('')).toBe('?');
  });

  it('tomDoStatus da a mesma cor pro mesmo status em qualquer tela', () => {
    expect(tomDoStatus('EM_ANDAMENTO')).toBe('warning');
    expect(tomDoStatus('CONCLUIDO')).toBe('success');
    expect(tomDoStatus('FINALIZADA')).toBe('success');
    expect(tomDoStatus('QUALQUER_OUTRO')).toBe('neutral');
  });

  it('textoOuNulo transforma vazio e espacos em null', () => {
    expect(textoOuNulo('   ')).toBeNull();
    expect(textoOuNulo('')).toBeNull();
    expect(textoOuNulo('  Brasileira ')).toBe('Brasileira');
  });

  it('hojeLocal usa a data do fuso do navegador, nao a de UTC', () => {
    expect(hojeLocal(new Date(2026, 9, 24, 23, 50))).toBe('2026-10-24');
    expect(hojeLocal(new Date(2026, 0, 5, 0, 10))).toBe('2026-01-05');
  });

  it('dataHoraNoPassado recusa horario que ja passou e aceita o minuto atual em diante', () => {
    const agora = new Date(2026, 9, 24, 9, 7, 30); // 24/10/2026 09:07:30
    expect(dataHoraNoPassado('2026-10-24', '09:06', agora)).toBeTrue();
    expect(dataHoraNoPassado('2026-10-23', '23:59', agora)).toBeTrue();
    expect(dataHoraNoPassado('2026-10-24', '09:07', agora)).toBeFalse();
    expect(dataHoraNoPassado('2026-10-24', '09:08:00', agora)).toBeFalse();
    expect(dataHoraNoPassado('2026-10-25', '08:00', agora)).toBeFalse();
  });

  it('cpfValido segue a regra do backend: 11 digitos, nao repetidos e verificadores certos', () => {
    expect(cpfValido('529.982.247-25')).toBeTrue();
    expect(cpfValido('52998224725')).toBeTrue();
    expect(cpfValido('529.982.247-24')).toBeFalse();
    expect(cpfValido('111.111.111-11')).toBeFalse();
    expect(cpfValido('123')).toBeFalse();
    expect(cpfValido(null)).toBeFalse();
  });

  it('normalizarPlaca tira hifen e espacos e poe em maiuscula', () => {
    expect(normalizarPlaca('abc-1234')).toBe('ABC1234');
    expect(normalizarPlaca(' ABC1D23 ')).toBe('ABC1D23');
    expect(normalizarPlaca(null)).toBe('');
  });

  it('descreverTransfer resume data, hora e rota', () => {
    const transfer: Transfer = {
      id: 12, dataTransfer: '2026-09-20', horaTransfer: '14:30:00', origem: 'Aeroporto', destino: 'Hotel',
      status: 'CONFIRMADO', valorBase: null, valorOriginal: null, moedaOrigem: null, osId: null,
      passageiroIds: [], versao: 0,
    };

    expect(descreverTransfer(transfer)).toBe('#12 · 20/09/2026 14:30 · Aeroporto → Hotel');
  });
});
