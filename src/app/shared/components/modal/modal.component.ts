import { Component, HostListener, input, output } from '@angular/core';
import { IconeComponent } from '../icone/icone.component';

// ---------------------------------------------------------------
// janela modal (formularios de cadastro/edicao)
// ---------------------------------------------------------------
// mesmo comportamento do modal do autonomousapi:
// - no celular abre como folha subindo do rodape; no desktop, cartao centralizado
// - fecha no x, clicando fora ou apertando esc
//
// uso:
// <app-modal [aberto]="modalAberto()" titulo="Novo motorista" (fechar)="fecharModal()">
//   ...conteudo...
// </app-modal>
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconeComponent],
  template: `
    @if (aberto()) {
      <div
        class="ajt-app fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-aparecer sm:items-center sm:p-4"
        (click)="fechar.emit()"
      >
        <div
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="titulo()"
          [class]="'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl '
                   + 'animate-surgir sm:rounded-lg ' + (largura() === 'larga' ? 'sm:max-w-2xl' : 'sm:max-w-md')"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 class="text-sm font-semibold text-foreground">{{ titulo() }}</h3>
            <button type="button" class="ajt-botao-icone -mr-2" aria-label="Fechar" (click)="fechar.emit()">
              <app-icone nome="fechar" class="size-4" />
            </button>
          </div>

          <div class="overflow-y-auto p-5">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  aberto = input(false);
  titulo = input('');

  // "larga" pra formularios com muitos campos (transfer, parada)
  largura = input<'normal' | 'larga'>('normal');

  fechar = output<void>();

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.aberto()) {
      this.fechar.emit();
    }
  }
}
