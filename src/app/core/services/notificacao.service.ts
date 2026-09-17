import { Injectable, signal } from '@angular/core';

export type TipoNotificacao = 'sucesso' | 'erro' | 'info';

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  mensagem: string;
}

// tempo que cada aviso fica na tela antes de sumir sozinho
const DURACAO_MS = 4000;

// ---------------------------------------------------------------
// avisos rapidos (toasts) no canto da tela
// ---------------------------------------------------------------
// usado depois de salvar/excluir, pra confirmar a acao sem obrigar o usuario a ler um alerta fixo.
// erro de formulario continua aparecendo dentro do proprio formulario (perto do campo).
// quem desenha os avisos e o ToastsComponent, que fica no shell.
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private proximoId = 1;

  readonly notificacoes = signal<Notificacao[]>([]);

  sucesso(mensagem: string): void {
    this.adicionar('sucesso', mensagem);
  }

  erro(mensagem: string): void {
    this.adicionar('erro', mensagem);
  }

  info(mensagem: string): void {
    this.adicionar('info', mensagem);
  }

  remover(id: number): void {
    this.notificacoes.update(lista => lista.filter(n => n.id !== id));
  }

  private adicionar(tipo: TipoNotificacao, mensagem: string): void {
    const id = this.proximoId++;
    this.notificacoes.update(lista => [...lista, { id, tipo, mensagem }]);
    setTimeout(() => this.remover(id), DURACAO_MS);
  }
}
