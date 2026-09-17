import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// ---------------------------------------------------------------
// guards de sessao
// ---------------------------------------------------------------

// protege o painel (/admin):
// - sem sessao valida -> login
// - com senha provisoria (trocarSenha = true) -> tela de troca de senha antes de liberar o resto
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAutenticado()) {
    return router.parseUrl('/login');
  }

  if (authService.precisaTrocarSenha()) {
    return router.parseUrl('/trocar-senha');
  }

  return true;
};

// protege a tela de troca de senha: so exige estar logado
// (nao pode usar o authGuard aqui, senao quem precisa trocar a senha entraria em loop)
export const sessaoAtivaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAutenticado() ? true : router.parseUrl('/login');
};
