import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro } from '../../core/http/erro-api';
import { Pagina, TAMANHO_MAXIMO_PAGINA } from '../../core/models/api.model';
import { Motorista } from '../../core/models/motorista.model';
import {
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

const TAMANHO_PAGINA = 20;

// ---------------------------------------------------------------
// tela de ordens de servico: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
// a os agrupa os transfers de um motorista + veiculo num dia. as paradas e os transfers
// vinculados sao gerenciados na tela de detalhe (/admin/ordens-servico/:id).
@Component({
  selector: 'app-ordens-servico',
  standalone: true,
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

  // motoristas e veiculos pra mostrar nome/placa na tabela e preencher os selects
  // (os 100 primeiros: limite de pagina do backend; suficiente pro tamanho da frota)
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
    this.carregando.set(true);
    this.erro.set(null);

    const parametros = { page: numeroPagina, size: TAMANHO_PAGINA, sort: 'dataServico,desc' };
    const status = this.filtroStatus();

    const request$ = status
      ? this.service.buscarPorStatus(status, parametros)
      : this.service.listar(parametros);

    request$.subscribe({
      next: pagina => {
        this.pagina.set(pagina);
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
    this.form.reset({ dataServico: '', motoristaId: null, veiculoId: null, status: 'ABERTA' });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(ordem: OrdemServico, evento?: Event): void {
    // o clique no botao nao deve abrir o detalhe (a linha inteira e clicavel)
    evento?.stopPropagation();
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
      return;
    }

    this.salvando.set(true);
    this.erroFormulario.set(null);

    const editando = this.editando();
    const dados: OrdemServicoRequest = this.form.getRawValue();

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.subscribe({
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

    this.service.excluir(ordem.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.sucesso(`OS #${ordem.id} excluída.`);
        const atual = this.pagina();
        const voltarUma = !!atual && atual.conteudo.length === 1 && atual.pagina > 0;
        this.carregar(atual ? (voltarUma ? atual.pagina - 1 : atual.pagina) : 0);
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
    }).subscribe({
      next: ({ motoristas, veiculos }) => {
        this.motoristas.set(motoristas.conteudo);
        this.veiculos.set(veiculos.conteudo);
      },
      // sem a frota a tabela mostra "#id" no lugar do nome; nao impede o uso da tela
      error: () => {},
    });
  }
}
