import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { semBootstrapGuard } from './estilos-site';

/*
 * o que testa: o guard que mantem o css do bootstrap sempre desligado, em qualquer rota.
 *
 * como rodar: TestBed simples; o teste cria um <link> falso de bootstrap no documento, roda o
 * guard e confere o atributo "disabled". roda com "npm test".
 *
 * por que existe: o bootstrap e o tailwind tem classes com o mesmo nome (border, shadow-sm,
 * mt-3, gap-4, bg-primary...) e o bootstrap marca as dele com !important, entao ele ganha por
 * baixo dos panos mesmo sem a gente usar nenhum componente dele de verdade — foi assim que a
 * borda dos cards e o hover dos botoes da landing saiam cinza-claro em vez de dourado. o bug
 * aparece so visualmente (nenhum erro no console), entao sem esse teste uma regressao (por
 * exemplo, alguem religando o bootstrap achando que precisa dele) passaria despercebida.
 */
describe('guard de estilo (bootstrap sempre desligado)', () => {
  let link: HTMLLinkElement;

  const executar = (guard: typeof semBootstrapGuard) =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'bootstrap.css';
    document.head.appendChild(link);
  });

  afterEach(() => link.remove());

  it('desativa o link do bootstrap', () => {
    expect(executar(semBootstrapGuard)).toBeTrue();
    expect(link.disabled).toBeTrue();
  });

  it('mantem desativado mesmo se ja estava desativado (idempotente)', () => {
    link.disabled = true;
    executar(semBootstrapGuard);
    expect(link.disabled).toBeTrue();
  });
});
