# ADR-0005: Sessão JWT no localStorage, com expiração checada no cliente

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O AJT-Backend é stateless: autentica via `Authorization: Bearer <token>` e não
tem endpoint de logout nem refresh token (ver
`AJT-Backend/docs/adr/0004-seguranca-de-login-e-sessao.md`). O token expira em
`expiraEm` segundos (24h por padrão) e vira inválido também se a senha for
trocada em outra aba, ou se o usuário for desativado — nesses casos o backend
simplesmente passa a responder 401 na próxima chamada. O front precisa: (a)
sobreviver a um F5 sem pedir login de novo, e (b) não deixar a tela "trabalhando
no escuro" com um token que já sabe estar vencido antes mesmo de chamar a API.

## Decisão

O `AuthService` guarda a sessão inteira (token, perfil, `trocarSenha`,
`expiraEmMs`) numa única chave do `localStorage`, serializada como JSON.
`expiraEmMs` é calculado uma vez no login (`Date.now() + expiraEm * 1000`) e
vira o instante absoluto de expiração, não o valor relativo que a API manda —
isso evita ter que lembrar quando o login aconteceu.

```ts
isAutenticado(): boolean {
  const sessao = this.sessaoAtual();
  if (!sessao) return false;
  if (Date.now() >= sessao.expiraEmMs) {
    this.logout();
    return false;
  }
  return true;
}
```

O `authGuard` (rotas do painel) chama `isAutenticado()` antes de deixar entrar.
Isso é uma checagem local, só evita mostrar a tela por um instante antes de a
API rejeitar — o backend continua sendo a fonte da verdade: se o token for
invalidado por outro motivo (senha trocada, usuário desativado), a próxima
chamada HTTP volta 401 e o `authInterceptor` desloga e redireciona, checagem de
relógio local ou não.

## Alternativas consideradas

- **`sessionStorage` em vez de `localStorage`:** descartado — sessionStorage
  não sobrevive a fechar a aba, e a equipe quer continuar logada ao reabrir o
  navegador dentro da validade do token (24h).
- **Confiar só no backend (sem checar `expiraEmMs` no cliente):** deixaria a
  tela do painel abrir normalmente com um token já vencido, e só ao primeiro
  clique que chamasse a API o usuário seria expulso — pior experiência que
  checar antes.
- **Refresh token / renovação silenciosa:** não é possível hoje porque o
  backend não implementa isso (ver decisão equivalente do lado do backend);
  quando expira, é logout mesmo, sem tentativa de renovar.
- **Guardar o token decodificado (JWT payload) em vez de campos próprios:**
  descartado — decodificar o JWT no front pra ler perfil/expiração criaria
  acoplamento com o formato interno do token; os mesmos dados já vêm
  explícitos na resposta do login (`role`, `expiraEm`).

## Consequências

- Reload da página mantém o usuário logado sem round-trip à API (só confia no
  relógio local até a primeira chamada real).
- Se o relógio do computador do usuário estiver muito errado, a checagem local
  pode achar que o token está válido quando não está (ou o contrário) — o
  backend corrige isso na primeira chamada real, então o pior caso é um
  flash da tela antes do redirecionamento.
- Token fica em texto plano no `localStorage`, acessível a qualquer script que
  rode na página (risco padrão de XSS em SPAs com JWT em localStorage) — mesmo
  trade-off aceito pelo backend ao não usar cookie `httpOnly`.

## Onde encontrar no código

- Sessão e checagem de expiração: `src/app/core/auth/auth.service.ts`
  (`isAutenticado`, `guardarSessao`, `carregarSessao`)
- Guard que usa a checagem: `src/app/core/auth/auth.guard.ts`
- Logout automático em 401: `src/app/core/auth/auth.interceptor.ts`
- Testes: `src/app/core/auth/auth.service.spec.ts`,
  `src/app/core/auth/auth.interceptor.spec.ts`, `src/app/core/auth/auth.guard.spec.ts`
