# ADR-0001: Standalone components e Angular signals, sem biblioteca de state management

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O projeto começou como um Angular 18 novo (`ng new` com a flag de standalone,
commit `403b41d`). Desde então, nenhuma tela criou um `NgModule`, e nenhum store
externo (NgRx, Akita, NGXS) foi adicionado — apesar do painel ter crescido bastante
(sete recursos com CRUD completo: transfers, ordens de serviço, pontos de coleta,
passageiros, motoristas, veículos, usuários) e ter estado real pra gerenciar:
lista carregada, item em edição, filtro ativo, modal aberto, requisição em
andamento.

## Decisão

Todo componente é `standalone: true` e declara os próprios `imports` (nada de
`SharedModule` ou `NgModule` intermediário). O estado de cada tela vive em
`signal()` dentro do próprio componente — sem um store central — e é populado
chamando o `service` HTTP do recurso (um por feature, ex.: `MotoristaService`,
`TransferService`).

O padrão se repete em toda tela de listagem/CRUD:

```ts
pagina = signal<Pagina<Motorista> | null>(null);
carregando = signal(true);
modalAberto = signal(false);
editando = signal<Motorista | null>(null);
salvando = signal(false);
```

Estado que precisa ser compartilhado entre telas (sessão do usuário, tema
claro/escuro, notificações) vira um `@Injectable({ providedIn: 'root' })` com os
próprios signals — por exemplo `AuthService.sessao`, `TemaService.escuro`,
`NotificacaoService.notificacoes` — sem nenhuma biblioteca de store por trás.

## Alternativas consideradas

- **NgRx (ou outro store global):** descartado por over-engineering pro tamanho
  do domínio. Não existe estado que precise ser acessado por muitas telas ao
  mesmo tempo com regras de derivação complexas — cada tela carrega os próprios
  dados quando é aberta. NgRx traria boilerplate (actions, reducers, effects,
  selectors) sem resolver um problema real que os services + signals não já
  resolvem.
- **RxJS puro com `BehaviorSubject` em vez de signals:** era o padrão mais comum
  em Angular antes da v16, mas signals são a direção oficial do framework
  (`detectar mudanças` sem Zone.js, sintaxe mais direta pra template) e o projeto
  já nasceu na v18, então não fazia sentido escrever no estilo antigo.
- **`NgModule` tradicional em vez de standalone:** descartado porque standalone
  é o padrão recomendado a partir do Angular 15+ e simplifica o lazy loading de
  rotas (`loadComponent` em vez de `loadChildren` apontando pra um módulo).

## Consequências

- Cada tela é auto-contida: dá pra entender uma feature lendo só o arquivo dela,
  sem caçar reducer/effect em outro lugar do projeto.
- Estado não sobrevive à navegação: sair de `/admin/motoristas` e voltar refaz o
  `carregar()` do zero. É a troca aceita — simplicidade contra cache entre
  navegações, que nenhuma tela hoje precisa.
- Se o projeto crescer a ponto de duas telas precisarem do mesmo dado ao mesmo
  tempo (ex.: um contador de notificações visível em vários lugares), o padrão
  já dá o caminho: sobe pra um `service` com `providedIn: 'root'`, como já foi
  feito para sessão e tema — não precisa reintroduzir um store geral.

## Onde encontrar no código

- Exemplo completo do padrão de tela: `src/app/features/motoristas/motoristas.component.ts`
- Services com estado compartilhado: `src/app/core/auth/auth.service.ts`,
  `src/app/core/services/tema.service.ts`, `src/app/core/services/notificacao.service.ts`
- Nenhum arquivo `*.module.ts` existe no projeto (confirma a ausência de NgModule)
- Rotas com lazy loading via `loadComponent`: `src/app/app.routes.ts`
