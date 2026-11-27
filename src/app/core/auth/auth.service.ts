import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Perfil, RegistroRequest, Sessao, TrocaSenhaRequest } from '../models/auth.model';
import { Usuario } from '../models/usuario.model';
import { Recurso, podeEscrever, podeExcluir, podeLer, podeAlterarStatusParada } from './permissoes';

// chave unica no localStorage; guarda token + dados basicos da sessao
const CHAVE_SESSAO = 'ajt_sessao';

// ---------------------------------------------------------------
// sessao do usuario logado
// ---------------------------------------------------------------
// responsabilidades:
// - fazer login, troca de senha e logout contra a api
// - guardar a sessao no localStorage pra sobreviver ao recarregar a pagina
// - expor o perfil e as permissoes pras telas (via signals)
//
// este service nao navega: quem decide pra onde ir e o guard, o interceptor ou a tela.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  private sessaoAtual = signal<Sessao | null>(this.carregarSessao());

  // leitura publica da sessao (somente leitura pras telas)
  readonly sessao = computed(() => this.sessaoAtual());
  readonly perfil = computed<Perfil | null>(() => this.sessaoAtual()?.role ?? null);
  readonly precisaTrocarSenha = computed(() => this.sessaoAtual()?.trocarSenha ?? false);

  // nome pra exibir no topo do painel; enquanto o /me nao responde, mostra o username
  readonly nomeExibicao = computed(() => {
    const sessao = this.sessaoAtual();
    return sessao?.nome || sessao?.username || '';
  });

  // ----- chamadas a api -----

  login(username: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}/login`, { username, senha })
      .pipe(tap(resposta => this.guardarSessao(resposta)));
  }

  // cadastro publico: nao abre sessao (a conta fica aguardando o admin liberar)
  registrar(dados: RegistroRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.base}/registro`, dados);
  }

  // restaura/atualiza os dados do usuario logado (nome, perfil, trocarSenha)
  // chamado ao abrir o painel: se o admin mudou o perfil ou desativou o usuario, o front fica sabendo
  carregarUsuarioLogado(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/me`).pipe(
      tap(usuario => {
        const sessao = this.sessaoAtual();
        if (!sessao) {
          return;
        }
        if (!usuario.ativo) {
          this.logout();
          return;
        }
        this.salvar({
          ...sessao,
          nome: usuario.nome,
          role: usuario.role,
          trocarSenha: usuario.trocarSenha,
        });
      }),
    );
  }

  // a troca de senha devolve um token novo e o antigo deixa de valer no backend,
  // por isso a sessao inteira e substituida pela resposta
  trocarSenha(dados: TrocaSenhaRequest): Observable<void> {
    return this.http.put<LoginResponse>(`${this.base}/senha`, dados).pipe(
      tap(resposta => this.guardarSessao(resposta)),
      map(() => void 0),
    );
  }

  // logout e so local: o backend e stateless (jwt), nao existe endpoint de logout
  logout(): void {
    localStorage.removeItem(CHAVE_SESSAO);
    this.sessaoAtual.set(null);
  }

  // ----- consultas usadas por guard, interceptor e telas -----

  // autenticado = tem token e ele ainda nao venceu pelo relogio local
  // leitura pura (sem mutar signal), segura pra usar dentro de computed() e templates
  isAutenticado(): boolean {
    return this.sessaoValida() !== null;
  }

  // usado pelos guards de rota: se a sessao expirou localmente, limpa o storage antes de redirecionar
  encerrarSeExpirada(): boolean {
    if (this.sessaoValida()) {
      return true;
    }
    if (this.sessaoAtual()) {
      this.logout();
    }
    return false;
  }

  getToken(): string | null {
    return this.sessaoValida()?.token ?? null;
  }

  temPerfil(...perfis: Perfil[]): boolean {
    const perfil = this.perfil();
    return !!perfil && perfis.includes(perfil);
  }

  podeLer(recurso: Recurso): boolean {
    return podeLer(this.perfil(), recurso);
  }

  podeEscrever(recurso: Recurso): boolean {
    return podeEscrever(this.perfil(), recurso);
  }

  podeExcluir(recurso: Recurso): boolean {
    return podeExcluir(this.perfil(), recurso);
  }

  podeAlterarStatusParada(): boolean {
    return podeAlterarStatusParada(this.perfil());
  }

  // ----- persistencia -----

  // converte a resposta da api no formato guardado localmente
  // mantem o nome que ja estava na sessao (a resposta de login/troca de senha nao traz nome)
  private guardarSessao(resposta: LoginResponse): void {
    this.salvar({
      token: resposta.token,
      username: resposta.username,
      role: resposta.role,
      trocarSenha: resposta.trocarSenha,
      expiraEmMs: Date.now() + resposta.expiraEm * 1000,
      nome: this.sessaoAtual()?.username === resposta.username ? this.sessaoAtual()?.nome : undefined,
    });
  }

  private salvar(sessao: Sessao): void {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    this.sessaoAtual.set(sessao);
  }

  private sessaoValida(): Sessao | null {
    const sessao = this.sessaoAtual();
    if (!sessao || typeof sessao.expiraEmMs !== 'number' || Date.now() >= sessao.expiraEmMs) {
      return null;
    }
    return sessao;
  }

  // le a sessao salva; se o json estiver corrompido, incompleto ou ja expirado, descarta
  private carregarSessao(): Sessao | null {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) {
      return null;
    }
    try {
      const sessao = JSON.parse(bruto) as Sessao;
      const valida = Boolean(
        sessao?.token
        && sessao?.role
        && typeof sessao.expiraEmMs === 'number'
        && Date.now() < sessao.expiraEmMs,
      );
      if (!valida) {
        localStorage.removeItem(CHAVE_SESSAO);
        return null;
      }
      return sessao;
    } catch {
      localStorage.removeItem(CHAVE_SESSAO);
      return null;
    }
  }
}
