# ADR-0002: CRUD em modal dentro da própria tela, em vez de rotas separadas

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

A primeira versão do painel (commits `9ba6d34` até `f8d26be`, fase de CRUD
mockado) seguia o padrão mais comum em Angular: cada recurso tinha uma rota de
listagem e rotas separadas de formulário —
`/admin/motoristas`, `/admin/motoristas/novo`,
`/admin/motoristas/:id/editar` — cada uma com o próprio componente
(`motorista-list`, `motorista-form`).

Quando o painel foi reconstruído para consumir o AJT-Backend de verdade (commit
`a704310` em diante), esse padrão foi abandonado: os componentes `*-list` e
`*-form` de cada recurso foram apagados e substituídos por um único componente
por feature (ex.: `MotoristasComponent`) que lista e também cria/edita, com o
formulário dentro de um `<app-modal>`.

## Decisão

Cada recurso do painel tem **um componente só**, sem sub-rotas de formulário.
Criar e editar abrem o mesmo modal (`ModalComponent`, ver
`src/app/shared/components/modal/modal.component.ts`), preenchido ou vazio
dependendo do signal `editando`. O componente guarda o próprio `FormGroup` e
decide entre `criar()` ou `atualizar()` no service com base nesse signal.

```ts
abrirEdicao(motorista: Motorista): void {
  this.editando.set(motorista);
  this.form.reset({ ...motorista });
  this.modalAberto.set(true);
}
```

As rotas em `app.routes.ts` ficam então bem mais enxutas: uma entrada por
recurso (`path: 'motoristas'`), sem `novo` nem `:id/editar`.

## Alternativas consideradas

- **Manter rotas `novo`/`:id/editar` (padrão anterior):** era o que já existia
  e funcionava, mas cada mudança de campo em um DTO do backend exigia editar
  três arquivos (list, form, e o service) em vez de um. Descartado ao reescrever
  o painel porque o formato modal reduziu drasticamente a quantidade de arquivo
  por feature sem perder nenhuma funcionalidade — o backend já valida tudo, o
  form só precisa espelhar as mesmas regras.
- **Rota de formulário como página cheia, mas ainda no mesmo componente da
  lista (troca de "modo" via signal, sem modal):** cogitado, mas o modal dá
  contexto visual melhor (o usuário não perde a lista de fundo) e é o padrão já
  usado nos projetos de referência (`lancamentosVendas`, `autonomousapi`).
- **Um componente de formulário genérico e reutilizável entre todos os
  recursos:** descartado — os formulários têm campos e validações
  suficientemente diferentes entre si (ex.: transfer tem conversão de moeda,
  parada-os tem seleção de transfers vinculados) que a abstração custaria mais
  do que economizaria.

## Consequências

- Menos arquivos por feature: um `.component.ts` + `.component.html` fazem lista
  e formulário, em vez de quatro arquivos (list.ts/html + form.ts/html).
- URL não reflete mais o estado "criando" ou "editando" — recarregar a página
  com o modal aberto perde o estado (volta pra lista fechada). Aceito porque
  nenhuma tela do painel precisa de link direto pra "editar o motorista X".
- Onde havia F5-refresh-safe deep link para um formulário, agora não há; se um
  dia for preciso (ex.: um link de e-mail que abre direto a edição de um
  registro), o padrão vai precisar reintroduzir leitura de query param pra abrir
  o modal já populado.

## Onde encontrar no código

- Padrão completo (lista + modal + formulário no mesmo arquivo):
  `src/app/features/motoristas/motoristas.component.ts` e `.html`
- Repetido em todos os outros recursos: `src/app/features/{transfers,
  ordens-servico, pontos-coleta, passageiros, veiculos, usuarios}/`
- Componente de modal reutilizável: `src/app/shared/components/modal/modal.component.ts`
- Rotas sem sub-rota de formulário: `src/app/app.routes.ts`
- Exceção: `ordens-servico/:id` continua sendo uma rota própria (não é um
  formulário de edição, é uma tela de detalhe com a rota do motorista — ver
  `src/app/features/ordens-servico/ordem-servico-detalhe/`)
