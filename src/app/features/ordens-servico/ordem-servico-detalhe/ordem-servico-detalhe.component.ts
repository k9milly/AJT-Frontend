import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemDeErro } from '../../../core/http/erro-api';
import { TAMANHO_MAXIMO_PAGINA } from '../../../core/models/api.model';
import { Motorista } from '../../../core/models/motorista.model';
import { OrdemServico, STATUS_ORDEM_SERVICO, StatusOrdemServico } from '../../../core/models/ordem-servico.model';
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
//
// limitacao conhecida: o backend nao tem "transfers por os", entao os transfers sao lidos da
// listagem geral (100 mais recentes, limite de pagina) e filtrados aqui pelo osId.
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
    templateUrl: './ordem-servico-detalhe.component.html'
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
  transfersRecentes = signal<Transfer[]>([]);

  carregando = signal(true);
  erro = signal<string | null>(null);

  // transfers desta os e os que ainda podem entrar nela (sem os)
  transfersVinculados = computed(() => {
    const id = this.ordem()?.id;
    return this.transfersRecentes().filter(t => t.osId === id);
  });

  transfersDisponiveis = computed(() =>
    this.transfersRecentes().filter(t => t.osId === null && t.status !== 'CANCELADO' && t.status !== 'CONCLUIDO'),
  );

  // ----- permissoes -----
  podeEditarOs = computed(() => this.auth.podeEscrever('ordens-servico'));
  podeEditarParadas = computed(() => this.auth.podeEscrever('paradas-os'));
  podeExcluirParadas = computed(() => this.auth.podeExcluir('paradas-os'));
  podeAlterarStatusParada = computed(() => this.auth.podeAlterarStatusParada());
  podeVincularTransfers = computed(() => this.auth.podeEscrever('transfers'));

  // ----- acoes em andamento (desabilitam o botao/select correspondente) -----
  alterandoStatusOs = signal(false);
  alterandoParadaId = signal<number | null>(null);
  alterandoTransferId = signal<number | null>(null);

  // ----- modal de parada -----
  modalAberto = signal(false);
  editandoParada = signal<ParadaOs | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // regras iguais as do ParadaOsRequestDTO do backend
  form = this.fb.group({
    ordemParada: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    localParada: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
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
    this.carregar();
  }

  carregar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregando.set(true);
    this.erro.set(null);

    forkJoin({
      ordem: this.ordemServicoService.buscarPorId(id),
      paradas: this.paradaService.listarPorOrdemServico(id),
      // se a listagem de transfers falhar, a tela ainda mostra os e paradas
      transfers: this.transferService
        .listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'dataTransfer,desc' })
        .pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ ordem, paradas, transfers }) => {
        this.ordem.set(ordem);
        this.paradas.set(paradas);
        this.transfersRecentes.set(transfers?.conteudo ?? []);
        this.carregarFrota(ordem);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar a ordem de serviço.'));
        this.carregando.set(false);
      },
    });
  }

  descricaoTransfer(transferId: number): string {
    const transfer = this.transfersRecentes().find(t => t.id === transferId);
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
    this.ordemServicoService.alterarStatus(ordem, valor as StatusOrdemServico).subscribe({
      next: atualizada => {
        this.ordem.set(atualizada);
        this.alterandoStatusOs.set(false);
        this.notificacao.sucesso(`OS marcada como "${this.rotuloStatusOs[atualizada.status]}".`);
      },
      error: (err: unknown) => {
        this.alterandoStatusOs.set(false);
        seletor.value = ordem.status;
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível alterar o status.'));
      },
    });
  }

  // ----- transfers vinculados -----

  vincularTransfer(valor: string): void {
    const ordem = this.ordem();
    const transfer = this.transfersRecentes().find(t => t.id === Number(valor));
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
    this.transferService.alterarOrdemServico(transfer, osId).subscribe({
      next: atualizado => {
        this.transfersRecentes.update(lista => lista.map(t => (t.id === atualizado.id ? atualizado : t)));
        this.alterandoTransferId.set(null);
        this.notificacao.sucesso(mensagemSucesso);
      },
      error: (err: unknown) => {
        this.alterandoTransferId.set(null);
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível alterar o vínculo do transfer.'));
      },
    });
  }

  // ----- status da parada (unica acao liberada pro motorista) -----

  alterarStatusParada(parada: ParadaOs, seletor: HTMLSelectElement): void {
    const valor = seletor.value;
    if (valor === parada.statusParada) {
      return;
    }

    this.alterandoParadaId.set(parada.id);
    this.paradaService.alterarStatus(parada.id, valor as StatusParada).subscribe({
      next: atualizada => {
        this.paradas.update(lista => lista.map(p => (p.id === atualizada.id ? atualizada : p)));
        this.alterandoParadaId.set(null);
      },
      error: (err: unknown) => {
        this.alterandoParadaId.set(null);
        seletor.value = parada.statusParada;
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível alterar o status da parada.'));
      },
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
    this.editandoParada.set(parada);
    this.form.reset({
      ordemParada: parada.ordemParada,
      localParada: parada.localParada,
      horarioPrevisto: horaParaInput(parada.horarioPrevisto),
      acao: parada.acao,
      statusParada: parada.statusParada,
      latitude: parada.latitude,
      longitude: parada.longitude,
      transferIds: [...parada.transferIds],
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
      return;
    }

    this.salvando.set(true);
    this.erroFormulario.set(null);

    const editando = this.editandoParada();
    const valores = this.form.getRawValue();
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
      transferIds: valores.transferIds,
    };

    const request$ = editando
      ? this.paradaService.atualizar(editando.id, dados)
      : this.paradaService.criar(dados);

    request$.subscribe({
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
    this.paradaService.excluir(parada.id).subscribe({
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

  // motorista e veiculo sao opcionais na os; falha aqui nao impede o uso da tela
  private carregarFrota(ordem: OrdemServico): void {
    this.motorista.set(null);
    this.veiculo.set(null);

    if (ordem.motoristaId) {
      this.motoristaService.buscarPorId(ordem.motoristaId).subscribe({
        next: motorista => this.motorista.set(motorista),
        error: () => {},
      });
    }
    if (ordem.veiculoId) {
      this.veiculoService.buscarPorId(ordem.veiculoId).subscribe({
        next: veiculo => this.veiculo.set(veiculo),
        error: () => {},
      });
    }
  }
}
