import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Sessao } from '../models/auth.model';
import { authGuard, sessaoAtivaGuard } from './auth.guard';
import { roleGuard } from './role.guard';

/*
 * o que testa: os guards que decidem quem entra em cada area.
 * - authGuard (painel /admin): sem sessao -> /login | senha provisoria -> /trocar-senha | ok -> entra
 * - sessaoAtivaGuard (/trocar-senha): so exige estar logado
 * - roleGuard (ex: /admin/usuarios so pra ADMIN): perfil errado volta pro painel
 *
 * como rodar: TestBed com router real e o guard executado via runInInjectionContext
 * (e assim que o angular roda guards funcionais). roda com "npm test".
 *
 * por que existe: o backend exige que o admin do seed troque a senha antes de usar o sistema
 * (trocarSenha = true). se o authGuard deixar passar, o usuario usa o painel com a senha padrao.
 * e se o sessaoAtivaGuard fizesse a mesma checagem do authGuard, quem precisa trocar a senha
 * entraria em loop infinito de redirecionamento.
 */
describe('guards de sessao e perfil', () => {
  let router: Router;

  function salvarSessao(parcial: Partial<Sessao>): void {
    const sessao: Sessao = {
      token: 't',
      username: 'u',
      role: 'ADMIN',
      trocarSenha: false,
      expiraEmMs: Date.now() + 60000,
      ...parcial,
    };
    localStorage.setItem('ajt_sessao', JSON.stringify(sessao));
  }

  // executa o guard do jeito que o router do angular executa
  function executar(guard: typeof authGuard): boolean | UrlTree {
    return TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  function destino(resultado: boolean | UrlTree): string | true {
    return resultado === true ? true : router.serializeUrl(resultado as UrlTree);
  }

  function configurar(): void {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
    router = TestBed.inject(Router);
  }

  afterEach(() => localStorage.clear());

  it('authGuard sem sessao manda pro login', () => {
    configurar();
    expect(destino(executar(authGuard))).toBe('/login');
  });

  it('authGuard com senha provisoria manda pra troca de senha', () => {
    salvarSessao({ trocarSenha: true });
    configurar();
    expect(destino(executar(authGuard))).toBe('/trocar-senha');
  });

  it('authGuard com sessao valida libera o painel', () => {
    salvarSessao({});
    configurar();
    expect(destino(executar(authGuard))).toBeTrue();
  });

  it('sessaoAtivaGuard libera a troca de senha mesmo com senha provisoria (sem loop)', () => {
    salvarSessao({ trocarSenha: true });
    configurar();
    expect(destino(executar(sessaoAtivaGuard))).toBeTrue();
  });

  it('roleGuard barra perfil sem permissao e devolve pro painel', () => {
    salvarSessao({ role: 'ATENDENTE' });
    configurar();
    expect(destino(executar(roleGuard('ADMIN')))).toBe('/admin/painel');
  });

  it('roleGuard libera o perfil permitido', () => {
    salvarSessao({ role: 'ADMIN' });
    configurar();
    expect(destino(executar(roleGuard('ADMIN')))).toBeTrue();
  });
});
