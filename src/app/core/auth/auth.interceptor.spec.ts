import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Sessao } from '../models/auth.model';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

/*
 * o que testa: o authInterceptor, que fica entre todas as chamadas http e a api.
 * - coloca "Authorization: Bearer <token>" nas chamadas pra nossa api
 * - nao coloca o token no login nem em urls de fora (ex: google fonts, apis externas)
 * - quando a api responde 401 fora do login: desloga e manda pro /login?sessao=expirada
 * - 403 (sem permissao) e 401 do proprio login nao deslogam
 *
 * como rodar: TestBed com HttpClient real + interceptor + HttpTestingController (sem rede).
 * o Router e trocado por um espiao so pra conferir a navegacao. roda com "npm test".
 *
 * por que existe: um erro aqui afeta o sistema inteiro de uma vez. token vazando pra url externa
 * e falha de seguranca; 401 sem logout deixa o usuario "preso" numa tela que so da erro; e
 * deslogar no 401 do login apagaria a mensagem "usuario ou senha invalidos".
 */
describe('authInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let authService: AuthService;
  let router: jasmine.SpyObj<Router>;

  const api = environment.apiUrl;

  beforeEach(() => {
    const sessao: Sessao = { token: 'token-valido', username: 'admin', role: 'ADMIN', trocarSenha: false, expiraEmMs: Date.now() + 60000 };
    localStorage.setItem('ajt_sessao', JSON.stringify(sessao));

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    controle.verify();
    localStorage.clear();
  });

  it('anexa o bearer token nas chamadas da api', () => {
    http.get(`${api}/transfers`).subscribe();

    const req = controle.expectOne(`${api}/transfers`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-valido');
    req.flush({});
  });

  it('nao anexa token no login', () => {
    http.post(`${api}/auth/login`, {}).subscribe();

    const req = controle.expectOne(`${api}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('nao vaza o token pra urls fora da api', () => {
    http.get('https://api.externa.com/dados').subscribe();

    const req = controle.expectOne('https://api.externa.com/dados');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('401 numa chamada da api desloga e redireciona com aviso de sessao expirada', () => {
    http.get(`${api}/motoristas`).subscribe({ error: () => {} });

    controle.expectOne(`${api}/motoristas`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authService.getToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { sessao: 'expirada' } });
  });

  it('401 no login nao desloga nem redireciona (e so senha errada)', () => {
    http.post(`${api}/auth/login`, {}).subscribe({ error: () => {} });

    controle.expectOne(`${api}/auth/login`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('403 nao desloga (usuario logado sem permissao)', () => {
    http.delete(`${api}/usuarios/1`).subscribe({ error: () => {} });

    controle.expectOne(`${api}/usuarios/1`).flush(null, { status: 403, statusText: 'Forbidden' });

    expect(authService.getToken()).toBe('token-valido');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('repassa o erro pra tela tratar', () => {
    let statusRecebido = 0;
    http.get(`${api}/transfers`).subscribe({ error: erro => (statusRecebido = erro.status) });

    controle.expectOne(`${api}/transfers`).flush(null, { status: 409, statusText: 'Conflict' });

    expect(statusRecebido).toBe(409);
  });
});
