import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

export type TipoNotificacao = 'sucesso' | 'erro' | 'info';

// ---------------------------------------------------------------
// avisos rapidos (toasts) no canto da tela, via sweetalert2
// ---------------------------------------------------------------
// usado depois de salvar/excluir, pra confirmar a acao sem obrigar o usuario a ler um alerta fixo.
// erro de formulario continua aparecendo dentro do proprio formulario (perto do campo).
// as telas so chamam notificacao.sucesso('...') / .erro('...') / .info('...'), sem saber
// que por baixo e o sweetalert2 quem desenha — se um dia a gente trocar de lib, so mexe aqui.
const toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  didOpen: alerta => {
    alerta.addEventListener('mouseenter', Swal.stopTimer);
    alerta.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

const ICONE_POR_TIPO: Record<TipoNotificacao, 'success' | 'error' | 'info'> = {
  sucesso: 'success',
  erro: 'error',
  info: 'info',
};

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  sucesso(mensagem: string): void {
    this.exibir('sucesso', mensagem);
  }

  erro(mensagem: string): void {
    this.exibir('erro', mensagem);
  }

  info(mensagem: string): void {
    this.exibir('info', mensagem);
  }

  private exibir(tipo: TipoNotificacao, mensagem: string): void {
    toast.fire({ icon: ICONE_POR_TIPO[tipo], title: mensagem });
  }
}
