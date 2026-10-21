import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro, statusDoErro } from '../../core/http/erro-api';
import { Pagina, TAMANHO_MAXIMO_PAGINA } from '../../core/models/api.model';
import { PERFIS, Perfil } from '../../core/models/auth.model';
import { Motorista } from '../../core/models/motorista.model';
import { Usuario, UsuarioRequest } from '../../core/models/usuario.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { UsuarioService } from './usuario.service';
import { MotoristaService } from '../motoristas/motorista.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { StatusBadgeComponent, TomStatus } from '../../shared/components/status-badge/status-badge.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import { ROTULO_PERFIL, formatarData, formatarHora, iniciais } from '../../shared/utils/rotulos';

const TAMANHO_PAGINA = 20;

// mesmo padrao de username aceito pelo backend (UsuarioRequestDTO)
const PADRAO_USERNAME = /^[a-zA-Z0-9._-]{3,50}$/;

// o que cada perfil pode fazer, mostrado no formulario pra ajudar o admin a escolher
const DESCRICAO_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Acesso total, inclusive gestão de usuários.',
  GERENTE: 'Opera tudo e gerencia frota e ordens de serviço.',
  ATENDENTE: 'Cadastra passageiros, transfers e pontos de coleta.',
  MOTORISTA: 'Vê só as ordens de serviço do motorista ligado a ele e atualiza o status das paradas.',
};

// ---------------------------------------------------------------
// tela de usuarios (somente ADMIN): listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// regras do backend que aparecem na tela:
// - usuario criado nasce com troca de senha obrigatoria no primeiro acesso
// - na edicao, senha em branco mantem a atual; preenchida redefine (e obriga nova troca)
// - desativar o usuario derruba a sessao dele na proxima chamada a api
@Component({
    selector: 'app-usuarios',
    imports: [
        ReactiveFormsModule,
        ConfirmDialogComponent,
        IconeComponent,
        ModalComponent,
        PaginacaoComponent,
        StatusBadgeComponent,
        TabelaSkeletonComponent,
    ],
    templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  private service = inject(UsuarioService);
  private motoristaService = inject(MotoristaService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private fb = inject(FormBuilder);

  perfis = PERFIS;
  rotuloPerfil = ROTULO_PERFIL;
  descricaoPerfil = DESCRICAO_PERFIL;
  iniciais = iniciais;

  // ----- listagem -----
  pagina = signal<Pagina<Usuario> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<Usuario | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // senha: obrigatoria so no cadastro (o validador e trocado ao abrir o modal)
  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    username: ['', [Validators.required, Validators.pattern(PADRAO_USERNAME)]],
    senha: [''],
    role: ['ATENDENTE' as Perfil, Validators.required],
    ativo: [true],
    // HU07: cadastro de motorista ligado (so aparece e so vale pro perfil MOTORISTA)
    motoristaId: this.fb.control<number | null>(null),
  });

  // opcoes do select de motorista (os 100 primeiros por nome, limite de pagina do backend)
  motoristas = signal<Motorista[]>([]);

  // nome do motorista ligado, pra mostrar na tabela
  nomeMotorista(id: number | null): string | null {
    return id ? this.motoristas().find(m => m.id === id)?.nome ?? `Motorista #${id}` : null;
  }

  perfilSelecionado = signal<Perfil>('ATENDENTE');

  // ----- exclusao -----
  paraExcluir = signal<Usuario | null>(null);
  excluindo = signal(false);

  // o admin nao pode excluir nem desativar a propria conta pela tela (evita se trancar pra fora)
  usernameLogado = computed(() => this.auth.sessao()?.username ?? '');

  ngOnInit(): void {
    this.carregar();
    this.carregarMotoristas();
    this.form.controls.role.valueChanges.subscribe(perfil => this.perfilSelecionado.set(perfil));
  }

  carregar(numeroPagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.listar({ page: numeroPagina, size: TAMANHO_PAGINA, sort: 'nome,asc' }).subscribe({
      next: pagina => {
        this.pagina.set(pagina);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os usuários.'));
        this.carregando.set(false);
      },
    });
  }

  // "Ativo" / "Inativo" / "Troca de senha pendente"
  situacao(usuario: Usuario): { tom: TomStatus; rotulo: string } {
    if (!usuario.ativo) {
      return { tom: 'neutral', rotulo: 'Inativo' };
    }
    if (usuario.trocarSenha) {
      return { tom: 'warning', rotulo: 'Troca de senha pendente' };
    }
    return { tom: 'success', rotulo: 'Ativo' };
  }

  // "17/09/2026 14:30" (a api manda "2026-09-17T14:30:00")
  formatarDataHora(valor: string | null): string {
    if (!valor) {
      return 'Nunca acessou';
    }
    return `${formatarData(valor)} ${formatarHora(valor.slice(11))}`;
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.configurarSenha(true);
    this.form.reset({ nome: '', username: '', senha: '', role: 'ATENDENTE', ativo: true, motoristaId: null });
    this.form.controls.ativo.enable();
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(usuario: Usuario): void {
    this.editando.set(usuario);
    this.configurarSenha(false);
    this.form.reset({
      nome: usuario.nome,
      username: usuario.username,
      senha: '',
      role: usuario.role,
      ativo: usuario.ativo,
      motoristaId: usuario.motoristaId,
    });
    // a propria conta nao pode ser desativada pela tela
    if (usuario.username === this.usernameLogado()) {
      this.form.controls.ativo.disable();
    } else {
      this.form.controls.ativo.enable();
    }
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
    const dados: UsuarioRequest = {
      nome: valores.nome.trim(),
      username: valores.username.trim(),
      senha: valores.senha ? valores.senha : null,
      role: valores.role,
      ativo: valores.ativo,
      // so motorista tem vinculo; trocar o perfil pra outro desfaz (o backend faz o mesmo)
      motoristaId: valores.role === 'MOTORISTA' ? valores.motoristaId : null,
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
        this.notificacao.sucesso(
          editando ? 'Usuário atualizado.' : 'Usuário criado. A senha deverá ser trocada no primeiro acesso.',
        );
        this.carregar(editando ? this.pagina()?.pagina ?? 0 : 0);
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar o usuário.'));
        // 409: a lista recarrega pra a proxima edicao ja partir dos dados novos
        if (statusDoErro(err) === 409) {
          this.carregar(this.pagina()?.pagina ?? 0);
        }
      },
    });
  }

  // ----- exclusao -----

  confirmarExclusao(): void {
    const usuario = this.paraExcluir();
    if (!usuario) {
      return;
    }

    this.excluindo.set(true);

    this.service.excluir(usuario.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.sucesso('Usuário excluído.');
        const atual = this.pagina();
        const voltarUma = !!atual && atual.conteudo.length === 1 && atual.pagina > 0;
        this.carregar(atual ? (voltarUma ? atual.pagina - 1 : atual.pagina) : 0);
      },
      error: (err: unknown) => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o usuário.'));
      },
    });
  }

  // no cadastro a senha e obrigatoria; na edicao e opcional, mas se vier precisa ter 8 a 72 caracteres
  private configurarSenha(obrigatoria: boolean): void {
    const senha = this.form.controls.senha;
    senha.setValidators(
      obrigatoria
        ? [Validators.required, Validators.minLength(8), Validators.maxLength(72)]
        : [Validators.minLength(8), Validators.maxLength(72)],
    );
    senha.updateValueAndValidity();
  }

  private carregarMotoristas(): void {
    this.motoristaService.listar({ page: 0, size: TAMANHO_MAXIMO_PAGINA, sort: 'nome,asc' }).subscribe({
      next: pagina => this.motoristas.set(pagina.conteudo),
      error: () => this.motoristas.set([]),
    });
  }
}
