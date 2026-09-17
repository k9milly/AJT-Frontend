import { Transfer } from '../../core/models/transfer.model';
import {
  descreverTransfer,
  formatarData,
  formatarHora,
  formatarMoeda,
  horaParaApi,
  horaParaInput,
  iniciais,
  textoOuNulo,
  tomDoStatus,
} from './rotulos';

/*
 * o que testa: os formatadores e conversoes usados em todas as telas do painel
 * (datas, horas, moedas, iniciais do avatar, cor dos status e limpeza de campos opcionais).
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

  it('descreverTransfer resume data, hora e rota', () => {
    const transfer: Transfer = {
      id: 12, dataTransfer: '2026-09-20', horaTransfer: '14:30:00', origem: 'Aeroporto', destino: 'Hotel',
      status: 'CONFIRMADO', valorBase: null, valorOriginal: null, moedaOrigem: null, osId: null,
    };

    expect(descreverTransfer(transfer)).toBe('#12 · 20/09/2026 14:30 · Aeroporto → Hotel');
  });
});
