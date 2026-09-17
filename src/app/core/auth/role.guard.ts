import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Perfil } from '../models/auth.model';

// ---------------------------------------------------------------
// guard de permissao por perfil
// ---------------------------------------------------------------
// uso: canActivate: [roleGuard('ADMIN')] -> varios perfis = basta ter um deles
// quem nao tem permissao volta pro inicio do painel, nunca pra landing page
export function roleGuard(...perfisPermitidos: Perfil[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.temPerfil(...perfisPermitidos) ? true : router.parseUrl('/admin/painel');
  };
}
