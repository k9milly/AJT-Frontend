import { Component, computed, input } from '@angular/core';

export type TomStatus = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

// classes de cor por tom (tokens definidos em styles.css)
const CLASSE_TOM: Record<TomStatus, string> = {
  info: 'bg-status-info-bg text-status-info',
  warning: 'bg-status-warning-bg text-status-warning',
  success: 'bg-status-success-bg text-status-success',
  danger: 'bg-status-danger-bg text-status-danger',
  neutral: 'bg-status-neutral-bg text-status-neutral',
};

const CLASSE_PONTO: Record<TomStatus, string> = {
  info: 'bg-status-info',
  warning: 'bg-status-warning',
  success: 'bg-status-success',
  danger: 'bg-status-danger',
  neutral: 'bg-status-neutral',
};

// etiqueta de status com bolinha colorida (mesmo desenho do autonomousapi)
// o tom de cada status vem de shared/utils/rotulos.ts (tomDoStatus), pra ser igual em todas as telas
//
// uso: <app-status-badge [tom]="tomDoStatus(transfer.status)" [rotulo]="rotuloStatus[transfer.status]" />
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ' + classeTom()">
      <span [class]="'size-1.5 rounded-full ' + classePonto()"></span>
      {{ rotulo() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  tom = input<TomStatus>('neutral');
  rotulo = input('');

  classeTom = computed(() => CLASSE_TOM[this.tom()]);
  classePonto = computed(() => CLASSE_PONTO[this.tom()]);
}
