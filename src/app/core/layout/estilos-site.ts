import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

// ---------------------------------------------------------------
// mantem o css do bootstrap desligado em todo o sistema
// ---------------------------------------------------------------
// por que existe:
// o bundle do bootstrap (angular.json -> styles) fica incluido no index.html, mas nunca e
// realmente usado: nenhuma tela (nem a landing) usa um componente de verdade dele, so
// markup proprio em tailwind. o problema e que o bootstrap gera classes utilitarias com o
// MESMO NOME de varias do tailwind (border, shadow-sm, mt-3, gap-4, bg-primary...) marcadas
// com !important, e ele ganhava da nossa por baixo dos panos mesmo sem a gente usar nada
// dele de proposito — foi assim que a borda dos cards e o hover dos botoes da landing
// saiam cinza-claro em vez de dourado, entre outros efeitos colaterais silenciosos.
//
// solucao: manter o link do bootstrap sempre desabilitado (nunca ligar), em qualquer rota.
// se um dia precisar mesmo de um componente do bootstrap em algum lugar, o certo e reativar
// so ali (com este mesmo guard) e revisar as colisoes de nome antes.

function desligarBootstrap(documento: Document): void {
  const links = documento.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href*="bootstrap"]');
  links.forEach(link => (link.disabled = true));
}

export const semBootstrapGuard: CanActivateFn = () => {
  desligarBootstrap(inject(DOCUMENT));
  return true;
};
