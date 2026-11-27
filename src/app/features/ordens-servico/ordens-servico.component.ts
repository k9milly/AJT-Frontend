import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro, statusDoErro } from '../../core/http/erro-api';
import { Pagina, TAMANHO_MAXIMO_PAGINA, paginaAposExclusao } from '../../core/models/api.model';
import { Motorista } from '../../core/models/motorista.model';
import {
  FiltroOrdemServico,
  OrdemServico,
  OrdemServicoRequest,
  STATUS_ORDEM_SERVICO,
  StatusOrdemServico,
} from '../../core/models/ordem-servico.model';
import { Veiculo } from '../../core/models/veiculo.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { OrdemServicoService } from './ordem-servico.service';
import { MotoristaService } from '../motoristas/motorista.service';
import { VeiculoService } from '../veiculos/veiculo.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import { ROTULO_STATUS_OS, formatarData, iniciais, tomDoStatus } from '../../shared/utils/rotulos';
import { periodoInvalido } from '../../shared/utils/validadores';

const TAMANHO_PAGINA = 20;

// ---------------------------------------------------------------
// tela de ordens de servico: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
// a os agrupa os transfers de um motorista + veiculo num dia. as paradas e os transfers
// vinculados sao gerenciados na tela de detalhe (/admin/ordens-servico/:id).
@Component({
    selector: 'app-ordens-servico',
    imports: [
        ReactiveFormsModule,
        RouterLink,
        ConfirmDialogComponent,
        IconeComponent,
        ModalComponent,
        PaginacaoComponent,
        StatusBadgeComponent,
        TabelaSkeletonComponent,
    ],
    templateUrl: './ordens-servico.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdensServicoComponent implements OnInit {
  private service = inject(OrdemServicoService);
  private motoristaService = inject(MotoristaService);
  private veiculoService = inject(VeiculoService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private cargaSub?: Subscription;

  statusOpcoes = STATUS_ORDEM_SERVICO;
  rotuloStatus = ROTULO_STATUS_OS;
  tomDoStatus = tomDoStatus;
  formatarData = formatarData;
  iniciais = iniciais;

  // ----- listagem -----
  pagina = signal<Pagina<OrdemServico> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);
  filtroStatus = signal<StatusOrdemServico | ''>('');

  // demais filtros (RF015): valem ao clicar em "Filtrar". o motorista nao filtra por motorista
  // (o backend ja devolve so as OS dele, HU07)
  filtroDataInicio = signal('');
  filtroDataFim = signal('');
  filtroMotoristaId = signal<number | null>(null);
  filtrosAplicados = signal<FiltroOrdemServico>({});
  temFiltroExtra = computed(() => Object.values(this.filtrosAplicados()).some(valor => !!valor));
  intervaloFiltroInvalido = computed(() => periodoInvalido(this.filtroDataInicio(), this.filtroDataFim()));
  ehMotorista = computed(() => this.auth.perfil() === 'MOTORISTA');

  // motoristas e veiculos pra mostrar nome/placa na tabela e preencher os selects
  motoristas = signal<Motorista[]>([]);
  veiculos = signal<Veiculo[]>([]);

  podeEscrever = computed(() => this.auth.podeEscrever('ordens-servico'));
  podeExcluir = computed(() => this.auth.podeExcluir('ordens-servico'));

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<OrdemServico | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // regras iguais as do OrdemServicoRequestDTO: so a data e obrigatoria
  form = this.fb.group({
    dataServico: this.fb.nonNullable.control('', Validators.required),
    motoristaId: this.fb.control<number | null>(null),
    veiculoId: this.fb.control<number | null>(null),
    status: this.fb.nonNullable.control<StatusOrdemServico>('ABERTA', Validators.required),
  });

  // ----- exclusao -----
  paraExcluir = signal<OrdemServico | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.carregarFrota();
    this.carregar();

    // atalho do painel: ?novo=1 abre o cadastro direto
    if (this.route.snapshot.queryParamMap.get('novo') && this.podeEscrever()) {
      this.abrirCadastro();
    }
  }

  // mais recentes primeiro
  carregar(numeroPagina = 0): void {
    this.cargaSub?.unsubscribe();
    this.carregando.set(true);
    this.erro.set(null);

    const parametros = { page: numeroPagina, size: TAMANHO_PAGINA, sort: 'dataServico,desc' };
    const filtros: FiltroOrdemServico = { ...this.filtrosAplicados(), status: this.filtroStatus() || undefined };

    this.cargaSub = this.service.listar(parametros, filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pagina => {
          this.pagina.set(pagina);
          this.garantirFrotaDaPagina(pagina.conteudo);
          this.carregando.set(false);
        },
        error: (err: unknown) => {
          this.erro.set(mensagemDeErro(err, 'Não foi possível carregar as ordens de serviço.'));
          this.carregando.set(false);
        },
      });
  }

  filtrarPorStatus(valor: string): void {
    this.filtroStatus.set(valor as StatusOrdemServico | '');
    this.carregar();
  }

  aplicarFiltros(): void {
    if (this.intervaloFiltroInvalido()) {
      return;
    }
    this.filtrosAplicados.set({
      dataInicio: this.filtroDataInicio() || undefined,
      dataFim: this.filtroDataFim() || undefined,
      motoristaId: this.filtroMotoristaId() ?? undefined,
    });
    this.carregar();
  }

  limparFiltros(): void {
    this.filtroDataInicio.set('');
    this.filtroDataFim.set('');
    this.filtroMotoristaId.set(null);
    this.filtrosAplicados.set({});
    this.carregar();
  }

  nomeMotorista(id: number | null): string | null {
    return id ? this.motoristas().find(m => m.id === id)?.nome ?? `Motorista #${id}` : null;
  }

  descricaoVeiculo(id: number | null): string | null {
    if (!id) {
      return null;
    }
    const veiculo = this.veiculos().find(v => v.id === id);
    return veiculo ? `${veiculo.label} · ${veiculo.placa}` : `Veículo #${id}`;
  }

  abrirDetalhe(ordem: OrdemServico): void {
    this.router.navigate(['/admin/ordens-servico', ordem.id]);
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.carregarFrota();
    this.form.reset({ dataServico: '', motoristaId: null, veiculoId: null, status: 'ABERTA' });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(ordem: OrdemServico, evento?: Event): void {
    // o clique no botao nao deve abrir o detalhe (a linha inteira e clicavel)
    evento?.stopPropagation();
    this.garantirFrotaDaPagina([ordem]);
    this.editando.set(ordem);
    this.form.reset({
      dataServico: ordem.dataServico,
      motoristaId: ordem.motoristaId,
      veiculoId: ordem.veiculoId,
      status: ordem.status,
    });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  pedirExclusao(ordem: OrdemServico, evento: Event): void {
    evento.stopPropagation();
    this.paraExcluir.set(ordem);
  }

  fecharModal(): void {
    if (!this.salvando()) {
      this.modalAberto.set(false);
    }
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // o erro do servidor era da tentativa anterior: nao pode ficar junto com os erros novos
      this.erroFormulario.set(null);
      return;
    }

    this.salvando.set(true);
    this.erroFormulario.set(null);

    const editando = this.editando();
    // na edicao a versao carregada vai junto: se outra pessoa salvou antes, o backend responde 409
    const dados: OrdemServicoRequest = { ...this.form.getRawValue(), versao: editando?.versao };

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: salva => {
        this.salvando.set(false);
        this.modalAberto.set(false);

        if (editando) {
          this.notificacao.sucesso('Ordem de serviço atualizada.');
          this.carregar(this.pagina()?.pagina ?? 0);
        } else {
          // os nova ainda nao tem paradas nem transfers: leva direto pro detalhe pra montar a rota
          this.notificacao.sucesso(`OS #${salva.id} criada. Agora monte a rota.`);
          this.router.navigate(['/admin/ordens-servico', salva.id]);
        }
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar a ordem de serviço.'));
        // 409: a lista e recarregada pra a proxima edicao ja partir dos dados novos
        if (statusDoErro(err) === 409) {
          this.carregar(this.pagina()?.pagina ?? 0);
        }
      },
    });
  }

  // ----- exclusao -----

  confirmarExclusao(): void {
    const ordem = this.paraExcluir();
    if (!ordem) {
      return;
    }

    this.excluindo.set(true);

    this.service.excluir(ordem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.excluindo.set(false);
          this.paraExcluir.set(null);
          this.notificacao.sucesso(`OS #${ordem.id} excluída.`);
          this.carregar(paginaAposExclusao(this.pagina()));
        },
        error: (err: unknown) => {
          // 409 = ainda existem transfers vinculados a esta os
          this.excluindo.set(false);
          this.paraExcluir.set(null);
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir a ordem de serviço.'));
        },
      });
  }

  private carregarFrota(): void {
    forkJoin({
      motoristas: this.motoristaService.listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'nome,asc' }),
      veiculos: this.veiculoService.listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'label,asc' }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ motoristas, veiculos }) => {
          this.motoristas.set(motoristas.conteudo);
          this.veiculos.set(veiculos.conteudo);
          this.garantirFrotaDaPagina(this.pagina()?.conteudo ?? []);
        },
        // sem a frota a tabela mostra "#id" no lugar do nome; nao impede o uso da tela
        error: () => {},
      });
  }

  // se alguma OS da pagina usar motorista/veiculo alem dos 100 primeiros, busca individualmente
  private garantirFrotaDaPagina(ordens: OrdemServico[]): void {
    const motoristasConhecidos = new Set(this.motoristas().map(m => m.id));
    const veiculosConhecidos = new Set(this.veiculos().map(v => v.id));

    for (const ordem of ordens) {
      if (ordem.motoristaId && !motoristasConhecidos.has(ordem.motoristaId)) {
        motoristasConhecidos.add(ordem.motoristaId);
        this.motoristaService.buscarPorId(ordem.motoristaId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: m => this.motoristas.update(lista => (lista.some(x => x.id === m.id) ? lista : [...lista, m])),
            error: () => {},
          });
      }
      if (ordem.veiculoId && !veiculosConhecidos.has(ordem.veiculoId)) {
        veiculosConhecidos.add(ordem.veiculoId);
        this.veiculoService.buscarPorId(ordem.veiculoId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: v => this.veiculos.update(lista => (lista.some(x => x.id === v.id) ? lista : [...lista, v])),
            error: () => {},
          });
      }
    }
  }
}
