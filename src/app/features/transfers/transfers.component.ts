import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro } from '../../core/http/erro-api';
import { Pagina, TAMANHO_MAXIMO_PAGINA } from '../../core/models/api.model';
import { OrdemServico } from '../../core/models/ordem-servico.model';
import {
  MOEDAS,
  MOEDA_BASE,
  STATUS_TRANSFER,
  StatusTransfer,
  Transfer,
  TransferRequest,
} from '../../core/models/transfer.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { TransferService } from './transfer.service';
import { OrdemServicoService } from '../ordens-servico/ordem-servico.service';
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
  formatarMoeda,
  horaParaApi,
  horaParaInput,
  tomDoStatus,
} from '../../shared/utils/rotulos';

const TAMANHO_PAGINA = 20;

// ---------------------------------------------------------------
// tela de transfers: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: todos os perfis | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
//
// sobre o valor:
// - o usuario informa o valor e a moeda em que foi negociado (valorOriginal + moedaOrigem)
// - o backend calcula o valorBase em reais (cotacao do dia quando a moeda nao e brl)
// - na edicao, se valor e moeda nao mudaram, o valorBase antigo e reenviado pra nao
//   reconverter com a cotacao de hoje um valor que ja foi fechado em outro dia
@Component({
    selector: 'app-transfers',
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
    templateUrl: './transfers.component.html'
})
export class TransfersComponent implements OnInit {
  private service = inject(TransferService);
  private ordemServicoService = inject(OrdemServicoService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

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

  // filtro por status (feito no backend); vazio = todos
  filtroStatus = signal<StatusTransfer | ''>('');

  podeEscrever = computed(() => this.auth.podeEscrever('transfers'));
  podeExcluir = computed(() => this.auth.podeExcluir('transfers'));

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<Transfer | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // opcoes do select de os: as 100 mais recentes (limite de pagina do backend)
  ordensServico = signal<OrdemServico[]>([]);

  // regras iguais as do TransferRequestDTO do backend
  form = this.fb.group({
    dataTransfer: this.fb.nonNullable.control('', Validators.required),
    horaTransfer: this.fb.nonNullable.control('', Validators.required),
    origem: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    destino: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    status: this.fb.nonNullable.control<StatusTransfer>('AGUARDANDO_OS', Validators.required),
    valor: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(99999999.99)]),
    moedaOrigem: this.fb.nonNullable.control(MOEDA_BASE, Validators.pattern(/^[A-Za-z]{3}$/)),
    osId: this.fb.control<number | null>(null),
  });

  moedaSelecionada = signal(MOEDA_BASE);

  // ----- exclusao -----
  paraExcluir = signal<Transfer | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.form.controls.moedaOrigem.valueChanges.subscribe(moeda => this.moedaSelecionada.set(moeda));

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
    this.carregando.set(true);
    this.erro.set(null);

    const parametros = { page: numeroPagina, size: TAMANHO_PAGINA, sort: 'dataTransfer,desc' };
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

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.carregarOrdensServico();
    this.form.reset({
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

    this.editando.set(transfer);
    this.carregarOrdensServico();
    this.form.reset({
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

    request$.subscribe({
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

    this.service.excluir(transfer.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.sucesso('Transfer excluído.');
        const atual = this.pagina();
        const voltarUma = !!atual && atual.conteudo.length === 1 && atual.pagina > 0;
        this.carregar(atual ? (voltarUma ? atual.pagina - 1 : atual.pagina) : 0);
      },
      error: (err: unknown) => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o transfer.'));
      },
    });
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
    };
  }

  private carregarOrdensServico(): void {
    if (this.ordensServico().length) {
      return;
    }
    this.ordemServicoService
      .listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'dataServico,desc' })
      .subscribe({
        next: pagina => this.ordensServico.set(pagina.conteudo),
        error: () => this.ordensServico.set([]),
      });
  }
}
