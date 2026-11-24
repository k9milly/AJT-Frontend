import { ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, input, output, viewChild } from '@angular/core';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { IconeComponent } from '../icone/icone.component';

const SELETOR_FOCAVEIS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ---------------------------------------------------------------
// janela modal (formularios de cadastro/edicao)
// ---------------------------------------------------------------
// mesmo comportamento do modal do autonomousapi:
// - no celular abre como folha subindo do rodape; no desktop, cartao centralizado
// - fecha no x, clicando fora ou apertando esc (exceto enquanto salva)
//
// uso:
// <app-modal [aberto]="modalAberto()" [bloqueado]="salvando()" titulo="Novo motorista" (fechar)="fecharModal()">
//   ...conteudo...
// </app-modal>
@Component({
    selector: 'app-modal',
    imports: [IconeComponent, MdbRippleModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (aberto()) {
      <div
        class="ajt-app fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-aparecer sm:items-center sm:p-4"
        (click)="solicitarFechamento()"
      >
        <div
          #dialogo
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="titulo()"
          tabindex="-1"
          [class]="'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl outline-none '
                   + 'animate-surgir sm:rounded-lg ' + (largura() === 'larga' ? 'sm:max-w-2xl' : 'sm:max-w-md')"
          (click)="$event.stopPropagation()"
          (keydown.tab)="prenderFoco($event)"
        >
          <div class="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 class="text-sm font-semibold text-foreground">{{ titulo() }}</h3>
            <button
              type="button"
              mdbRipple
              rippleColor="dark"
              [rippleRadius]="20"
              class="ajt-botao-icone -mr-2"
              aria-label="Fechar"
              [disabled]="bloqueado()"
              (click)="solicitarFechamento()"
            >
              <app-icone nome="fechar" class="size-4" />
            </button>
          </div>

          <div class="overflow-y-auto p-5">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  aberto = input(false);
  titulo = input('');
  bloqueado = input(false);

  // "larga" pra formularios com muitos campos (transfer, parada)
  largura = input<'normal' | 'larga'>('normal');

  fechar = output<void>();

  private dialogo = viewChild<ElementRef<HTMLElement>>('dialogo');
  private focoAnterior: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.aberto()) {
        this.focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        queueMicrotask(() => {
          const el = this.dialogo()?.nativeElement;
          const primeiroCampo = el?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
            ?? el?.querySelector<HTMLElement>(SELETOR_FOCAVEIS);
          (primeiroCampo ?? el)?.focus();
        });
      } else if (this.focoAnterior) {
        const anterior = this.focoAnterior;
        this.focoAnterior = null;
        queueMicrotask(() => anterior.focus());
      }
    });
  }

  solicitarFechamento(): void {
    if (!this.bloqueado()) {
      this.fechar.emit();
    }
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.aberto() && !this.bloqueado()) {
      this.fechar.emit();
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
