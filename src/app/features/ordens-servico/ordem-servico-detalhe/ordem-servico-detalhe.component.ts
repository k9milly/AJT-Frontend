import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemDeErro, statusDoErro } from '../../../core/http/erro-api';
import { TAMANHO_MAXIMO_PAGINA } from '../../../core/models/api.model';
import { Motorista } from '../../../core/models/motorista.model';
import {
  OrdemServico,
  STATUS_ORDEM_SERVICO,
  STATUS_OS_RECEBE_TRANSFER,
  StatusOrdemServico,
} from '../../../core/models/ordem-servico.model';
import {
  ACOES_PARADA,
  AcaoParada,
  ParadaOs,
  ParadaOsRequest,
  STATUS_PARADA,
  StatusParada,
} from '../../../core/models/parada-os.model';
import { Transfer } from '../../../core/models/transfer.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { OrdemServicoService } from '../ordem-servico.service';
import { ParadaOsService } from '../parada-os.service';
import { TransferService } from '../../transfers/transfer.service';
import { MotoristaService } from '../../motoristas/motorista.service';
import { VeiculoService } from '../../veiculos/veiculo.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../../shared/components/icone/icone.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import {
  ROTULO_ACAO_PARADA,
  ROTULO_STATUS_OS,
  ROTULO_STATUS_PARADA,
  ROTULO_STATUS_TRANSFER,
  formatarData,
  formatarHora,
  horaParaApi,
  horaParaInput,
  textoOuNulo,
  tomDoStatus,
} from '../../../shared/utils/rotulos';
import { inteiroPositivo, textoObrigatorio } from '../../../shared/utils/validadores';

// ---------------------------------------------------------------
// detalhe da ordem de servico: a rota do motorista
// ---------------------------------------------------------------
// junta numa tela so:
// - os dados da os (data, motorista, veiculo) e a troca rapida de status
// - os transfers vinculados (vincular/desvincular muda o transfer.osId)
// - as paradas da rota, em ordem, com os transfers que embarcam/desembarcam em cada uma
//
// permissoes (matriz em core/auth/permissoes.ts):
// - os e paradas: ADMIN, GERENTE editam | MOTORISTA so troca o status da parada
// - vinculo de transfer: quem pode escrever em transfers (ADMIN, GERENTE, ATENDENTE)
@Component({
    selector: 'app-ordem-servico-detalhe',
    imports: [
        ReactiveFormsModule,
        RouterLink,
        ConfirmDialogComponent,
        IconeComponent,
        ModalComponent,
        StatusBadgeComponent,
    ],
    templateUrl: './ordem-servico-detalhe.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdemServicoDetalheComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordemServicoService = inject(OrdemServicoService);
  private paradaService = inject(ParadaOsService);
  private transferService = inject(TransferService);
  private motoristaService = inject(MotoristaService);
  private veiculoService = inject(VeiculoService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private cargaSub?: Subscription;
  private disponiveisSub?: Subscription;
  private osIdAtual = 0;

  statusOsOpcoes = STATUS_ORDEM_SERVICO;
  statusParadaOpcoes = STATUS_PARADA;
  acoesParada = ACOES_PARADA;
  rotuloStatusOs = ROTULO_STATUS_OS;
  rotuloStatusParada = ROTULO_STATUS_PARADA;
  rotuloStatusTransfer = ROTULO_STATUS_TRANSFER;
  rotuloAcao = ROTULO_ACAO_PARADA;
  tomDoStatus = tomDoStatus;
  formatarData = formatarData;
  formatarHora = formatarHora;

  // ----- dados da tela -----
  ordem = signal<OrdemServico | null>(null);
  motorista = signal<Motorista | null>(null);
  veiculo = signal<Veiculo | null>(null);
  paradas = signal<ParadaOs[]>([]);
  transfersVinculados = signal<Transfer[]>([]);
  transfersSemOsDoDia = signal<Transfer[]>([]);

  carregando = signal(true);
  erro = signal<string | null>(null);

  // o backend so aceita transfer do mesmo dia da os (RF009) e que nao esteja concluido/cancelado
  transfersDisponiveis = computed(() =>
    this.transfersSemOsDoDia().filter(t => t.osId === null && t.status !== 'CANCELADO' && t.status !== 'CONCLUIDO'),
  );

  // os cancelada ou finalizada nao recebe transfer novo (o backend responde 400)
  osRecebeTransfers = computed(() => {
    const status = this.ordem()?.status;
    return !!status && STATUS_OS_RECEBE_TRANSFER.includes(status);
  });

  gerandoPdf = signal(false);

  // ----- permissoes -----
  podeEditarOs = computed(() => this.auth.podeEscrever('ordens-servico'));
  podeEditarParadas = computed(() => this.auth.podeEscrever('paradas-os'));
  podeExcluirParadas = computed(() => this.auth.podeExcluir('paradas-os'));
  podeAlterarStatusParada = computed(() => this.auth.podeAlterarStatusParada());
  podeVincularTransfers = computed(() => this.auth.podeEscrever('transfers'));

  // ----- acoes em andamento (desabilitam o botao/select correspondente) -----
  alterandoStatusOs = signal(false);
  paradasEmAlteracao = signal<ReadonlySet<number>>(new Set());
  alterandoTransferId = signal<number | null>(null);

  // ----- modal de parada -----
  modalAberto = signal(false);
  editandoParada = signal<ParadaOs | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // regras iguais as do ParadaOsRequestDTO do backend
  form = this.fb.group({
    ordemParada: this.fb.control<number | null>(null, [Validators.required, inteiroPositivo]),
    localParada: this.fb.nonNullable.control('', [textoObrigatorio, Validators.maxLength(100)]),
    horarioPrevisto: this.fb.nonNullable.control(''),
    acao: this.fb.control<AcaoParada | null>(null),
    statusParada: this.fb.nonNullable.control<StatusParada>('PENDENTE'),
    latitude: this.fb.control<number | null>(null, [Validators.min(-90), Validators.max(90)]),
    longitude: this.fb.control<number | null>(null, [Validators.min(-180), Validators.max(180)]),
    transferIds: this.fb.nonNullable.control<number[]>([]),
  });

  // ----- exclusao de parada -----
  paradaParaExcluir = signal<ParadaOs | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = Number(params.get('id'));
        if (!Number.isInteger(id) || id <= 0) {
          this.osIdAtual = 0;
          this.carregando.set(false);
          this.erro.set('Identificador de ordem de serviço inválido.');
          return;
        }
        this.osIdAtual = id;
        this.carregar();
      });
  }

  estaAlterandoParada(paradaId: number): boolean {
    return this.paradasEmAlteracao().has(paradaId);
  }

  carregar(): void {
    const id = this.osIdAtual;
    if (!id) {
      return;
    }

    this.cargaSub?.unsubscribe();
    this.disponiveisSub?.unsubscribe();
    this.carregando.set(true);
    this.erro.set(null);

    this.cargaSub = forkJoin({
      ordem: this.ordemServicoService.buscarPorId(id),
      paradas: this.paradaService.listarPorOrdemServico(id),
      // busca filtrada direto pelo osId (RF015): nao perde transfers quando ha mais de 100 no sistema
      vinculados: this.transferService
        .listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'horaTransfer,asc' }, { osId: id })
        .pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ ordem, paradas, vinculados }) => {
          this.ordem.set(ordem);
          this.paradas.set(paradas);
          this.transfersVinculados.set(vinculados?.conteudo ?? []);
          this.carregarFrota(ordem);
          this.carregarTransfersDisponiveis(ordem);
          this.carregando.set(false);
        },
        error: (err: unknown) => {
          this.erro.set(mensagemDeErro(err, 'Não foi possível carregar a ordem de serviço.'));
          this.carregando.set(false);
        },
      });
  }

  descricaoTransfer(transferId: number): string {
    const transfer = this.transfersVinculados().find(t => t.id === transferId);
    return transfer ? `${transfer.origem} → ${transfer.destino}` : `Transfer #${transferId}`;
  }

  // ----- status da os -----

  // recebe o proprio <select> pra conseguir voltar o valor antigo se a api recusar
  alterarStatusOs(seletor: HTMLSelectElement): void {
    const ordem = this.ordem();
    const valor = seletor.value;
    if (!ordem || valor === ordem.status) {
      return;
    }

    this.alterandoStatusOs.set(true);
    this.ordemServicoService.alterarStatus(ordem, valor as StatusOrdemServico)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: atualizada => {
          this.ordem.set(atualizada);
          this.alterandoStatusOs.set(false);
          // cancelar a os devolve os transfers pendentes pra "aguardando OS" (saem dela e do roteiro):
          // recarrega tudo pra tela nao continuar mostrando esses transfers como vinculados
          if (atualizada.status === 'CANCELADA') {
            this.carregar();
          } else {
            this.carregarTransfersDisponiveis(atualizada);
          }
          this.notificacao.sucesso(`OS marcada como "${this.rotuloStatusOs[atualizada.status]}".`);
        },
        error: (err: unknown) => {
          this.alterandoStatusOs.set(false);
          seletor.value = ordem.status;
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível alterar o status.'));
          this.recarregarSeConflito(err);
        },
      });
  }

  // 409 = outra pessoa salvou a os ou o transfer no meio tempo (RNF008): busca os dados novos
  private recarregarSeConflito(err: unknown): void {
    if (statusDoErro(err) === 409) {
      this.carregar();
    }
  }

  // ----- relatorio em pdf (RF013) -----

  // a aba abre ja no clique (senao o navegador bloqueia como popup) e recebe o pdf quando chegar
  imprimirPdf(): void {
    const ordem = this.ordem();
    if (!ordem || this.gerandoPdf()) {
      return;
    }

    const aba = window.open('', '_blank');
    this.gerandoPdf.set(true);
    this.ordemServicoService.baixarPdf(ordem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pdf => {
          this.gerandoPdf.set(false);
          const url = URL.createObjectURL(pdf);
          if (aba) {
            aba.location.href = url;
          } else {
            // popup bloqueado: baixa o arquivo
            const link = document.createElement('a');
            link.href = url;
            link.download = `ordem-servico-${ordem.id}.pdf`;
            link.click();
          }
          // da tempo da aba carregar antes de liberar a memoria
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        },
        error: (err: unknown) => {
          this.gerandoPdf.set(false);
          aba?.close();
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível gerar o PDF da ordem de serviço.'));
        },
      });
  }

  // ----- transfers vinculados -----

  vincularTransfer(valor: string): void {
    const ordem = this.ordem();
    const transfer = this.transfersDisponiveis().find(t => t.id === Number(valor));
    if (!ordem || !transfer) {
      return;
    }
    this.alterarVinculo(transfer, ordem.id, 'Transfer vinculado à OS.');
  }

  desvincularTransfer(transfer: Transfer): void {
    this.alterarVinculo(transfer, null, 'Transfer desvinculado da OS.');
  }

  private alterarVinculo(transfer: Transfer, osId: number | null, mensagemSucesso: string): void {
    this.alterandoTransferId.set(transfer.id);
    this.transferService.alterarOrdemServico(transfer, osId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: atualizado => {
          if (osId !== null) {
            this.transfersSemOsDoDia.update(lista => lista.filter(t => t.id !== atualizado.id));
            this.transfersVinculados.update(lista => [...lista.filter(t => t.id !== atualizado.id), atualizado]);
          } else {
            this.transfersVinculados.update(lista => lista.filter(t => t.id !== atualizado.id));
            const ordem = this.ordem();
            if (ordem && atualizado.dataTransfer === ordem.dataServico) {
              this.transfersSemOsDoDia.update(lista => [...lista.filter(t => t.id !== atualizado.id), atualizado]);
            }
            // desvincular pode alterar paradas no backend (transferIds/versao): sincroniza a rota
            if (ordem) {
              this.recarregarParadas(ordem.id);
            }
          }
          this.alterandoTransferId.set(null);
          this.notificacao.sucesso(mensagemSucesso);
        },
        error: (err: unknown) => {
          this.alterandoTransferId.set(null);
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível alterar o vínculo do transfer.'));
          this.recarregarSeConflito(err);
        },
      });
  }

  // ----- status da parada (unica acao liberada pro motorista) -----

  alterarStatusParada(parada: ParadaOs, seletor: HTMLSelectElement): void {
    const valor = seletor.value;
    if (valor === parada.statusParada || this.estaAlterandoParada(parada.id)) {
      return;
    }

    this.marcarParadaEmAlteracao(parada.id, true);
    this.paradaService.alterarStatus(parada, valor as StatusParada)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: atualizada => {
          this.paradas.update(lista => lista.map(p => (p.id === atualizada.id ? atualizada : p)));
          this.marcarParadaEmAlteracao(parada.id, false);
        },
        error: (err: unknown) => {
          this.marcarParadaEmAlteracao(parada.id, false);
          seletor.value = parada.statusParada;
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível alterar o status da parada.'));
          this.recarregarSeConflito(err);
        },
      });
  }

  private marcarParadaEmAlteracao(paradaId: number, emAlteracao: boolean): void {
    this.paradasEmAlteracao.update(atual => {
      const proximo = new Set(atual);
      if (emAlteracao) {
        proximo.add(paradaId);
      } else {
        proximo.delete(paradaId);
      }
      return proximo;
    });
  }

  // ----- cadastro/edicao de parada -----

  abrirNovaParada(): void {
    const proximaOrdem = Math.max(0, ...this.paradas().map(p => p.ordemParada)) + 1;
    this.editandoParada.set(null);
    this.form.reset({
      ordemParada: proximaOrdem,
      localParada: '',
      horarioPrevisto: '',
      acao: 'EMBARQUE',
      statusParada: 'PENDENTE',
      latitude: null,
      longitude: null,
      transferIds: [],
    });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicaoParada(parada: ParadaOs): void {
    const idsVinculados = new Set(this.transfersVinculados().map(t => t.id));
    this.editandoParada.set(parada);
    this.form.reset({
      ordemParada: parada.ordemParada,
      localParada: parada.localParada,
      horarioPrevisto: horaParaInput(parada.horarioPrevisto),
      acao: parada.acao,
      statusParada: parada.statusParada,
      latitude: parada.latitude,
      longitude: parada.longitude,
      transferIds: parada.transferIds.filter(id => idsVinculados.has(id)),
    });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    if (!this.salvando()) {
      this.modalAberto.set(false);
    }
  }

  transferMarcado(transferId: number): boolean {
    return this.form.controls.transferIds.value.includes(transferId);
  }

  alternarTransfer(transferId: number, marcado: boolean): void {
    const atual = this.form.controls.transferIds.value;
    this.form.controls.transferIds.setValue(
      marcado ? [...atual, transferId] : atual.filter(id => id !== transferId),
    );
  }

  salvarParada(): void {
    const ordem = this.ordem();
    if (!ordem) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // o erro do servidor era da tentativa anterior: nao pode ficar junto com os erros novos
      this.erroFormulario.set(null);
      return;
    }

    this.salvando.set(true);
    this.erroFormulario.set(null);

    const editando = this.editandoParada();
    const valores = this.form.getRawValue();
    const idsVinculados = new Set(this.transfersVinculados().map(t => t.id));
    const numeroOuNulo = (valor: number | null) =>
      valor === null || (valor as unknown) === '' ? null : Number(valor);

    const dados: ParadaOsRequest = {
      osId: ordem.id,
      ordemParada: Number(valores.ordemParada),
      localParada: textoOuNulo(valores.localParada) ?? '',
      horarioPrevisto: horaParaApi(valores.horarioPrevisto),
      acao: valores.acao,
      statusParada: valores.statusParada,
      latitude: numeroOuNulo(valores.latitude),
      longitude: numeroOuNulo(valores.longitude),
      transferIds: valores.transferIds.filter(id => idsVinculados.has(id)),
      // RNF008: com a versao carregada, se outra pessoa salvou antes o backend responde 409
      versao: editando?.versao,
    };

    const request$ = editando
      ? this.paradaService.atualizar(editando.id, dados)
      : this.paradaService.criar(dados);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: salva => {
        // mantem a lista ordenada pela posicao na rota, igual o backend devolve
        this.paradas.update(lista =>
          [...lista.filter(p => p.id !== salva.id), salva].sort((a, b) => a.ordemParada - b.ordemParada),
        );
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.notificacao.sucesso(editando ? 'Parada atualizada.' : 'Parada adicionada à rota.');
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar a parada.'));
        this.recarregarSeConflito(err);
      },
    });
  }

  // ----- exclusao de parada -----

  confirmarExclusaoParada(): void {
    const parada = this.paradaParaExcluir();
    if (!parada) {
      return;
    }

    this.excluindo.set(true);
    this.paradaService.excluir(parada.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.paradas.update(lista => lista.filter(p => p.id !== parada.id));
          this.excluindo.set(false);
          this.paradaParaExcluir.set(null);
          this.notificacao.sucesso('Parada removida da rota.');
        },
        error: (err: unknown) => {
          this.excluindo.set(false);
          this.paradaParaExcluir.set(null);
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível remover a parada.'));
        },
      });
  }

  private recarregarParadas(osId: number): void {
    this.paradaService.listarPorOrdemServico(osId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: paradas => this.paradas.set(paradas),
        error: () => {},
      });
  }

  private carregarTransfersDisponiveis(ordem: OrdemServico): void {
    this.disponiveisSub?.unsubscribe();
    if (!this.podeVincularTransfers() || !STATUS_OS_RECEBE_TRANSFER.includes(ordem.status)) {
      this.transfersSemOsDoDia.set([]);
      return;
    }

    this.disponiveisSub = this.transferService
      .listar(
        { page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'horaTransfer,asc' },
        { semOs: true, dataInicio: ordem.dataServico, dataFim: ordem.dataServico },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pagina => this.transfersSemOsDoDia.set(pagina.conteudo),
        error: () => this.transfersSemOsDoDia.set([]),
      });
  }

  // motorista e veiculo sao opcionais na os; falha aqui nao impede o uso da tela
  private carregarFrota(ordem: OrdemServico): void {
    this.motorista.set(null);
    this.veiculo.set(null);

    if (ordem.motoristaId) {
      this.motoristaService.buscarPorId(ordem.motoristaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: motorista => this.motorista.set(motorista),
          error: () => {},
        });
    }
    if (ordem.veiculoId) {
      this.veiculoService.buscarPorId(ordem.veiculoId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: veiculo => this.veiculo.set(veiculo),
          error: () => {},
        });
    }
  }
}
