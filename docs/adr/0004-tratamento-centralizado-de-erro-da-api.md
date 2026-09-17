# ADR-0004: Tratamento de erro da API centralizado numa função única

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O AJT-Backend responde todo erro no mesmo formato
(`{ timestamp, status, erro, mensagem, detalhes[] }`) e usa o código HTTP pra
classificar o tipo de problema: 400 é validação, 401 é sessão inválida, 403 é
falta de permissão, 404/409 são conflitos de negócio, 429 é bloqueio de login
por tentativas, 502 é a cotação de câmbio fora do ar. Sem um lugar único pra
traduzir isso, cada tela que chama a API precisaria repetir o mesmo `switch` de
status pra decidir o que mostrar pro usuário.

## Decisão

Uma função pura, `mensagemDeErro(erro, mensagemPadrao?)`, recebe qualquer coisa
que caia no `error:` de um `subscribe()` e devolve a string pronta pra mostrar
na tela — sem a tela precisar saber o que é `HttpErrorResponse` nem o formato
do corpo de erro do backend:

```ts
this.service.criar(dados).subscribe({
  next: () => { /* ... */ },
  error: (err: unknown) => {
    this.erro.set(mensagemDeErro(err, 'Não foi possível salvar o motorista.'));
  },
});
```

Por dentro, a função faz `switch (erro.status)`: pra 400/404/409 prioriza a
mensagem que o backend mandou (já é específica, ex. "CNH já cadastrada"); pra
401/403/429/502/0 (sem conexão) usa um texto fixo do front, porque a mensagem
do backend nesses casos é técnica demais ou nem existe (erro de rede não tem
corpo JSON). O segundo parâmetro é o texto de fallback quando nada mais serve.

## Alternativas consideradas

- **Cada tela trata o próprio erro:** era o caminho natural sem essa função, mas
  significaria repetir a mesma lógica de "se 409, mostra a mensagem; se 401,
  redireciona" em cada um dos sete recursos. Descartado por duplicação.
- **Interceptor HTTP global que já transforma o erro antes de chegar no
  `subscribe`:** cogitado, descartado porque cada tela precisa de uma mensagem
  de fallback diferente ("não foi possível salvar o motorista" vs "não foi
  possível excluir o transfer"), e um interceptor não tem esse contexto — ele
  vê só a requisição, não sabe o texto ideal pra cada formulário. O
  interceptor de auth (ver `auth.interceptor.ts`) continua existindo, mas só
  cuida do 401 (deslogar), não da mensagem exibida.
- **Um serviço Angular (`@Injectable`) em vez de função pura:** descartado — a
  função não depende de nenhum estado da aplicação, só do objeto de erro que
  recebe; não precisar de injeção deixa ela testável sem `TestBed`.

## Consequências

- Toda tela segue o mesmo padrão de tratamento (`mensagemDeErro(err, '...')`),
  o que torna o código previsível e fácil de revisar.
- Mudar o texto de uma mensagem genérica (ex.: "sessão expirada") é uma
  alteração em um arquivo só, não uma busca por todo o projeto.
- Se o backend mudar o formato do corpo de erro, só este arquivo precisa
  mudar — nenhuma tela lê `err.error.mensagem` diretamente.

## Onde encontrar no código

- Função principal: `src/app/core/http/erro-api.ts` (`mensagemDeErro`,
  `statusDoErro`, `MENSAGENS_ERRO`)
- Testes com um caso por status HTTP: `src/app/core/http/erro-api.spec.ts`
- Uso típico numa tela: `src/app/features/motoristas/motoristas.component.ts`
- Tratamento separado do 401 (logout automático): `src/app/core/auth/auth.interceptor.ts`
