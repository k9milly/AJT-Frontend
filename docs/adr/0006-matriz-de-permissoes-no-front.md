# ADR-0006: Matriz de permissões no front, espelhando o backend

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O AJT-Backend restringe cada recurso por perfil via Spring Security (ver
`AJT-Backend/docs/adr/0002-matriz-de-permissoes-por-perfil.md`): por exemplo,
`usuarios` só ADMIN lê/escreve, `passageiros`/`transfers`/`pontos-coleta`
aceitam escrita de ADMIN, GERENTE e ATENDENTE mas exclusão só de ADMIN/GERENTE,
e MOTORISTA só pode alterar o `statusParada` de uma parada. Sem replicar essa
regra no front, a única forma de o usuário descobrir que não pode fazer algo
seria clicar no botão e receber um 403 — toda tela mostraria ações que sempre
falhariam pra certos perfis.

## Decisão

Uma matriz estática no front (`MATRIZ_ACESSO`) espelha manualmente a mesma
tabela do `SecurityConfig` do backend, com funções puras (`podeLer`,
`podeEscrever`, `podeExcluir`, `podeAlterarStatusParada`) que recebem o perfil
e o nome do recurso:

```ts
export const MATRIZ_ACESSO: Record<Recurso, RegraAcesso> = {
  usuarios: { leitura: ['ADMIN'], escrita: ['ADMIN'], exclusao: ['ADMIN'] },
  passageiros: { leitura: TODOS, escrita: OPERACAO, exclusao: GESTAO },
  // ...
};
```

`AuthService` expõe métodos de conveniência (`podeEscrever(recurso)`) que já
usam o perfil da sessão atual, e as telas usam isso só pra **esconder ou
desabilitar** botões — nunca pra decidir se uma chamada à API deve ou não ser
feita. O backend continua sendo quem de fato bloqueia (responde 403); esta
matriz é puramente de UX.

## Alternativas consideradas

- **Backend expor a lista de permissões do usuário no login/`/me`, front só
  consome:** seria mais robusto (uma fonte só, sem risco de as duas matrizes
  divergirem), mas o AJT-Backend não tem esse endpoint hoje — implementaria
  RBAC dinâmico que o projeto não pediu. Descartado por escopo; fica registrado
  aqui como melhoria possível se as duas matrizes começarem a divergir com
  frequência.
- **Não esconder nada no front, deixar todo mundo ver todos os botões e tratar
  só o erro 403 quando vier:** descartado — pior experiência (usuário clica,
  espera, recebe erro) e deixa a tela cheia de ações que nunca vão funcionar
  pra certos perfis, o que também é confuso.
- **Checar perfil direto no template com `if (usuario.role === 'ADMIN')` em vez
  de uma matriz central:** era tecnicamente possível, descartado porque
  espalharia a regra de permissão por dezenas de templates — uma mudança na
  regra do backend exigiria caçar cada `if` no front.

## Consequências

- Interface consistente com o que o backend realmente permite, sem viagens
  desnecessárias à API que vão dar 403.
- Risco real de as duas matrizes (backend e front) saírem de sincronia se
  uma mudar sem a outra ser atualizada — o comentário no topo do arquivo
  (`permissoes.ts`) avisa disso explicitamente. Não há teste automatizado que
  compare as duas matrizes entre os dois repositórios.
- Esconder um botão não é segurança — é só não pra confundir; qualquer
  tentativa de chamar a API sem permissão ainda é barrada pelo backend.

## Onde encontrar no código

- Matriz e funções: `src/app/core/auth/permissoes.ts`
- Consumo pelo `AuthService`: `src/app/core/auth/auth.service.ts`
  (`podeLer`, `podeEscrever`, `podeExcluir`, `podeAlterarStatusParada`)
- Uso típico numa tela (esconder botão de criar): `src/app/features/motoristas/motoristas.component.html`
- Uso num guard de rota (bloquear `/admin/usuarios` pra quem não é ADMIN):
  `src/app/core/auth/role.guard.ts`, aplicado em `src/app/app.routes.ts`
- Testes: `src/app/core/auth/permissoes.spec.ts`
