# ADR-0007: Design tokens via CSS custom properties + Tailwind, sem biblioteca de UI

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O painel administrativo precisava de um visual próprio, consistente entre
telas, com suporte a tema claro/escuro — mas sem herdar a aparência genérica de
uma biblioteca de componentes pronta (Angular Material, PrimeNG). O projeto
tinha como referência dois sistemas internos da mesma operadora
(`lancamentosVendas` e `autonomousapi`), que já resolviam esse problema com o
mesmo tipo de abordagem.

## Decisão

As cores do painel são variáveis CSS no formato `"r g b"` (sem `rgb()` em volta),
definidas em `:root` (tema claro) e sobrescritas em `.dark` (tema escuro):

```css
:root {
  --primary: 38 38 43;
  --primary-foreground: 250 250 250;
}
.dark {
  --primary: 228 228 231;
  --primary-foreground: 24 24 27;
}
```

O `tailwind.config.js` mapeia cada token pra uma cor Tailwind usando
`rgb(var(--nome) / <alpha-value>)`, o que permite usar opacidade normalmente
(`bg-primary/10`) mesmo com o valor vindo de uma CSS var. A troca de tema é só
alternar a classe `.dark` no `<html>` (`TemaService`), sem duplicar nenhum
componente. Componentes que se repetem em várias telas (botão, campo, tabela,
card) viram classes utilitárias próprias em `@layer components` no `styles.css`
(prefixo `ajt-`, ex. `.ajt-botao-primario`, `.ajt-campo`), montadas com
`@apply` de utilitários Tailwind — não são componentes Angular novos, só CSS
reutilizável.

## Alternativas consideradas

- **Angular Material:** descartado — traz um visual reconhecível "Material
  Design" que precisaria de bastante customização de tema pra não parecer
  genérico, e o projeto já usa Tailwind pra tudo (landing page inclusive),
  então adicionar Material duplicaria a forma de estilizar.
- **PrimeNG:** mesma lógica do Material — biblioteca completa de componentes
  quando o painel só precisa de um conjunto pequeno e específico (tabela,
  modal, badge, paginação), que já foram construídos à mão em
  `shared/components/`.
- **CSS-in-JS ou Styled Components (via alguma lib de terceiros):** não é
  idiomático em Angular e adicionaria uma dependência nova só pra um problema
  que CSS custom properties já resolve nativamente.
- **Cores fixas em hexadecimal espalhadas pelos componentes, sem token
  central:** era o estado antes desta decisão (ver histórico anterior à
  integração com o backend); descartado ao reescrever o painel porque
  dificultava trocar uma cor em todo o sistema de uma vez, e não dava suporte
  a tema escuro sem duplicar toda classe.

## Consequências

- Tema claro/escuro funciona em qualquer componente novo automaticamente,
  desde que use os tokens (`bg-card`, `text-foreground`) em vez de cor fixa.
- Menos peso de bundle que adicionar uma biblioteca de componentes inteira.
- Cada componente visual novo (badge, skeleton, stat-card) precisa ser
  construído à mão — não tem um catálogo pronto de onde puxar; isso é mais
  lento no início mas dá controle total sobre o resultado.
- A landing page **não** usa esses tokens (usa cor fixa em hexadecimal direto
  no template) — ver ADR relacionado sobre a landing ser uma área visualmente
  separada do painel.

## Onde encontrar no código

- Tokens de cor: `src/styles.css` (`:root` e `.dark`)
- Mapeamento pro Tailwind: `tailwind.config.js` (`theme.extend.colors`, função `token()`)
- Classes de componente reutilizáveis: `src/styles.css` (`@layer components`,
  `.ajt-botao-*`, `.ajt-campo`, `.ajt-card`, `.ajt-tabela`)
- Toggle de tema: `src/app/core/services/tema.service.ts`
- Componentes visuais próprios: `src/app/shared/components/`
