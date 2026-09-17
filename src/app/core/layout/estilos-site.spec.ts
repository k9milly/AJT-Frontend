import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { comBootstrapGuard, semBootstrapGuard } from './estilos-site';

/*
 * o que testa: os guards que ligam o css do bootstrap so na landing page e desligam no painel.
 *
 * como rodar: TestBed simples; o teste cria um <link> falso de bootstrap no documento, roda os
 * guards e confere o atributo "disabled". roda com "npm test".
 *
 * por que existe: bootstrap e tailwind tem classes com o mesmo nome (bg-primary, border, p-4...).
 * com os dois ativos o painel fica azul e com espacamentos errados; sem o bootstrap a navbar da
 * landing perde o estilo. o bug aparece so visualmente (nenhum erro no console), entao sem esse
 * teste uma regressao passaria despercebida ate alguem abrir a tela.
 */
describe('guards de estilo (bootstrap so na landing)', () => {
  let link: HTMLLinkElement;

  const executar = (guard: typeof comBootstrapGuard) =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'bootstrap.css';
    document.head.appendChild(link);
  });

  afterEach(() => link.remove());

  it('no painel/login o bootstrap fica desligado', () => {
    expect(executar(semBootstrapGuard)).toBeTrue();
    expect(link.disabled).toBeTrue();
  });

  it('ao voltar pra landing o bootstrap e religado', () => {
    executar(semBootstrapGuard);
    expect(executar(comBootstrapGuard)).toBeTrue();
    expect(link.disabled).toBeFalse();
  });
});
