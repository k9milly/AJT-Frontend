# ADR-0008: URL da API absoluta em dev, relativa em produção

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O front precisa saber onde fica a API em cada ambiente. Em desenvolvimento, o
`ng serve` roda em `localhost:4200` e o AJT-Backend roda separado em
`localhost:8080` — dois domínios (com porta) diferentes. Em produção, o plano é
o front e o back ficarem atrás do mesmo domínio (o `README.md` do backend cita
isso: "front-end em repositório separado"), o que muda a forma correta de
apontar pra API.

## Decisão

Dois arquivos de configuração, trocados no build via `fileReplacements` do
`angular.json`:

```ts
// environment.ts (ng serve e testes)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};

// environment.prod.ts (ng build, produção)
export const environment = {
  production: true,
  apiUrl: '/api',
};
```

Em dev, `apiUrl` é absoluto (`http://localhost:8080/api`) porque o front e o
back estão em portas diferentes — o navegador precisa do host completo pra
saber pra onde mandar a requisição, e o backend libera CORS especificamente pra
`http://localhost:4200` (`AJT_CORS_ORIGINS`). Em produção, `apiUrl` é um
caminho relativo (`/api`) — como front e back compartilham o mesmo domínio,
não precisa (nem deve) hardcodar um host, o que também evita quebrar se o
domínio de produção mudar.

## Alternativas consideradas

- **Um único `apiUrl` configurável via variável de ambiente injetada no
  `index.html` em runtime:** mais flexível (não precisaria rebuildar pra
  trocar de ambiente), mas é complexidade de infraestrutura que este projeto
  não tem hoje — ficaria fora do escopo "só decisões de código" desta branch
  de documentação. Fica registrado como opção se um dia existir a necessidade
  de apontar o mesmo build pra ambientes diferentes (staging vs. produção).
- **Sempre caminho relativo, inclusive em dev, com um proxy do Angular CLI
  (`proxy.conf.json`) redirecionando `/api` pra `localhost:8080`:** era
  tecnicamente viável e evitaria depender de CORS em dev. Não foi adotado —
  o projeto optou por CORS explícito no backend (mais próximo do
  comportamento real de produção) em vez de mascarar isso com um proxy só de
  desenvolvimento.

## Consequências

- Rodar `ng serve` localmente exige o backend estar de pé e com
  `AJT_CORS_ORIGINS` incluindo `http://localhost:4200` (o valor padrão já é
  esse, ver `AJT-Backend/api/src/main/resources/application.yml`), senão toda
  chamada falha por CORS.
- Trocar o domínio de produção não exige nenhuma mudança no front, só no
  deploy (fora do escopo desta branch por enquanto).
- Se algum dia o front precisar falar com mais de uma API (ex.: um serviço de
  mapas ou pagamento externo), o padrão de `environment.ts` já suporta
  adicionar novas chaves — não fica limitado a `apiUrl`.

## Onde encontrar no código

- Arquivos de ambiente: `src/environments/environment.ts`,
  `src/environments/environment.prod.ts`
- Troca no build: `angular.json` (`projects.ajt-front.architect.build.configurations.production.fileReplacements`)
- Uso em todos os services HTTP: ex. `src/app/features/motoristas/motorista.service.ts`
  (`${environment.apiUrl}/motoristas`)
