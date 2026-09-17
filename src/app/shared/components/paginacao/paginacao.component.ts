import { Component, computed, input, output } from '@angular/core';
import { Pagina } from '../../../core/models/api.model';
import { IconeComponent } from '../icone/icone.component';

// ---------------------------------------------------------------
// rodape de paginacao das listagens
// ---------------------------------------------------------------
// recebe o envelope Pagina<T> que veio da api e avisa a tela qual pagina carregar.
// a tela continua dona da chamada http; este componente so desenha e emite o numero.
//
// uso:
// <app-paginacao [pagina]="pagina()" (mudarPagina)="carregar($event)" />
@Component({
  selector: 'app-paginacao',
  standalone: true,
  imports: [IconeComponent],
  template: `
    @if (pagina(); as p) {
      @if (p.totalPaginas > 1) {
        <div class="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span class="ajt-dado">{{ inicio() }}–{{ fim() }} de {{ p.totalElementos }}</span>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="ajt-botao-icone"
              aria-label="Página anterior"
              [disabled]="p.primeira"
              (click)="mudarPagina.emit(p.pagina - 1)"
            >
              <app-icone nome="seta-esquerda" class="size-4" />
            </button>

            <span class="ajt-dado px-2 text-foreground">{{ p.pagina + 1 }} / {{ p.totalPaginas }}</span>

            <button
              type="button"
              class="ajt-botao-icone"
              aria-label="Próxima página"
              [disabled]="p.ultima"
              (click)="mudarPagina.emit(p.pagina + 1)"
            >
              <app-icone nome="seta-direita" class="size-4" />
            </button>
          </div>
        </div>
      }
    }
  `,
})
export class PaginacaoComponent {
  pagina = input<Pagina<unknown> | null>(null);

  // numero da pagina (comecando em 0) que a tela deve carregar
  mudarPagina = output<number>();

  // "21–40 de 57": calcula a faixa a partir do tamanho da pagina, nao do conteudo
  inicio = computed(() => {
    const p = this.pagina();
    return p && p.totalElementos ? p.pagina * p.tamanho + 1 : 0;
  });

  fim = computed(() => {
    const p = this.pagina();
    return p ? p.pagina * p.tamanho + p.conteudo.length : 0;
  });
}
