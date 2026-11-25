import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro, statusDoErro } from '../../core/http/erro-api';
import { Pagina, paginaAposExclusao } from '../../core/models/api.model';
import { FiltroPassageiro, Passageiro, PassageiroRequest, TIPOS_DOCUMENTO } from '../../core/models/passageiro.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { PassageiroService } from './passageiro.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import { cpfValido, formatarCpf, iniciais, textoOuNulo } from '../../shared/utils/rotulos';
import { textoObrigatorio } from '../../shared/utils/validadores';

const TAMANHO_PAGINA = 20;

// com tipo CPF o numero precisa ser um cpf valido (mesma regra do backend);
// os outros tipos de documento sao texto livre
function cpfQuandoTipoCpf(controle: AbstractControl): ValidationErrors | null {
  const tipo = controle.parent?.get('tipoDocumento')?.value;
  const valor = controle.value as string;
  return tipo === 'CPF' && valor?.trim() && !cpfValido(valor) ? { cpfInvalido: true } : null;
}

// ---------------------------------------------------------------
// tela de passageiros: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: ADMIN, GERENTE, ATENDENTE | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
// o documento e cifrado no banco, mas volta legivel da api: e dado sensivel (lgpd)
@Component({
    selector: 'app-passageiros',
    imports: [
        ReactiveFormsModule,
        ConfirmDialogComponent,
        IconeComponent,
        ModalComponent,
        PaginacaoComponent,
        TabelaSkeletonComponent,
    ],
    templateUrl: './passageiros.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassageirosComponent implements OnInit {
  private service = inject(PassageiroService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private cargaSub?: Subscription;

  iniciais = iniciais;
  tiposDocumento = signal<string[]>(TIPOS_DOCUMENTO);

  // ----- listagem -----
  pagina = signal<Pagina<Passageiro> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  // filtros por nome e nacionalidade (RF015); o aplicado fica separado do que esta sendo
  // digitado pra paginacao continuar usando o filtro da ultima busca
  buscaNome = signal('');
  buscaNacionalidade = signal('');
  filtroAplicado = signal<FiltroPassageiro>({});
  filtroAtivo = computed(() => !!(this.filtroAplicado().nome || this.filtroAplicado().nacionalidade));

  podeEscrever = computed(() => this.auth.podeEscrever('passageiros'));
  podeExcluir = computed(() => this.auth.podeExcluir('passageiros'));

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<Passageiro | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // tamanhos iguais aos do PassageiroRequestDTO do backend
  form = this.fb.nonNullable.group({
    nome: ['', [textoObrigatorio, Validators.maxLength(100)]],
    tipoDocumento: ['CPF', [textoObrigatorio, Validators.maxLength(20)]],
    documento: ['', [textoObrigatorio, Validators.maxLength(50), cpfQuandoTipoCpf]],
    nacionalidade: ['Brasileira', Validators.maxLength(50)],
  });

  // ----- exclusao -----
  paraExcluir = signal<Passageiro | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.carregar();
    this.form.controls.tipoDocumento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tipo => this.ajustarDocumentoAoTipo(tipo));

    // atalho do painel: ?novo=1 abre o cadastro direto
    if (this.route.snapshot.queryParamMap.get('novo') && this.podeEscrever()) {
      this.abrirCadastro();
    }
  }

  // carrega a pagina pedida com os filtros aplicados
  carregar(numeroPagina = 0): void {
    this.cargaSub?.unsubscribe();
    this.carregando.set(true);
    this.erro.set(null);

    const parametros = { page: numeroPagina, size: TAMANHO_PAGINA, sort: 'nome,asc' };
    this.cargaSub = this.service.listar(parametros, this.filtroAplicado())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pagina => {
          this.pagina.set(pagina);
          this.carregando.set(false);
        },
        error: (err: unknown) => {
          this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os passageiros.'));
          this.carregando.set(false);
        },
      });
  }

  buscar(): void {
    this.filtroAplicado.set({
      nome: this.buscaNome().trim() || undefined,
      nacionalidade: this.buscaNacionalidade().trim() || undefined,
    });
    this.carregar();
  }

  limparBusca(): void {
    this.buscaNome.set('');
    this.buscaNacionalidade.set('');
    this.filtroAplicado.set({});
    this.carregar();
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.form.reset({ nome: '', tipoDocumento: 'CPF', documento: '', nacionalidade: 'Brasileira' }, { emitEvent: false });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(passageiro: Passageiro): void {
    // tipo cadastrado fora da lista sugerida continua aparecendo no select
    if (!this.tiposDocumento().includes(passageiro.tipoDocumento)) {
      this.tiposDocumento.update(lista => [...lista, passageiro.tipoDocumento]);
    }
    this.editando.set(passageiro);
    // emitEvent false: a troca de tipo abaixo e so pra quando o usuario muda o select
    this.form.reset({
      nome: passageiro.nome,
      tipoDocumento: passageiro.tipoDocumento,
      documento: passageiro.tipoDocumento === 'CPF' ? formatarCpf(passageiro.documento) : passageiro.documento,
      nacionalidade: passageiro.nacionalidade ?? '',
    }, { emitEvent: false });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    if (!this.salvando()) {
      this.modalAberto.set(false);
    }
  }

  // mascara so se aplica quando o tipo e cpf; outros documentos ficam como digitados
  aplicarMascaraDocumento(valorDigitado: string): void {
    if (this.form.controls.tipoDocumento.value !== 'CPF') {
      return;
    }
    this.form.controls.documento.setValue(formatarCpf(valorDigitado), { emitEvent: false });
  }

  // trocou o tipo depois de digitar: virou CPF -> aplica a mascara (se nao tiver letras);
  // deixou de ser CPF -> tira a mascara de cpf que ficou. nos dois casos revalida o numero
  private ajustarDocumentoAoTipo(tipo: string): void {
    const documento = this.form.controls.documento;
    const atual = documento.value;
    if (tipo === 'CPF' && !/[A-Za-z]/.test(atual)) {
      documento.setValue(formatarCpf(atual), { emitEvent: false });
    } else if (tipo !== 'CPF' && /^\d{3}\.\d{1,3}(\.\d{1,3}(-\d{1,2})?)?$/.test(atual)) {
      documento.setValue(atual.replace(/[.-]/g, ''), { emitEvent: false });
    }
    documento.updateValueAndValidity({ emitEvent: false });
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
    const valores = this.form.getRawValue();
    const dados: PassageiroRequest = {
      nome: valores.nome.trim(),
      tipoDocumento: valores.tipoDocumento,
      documento: valores.documento.trim(),
      nacionalidade: textoOuNulo(valores.nacionalidade),
      // RNF008: com a versao carregada, se outra pessoa salvou antes o backend responde 409
      versao: editando?.versao,
    };

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.notificacao.sucesso(editando ? 'Passageiro atualizado.' : 'Passageiro cadastrado.');
        this.carregar(editando ? this.pagina()?.pagina ?? 0 : 0);
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar o passageiro.'));
        // 409: a lista recarrega pra a proxima edicao ja partir dos dados novos
        if (statusDoErro(err) === 409) {
          this.carregar(this.pagina()?.pagina ?? 0);
        }
      },
    });
  }

  // ----- exclusao -----

  confirmarExclusao(): void {
    const passageiro = this.paraExcluir();
    if (!passageiro) {
      return;
    }

    this.excluindo.set(true);

    this.service.excluir(passageiro.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.excluindo.set(false);
          this.paraExcluir.set(null);
          this.notificacao.sucesso('Passageiro excluído.');
          this.carregar(paginaAposExclusao(this.pagina()));
        },
        error: (err: unknown) => {
          this.excluindo.set(false);
          this.paraExcluir.set(null);
          this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o passageiro.'));
        },
      });
  }
}
