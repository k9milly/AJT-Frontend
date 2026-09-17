import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro } from '../../core/http/erro-api';
import { Pagina } from '../../core/models/api.model';
import { Passageiro, PassageiroRequest, TIPOS_DOCUMENTO } from '../../core/models/passageiro.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { PassageiroService } from './passageiro.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import { iniciais, textoOuNulo } from '../../shared/utils/rotulos';

const TAMANHO_PAGINA = 20;

// formata o cpf enquanto digita (000.000.000-00)
// a validacao do digito verificador fica a cargo do backend
export function formatarCpf(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, '').slice(0, 11);

  if (digitos.length > 9) {
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  }
  if (digitos.length > 6) {
    return digitos.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  }
  if (digitos.length > 3) {
    return digitos.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  return digitos;
}

// ---------------------------------------------------------------
// tela de passageiros: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: todos os perfis | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
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
    templateUrl: './passageiros.component.html'
})
export class PassageirosComponent implements OnInit {
  private service = inject(PassageiroService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  iniciais = iniciais;
  tiposDocumento = signal<string[]>(TIPOS_DOCUMENTO);

  // ----- listagem -----
  pagina = signal<Pagina<Passageiro> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  // filtro por nacionalidade (unico filtro que o backend oferece pra passageiros)
  // guardado separado do input pra paginacao usar o filtro aplicado, nao o que esta sendo digitado
  termoBusca = signal('');
  filtroAplicado = signal('');

  podeEscrever = computed(() => this.auth.podeEscrever('passageiros'));
  podeExcluir = computed(() => this.auth.podeExcluir('passageiros'));

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<Passageiro | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // tamanhos iguais aos do PassageiroRequestDTO do backend
  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    tipoDocumento: ['CPF', [Validators.required, Validators.maxLength(20)]],
    documento: ['', [Validators.required, Validators.maxLength(50)]],
    nacionalidade: ['Brasileira', Validators.maxLength(50)],
  });

  // ----- exclusao -----
  paraExcluir = signal<Passageiro | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.carregar();

    // atalho do painel: ?novo=1 abre o cadastro direto
    if (this.route.snapshot.queryParamMap.get('novo') && this.podeEscrever()) {
      this.abrirCadastro();
    }
  }

  // carrega a pagina pedida, com ou sem o filtro de nacionalidade
  carregar(numeroPagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);

    const parametros = { page: numeroPagina, size: TAMANHO_PAGINA, sort: 'nome,asc' };
    const nacionalidade = this.filtroAplicado();

    const request$ = nacionalidade
      ? this.service.buscarPorNacionalidade(nacionalidade, parametros)
      : this.service.listar(parametros);

    request$.subscribe({
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
    this.filtroAplicado.set(this.termoBusca().trim());
    this.carregar();
  }

  limparBusca(): void {
    this.termoBusca.set('');
    this.filtroAplicado.set('');
    this.carregar();
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.form.reset({ nome: '', tipoDocumento: 'CPF', documento: '', nacionalidade: 'Brasileira' });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(passageiro: Passageiro): void {
    // tipo cadastrado fora da lista sugerida continua aparecendo no select
    if (!this.tiposDocumento().includes(passageiro.tipoDocumento)) {
      this.tiposDocumento.update(lista => [...lista, passageiro.tipoDocumento]);
    }
    this.editando.set(passageiro);
    this.form.reset({
      nome: passageiro.nome,
      tipoDocumento: passageiro.tipoDocumento,
      documento: passageiro.documento,
      nacionalidade: passageiro.nacionalidade ?? '',
    });
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

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
    };

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.notificacao.sucesso(editando ? 'Passageiro atualizado.' : 'Passageiro cadastrado.');
        this.carregar(editando ? this.pagina()?.pagina ?? 0 : 0);
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar o passageiro.'));
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

    this.service.excluir(passageiro.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.sucesso('Passageiro excluído.');
        // se era o ultimo item da pagina, volta uma pagina pra nao mostrar tabela vazia
        const atual = this.pagina();
        const voltarUma = !!atual && atual.conteudo.length === 1 && atual.pagina > 0;
        this.carregar(atual ? (voltarUma ? atual.pagina - 1 : atual.pagina) : 0);
      },
      error: (err: unknown) => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o passageiro.'));
      },
    });
  }
}
