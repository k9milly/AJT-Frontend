import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

// ---------------------------------------------------------------
// liga/desliga o css do bootstrap conforme a area do sistema
// ---------------------------------------------------------------
// por que existe:
// a landing page usa bootstrap na navbar; o painel usa so tailwind. as duas bibliotecas tem
// classes com o mesmo nome (bg-primary, border, rounded, p-4, mb-3, gap-3...) e o bootstrap
// marca as dele com !important e usa outra escala de espacamento. com os dois ativos ao mesmo
// tempo, o painel ficava com cor azul, bordas claras e espacamentos errados.
//
// como funciona:
// o angular.json gera o bootstrap num arquivo proprio (bootstrap.css) ja incluido no index.html.
// em vez de baixar/remover o arquivo a cada navegacao, so alternamos o atributo "disabled" do
// <link>: e instantaneo e nao pisca a tela. a landing page em si nao foi alterada.

function alternarBootstrap(documento: Document, ativo: boolean): void {
  const links = documento.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href*="bootstrap"]');
  links.forEach(link => (link.disabled = !ativo));
}

// usado na rota da landing page: garante o bootstrap ligado
export const comBootstrapGuard: CanActivateFn = () => {
  alternarBootstrap(inject(DOCUMENT), true);
  return true;
};

// usado no login, troca de senha e painel: desliga o bootstrap
export const semBootstrapGuard: CanActivateFn = () => {
  alternarBootstrap(inject(DOCUMENT), false);
  return true;
};
