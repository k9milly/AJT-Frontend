import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro } from '../../core/http/erro-api';
import { Pagina, TAMANHO_MAXIMO_PAGINA, paginaUnica } from '../../core/models/api.model';
import { PontoColeta, PontoColetaRequest } from '../../core/models/ponto-coleta.model';
import { Transfer } from '../../core/models/transfer.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { PontoColetaService } from './ponto-coleta.service';
import { TransferService } from '../transfers/transfer.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import { descreverTransfer, formatarHora, horaParaApi, horaParaInput } from '../../shared/utils/rotulos';

const TAMANHO_PAGINA = 20;

// ---------------------------------------------------------------
// tela de pontos de coleta: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: todos os perfis | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
// cada ponto pertence a um transfer. sem filtro a lista e geral e paginada; com um transfer
// escolhido, mostra so os pontos dele na ordem da rota (lista "filha", sem paginacao no backend).
// a tela de transfers abre esta ja filtrada via ?transferId=...
@Component({
  selector: 'app-pontos-coleta',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ConfirmDialogComponent,
    IconeComponent,
    ModalComponent,
    PaginacaoComponent,
    TabelaSkeletonComponent,
  ],
  templateUrl: './pontos-coleta.component.html',
})
export class PontosColetaComponent implements OnInit {
  private service = inject(PontoColetaService);
  private transferService = inject(TransferService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  formatarHora = formatarHora;
  descreverTransfer = descreverTransfer;

  // ----- listagem -----
  pagina = signal<Pagina<PontoColeta> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  // transfers pro select de filtro, pro formulario e pra descrever a rota na tabela
  // (os 100 mais recentes: limite de pagina do backend)
  transfers = signal<Transfer[]>([]);
  filtroTransferId = signal<number | null>(null);

  transferFiltrado = computed(() => this.transfers().find(t => t.id === this.filtroTransferId()) ?? null);

  podeEscrever = computed(() => this.auth.podeEscrever('pontos-coleta'));
  podeExcluir = computed(() => this.auth.podeExcluir('pontos-coleta'));

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<PontoColeta | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // regras iguais as do PontoColetaRequestDTO do backend
  // latitude/longitude sao obrigatorias (o banco nao aceita ponto sem coordenada)
  form = this.fb.group({
    transferId: this.fb.control<number | null>(null, Validators.required),
    localColeta: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    ordemParada: this.fb.control<number | null>(null, Validators.min(1)),
    horarioPrevisto: this.fb.nonNullable.control(''),
    latitude: this.fb.control<number | null>(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: this.fb.control<number | null>(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  // ----- exclusao -----
  paraExcluir = signal<PontoColeta | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.carregarTransfers();

    const transferId = Number(this.route.snapshot.queryParamMap.get('transferId'));
    this.filtroTransferId.set(transferId > 0 ? transferId : null);

    this.carregar();
  }

  carregar(numeroPagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);

    const transferId = this.filtroTransferId();

    // lista filha nao e paginada: embrulha num envelope unico pra reaproveitar a mesma tabela
    const request$: Observable<Pagina<PontoColeta>> = transferId
      ? this.service.listarPorTransfer(transferId).pipe(map(pontos => paginaUnica(pontos)))
      : this.service.listar({ page: numeroPagina, size: TAMANHO_PAGINA, sort: 'id,desc' });

    request$.subscribe({
      next: pagina => {
        this.pagina.set(pagina);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os pontos de coleta.'));
        this.carregando.set(false);
      },
    });
  }

  // troca o filtro e mantem a url sincronizada (recarregar a pagina mantem o filtro)
  filtrarPorTransfer(valor: string): void {
    const transferId = Number(valor) || null;
    this.filtroTransferId.set(transferId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { transferId },
      replaceUrl: true,
    });
    this.carregar();
  }

  descricaoTransfer(transferId: number): string {
    const transfer = this.transfers().find(t => t.id === transferId);
    return transfer ? `${transfer.origem} → ${transfer.destino}` : `Transfer #${transferId}`;
  }

  // abre a coordenada no google maps (nova aba)
  linkMapa(ponto: PontoColeta): string {
    return `https://www.google.com/maps?q=${ponto.latitude},${ponto.longitude}`;
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    const pontosAtuais = this.pagina()?.conteudo ?? [];
    // com transfer filtrado, sugere a proxima posicao da rota
    const proximaOrdem = this.filtroTransferId()
      ? Math.max(0, ...pontosAtuais.map(p => p.ordemParada ?? 0)) + 1
      : null;

    this.editando.set(null);
    this.form.reset({
      transferId: this.filtroTransferId(),
      localColeta: '',
      ordemParada: proximaOrdem,
      horarioPrevisto: '',
      latitude: null,
      longitude: null,
    });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(ponto: PontoColeta): void {
    this.garantirTransferNaLista(ponto.transferId);
    this.editando.set(ponto);
    this.form.reset({
      transferId: ponto.transferId,
      localColeta: ponto.localColeta,
      ordemParada: ponto.ordemParada,
      horarioPrevisto: horaParaInput(ponto.horarioPrevisto),
      latitude: ponto.latitude,
      longitude: ponto.longitude,
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
    const valores = this.form.getRawValue();
    const dados: PontoColetaRequest = {
      transferId: Number(valores.transferId),
      localColeta: valores.localColeta.trim(),
      ordemParada: valores.ordemParada ? Number(valores.ordemParada) : null,
      horarioPrevisto: horaParaApi(valores.horarioPrevisto),
      latitude: Number(valores.latitude),
      longitude: Number(valores.longitude),
    };

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.notificacao.sucesso(editando ? 'Ponto de coleta atualizado.' : 'Ponto de coleta cadastrado.');
        this.carregar(editando ? this.pagina()?.pagina ?? 0 : 0);
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar o ponto de coleta.'));
      },
    });
  }

  // ----- exclusao -----

  confirmarExclusao(): void {
    const ponto = this.paraExcluir();
    if (!ponto) {
      return;
    }

    this.excluindo.set(true);

    this.service.excluir(ponto.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.sucesso('Ponto de coleta excluído.');
        const atual = this.pagina();
        const voltarUma = !!atual && atual.conteudo.length === 1 && atual.pagina > 0;
        this.carregar(atual ? (voltarUma ? atual.pagina - 1 : atual.pagina) : 0);
      },
      error: (err: unknown) => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o ponto de coleta.'));
      },
    });
  }

  private carregarTransfers(): void {
    this.transferService
      .listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'dataTransfer,desc' })
      .subscribe({
        next: pagina => {
          this.transfers.set(pagina.conteudo);
          const filtrado = this.filtroTransferId();
          if (filtrado) {
            this.garantirTransferNaLista(filtrado);
          }
        },
        error: () => this.transfers.set([]),
      });
  }

  // transfer mais antigo que os 100 carregados e buscado a parte pra aparecer nos selects
  private garantirTransferNaLista(transferId: number): void {
    if (this.transfers().some(t => t.id === transferId)) {
      return;
    }
    this.transferService.buscarPorId(transferId).subscribe({
      next: transfer => this.transfers.update(lista => [transfer, ...lista]),
      error: () => {},
    });
  }
}
