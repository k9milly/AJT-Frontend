import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { LoginResponse, Perfil, Usuario } from '../models/auth.model';
import { USUARIOS_MOCK } from '../mock/usuarios.mock';

const TOKEN_KEY = 'ajt_token';
const USUARIO_KEY = 'ajt_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuarioAtual = signal<Usuario | null>(this.carregarUsuario());

  login(email: string, senha: string): Observable<LoginResponse> {
    const encontrado = USUARIOS_MOCK.find(u => u.email === email && u.senha === senha);

    if (!encontrado) {
      return throwError(() => new Error('E-mail ou senha inválidos')).pipe(delay(400));
    }

    const { senha: _senha, ...usuario } = encontrado;
    const response: LoginResponse = {
      token: `mock-jwt-token-${usuario.id}-${Date.now()}`,
      usuario,
    };

    return of(response).pipe(
      delay(400),
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USUARIO_KEY, JSON.stringify(res.usuario));
        this.usuarioAtual.set(res.usuario);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    this.usuarioAtual.set(null);
  }

  isAutenticado(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  temPerfil(...perfis: Perfil[]): boolean {
    const usuario = this.usuarioAtual();
    return !!usuario && perfis.includes(usuario.perfil);
  }

  private carregarUsuario(): Usuario | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
