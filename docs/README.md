# Documentação do AJT-Frontend

Esta pasta é o registro permanente das decisões de código do AJT-Frontend. A ideia é
simples: quando alguém (você daqui a alguns meses, ou outra pessoa do time) olhar pra
um trecho de código e perguntar "por que isso foi feito assim?", a resposta está aqui
— não precisa adivinhar, nem perguntar, nem quebrar a decisão sem saber que ela existia.

Segue o mesmo processo já usado no [AJT-Backend](https://github.com/guiPinheiroAfK/AJT-Backend/tree/documentacao/docs).

## Onde estamos

Esta é a branch `documentacao`, uma **branch eterna**: ela nunca é apagada e não segue
o ciclo normal de feature branch (criar → revisar → mergear → apagar). O trabalho de
documentar acontece direto aqui. Periodicamente — o combinado é sempre por volta do
dia 20 de cada mês — o conteúdo acumulado aqui é mergeado na `main`, e a branch
`documentacao` continua viva pra receber as próximas ADRs.

## Como funciona (resumo — o processo completo está na [ADR-0000](adr/0000-processo-de-adr.md))

- Cada decisão relevante vira um arquivo em `docs/adr/`, numerado sequencialmente:
  `0001-titulo-curto.md`, `0002-titulo-curto.md`, e assim por diante.
- A numeração é **imutável**: um número usado nunca é reaproveitado, nunca é
  reordenado. Se uma decisão muda depois, a ADR antiga não é editada pra "sumir" —
  ela é marcada como **substituída** e uma ADR nova é criada.
- Todo ADR segue o mesmo template (contexto, decisão, alternativas consideradas,
  consequências, onde encontrar no código) — ver [ADR-0000](adr/0000-processo-de-adr.md).
- **Por enquanto, o escopo é só decisões de código** (arquitetura do front,
  componentes, estado, integração com a API, design system). Infraestrutura e deploy
  ficam de fora até fazer sentido documentar — ver a seção "Escopo" da ADR-0000.

## Índice de decisões

| ADR | Título | Status |
|---|---|---|
| [0000](adr/0000-processo-de-adr.md) | Processo de ADR desta branch | Aceito |
| [0001](adr/0001-standalone-components-e-signals.md) | Standalone components e Angular signals, sem biblioteca de state management | Aceito |
| [0002](adr/0002-crud-em-modal-por-tela.md) | CRUD em modal dentro da própria tela, em vez de rotas separadas | Aceito |
| [0003](adr/0003-paginacao-e-filtros-no-backend.md) | Paginação e filtros resolvidos no backend, não no cliente | Aceito |
| [0004](adr/0004-tratamento-centralizado-de-erro-da-api.md) | Tratamento de erro da API centralizado numa função única | Aceito |
| [0005](adr/0005-sessao-jwt-no-localstorage.md) | Sessão JWT no localStorage, com expiração checada no cliente | Aceito |
| [0006](adr/0006-matriz-de-permissoes-no-front.md) | Matriz de permissões no front, espelhando o backend | Aceito |
| [0007](adr/0007-design-tokens-css-sem-biblioteca-de-ui.md) | Design tokens via CSS custom properties + Tailwind, sem biblioteca de UI | Aceito |
| [0008](adr/0008-environments-por-build.md) | URL da API absoluta em dev, relativa em produção | Aceito |
| [0009](adr/0009-testes-com-httptestingcontroller.md) | Testes de HTTP com HttpTestingController, sem mockar services na mão | Aceito |

## Por onde começar a ler

Se você chegou aqui sem contexto nenhum do projeto, a ordem sugerida é:

1. [ADR-0001](adr/0001-standalone-components-e-signals.md) — como o app é estruturado
   (standalone components, estado em signals, sem NgRx). É a base pra entender
   qualquer outro arquivo do projeto.
2. [ADR-0002](adr/0002-crud-em-modal-por-tela.md) e
   [ADR-0003](adr/0003-paginacao-e-filtros-no-backend.md) — como uma tela típica do
   painel é montada: um componente por recurso, lista paginada, modal de
   criar/editar.
3. [ADR-0005](adr/0005-sessao-jwt-no-localstorage.md) e
   [ADR-0006](adr/0006-matriz-de-permissoes-no-front.md) — como o login funciona de
   ponta a ponta e como cada perfil vê botões diferentes.
4. [ADR-0004](adr/0004-tratamento-centralizado-de-erro-da-api.md) — como qualquer
   erro vindo da API vira uma mensagem na tela.
5. [ADR-0007](adr/0007-design-tokens-css-sem-biblioteca-de-ui.md) — de onde vêm as
   cores e os componentes visuais (botão, campo, card, tabela).
6. [ADR-0008](adr/0008-environments-por-build.md) e
   [ADR-0009](adr/0009-testes-com-httptestingcontroller.md) — como rodar o projeto
   localmente e como os testes são escritos.

Cada ADR tem uma seção **"Onde encontrar no código"** com os arquivos exatos — não é
só teoria, é o mapa de onde cavar.

## Repositório relacionado

- Backend (Spring Boot): [AJT-Backend](https://github.com/guiPinheiroAfK/AJT-Backend) —
  tem a própria branch `documentacao` com as ADRs do lado da API.
