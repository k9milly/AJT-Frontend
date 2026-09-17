import { Routes } from '@angular/router';

import { authGuard, sessaoAtivaGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { comBootstrapGuard, semBootstrapGuard } from './core/layout/estilos-site';

import { HomeComponent } from './features/site/home/home.component';

export const routes: Routes = [

  // landing page publica (nao depende de login nem da api)
  // unica area que usa bootstrap (ver core/layout/estilos-site.ts)
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    canActivate: [comBootstrapGuard],
  },

  {
    path: 'login',
    canActivate: [semBootstrapGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // fora do shell de proposito: quem esta com senha provisoria nao pode navegar pelo painel
  {
    path: 'trocar-senha',
    canActivate: [semBootstrapGuard, sessaoAtivaGuard],
    loadComponent: () =>
      import('./features/auth/trocar-senha/trocar-senha.component').then(m => m.TrocarSenhaComponent),
  },

  // painel administrativo: exige sessao valida e senha ja trocada (authGuard)
  // "data.titulo" e o texto que aparece na barra superior do shell
  // cadastro/edicao abrem em modal dentro de cada tela, entao nao existem rotas "novo"/"editar";
  // o controle de quem pode escrever fica nos botoes (matriz em core/auth/permissoes.ts)
  {
    path: 'admin',
    canActivate: [semBootstrapGuard, authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),

    children: [

      { path: '', redirectTo: 'painel', pathMatch: 'full' },

      // ----- operacao -----
      {
        path: 'painel',
        data: { titulo: 'Painel' },
        loadComponent: () =>
          import('./features/painel/painel.component').then(m => m.PainelComponent),
      },
      {
        path: 'transfers',
        data: { titulo: 'Transfers' },
        loadComponent: () =>
          import('./features/transfers/transfers.component').then(m => m.TransfersComponent),
      },
      {
        path: 'ordens-servico',
        data: { titulo: 'Ordens de serviço' },
        loadComponent: () =>
          import('./features/ordens-servico/ordens-servico.component').then(m => m.OrdensServicoComponent),
      },
      {
        path: 'ordens-servico/:id',
        data: { titulo: 'Ordem de serviço' },
        loadComponent: () =>
          import('./features/ordens-servico/ordem-servico-detalhe/ordem-servico-detalhe.component')
            .then(m => m.OrdemServicoDetalheComponent),
      },
      {
        path: 'pontos-coleta',
        data: { titulo: 'Pontos de coleta' },
        loadComponent: () =>
          import('./features/pontos-coleta/pontos-coleta.component').then(m => m.PontosColetaComponent),
      },

      // ----- cadastros -----
      {
        path: 'passageiros',
        data: { titulo: 'Passageiros' },
        loadComponent: () =>
          import('./features/passageiros/passageiros.component').then(m => m.PassageirosComponent),
      },
      {
        path: 'motoristas',
        data: { titulo: 'Motoristas' },
        loadComponent: () =>
          import('./features/motoristas/motoristas.component').then(m => m.MotoristasComponent),
      },
      {
        path: 'veiculos',
        data: { titulo: 'Veículos' },
        loadComponent: () =>
          import('./features/veiculos/veiculos.component').then(m => m.VeiculosComponent),
      },

      // ----- administracao -----
      // somente ADMIN (o backend devolve 403 pros outros perfis)
      {
        path: 'usuarios',
        data: { titulo: 'Usuários' },
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
      },

      { path: '**', redirectTo: 'painel' },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },

];
