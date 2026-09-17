import { Component, inject } from '@angular/core';
import { NotificacaoService, TipoNotificacao } from '../../../core/services/notificacao.service';
import { IconeComponent, NomeIcone } from '../icone/icone.component';

const ICONE_POR_TIPO: Record<TipoNotificacao, NomeIcone> = {
  sucesso: 'check-circulo',
  erro: 'alerta',
  info: 'info',
};

const COR_POR_TIPO: Record<TipoNotificacao, string> = {
  sucesso: 'text-status-success',
  erro: 'text-status-danger',
  info: 'text-status-info',
};

// desenha os avisos do NotificacaoService no canto inferior direito
// fica uma unica vez no shell; as telas so chamam notificacao.sucesso('...')
@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [IconeComponent],
  template: `
    <div class="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      @for (notificacao of servico.notificacoes(); track notificacao.id) {
        <div
          role="status"
          class="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg animate-surgir"
        >
          <app-icone [nome]="icone[notificacao.tipo]" [class]="'mt-0.5 size-4 ' + cor[notificacao.tipo]" />
          <p class="flex-1 text-sm text-foreground">{{ notificacao.mensagem }}</p>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground"
            aria-label="Fechar aviso"
            (click)="servico.remover(notificacao.id)"
          >
            <app-icone nome="fechar" class="size-4" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  servico = inject(NotificacaoService);

  icone = ICONE_POR_TIPO;
  cor = COR_POR_TIPO;
}
