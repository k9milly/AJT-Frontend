import { Component, HostListener, input, output } from '@angular/core';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { IconeComponent } from '../icone/icone.component';

// ---------------------------------------------------------------
// confirmacao de acao destrutiva (excluir)
// ---------------------------------------------------------------
// uso:
// <app-confirm-dialog
//   [aberto]="itemParaExcluir() !== null"
//   titulo="Excluir motorista"
//   mensagem="Essa ação não pode ser desfeita."
//   (cancelar)="..." (confirmar)="..." />
@Component({
    selector: 'app-confirm-dialog',
    imports: [IconeComponent, MdbRippleModule],
    template: `
    @if (aberto()) {
      <div
        class="ajt-app fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-aparecer"
        (click)="cancelar.emit()"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          class="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl animate-surgir"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4 flex size-10 items-center justify-center rounded-full bg-status-danger-bg text-status-danger">
            <app-icone nome="alerta" class="size-5" />
          </div>

          <h2 class="mb-1 text-base font-semibold text-foreground">{{ titulo() }}</h2>
          <p class="mb-5 text-sm text-muted-foreground">{{ mensagem() }}</p>

          <div class="flex justify-end gap-2">
            <button type="button" mdbRipple rippleColor="dark" class="ajt-botao-secundario" (click)="cancelar.emit()">
              Cancelar
            </button>
            <button
              type="button"
              mdbRipple
              rippleColor="light"
              class="ajt-botao-perigo"
              [disabled]="processando()"
              (click)="confirmar.emit()"
            >
              {{ processando() ? 'Aguarde...' : textoConfirmar() }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  aberto = input(false);
  titulo = input('Confirmar ação');
  mensagem = input('Tem certeza que deseja continuar?');
  textoConfirmar = input('Confirmar');

  // desabilita o botao enquanto a chamada a api nao responde (evita clique duplo)
  processando = input(false);

  confirmar = output<void>();
  cancelar = output<void>();

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.aberto()) {
      this.cancelar.emit();
    }
  }
}
