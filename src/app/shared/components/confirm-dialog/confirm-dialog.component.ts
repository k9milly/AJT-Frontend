import { Component, input, output } from '@angular/core';

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
}
