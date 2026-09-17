import { Component, computed, input } from '@angular/core';

// linhas "fantasma" enquanto a listagem carrega (no lugar do texto "carregando...")
// larguras variam de proposito pra parecer dado de verdade chegando, nao uma grade uniforme
@Component({
  selector: 'app-tabela-skeleton',
  standalone: true,
  template: `
    <div class="divide-y divide-border">
      @for (linha of linhasArray(); track linha) {
        <div class="flex items-center gap-6 px-5 py-3.5">
          @for (coluna of colunasArray(); track coluna) {
            <div
              class="h-3.5 flex-1 rounded bg-muted animate-pulsar"
              [style.max-width]="larguraMaxima(linha, coluna)"
            ></div>
          }
        </div>
      }
    </div>
  `,
})
export class TabelaSkeletonComponent {
  linhas = input(6);
  colunas = input(5);

  linhasArray = computed(() => Array.from({ length: this.linhas() }, (_, i) => i));
  colunasArray = computed(() => Array.from({ length: this.colunas() }, (_, i) => i));

  larguraMaxima(linha: number, coluna: number): string {
    return coluna === 0 ? '5rem' : `${8 + ((linha + coluna) % 3) * 3}rem`;
  }
}
