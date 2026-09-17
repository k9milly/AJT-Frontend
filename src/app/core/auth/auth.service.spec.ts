import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { LoginResponse, Sessao } from '../models/auth.model';
import { AuthService } from './auth.service';

/*
 * o que testa: o AuthService, que guarda a sessao do usuario.
 * - login: chama POST /api/auth/login com username/senha e guarda token, perfil e validade
 * - troca de senha: substitui o token guardado pelo novo que vem na resposta
 * - /api/auth/me: completa a sessao com nome e perfil atualizados
 * - validade: token vencido pelo relogio local derruba a sessao sozinho
 * - localStorage corrompido nao quebra o app
 *
 * como rodar: usa TestBed com HttpTestingController (http falso, nenhuma chamada sai da maquina).
 * roda com "npm test"; nao precisa do backend no ar.
 *
 * por que existe: e o ponto mais sensivel do front. dois comportamentos do backend sao faceis de
 * esquecer e quebram a sessao em silencio: "expiraEm" vem em segundos (e nao em milissegundos) e
 * a troca de senha invalida o token antigo. se o front continuar usando o token velho, toda
 * chamada seguinte devolve 401 e o usuario e expulso logo depois de trocar a senha.
 */
describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const respostaLogin: LoginResponse = {
    token: 'token-1',
    tipo: 'Bearer',
    expiraEm: 3600,
    username: 'admin',
    role: 'ADMIN',
    trocarSenha: true,
  };

  function sessaoSalva(): Sessao | null {
    const bruto = localStorage.getItem('ajt_sessao');
    return bruto ? JSON.parse(bruto) : null;
  }

  function criarServico(): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    http?.verify();
    localStorage.clear();
  });

  it('login envia username/senha e guarda a sessao com validade em milissegundos', () => {
    criarServico();
    const antes = Date.now();

    service.login('admin', 'admin123').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', senha: 'admin123' });
    req.flush(respostaLogin);

    const sessao = sessaoSalva()!;
    expect(sessao.token).toBe('token-1');
    expect(service.perfil()).toBe('ADMIN');
    expect(service.precisaTrocarSenha()).toBeTrue();
    // 3600 segundos => ~1 hora a frente
    expect(sessao.expiraEmMs).toBeGreaterThanOrEqual(antes + 3600 * 1000);
    expect(service.isAutenticado()).toBeTrue();
  });

  it('troca de senha substitui o token antigo pelo novo', () => {
    criarServico();
    service.login('admin', 'admin123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respostaLogin);

    service.trocarSenha({ senhaAtual: 'admin123', novaSenha: 'nova-senha-forte' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/senha`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...respostaLogin, token: 'token-2', trocarSenha: false });

    expect(service.getToken()).toBe('token-2');
    expect(service.precisaTrocarSenha()).toBeFalse();
  });

  it('/me completa o nome e atualiza perfil e troca de senha', () => {
    criarServico();
    service.login('admin', 'admin123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respostaLogin);

    service.carregarUsuarioLogado().subscribe();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush({
      id: 1, nome: 'Administrador', username: 'admin', role: 'GERENTE',
      ativo: true, trocarSenha: false, ultimoLogin: null, criadoEm: '2026-09-17T10:00:00',
    });

    expect(service.nomeExibicao()).toBe('Administrador');
    expect(service.perfil()).toBe('GERENTE');
    expect(service.precisaTrocarSenha()).toBeFalse();
  });

  it('token vencido pelo relogio local derruba a sessao', () => {
    const vencida: Sessao = { token: 't', username: 'u', role: 'ATENDENTE', trocarSenha: false, expiraEmMs: Date.now() - 1 };
    localStorage.setItem('ajt_sessao', JSON.stringify(vencida));
    criarServico();

    expect(service.isAutenticado()).toBeFalse();
    expect(sessaoSalva()).toBeNull();
    expect(service.perfil()).toBeNull();
  });

  it('sessao corrompida no localStorage e descartada sem erro', () => {
    localStorage.setItem('ajt_sessao', '{json quebrado');
    criarServico();

    expect(service.isAutenticado()).toBeFalse();
    expect(localStorage.getItem('ajt_sessao')).toBeNull();
  });

  it('logout limpa a sessao', () => {
    criarServico();
    service.login('admin', 'admin123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respostaLogin);

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(sessaoSalva()).toBeNull();
  });

  it('permissoes seguem o perfil da sessao', () => {
    const atendente: Sessao = { token: 't', username: 'u', role: 'ATENDENTE', trocarSenha: false, expiraEmMs: Date.now() + 60000 };
    localStorage.setItem('ajt_sessao', JSON.stringify(atendente));
    criarServico();

    expect(service.podeEscrever('transfers')).toBeTrue();
    expect(service.podeExcluir('transfers')).toBeFalse();
    expect(service.podeLer('usuarios')).toBeFalse();
  });
});
