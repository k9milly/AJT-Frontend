import { Injectable, signal } from '@angular/core';

const CHAVE_TEMA = 'ajt_tema';

// ---------------------------------------------------------------
// tema claro/escuro do painel
// ---------------------------------------------------------------
// liga/desliga a classe "dark" no <html>; os tokens de cor (styles.css) mudam sozinhos.
// a escolha fica salva no localStorage; sem escolha salva, segue o tema do sistema operacional.
// a landing page e a tela de login nao usam esses tokens, entao nao mudam de aparencia.
@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly escuro = signal<boolean>(this.lerPreferenciaInicial());

  constructor() {
    this.aplicar(this.escuro());
  }

  alternar(): void {
    const novoValor = !this.escuro();
    this.escuro.set(novoValor);
    localStorage.setItem(CHAVE_TEMA, novoValor ? 'escuro' : 'claro');
    this.aplicar(novoValor);
  }

  private lerPreferenciaInicial(): boolean {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo === 'escuro') {
      return true;
    }
    if (salvo === 'claro') {
      return false;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private aplicar(escuro: boolean): void {
    document.documentElement.classList.toggle('dark', escuro);
  }
}
