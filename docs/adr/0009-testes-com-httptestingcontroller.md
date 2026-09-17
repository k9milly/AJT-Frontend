# ADR-0009: Testes de HTTP com HttpTestingController, sem mockar services na mão

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

Boa parte da lógica do front que vale a pena testar depende de uma chamada
HTTP: o `AuthService` faz login e guarda sessão, o `authInterceptor` decide se
anexa o token e se desloga no 401, cada `*.service.ts` de recurso monta a URL e
os query params certos. Testar essas coisas exige simular uma resposta da API
sem depender do AJT-Backend estar rodando — os testes precisam passar em
qualquer máquina, sem Docker nem banco (diferente dos testes de integração do
backend, que usam Testcontainers).

## Decisão

Todo teste que envolve HTTP usa `provideHttpClient()` real (não um mock do
`HttpClient` em si) combinado com `provideHttpClientTesting()` e
`HttpTestingController` — o Angular intercepta a requisição antes dela sair
pra rede, o teste inspeciona o que foi montado (URL, método, headers, body,
query params) e responde manualmente com `req.flush(...)`:

```ts
service.login('admin', 'admin123').subscribe();

const req = http.expectOne(`${environment.apiUrl}/auth/login`);
expect(req.request.method).toBe('POST');
expect(req.request.body).toEqual({ username: 'admin', senha: 'admin123' });
req.flush(respostaLogin);
```

Isso testa o `HttpClient` de verdade fazendo o trabalho real de montar a
requisição (incluindo passar pelo `authInterceptor`, quando ele está no
provider list do teste) — só a resposta da rede é substituída.

## Alternativas consideradas

- **Mockar o `HttpClient` inteiro (`jasmine.createSpyObj('HttpClient', ['get',
  'post', ...])`) e o service ficar responsável por controlar o retorno:**
  descartado porque não testa o contrato real com a API — um erro na URL, no
  método ou nos query params passaria despercebido, já que o spy simplesmente
  devolveria o que o teste mandar, sem checar o que foi pedido.
- **Testar contra o AJT-Backend real rodando (Testcontainers ou uma instância
  de dev):** o backend já faz isso do próprio lado (testes de integração com
  Testcontainers + WireMock). Do lado do front, isso tornaria os testes
  lentos e dependentes de infraestrutura externa só pra validar lógica que não
  precisa de banco de dados nenhum — o objetivo aqui é validar o que o front
  manda e como reage, não o comportamento do backend.
- **Sem teste de HTTP nenhum, só testar funções puras (formatadores,
  permissões):** essas também são testadas (ver `rotulos.spec.ts`,
  `permissoes.spec.ts`), mas deixaria sem cobertura justamente a parte mais
  fácil de quebrar silenciosamente — um erro de digitação na URL ou um
  parâmetro esquecido.

## Consequências

- Testes rodam em qualquer máquina com `npm test`, sem precisar do backend nem
  de Docker — inclusive em CI, se um dia for configurado (fora do escopo desta
  branch).
- Todo teste que usa `HttpTestingController` deve chamar `http.verify()` no
  `afterEach` pra garantir que nenhuma requisição esperada ficou sem resposta
  — um teste que esquece isso pode mascarar uma chamada duplicada ou faltando.
- O padrão só cobre a camada HTTP; não substitui testar a lógica de template
  (isso exigiria `TestBed` com fixture e `detectChanges()`, que o projeto não
  usa hoje — nenhum teste atual renderiza componente, só serviços, guards,
  interceptor e funções puras).

## Onde encontrar no código

- Exemplo mais completo do padrão: `src/app/core/auth/auth.service.spec.ts`
- Padrão aplicado a interceptor: `src/app/core/auth/auth.interceptor.spec.ts`
- Padrão aplicado a guard: `src/app/core/auth/auth.guard.spec.ts`
- Padrão aplicado a um service de recurso: `src/app/features/transfers/transfer.service.spec.ts`
- Testes de função pura, sem HTTP nem TestBed: `src/app/shared/utils/rotulos.spec.ts`,
  `src/app/core/auth/permissoes.spec.ts`, `src/app/features/passageiros/formatar-cpf.spec.ts`
