import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro, statusDoErro } from '../../core/http/erro-api';
import { Pagina } from '../../core/models/api.model';
import { FiltroMotorista, Motorista, MotoristaRequest } from '../../core/models/motorista.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { MotoristaService } from './motorista.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import { formatarTelefone, iniciais, textoOuNulo } from '../../shared/utils/rotulos';

const TAMANHO_PAGINA = 20;

// ---------------------------------------------------------------
// tela de motoristas: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
@Component({
    selector: 'app-motoristas',
    imports: [
        ReactiveFormsModule,
        ConfirmDialogComponent,
        IconeComponent,
        ModalComponent,
        PaginacaoComponent,
        TabelaSkeletonComponent,
    ],
    templateUrl: './motoristas.component.html'
})
export class MotoristasComponent implements OnInit {
  private service = inject(MotoristaService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  iniciais = iniciais;
  formatarTelefone = formatarTelefone;

  // ----- listagem -----
  pagina = signal<Pagina<Motorista> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  // filtros por nome e cnh (RF015, parte do texto); o aplicado fica separado do digitado
  buscaNome = signal('');
  buscaCnh = signal('');
  filtroAplicado = signal<FiltroMotorista>({});
  filtroAtivo = computed(() => !!(this.filtroAplicado().nome || this.filtroAplicado().cnh));

  podeEscrever = computed(() => this.auth.podeEscrever('motoristas'));
  podeExcluir = computed(() => this.auth.podeExcluir('motoristas'));

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<Motorista | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // tamanhos iguais aos do MotoristaRequestDTO do backend
  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    cnh: ['', [Validators.required, Validators.maxLength(20)]],
    telefone: ['', Validators.maxLength(20)],
  });

  // ----- exclusao -----
  paraExcluir = signal<Motorista | null>(null);
  excluindo = signal(false);

  ngOnInit(): void {
    this.carregar();

    // atalho do painel: ?novo=1 abre o cadastro direto
    if (this.route.snapshot.queryParamMap.get('novo') && this.podeEscrever()) {
      this.abrirCadastro();
    }
  }

  carregar(numeroPagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);

    const parametros = { page: numeroPagina, size: TAMANHO_PAGINA, sort: 'nome,asc' };
    this.service.listar(parametros, this.filtroAplicado()).subscribe({
      next: pagina => {
        this.pagina.set(pagina);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os motoristas.'));
        this.carregando.set(false);
      },
    });
  }

  buscar(): void {
    this.filtroAplicado.set({
      nome: this.buscaNome().trim() || undefined,
      cnh: this.buscaCnh().trim() || undefined,
    });
    this.carregar();
  }

  limparBusca(): void {
    this.buscaNome.set('');
    this.buscaCnh.set('');
    this.filtroAplicado.set({});
    this.carregar();
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.form.reset({ nome: '', cnh: '', telefone: '' });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(motorista: Motorista): void {
    this.editando.set(motorista);
    this.form.reset({
      nome: motorista.nome,
      cnh: motorista.cnh,
      telefone: motorista.telefone ?? '',
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
    const dados: MotoristaRequest = {
      nome: valores.nome.trim(),
      cnh: valores.cnh.trim(),
      telefone: textoOuNulo(valores.telefone),
      // posicao atual nao e editada no painel, mas o PUT sobrescreve: reenvia o que ja existia
      latitudeAtual: editando?.latitudeAtual ?? null,
      longitudeAtual: editando?.longitudeAtual ?? null,
      // RNF008: com a versao carregada, se outra pessoa salvou antes o backend responde 409
      versao: editando?.versao,
    };

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.notificacao.sucesso(editando ? 'Motorista atualizado.' : 'Motorista cadastrado.');
        this.carregar(editando ? this.pagina()?.pagina ?? 0 : 0);
      },
      error: (err: unknown) => {
        // cnh duplicada ou campo invalido: a mensagem do backend ja explica
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar o motorista.'));
        // 409: a lista recarrega pra a proxima edicao ja partir dos dados novos
        if (statusDoErro(err) === 409) {
          this.carregar(this.pagina()?.pagina ?? 0);
        }
      },
    });
  }

  // ----- exclusao -----

  confirmarExclusao(): void {
    const motorista = this.paraExcluir();
    if (!motorista) {
      return;
    }

    this.excluindo.set(true);

    this.service.excluir(motorista.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.sucesso('Motorista excluído.');
        this.recarregarAposExclusao();
      },
      error: (err: unknown) => {
        // 409 = motorista vinculado a uma ordem de servico
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o motorista.'));
      },
    });
  }

  // se o item excluido era o ultimo da pagina, volta uma pagina pra nao mostrar tabela vazia
  private recarregarAposExclusao(): void {
    const atual = this.pagina();
    if (!atual) {
      this.carregar();
      return;
    }
    const voltarUma = atual.conteudo.length === 1 && atual.pagina > 0;
    this.carregar(voltarUma ? atual.pagina - 1 : atual.pagina);
  }
}
