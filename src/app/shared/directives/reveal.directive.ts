import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

// ---------------------------------------------------------------
// anima a entrada de um elemento quando ele aparece na tela ao rolar a pagina
// ---------------------------------------------------------------
// usado na landing page pra dar mais vida as secoes: o elemento nasce baixo e
// transparente (classe "ajt-reveal", em styles.css) e sobe ate o lugar assim que
// 15% dele fica visivel (classe "ajt-reveal-ativo" liga a transicao).
//
// uso: <h2 appReveal>Titulo</h2>  ou  <div [appReveal]="120">...</div> (atraso em ms,
// pra escalonar varios itens do mesmo grupo, ex: os cards de um grid).
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  // aceita string tambem pra funcionar como atributo simples (<h2 appReveal>), sem
  // precisar escrever [appReveal]="0" toda vez que nao tem atraso
  @Input('appReveal') atrasoMs: number | string = 0;

  private elemento = inject(ElementRef<HTMLElement>).nativeElement;
  private observador?: IntersectionObserver;

  ngOnInit(): void {
    this.elemento.classList.add('ajt-reveal');
    const atraso = Number(this.atrasoMs) || 0;
    if (atraso) {
      this.elemento.style.transitionDelay = `${atraso}ms`;
    }

    // sem IntersectionObserver (navegador muito antigo) o elemento aparece direto,
    // sem animacao, em vez de ficar invisivel pra sempre
    if (!('IntersectionObserver' in window)) {
      this.elemento.classList.add('ajt-reveal-ativo');
      return;
    }

    this.observador = new IntersectionObserver(
      entradas => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            this.elemento.classList.add('ajt-reveal-ativo');
            this.observador?.unobserve(this.elemento);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    this.observador.observe(this.elemento);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
