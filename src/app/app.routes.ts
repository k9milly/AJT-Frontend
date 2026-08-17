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
      {
        path: 'pontos-coleta',
        loadChildren: () =>
          import('./features/pontos-coleta/pontos-coleta.routes').then(m => m.PONTOS_COLETA_ROUTES),
      },
      {
        path: 'transfers',
        loadChildren: () =>
          import('./features/transfers/transfers.routes').then(m => m.TRANSFERS_ROUTES),
      },
      {
        path: 'ordens-servico',
        loadChildren: () =>
          import('./features/ordens-servico/ordens-servico.routes').then(m => m.ORDENS_SERVICO_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
