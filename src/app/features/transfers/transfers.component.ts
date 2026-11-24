import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro, statusDoErro } from '../../core/http/erro-api';
import { Pagina, TAMANHO_MAXIMO_PAGINA, paginaAposExclusao } from '../../core/models/api.model';
import { OrdemServico, STATUS_OS_RECEBE_TRANSFER } from '../../core/models/ordem-servico.model';
import { Passageiro } from '../../core/models/passageiro.model';
import {
  FiltroTransfer,
  MOEDAS,
  MOEDA_BASE,
  STATUS_TRANSFER,
  StatusTransfer,
  Transfer,
  TransferRequest,
  ajustarStatusAoVinculo,
  statusPermitidoParaVinculo,
} from '../../core/models/transfer.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { TransferService } from './transfer.service';
import { OrdemServicoService } from '../ordens-servico/ordem-servico.service';
import { PassageiroService } from '../passageiros/passageiro.service';
import { HistoricoListaComponent } from '../historico/historico-lista.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import {
  ROTULO_STATUS_OS,
  ROTULO_STATUS_TRANSFER,
  formatarData,
  formatarHora,
  dataHoraNoPassado,
  formatarMoeda,
  hojeLocal,
  horaParaApi,
  horaParaInput,
  tomDoStatus,
} from '../../shared/utils/rotulos';
import { periodoInvalido, textoObrigatorio } from '../../shared/utils/validadores';

const TAMANHO_PAGINA = 20;

// o formulario nao salva status que contradiz o vinculo (ex.: Confirmado sem OS)
function statusCompativelComOs(grupo: AbstractControl): ValidationErrors | null {
  const status = grupo.get('status')?.value as StatusTransfer;
  const temOs = grupo.get('osId')?.value !== null;
  return statusPermitidoParaVinculo(status, temOs) ? null : { statusIncompativelComOs: true };
}

// ---------------------------------------------------------------
// tela de transfers: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: ADMIN, GERENTE, ATENDENTE (na tela) | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
//
// sobre o valor:
// - o usuario informa o valor e a moeda em que foi negociado (valorOriginal + moedaOrigem)
// - o backend calcula o valorBase em reais (cotacao do dia quando a moeda nao e brl)
// - na edicao, se valor e moeda nao mudaram, o valorBase antigo e reenviado pra nao
//   reconverter com a cotacao de hoje um valor que ja foi fechado em outro dia
//
// sobre a os e o status: so entram os abertas/em andamento do mesmo dia do transfer (RF009);
// com os o backend marca o transfer como CONFIRMADO, e ao sair dela volta pra AGUARDANDO_OS.
// a edicao manda a versao carregada: se outra pessoa salvou antes, o backend responde 409 (RNF008).
@Component({
    selector: 'app-transfers',
    imports: [
        ReactiveFormsModule,
        RouterLink,
        ConfirmDialogComponent,
        HistoricoListaComponent,
        IconeComponent,
        ModalComponent,
        PaginacaoComponent,
        StatusBadgeComponent,
        TabelaSkeletonComponent,
    ],
    templateUrl: './transfers.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransfersComponent implements OnInit {
  private service = inject(TransferService);
  private ordemServicoService = inject(OrdemServicoService);
  private passageiroService = inject(PassageiroService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private cargaSub?: Subscription;
  private ordensSub?: Subscription;
  private buscaPassageiro$ = new Subject<string>();

  // helpers de exibicao usados no template
  statusOpcoes = STATUS_TRANSFER;
  rotuloStatus = ROTULO_STATUS_TRANSFER;
  rotuloStatusOs = ROTULO_STATUS_OS;
  moedaBase = MOEDA_BASE;
  tomDoStatus = tomDoStatus;
  formatarData = formatarData;
  formatarHora = formatarHora;
  formatarMoeda = formatarMoeda;

  moedas = signal<string[]>(MOEDAS);

  // ----- listagem -----
  pagina = signal<Pagina<Transfer> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  // filtro por status (abas, aplica na hora); vazio = todos
  filtroStatus = signal<StatusTransfer | ''>('');

  // demais filtros (RF015): o que esta digitado so vale ao clicar em "Filtrar"
  filtroDataInicio = signal('');
  filtroDataFim = signal('');
  filtroBusca = signal('');
  filtroSemOs = signal(false);
  filtrosAplicados = signal<FiltroTransfer>({});
  temFiltroExtra = computed(() => Object.values(this.filtrosAplicados()).some(valor => !!valor));
  intervaloFiltroInvalido = computed(() => periodoInvalido(this.filtroDataInicio(), this.filtroDataFim()));

  podeEscrever = computed(() => this.auth.podeEscrever('transfers'));
  podeExcluir = computed(() => this.auth.podeExcluir('transfers'));
  podeVerHistorico = computed(() => this.auth.podeLer('auditoria'));
  podeVerPassageiros = computed(() => this.auth.podeLer('passageiros'));

  // ----- historico do transfer (HU11) -----
  historicoDe = signal<Transfer | null>(null);

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<Transfer | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // ordens de servico carregadas sob demanda para a data escolhida no formulario
  ordensServico = signal<OrdemServico[]>([]);

  // so aparecem as os do mesmo dia do transfer que ainda recebem transfers; a os atual (na edicao)
  // continua aparecendo mesmo finalizada, mas so enquanto a data do transfer for a dela
  dataSelecionada = signal('');
  ordensDoDia = computed(() => {
    const data = this.dataSelecionada();
    const atual = this.editando()?.osId ?? null;
    return this.ordensServico().filter(ordem =>
      ordem.dataServico === data && (ordem.id === atual || STATUS_OS_RECEBE_TRANSFER.includes(ordem.status)));
  });

  // opcoes do select de status conforme o vinculo; um status antigo fora da regra continua
  // visivel (pra o select nao ficar em branco), mas o formulario nao salva ate corrigir
  osSelecionada = signal<number | null>(null);
  statusSelecionado = signal<StatusTransfer>('AGUARDANDO_OS');
  statusOpcoesDoFormulario = computed(() => {
    const temOs = this.osSelecionada() !== null;
    const atual = this.statusSelecionado();
    return STATUS_TRANSFER.filter(status => status === atual || statusPermitidoParaVinculo(status, temOs));
  });

  // ----- passageiros do transfer (RF007) -----
  // busca no servidor por nome (nao trava no limite de 100 registros) + cache dos ja selecionados
  buscaPassageiro = signal('');
  passageiros = signal<Passageiro[]>([]);
  passageirosConhecidos = signal<ReadonlyMap<number, Passageiro>>(new Map());
  passageiroIds = signal<number[]>([]);
  passageirosSelecionados = computed(() => {
    const conhecidos = this.passageirosConhecidos();
    return this.passageiroIds().map(id => conhecidos.get(id) ?? { id, nome: `Passageiro #${id}` });
  });
  passageirosDisponiveis = computed(() => {
    const escolhidos = new Set(this.passageiroIds());
    return this.passageiros().filter(p => !escolhidos.has(p.id));
  });

  // regras iguais as do TransferRequestDTO do backend
  form = this.fb.group({
    dataTransfer: this.fb.nonNullable.control('', Validators.required),
    horaTransfer: this.fb.nonNullable.control('', Validators.required),
    origem: this.fb.nonNullable.control('', [textoObrigatorio, Validators.maxLength(100)]),
    destino: this.fb.nonNullable.control('', [textoObrigatorio, Validators.maxLength(100)]),
    status: this.fb.nonNullable.control<StatusTransfer>('AGUARDANDO_OS', Validators.required),
    valor: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(99999999.99)]),
    moedaOrigem: this.fb.nonNullable.control(MOEDA_BASE, Validators.pattern(/^[A-Za-z]{3}$/)),
    osId: this.fb.control<number | null>(null),
  }, { validators: [statusCompativelComOs, grupo => this.validarDataHoraNoFuturo(grupo)] });

  // no cadastro o calendario ja nao deixa escolher dia passado (a hora e conferida pelo validador)
  hoje = signal(hojeLocal());

  moedaSelecionada = signal(MOEDA_BASE);

  // ----- exclusao -----
  paraExcluir = signal<Transfer | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.form.controls.moedaOrigem.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(moeda => this.moedaSelecionada.set(moeda));

    this.form.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.statusSelecionado.set(status));

    this.form.controls.dataTransfer.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.dataSelecionada.set(data);
        // trocou o dia: limpa o vinculo anterior e busca as OS daquele dia no servidor
        if (this.form.controls.osId.value !== null) {
          this.form.controls.osId.setValue(null);
        }
        this.carregarOrdensDoDia(data, null);
      });

    // entrou ou saiu de uma os: o status vai junto (Aguardando OS <-> Confirmado)
    this.form.controls.osId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(osId => {
        this.osSelecionada.set(osId);
        const status = this.form.controls.status;
        const ajustado = ajustarStatusAoVinculo(status.value, osId !== null);
        if (ajustado !== status.value) {
          status.setValue(ajustado);
        }
      });

    // busca de passageiros no modal com debounce e cancelamento automatico
    this.buscaPassageiro$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(termo =>
          this.passageiroService
            .listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'nome,asc' }, { nome: termo.trim() || undefined })
            .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(pagina => {
        const lista = pagina?.conteudo ?? [];
        this.passageiros.set(lista);
        this.registrarPassageirosConhecidos(lista);
      });

    // o painel pode mandar ?status=AGUARDANDO_OS pra abrir ja filtrado
    const status = this.route.snapshot.queryParamMap.get('status') as StatusTransfer | null;
    if (status && this.statusOpcoes.includes(status)) {
      this.filtroStatus.set(status);
    }

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

    const parametros = { page: numeroPagina, size: TAMANHO_PAGINA, sort: 'dataTransfer,desc' };
    const filtros: FiltroTransfer = { ...this.filtrosAplicados(), status: this.filtroStatus() || undefined };

    this.cargaSub = this.service.listar(parametros, filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pagina => {
          this.pagina.set(pagina);
          this.carregando.set(false);
        },
        error: (err: unknown) => {
          this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os transfers.'));
          this.carregando.set(false);
        },
      });
  }

  // troca o filtro e mantem a url sincronizada (recarregar a pagina mantem o filtro)
  filtrarPorStatus(valor: string): void {
    this.filtroStatus.set(valor as StatusTransfer | '');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: valor || null },
      replaceUrl: true,
    });
    this.carregar();
  }

  aplicarFiltros(): void {
    if (this.intervaloFiltroInvalido()) {
      return;
    }
    this.filtrosAplicados.set({
      dataInicio: this.filtroDataInicio() || undefined,
      dataFim: this.filtroDataFim() || undefined,
      busca: this.filtroBusca().trim() || undefined,
      semOs: this.filtroSemOs() || undefined,
    });
    this.carregar();
  }

  limparFiltros(): void {
    this.filtroDataInicio.set('');
    this.filtroDataFim.set('');
    this.filtroBusca.set('');
    this.filtroSemOs.set(false);
    this.filtrosAplicados.set({});
    this.carregar();
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.hoje.set(hojeLocal());
    this.ordensServico.set([]);
    this.passageiroIds.set([]);
    this.iniciarBuscaPassageiros([]);
    this.preencherFormulario({
      dataTransfer: '',
      horaTransfer: '',
      origem: '',
      destino: '',
      status: 'AGUARDANDO_OS',
      valor: null,
      moedaOrigem: MOEDA_BASE,
      osId: null,
    });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(transfer: Transfer): void {
    const moeda = transfer.moedaOrigem ?? MOEDA_BASE;
    // moeda cadastrada fora da lista sugerida continua aparecendo no select
    if (!this.moedas().includes(moeda)) {
      this.moedas.update(lista => [...lista, moeda]);
    }

    const idsPassageiros = [...(transfer.passageiroIds ?? [])];
    this.editando.set(transfer);
    this.passageiroIds.set(idsPassageiros);
    this.carregarOrdensDoDia(transfer.dataTransfer, transfer.osId);
    this.iniciarBuscaPassageiros(idsPassageiros);
    this.preencherFormulario({
      dataTransfer: transfer.dataTransfer,
      horaTransfer: horaParaInput(transfer.horaTransfer),
      origem: transfer.origem,
      destino: transfer.destino,
      status: transfer.status,
      valor: transfer.valorOriginal ?? transfer.valorBase,
      moedaOrigem: moeda,
      osId: transfer.osId,
    });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    if (!this.salvando()) {
      this.modalAberto.set(false);
    }
  }

  salvar(): void {
    // o relogio andou desde que o modal abriu: confere de novo se o horario ainda nao passou
    this.form.updateValueAndValidity({ emitEvent: false });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erroFormulario.set(null);

    const editando = this.editando();
    const dados = this.montarRequisicao(editando);

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: salvo => {
        this.salvando.set(false);
        this.modalAberto.set(false);

        // moeda estrangeira com cambio fora do ar: o backend salva, mas sem o valor em reais
        if (salvo.moedaOrigem !== MOEDA_BASE && salvo.valorOriginal !== null && salvo.valorBase === null) {
          this.notificacao.info('Transfer salvo, mas a cotação estava indisponível: o valor em reais ficou em branco.');
        } else {
          this.notificacao.sucesso(editando ? 'Transfer atualizado.' : 'Transfer cadastrado.');
        }

        this.carregar(editando ? this.pagina()?.pagina ?? 0 : 0);
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar o transfer.'));
        // 409: outra pessoa salvou antes; a lista recarrega pra a proxima edicao partir dos dados novos
        if (statusDoErro(err) === 409) {
          this.carregar(this.pagina()?.pagina ?? 0);
        }
      },
    });
  }

  // ----- exclusao -----

  confirmarExclusao(): void {
    const transfer = this.paraExcluir();
    if (!transfer) {
      return;
    }

    this.excluindo.set(true);

    this.service.excluir(transfer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.excluindo.set(false);
          this.paraExcluir.set(null);
          this.notificacao.sucesso('Transfer excluído.');
          this.carregar(paginaAposExclusao(this.pagina()));
        },
        error: (err: unknown) => {
          this.excluindo.set(false);
          this.paraExcluir.set(null);
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o transfer.'));
        },
      });
  }

  // nao deixa agendar no passado. na edicao so confere se a data ou a hora mudaram:
  // um transfer que ja aconteceu continua editavel (ex.: marcar como concluido)
  private validarDataHoraNoFuturo(grupo: AbstractControl): ValidationErrors | null {
    const data = grupo.get('dataTransfer')?.value as string;
    const hora = grupo.get('horaTransfer')?.value as string;
    if (!data || !hora) {
      return null;
    }
    const original = this.editando();
    if (original && original.dataTransfer === data && horaParaInput(original.horaTransfer) === hora) {
      return null;
    }
    return dataHoraNoPassado(data, hora) ? { dataHoraNoPassado: true } : null;
  }

  // carrega os valores sem disparar as reacoes do formulario (limpar os, ajustar status):
  // elas sao pra quando o usuario mexe nos campos, nao pra quando o modal abre
  private preencherFormulario(valores: ReturnType<TransfersComponent['form']['getRawValue']>): void {
    this.form.reset(valores, { emitEvent: false });
    this.dataSelecionada.set(valores.dataTransfer);
    this.moedaSelecionada.set(valores.moedaOrigem);
    this.osSelecionada.set(valores.osId);
    this.statusSelecionado.set(valores.status);
  }

  // converte o formulario no corpo esperado pela api
  private montarRequisicao(original: Transfer | null): TransferRequest {
    const valores = this.form.getRawValue();
    const moeda = valores.moedaOrigem.toUpperCase();
    const valor = valores.valor === null || (valores.valor as unknown) === '' ? null : Number(valores.valor);

    // valorBase nulo = backend calcula; so reaproveita o antigo se valor e moeda nao mudaram
    const valorNaoMudou = !!original
      && original.valorOriginal === valor
      && (original.moedaOrigem ?? MOEDA_BASE) === moeda;

    return {
      dataTransfer: valores.dataTransfer,
      horaTransfer: horaParaApi(valores.horaTransfer)!,
      origem: valores.origem.trim(),
      destino: valores.destino.trim(),
      status: valores.status,
      valorOriginal: valor,
      moedaOrigem: moeda,
      valorBase: valorNaoMudou ? original!.valorBase : null,
      osId: valores.osId,
      passageiroIds: this.passageiroIds(),
      versao: original?.versao,
    };
  }

  // ----- passageiros e OS do transfer -----

  filtrarPassageirosNoModal(termo: string): void {
    this.buscaPassageiro.set(termo);
    this.buscaPassageiro$.next(termo);
  }

  adicionarPassageiro(valor: string): void {
    const id = Number(valor);
    if (id && !this.passageiroIds().includes(id)) {
      this.passageiroIds.update(ids => [...ids, id]);
    }
  }

  removerPassageiro(id: number): void {
    this.passageiroIds.update(ids => ids.filter(atual => atual !== id));
  }

  private iniciarBuscaPassageiros(idsSelecionados: number[]): void {
    if (!this.podeVerPassageiros()) {
      return;
    }
    this.buscaPassageiro.set('');
    this.passageiroService
      .listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'nome,asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pagina => {
          this.passageiros.set(pagina.conteudo);
          this.registrarPassageirosConhecidos(pagina.conteudo);
          this.garantirPassageirosSelecionados(idsSelecionados);
        },
        error: () => this.passageiros.set([]),
      });
  }

  private registrarPassageirosConhecidos(lista: Passageiro[]): void {
    if (!lista.length) {
      return;
    }
    this.passageirosConhecidos.update(atual => {
      const proximo = new Map(atual);
      for (const p of lista) {
        proximo.set(p.id, p);
      }
      return proximo;
    });
  }

  // passageiros ja vinculados que estao alem da primeira pagina de 100 sao buscados por id
  private garantirPassageirosSelecionados(ids: number[]): void {
    const conhecidos = this.passageirosConhecidos();
    for (const id of ids) {
      if (conhecidos.has(id)) {
        continue;
      }
      this.passageiroService.buscarPorId(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: passageiro => this.registrarPassageirosConhecidos([passageiro]),
          error: () => {},
        });
    }
  }

  // consulta as OS especificamente do dia escolhido (RF015), evitando o teto global de 100 OSs
  private carregarOrdensDoDia(data: string, osAtualId: number | null): void {
    this.ordensSub?.unsubscribe();
    if (!data) {
      this.ordensServico.set([]);
      return;
    }

    this.ordensSub = this.ordemServicoService
      .listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'id,desc' }, { dataInicio: data, dataFim: data })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pagina => {
          this.ordensServico.set(pagina.conteudo);
          if (osAtualId && !pagina.conteudo.some(o => o.id === osAtualId)) {
            this.ordemServicoService.buscarPorId(osAtualId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: os => this.ordensServico.update(lista => [os, ...lista]),
                error: () => {},
              });
          }
        },
        error: () => this.ordensServico.set([]),
      });
  }
}
