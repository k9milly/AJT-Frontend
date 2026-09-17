import { formatarCpf } from './passageiros.component';

/*
 * o que testa: a mascara de cpf aplicada enquanto o usuario digita no cadastro de passageiros.
 *
 * como rodar: teste unitario puro da funcao exportada, sem renderizar a tela. roda com "npm test".
 *
 * por que existe: a mascara roda a cada tecla. se ela nao lidar com texto colado (com pontos,
 * tracos ou espacos) ou com digitos a mais, o documento e salvo errado. o documento e cifrado
 * no banco, entao um cpf mal formatado dificilmente e percebido e corrigido depois.
 */
describe('formatarCpf', () => {

  it('formata progressivamente enquanto digita', () => {
    expect(formatarCpf('123')).toBe('123');
    expect(formatarCpf('1234')).toBe('123.4');
    expect(formatarCpf('1234567')).toBe('123.456.7');
    expect(formatarCpf('12345678901')).toBe('123.456.789-01');
  });

  it('aceita texto colado com pontuacao e espacos', () => {
    expect(formatarCpf(' 123.456.789-01 ')).toBe('123.456.789-01');
  });

  it('ignora letras e corta digitos alem de 11', () => {
    expect(formatarCpf('123abc45678901999')).toBe('123.456.789-01');
  });
});
