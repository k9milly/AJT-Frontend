import { FormControl } from '@angular/forms';
import { Pagina, paginaAposExclusao } from '../../core/models/api.model';
import { inteiroPositivo, periodoInvalido, textoObrigatorio } from './validadores';

/*
 * o que testa: os validadores reutilizados nos formularios do painel (textoObrigatorio,
 * inteiroPositivo, periodoInvalido) e o calculo de pagina apos exclusao (paginaAposExclusao).
 *
 * como rodar: teste unitario puro, sem TestBed. roda com "npm test".
 *
 * por que existe: Validators.required do Angular aceita "   " (so espacos), que depois do .trim()
 * chegava vazio na API e estourava 400. e campos numericos inteiros aceitavam decimais como 4.5.
 */
describe('validadores e paginacao auxiliar', () => {

  it('textoObrigatorio recusa vazio e espacos em branco', () => {
    expect(textoObrigatorio(new FormControl(''))).toEqual({ required: true });
    expect(textoObrigatorio(new FormControl('   '))).toEqual({ required: true });
    expect(textoObrigatorio(new FormControl(null))).toEqual({ required: true });
    expect(textoObrigatorio(new FormControl('Aeroporto'))).toBeNull();
  });

  it('inteiroPositivo aceita vazio (opcional) e inteiros >= 1, mas recusa zero, negativo e decimal', () => {
    expect(inteiroPositivo(new FormControl(null))).toBeNull();
    expect(inteiroPositivo(new FormControl(''))).toBeNull();
    expect(inteiroPositivo(new FormControl(1))).toBeNull();
    expect(inteiroPositivo(new FormControl(15))).toBeNull();
    expect(inteiroPositivo(new FormControl(0))).toEqual({ inteiroPositivo: true });
    expect(inteiroPositivo(new FormControl(-2))).toEqual({ inteiroPositivo: true });
    expect(inteiroPositivo(new FormControl(2.5))).toEqual({ inteiroPositivo: true });
  });

  it('periodoInvalido detecta quando a data inicial e posterior a final', () => {
    expect(periodoInvalido('2026-10-20', '2026-10-10')).toBeTrue();
    expect(periodoInvalido('2026-10-10', '2026-10-10')).toBeFalse();
    expect(periodoInvalido('2026-10-10', '2026-10-20')).toBeFalse();
    expect(periodoInvalido('2026-10-20', '')).toBeFalse();
  });

  it('paginaAposExclusao recua uma pagina quando exclui o ultimo item de pagina > 0', () => {
    const base: Pagina<number> = {
      conteudo: [1], pagina: 2, tamanho: 20, totalElementos: 41, totalPaginas: 3, primeira: false, ultima: true,
    };
    expect(paginaAposExclusao(base)).toBe(1);
    expect(paginaAposExclusao({ ...base, conteudo: [1, 2] })).toBe(2);
    expect(paginaAposExclusao({ ...base, pagina: 0 })).toBe(0);
    expect(paginaAposExclusao(null)).toBe(0);
  });
});
