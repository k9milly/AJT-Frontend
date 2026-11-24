import { ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, input, output, viewChild } from '@angular/core';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { IconeComponent } from '../icone/icone.component';

const SELETOR_FOCAVEIS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (aberto()) {
      <div
        class="ajt-app fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-aparecer"
        (click)="solicitarCancelamento()"
      >
        <div
          #dialogo
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="titulo()"
          tabindex="-1"
          class="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl outline-none animate-surgir"
          (click)="$event.stopPropagation()"
          (keydown.tab)="prenderFoco($event)"
        >
          <div class="mb-4 flex size-10 items-center justify-center rounded-full bg-status-danger-bg text-status-danger">
            <app-icone nome="alerta" class="size-5" />
          </div>

          <h2 class="mb-1 text-base font-semibold text-foreground">{{ titulo() }}</h2>
          <p class="mb-5 text-sm text-muted-foreground">{{ mensagem() }}</p>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              mdbRipple
              rippleColor="dark"
              class="ajt-botao-secundario"
              [disabled]="processando()"
              (click)="solicitarCancelamento()"
            >
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

  // desabilita os botoes e o fechamento enquanto a chamada a api nao responde (evita clique duplo ou fechar no meio)
  processando = input(false);

  confirmar = output<void>();
  cancelar = output<void>();

  private dialogo = viewChild<ElementRef<HTMLElement>>('dialogo');
  private focoAnterior: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.aberto()) {
        this.focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        queueMicrotask(() => {
          const el = this.dialogo()?.nativeElement;
          const primeiroBotao = el?.querySelector<HTMLElement>(SELETOR_FOCAVEIS);
          (primeiroBotao ?? el)?.focus();
        });
      } else if (this.focoAnterior) {
        const anterior = this.focoAnterior;
        this.focoAnterior = null;
        queueMicrotask(() => anterior.focus());
      }
    });
  }

  solicitarCancelamento(): void {
    if (!this.processando()) {
      this.cancelar.emit();
    }
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.aberto() && !this.processando()) {
      this.cancelar.emit();
    }
  }

  prenderFoco(evento: Event): void {
    const teclado = evento as KeyboardEvent;
    const container = this.dialogo()?.nativeElement;
    if (!container) {
      return;
    }
    const focaveis = Array.from(container.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS));
    if (!focaveis.length) {
      teclado.preventDefault();
      return;
    }
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (teclado.shiftKey && document.activeElement === primeiro) {
      teclado.preventDefault();
      ultimo.focus();
    } else if (!teclado.shiftKey && document.activeElement === ultimo) {
      teclado.preventDefault();
      primeiro.focus();
    }
  }
}
