import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './shared/layout/shell.component';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'passageiros', pathMatch: 'full' },
      {
        path: 'passageiros',
        loadChildren: () =>
          import('./features/passageiros/passageiros.routes').then(m => m.PASSAGEIROS_ROUTES),
      },
      {
        path: 'motoristas',
        loadChildren: () =>
          import('./features/motoristas/motoristas.routes').then(m => m.MOTORISTAS_ROUTES),
      },
      {
        path: 'veiculos',
        loadChildren: () =>
          import('./features/veiculos/veiculos.routes').then(m => m.VEICULOS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
