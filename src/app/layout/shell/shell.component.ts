import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Recurso } from '../../core/auth/permissoes';
import { TemaService } from '../../core/services/tema.service';
import { IconeComponent, NomeIcone } from '../../shared/components/icone/icone.component';
import { ToastsComponent } from '../../shared/components/toasts/toasts.component';
import { ROTULO_PERFIL, iniciais } from '../../shared/utils/rotulos';

interface ItemMenu {
  rota: string;
  rotulo: string;
  icone: NomeIcone;
  // recurso da matriz de permissoes; sem recurso = visivel pra todos
  recurso?: Recurso;
}

interface SecaoMenu {
  titulo: string;
  itens: ItemMenu[];
}

// ---------------------------------------------------------------
// menu lateral
// ---------------------------------------------------------------
// separado pelo tipo de trabalho, como no lancamentosVendas/autonomousapi:
// operacao = o dia a dia do receptivo | cadastros = base que a operacao usa | administracao = acesso
const SECOES_EQUIPE: SecaoMenu[] = [
  {
    titulo: 'Operação',
    itens: [
      { rota: '/admin/painel', rotulo: 'Painel', icone: 'painel' },
      { rota: '/admin/transfers', rotulo: 'Transfers', icone: 'rota', recurso: 'transfers' },
      { rota: '/admin/ordens-servico', rotulo: 'Ordens de serviço', icone: 'prancheta', recurso: 'ordens-servico' },
      { rota: '/admin/pontos-coleta', rotulo: 'Pontos de coleta', icone: 'pino', recurso: 'pontos-coleta' },
    ],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { rota: '/admin/passageiros', rotulo: 'Passageiros', icone: 'pessoas', recurso: 'passageiros' },
      { rota: '/admin/motoristas', rotulo: 'Motoristas', icone: 'cracha', recurso: 'motoristas' },
      { rota: '/admin/veiculos', rotulo: 'Veículos', icone: 'van', recurso: 'veiculos' },
    ],
  },
  {
    titulo: 'Administração',
    itens: [
      { rota: '/admin/usuarios', rotulo: 'Usuários', icone: 'escudo', recurso: 'usuarios' },
    ],
  },
];

// o motorista ve um menu enxuto: so o que afeta o proprio trabalho (mesma decisao do autonomousapi)
const SECOES_MOTORISTA: SecaoMenu[] = [
  {
    titulo: 'Meu trabalho',
    itens: [
      { rota: '/admin/painel', rotulo: 'Início', icone: 'painel' },
      { rota: '/admin/ordens-servico', rotulo: 'Ordens de serviço', icone: 'prancheta' },
    ],
  },
];

// layout autenticado: menu lateral + barra superior + conteudo da rota
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconeComponent, ToastsComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);
  tema = inject(TemaService);

  // abaixo de lg o menu vira gaveta; fecha sozinho a cada troca de rota
  menuAberto = signal(false);

  // titulo da barra superior vem do "data: { titulo }" de cada rota (app.routes.ts)
  tituloPagina = signal('Painel');

  rotuloPerfil = computed(() => {
    const perfil = this.auth.perfil();
    return perfil ? ROTULO_PERFIL[perfil] : '';
  });

  iniciais = computed(() => iniciais(this.auth.nomeExibicao()));

  // secoes filtradas pelo perfil; secao sem nenhum item visivel some inteira
  secoesVisiveis = computed<SecaoMenu[]>(() => {
    const secoes = this.auth.perfil() === 'MOTORISTA' ? SECOES_MOTORISTA : SECOES_EQUIPE;
    return secoes
      .map(secao => ({
        ...secao,
        itens: secao.itens.filter(item => !item.recurso || this.auth.podeLer(item.recurso)),
      }))
      .filter(secao => secao.itens.length > 0);
  });

  constructor() {
    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.menuAberto.set(false);
        this.atualizarTitulo();
      });
  }

  ngOnInit(): void {
    this.atualizarTitulo();

    // ao abrir/recarregar o painel, confirma a sessao no backend e atualiza nome/perfil
    // se o token ja nao valer, o interceptor recebe 401 e manda pro login
    this.auth.carregarUsuarioLogado().subscribe({
      next: () => {
        // o admin pode ter redefinido a senha deste usuario enquanto ele estava logado
        if (this.auth.precisaTrocarSenha()) {
          this.router.navigateByUrl('/trocar-senha');
        }
      },
      // erro de rede nao derruba o painel; cada tela mostra o proprio erro ao chamar a api
      error: () => {},
    });
  }

  sair(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  // desce ate a rota filha mais profunda e le o titulo dela
  private atualizarTitulo(): void {
    let atual = this.route;
    while (atual.firstChild) {
      atual = atual.firstChild;
    }
    this.tituloPagina.set(atual.snapshot.data['titulo'] ?? 'Painel');
  }
}
