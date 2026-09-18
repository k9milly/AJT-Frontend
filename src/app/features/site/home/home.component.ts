import { Component, ElementRef, HostListener, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { IDIOMAS, Idioma, TEXTOS_HOME } from './home.textos';

// idioma escolhido fica salvo no navegador do visitante (so conveniencia: se o storage
// estiver bloqueado, a pagina abre em portugues e segue funcionando)
const CHAVE_IDIOMA = 'ajt_idioma_home';

@Component({
    selector: 'app-home',
    imports: [RouterLink, RevealDirective],
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnDestroy {
  private document = inject(DOCUMENT);

  readonly idiomas = IDIOMAS;
  readonly idioma = signal<Idioma>(this.idiomaSalvo());

  // textos do idioma atual; o template le tudo daqui (t().hero.titulo, etc.)
  readonly t = computed(() => TEXTOS_HOME[this.idioma()]);

  // seletor de idioma compacto: botao "PT ▾" que abre a lista de idiomas
  readonly idiomaAtual = computed(() => IDIOMAS.find(i => i.codigo === this.idioma()) ?? IDIOMAS[0]);
  readonly menuIdiomaAberto = signal(false);
  private seletorIdioma = viewChild<ElementRef<HTMLElement>>('seletorIdioma');

  constructor() {
    // mantem o <html lang> em dia com o idioma da home
    effect(() => {
      const atual = IDIOMAS.find(i => i.codigo === this.idioma());
      this.document.documentElement.lang = atual?.lang ?? 'pt-BR';
    });
  }

  alternarMenuIdioma(): void {
    this.menuIdiomaAberto.update(aberto => !aberto);
  }

  // fecha o menu ao clicar fora dele
  @HostListener('document:click', ['$event'])
  aoClicarNaPagina(evento: MouseEvent): void {
    const seletor = this.seletorIdioma()?.nativeElement;
    if (this.menuIdiomaAberto() && seletor && !seletor.contains(evento.target as Node)) {
      this.menuIdiomaAberto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    this.menuIdiomaAberto.set(false);
  }

  trocarIdioma(idioma: Idioma): void {
    this.menuIdiomaAberto.set(false);
    this.idioma.set(idioma);
    try {
      localStorage.setItem(CHAVE_IDIOMA, idioma);
    } catch {
      // storage indisponivel (aba anonima, bloqueio): so nao lembra a escolha
    }
  }

  // o resto do site e o painel sao so em portugues: ao sair da home o <html lang> volta
  ngOnDestroy(): void {
    this.document.documentElement.lang = 'pt-BR';
  }

  private idiomaSalvo(): Idioma {
    try {
      const salvo = localStorage.getItem(CHAVE_IDIOMA);
      return IDIOMAS.some(i => i.codigo === salvo) ? (salvo as Idioma) : 'pt';
    } catch {
      return 'pt';
    }
  }
}
