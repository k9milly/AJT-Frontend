import { Component, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  aberto = input(false);
  titulo = input('Confirmar ação');
  mensagem = input('Tem certeza que deseja continuar?');
  textoConfirmar = input('Confirmar');

  confirmar = output<void>();
  cancelar = output<void>();

  /**
   * O dialog só entra no DOM depois de ser aberto pela primeira vez.
   * Antes disso não existe nada pra "piscar" na tela.
   */
  foiAbertoAlgumaVez = signal(false);

  constructor() {
    effect(
      () => {
        if (this.aberto()) {
          this.foiAbertoAlgumaVez.set(true);
        }
      },
      { allowSignalWrites: true },
    );
  }
}
