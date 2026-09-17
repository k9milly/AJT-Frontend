import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensagemDeErro, statusDoErro } from '../../core/http/erro-api';
import { Pagina, paginaUnica } from '../../core/models/api.model';
import { TIPOS_VEICULO, Veiculo, VeiculoRequest } from '../../core/models/veiculo.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { VeiculoService } from './veiculo.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { TabelaSkeletonComponent } from '../../shared/components/tabela-skeleton/tabela-skeleton.component';
import { textoOuNulo } from '../../shared/utils/rotulos';

const TAMANHO_PAGINA = 20;

// ---------------------------------------------------------------
// tela de veiculos: listagem + cadastro/edicao em modal
// ---------------------------------------------------------------
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
@Component({
    selector: 'app-veiculos',
    imports: [
        ReactiveFormsModule,
        ConfirmDialogComponent,
        IconeComponent,
        ModalComponent,
        PaginacaoComponent,
        TabelaSkeletonComponent,
    ],
    templateUrl: './veiculos.component.html'
})
export class VeiculosComponent implements OnInit {
  private service = inject(VeiculoService);
  private auth = inject(AuthService);
  private notificacao = inject(NotificacaoService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // lista sugerida; se um veiculo tiver tipo fora dela, ele e acrescentado ao abrir a edicao
  tipos = signal<string[]>(TIPOS_VEICULO);

  // ----- listagem -----
  pagina = signal<Pagina<Veiculo> | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  // busca por placa e exata e feita no backend; enquanto ativa, a paginacao some
  termoBusca = signal('');
  buscaAtiva = signal(false);

  podeEscrever = computed(() => this.auth.podeEscrever('veiculos'));
  podeExcluir = computed(() => this.auth.podeExcluir('veiculos'));

  // ----- modal de cadastro/edicao -----
  modalAberto = signal(false);
  editando = signal<Veiculo | null>(null);
  salvando = signal(false);
  erroFormulario = signal<string | null>(null);

  // tamanhos iguais aos do VeiculoRequestDTO do backend
  form = this.fb.group({
    label: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    placa: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(10)]),
    capacidade: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    tipo: this.fb.nonNullable.control('VAN', Validators.maxLength(50)),
    marca: this.fb.nonNullable.control('', Validators.maxLength(50)),
  });

  // ----- exclusao -----
  paraExcluir = signal<Veiculo | null>(null);
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
    this.buscaAtiva.set(false);

    this.service.listar({ page: numeroPagina, size: TAMANHO_PAGINA, sort: 'label,asc' }).subscribe({
      next: pagina => {
        this.pagina.set(pagina);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os veículos.'));
        this.carregando.set(false);
      },
    });
  }

  buscar(): void {
    const placa = this.termoBusca().trim().toUpperCase();
    if (!placa) {
      this.carregar();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);
    this.buscaAtiva.set(true);

    this.service.buscarPorPlaca(placa).subscribe({
      next: veiculo => {
        this.pagina.set(paginaUnica([veiculo]));
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        // 404 na busca so significa "nenhum resultado"
        if (statusDoErro(err) === 404) {
          this.pagina.set(paginaUnica([]));
        } else {
          this.erro.set(mensagemDeErro(err, 'Não foi possível buscar o veículo.'));
        }
        this.carregando.set(false);
      },
    });
  }

  limparBusca(): void {
    this.termoBusca.set('');
    this.carregar();
  }

  // ----- cadastro/edicao -----

  abrirCadastro(): void {
    this.editando.set(null);
    this.form.reset({ label: '', placa: '', capacidade: null, tipo: 'VAN', marca: '' });
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  abrirEdicao(veiculo: Veiculo): void {
    if (veiculo.tipo && !this.tipos().includes(veiculo.tipo)) {
      this.tipos.update(lista => [...lista, veiculo.tipo!]);
    }
    this.editando.set(veiculo);
    this.form.reset({
      label: veiculo.label,
      placa: veiculo.placa,
      capacidade: veiculo.capacidade,
      tipo: veiculo.tipo ?? '',
      marca: veiculo.marca ?? '',
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
    const dados: VeiculoRequest = {
      label: valores.label.trim(),
      placa: valores.placa.trim().toUpperCase(),
      capacidade: Number(valores.capacidade),
      tipo: textoOuNulo(valores.tipo),
      marca: textoOuNulo(valores.marca),
    };

    const request$ = editando
      ? this.service.atualizar(editando.id, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.notificacao.sucesso(editando ? 'Veículo atualizado.' : 'Veículo cadastrado.');
        this.carregar(editando ? this.pagina()?.pagina ?? 0 : 0);
      },
      error: (err: unknown) => {
        // placa duplicada ou campo invalido: a mensagem do backend ja explica
        this.salvando.set(false);
        this.erroFormulario.set(mensagemDeErro(err, 'Não foi possível salvar o veículo.'));
      },
    });
  }

  // ----- exclusao -----

  confirmarExclusao(): void {
    const veiculo = this.paraExcluir();
    if (!veiculo) {
      return;
    }

    this.excluindo.set(true);

    this.service.excluir(veiculo.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.sucesso('Veículo excluído.');
        this.recarregarAposExclusao();
      },
      error: (err: unknown) => {
        // 409 = veiculo vinculado a uma ordem de servico
        this.excluindo.set(false);
        this.paraExcluir.set(null);
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível excluir o veículo.'));
      },
    });
  }

  // se o item excluido era o ultimo da pagina, volta uma pagina pra nao mostrar tabela vazia
  private recarregarAposExclusao(): void {
    const atual = this.pagina();
    if (this.buscaAtiva() || !atual) {
      this.limparBusca();
      return;
    }
    const voltarUma = atual.conteudo.length === 1 && atual.pagina > 0;
    this.carregar(voltarUma ? atual.pagina - 1 : atual.pagina);
  }
}
