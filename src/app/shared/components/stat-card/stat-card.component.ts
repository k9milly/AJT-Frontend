import { Component, computed, input } from '@angular/core';
import { IconeComponent, NomeIcone } from '../icone/icone.component';

export type TomCard = 'default' | 'success' | 'warning' | 'danger';

const CLASSE_BARRA: Record<TomCard, string> = {
  default: 'bg-primary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
};

const CLASSE_ICONE: Record<TomCard, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  danger: 'bg-status-danger-bg text-status-danger',
};

// cartao de indicador (kpi) do painel: faixa colorida no topo, numero grande e icone
// "valor" nulo mostra um placeholder pulsando enquanto a api nao respondeu
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [IconeComponent],
  template: `
    <div class="ajt-card overflow-hidden hover:shadow-md">
      <div [class]="'h-1 ' + classeBarra()"></div>
      <div class="flex items-start justify-between gap-3 p-4">
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground">{{ rotulo() }}</p>

          @if (valor() === null) {
            <div class="mt-2 h-7 w-16 rounded bg-muted animate-pulsar"></div>
          } @else {
            <p class="ajt-dado mt-1 text-2xl font-bold text-foreground">{{ valor() }}</p>
          }

          @if (dica()) {
            <p class="mt-1 text-[11px] text-muted-foreground">{{ dica() }}</p>
          }
        </div>

        @if (icone(); as nomeIcone) {
          <div [class]="'flex size-9 shrink-0 items-center justify-center rounded-full ' + classeIcone()">
            <app-icone [nome]="nomeIcone" class="size-[18px]" />
          </div>
        }
      </div>
    </div>
  `,
})
export class StatCardComponent {
  rotulo = input('');
  valor = input<string | number | null>(null);
  dica = input<string | null>(null);
  tom = input<TomCard>('default');
  icone = input<NomeIcone | null>(null);

  classeBarra = computed(() => CLASSE_BARRA[this.tom()]);
  classeIcone = computed(() => CLASSE_ICONE[this.tom()]);
}
