import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Perfil } from '../models/auth.model';

export function roleGuard(...perfisPermitidos: Perfil[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.temPerfil(...perfisPermitidos)) {
      return true;
    }

    return router.parseUrl('/');
  };
}
