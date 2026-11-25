import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { mensagemDeErro } from '../../core/http/erro-api';
import { Pagina } from '../../core/models/api.model';
import { ROTULO_TABELA_AUDITADA, RegistroAuditoria, TabelaAuditada } from '../../core/models/auditoria.model';
import { AuditoriaService } from './auditoria.service';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { PaginacaoComponent } from '../../shared/components/paginacao/paginacao.component';
import { ROTULO_STATUS_OS, ROTULO_STATUS_TRANSFER, formatarDataHora } from '../../shared/utils/rotulos';

// status do backend (AGUARDANDO_OS) -> rotulo da tela (Aguardando OS), pra mensagem ficar legivel
const ROTULOS_STATUS: Record<string, string> = { ...ROTULO_STATUS_OS, ...ROTULO_STATUS_TRANSFER };

interface LinhaHistorico {
  registro: RegistroAuditoria;
  texto: string;
  autor: string | null;
  quando: string;
}

// "Transfer atualizado: status AGUARDANDO_OS -> CONFIRMADO (por maria)"
//   -> texto "Transfer atualizado: status Aguardando OS → Confirmado" | autor "maria"
function montarLinha(registro: RegistroAuditoria): LinhaHistorico {
  const autor = registro.mensagem.match(/\(por ([^)]+)\)\s*$/);
  let texto = autor ? registro.mensagem.slice(0, autor.index).trim() : registro.mensagem;
  texto = texto
    .replace(/\b[A-Z][A-Z_]+\b/g, status => ROTULOS_STATUS[status] ?? status)
    .replace(/ -> /g, ' → ');
  return { registro, texto, autor: autor?.[1] ?? null, quando: formatarDataHora(registro.dataHora) };
}

// ---------------------------------------------------------------
// lista da trilha de auditoria (HU11, RF014)
// ---------------------------------------------------------------
// usada na tela de historico (todos os registros, filtro por tabela) e no modal
// "historico do transfer" (tabela + registroId). recarrega sozinha quando o filtro muda.
@Component({
  selector: 'app-historico-lista',
  imports: [RouterLink, IconeComponent, PaginacaoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (erro()) {
      <div class="ajt-alerta-erro m-4">{{ erro() }}</div>
    } @else if (carregando()) {
      <div class="space-y-3 p-5">
        @for (i of [1, 2, 3]; track i) {
          <div class="h-10 rounded bg-muted animate-pulsar"></div>
        }
      </div>
    } @else {
      <ul class="divide-y divide-border">
        @for (linha of linhas(); track linha.registro.id) {
          <li class="flex gap-3 px-5 py-3">
            <app-icone nome="relogio" class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div class="min-w-0 flex-1">
              <p class="text-[13px] text-foreground">{{ linha.texto }}</p>
              <p class="ajt-dado mt-0.5 text-[11px] text-muted-foreground">
                {{ linha.quando }}
                @if (linha.autor) { · por {{ linha.autor }} }
                @if (mostrarRegistro()) {
                  ·
                  @if (linha.registro.tabelaAfetada === 'ordens_servico') {
                    <a [routerLink]="['/admin/ordens-servico', linha.registro.registroId]" class="text-foreground underline-offset-2 hover:underline">
                      OS #{{ linha.registro.registroId }}
                    </a>
                  } @else {
                    {{ rotuloTabela(linha.registro.tabelaAfetada) }} #{{ linha.registro.registroId }}
                  }
                }
              </p>
            </div>
          </li>
        } @empty {
          <li class="px-5 py-10 text-center text-xs text-muted-foreground">Nenhuma alteração registrada.</li>
        }
      </ul>
      <app-paginacao [pagina]="pagina()" (mudarPagina)="carregar($event)" />
    }
  `,
})
export class HistoricoListaComponent {
  private service = inject(AuditoriaService);
  private destroyRef = inject(DestroyRef);
  private cargaSub?: Subscription;

  tabela = input<TabelaAuditada | null>(null);
  registroId = input<number | null>(null);
  tamanhoPagina = input(20);
  // na tela geral cada linha diz de qual registro e; no historico de um transfer nao precisa
  mostrarRegistro = input(true);

  pagina = signal<Pagina<RegistroAuditoria> | null>(null);
  linhas = signal<LinhaHistorico[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);

  constructor() {
    // filtro mudou -> volta pra primeira pagina (cancelando requisicao anterior em voo)
    effect(() => {
      this.tabela();
      this.registroId();
      untracked(() => this.carregar(0));
    });
  }

  carregar(numeroPagina: number): void {
    this.cargaSub?.unsubscribe();
    this.carregando.set(true);
    this.erro.set(null);
    this.cargaSub = this.service
      .listar({ tabela: this.tabela(), registroId: this.registroId() }, { page: numeroPagina, size: this.tamanhoPagina() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: pagina => {
          this.pagina.set(pagina);
          this.linhas.set(pagina.conteudo.map(montarLinha));
          this.carregando.set(false);
        },
        error: (err: unknown) => {
          this.erro.set(mensagemDeErro(err, 'Não foi possível carregar o histórico.'));
          this.carregando.set(false);
        },
      });
  }

  rotuloTabela(tabela: string): string {
    return ROTULO_TABELA_AUDITADA[tabela as TabelaAuditada] ?? tabela;
  }
}
