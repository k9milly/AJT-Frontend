import { Routes } from '@angular/router';

import { authChildGuard, authGuard, sessaoAtivaGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { semBootstrapGuard } from './core/layout/estilos-site';

export const routes: Routes = [

  // landing page publica (nao depende de login nem da api)
  {
    path: '',
    pathMatch: 'full',
    // o bootstrap nao e mais ligado em lugar nenhum (ver estilos-site.ts): a landing
    // nao usa nenhum componente real dele, so classes utilitarias que colidiam com as
    // do tailwind (border, shadow-sm, mt-3, gap-4...) e o bootstrap ganhava por usar !important
    canActivate: [semBootstrapGuard],
    loadComponent: () =>
      import('./features/site/home/home.component').then(m => m.HomeComponent),
  },

  {
    path: 'login',
    canActivate: [semBootstrapGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // cadastro publico: a conta nasce inativa e o admin libera em Usuarios
  {
    path: 'criar-conta',
    canActivate: [semBootstrapGuard],
    loadComponent: () =>
      import('./features/auth/criar-conta/criar-conta.component').then(m => m.CriarContaComponent),
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
    canActivateChild: [authChildGuard],
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
        canActivate: [roleGuard('ADMIN', 'GERENTE', 'ATENDENTE')],
        loadComponent: () =>
          import('./features/transfers/transfers.component').then(m => m.TransfersComponent),
      },
      // roteiro do dia do motorista (HU07): so o perfil MOTORISTA (o backend responde 403 pros outros)
      {
        path: 'minhas-os',
        data: { titulo: 'Minhas OS' },
        canActivate: [roleGuard('MOTORISTA')],
        loadComponent: () =>
          import('./features/minhas-os/minhas-os.component').then(m => m.MinhasOsComponent),
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
        canActivate: [roleGuard('ADMIN', 'GERENTE', 'ATENDENTE')],
        loadComponent: () =>
          import('./features/pontos-coleta/pontos-coleta.component').then(m => m.PontosColetaComponent),
      },

      // ----- cadastros -----
      {
        path: 'passageiros',
        data: { titulo: 'Passageiros' },
        // documento e dado sensivel: o motorista nao abre o cadastro (backend responde 403)
        canActivate: [roleGuard('ADMIN', 'GERENTE', 'ATENDENTE')],
        loadComponent: () =>
          import('./features/passageiros/passageiros.component').then(m => m.PassageirosComponent),
      },
      {
        path: 'motoristas',
        data: { titulo: 'Motoristas' },
        canActivate: [roleGuard('ADMIN', 'GERENTE', 'ATENDENTE')],
        loadComponent: () =>
          import('./features/motoristas/motoristas.component').then(m => m.MotoristasComponent),
      },
      {
        path: 'veiculos',
        data: { titulo: 'Veículos' },
        canActivate: [roleGuard('ADMIN', 'GERENTE', 'ATENDENTE')],
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

      // historico de alteracoes (HU11): ADMIN e GERENTE
      {
        path: 'historico',
        data: { titulo: 'Histórico' },
        canActivate: [roleGuard('ADMIN', 'GERENTE')],
        loadComponent: () =>
          import('./features/historico/historico.component').then(m => m.HistoricoComponent),
      },

      { path: '**', redirectTo: 'painel' },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },

];
