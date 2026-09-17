import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// ---------------------------------------------------------------
// interceptor de autenticacao
// ---------------------------------------------------------------
// 1. anexa "Authorization: Bearer <token>" em toda chamada pra nossa api
//    (menos no login, que e publico, e em urls de fora da api)
// 2. se a api responder 401 fora do login, a sessao caiu: token expirou, a senha foi trocada
//    em outra aba ou o admin desativou o usuario. nesse caso desloga e manda pro login.
//    nao tenta de novo: o backend nao tem refresh token, entao repetir a chamada nao resolve.
//
// o 403 (logado mas sem permissao) nao desloga: a tela mostra a mensagem e o usuario segue.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const ehChamadaDaApi = req.url.startsWith(environment.apiUrl);
  const ehLogin = req.url.endsWith('/auth/login');
  const token = authService.getToken();

  const requisicao = token && ehChamadaDaApi && !ehLogin
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      const sessaoCaiu = erro instanceof HttpErrorResponse
        && erro.status === 401
        && ehChamadaDaApi
        && !ehLogin;

      if (sessaoCaiu) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { sessao: 'expirada' } });
      }

      return throwError(() => erro);
    }),
  );
};
