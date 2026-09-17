# ADR-0000: Processo de ADR desta branch

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O AJT-Frontend já tinha decisões de código importantes tomadas — algumas antigas
(do CRUD mockado inicial), outras recentes (da integração com o AJT-Backend) —
que só existiam na cabeça de quem escreveu, ou espalhadas em mensagens de commit.
Isso tem dois problemas: quem entra no projeto depois não sabe *por que* o código
é do jeito que é, e é fácil "desfazer" uma decisão sem querer, por não saber que
ela foi deliberada. O AJT-Backend já resolveu isso com uma branch `documentacao`
e ADRs (ver `AJT-Backend/docs/adr/0000-processo-de-adr.md`); este documento aplica
o mesmo processo aqui.

## Decisão

Criar uma branch eterna chamada `documentacao`, com uma pasta `docs/adr/` contendo
um arquivo por decisão relevante — Architecture Decision Records (ADR).

Regras do processo (idênticas às do backend):

1. **Numeração sequencial e imutável.** Cada ADR tem um número de 4 dígitos
   (`0001`, `0002`, ...), atribuído em ordem crescente e nunca reaproveitado.
2. **ADR não se edita pra mudar de ideia.** Se uma decisão for revista depois, a
   ADR antiga é marcada como `Substituído por ADR-000X` no campo Status, e uma
   ADR nova é criada explicando a mudança.
3. **Toda ADR segue o mesmo template** (ver seção abaixo), incluindo uma seção
   **"Onde encontrar no código"**.
4. **Quando escrever uma ADR:** sempre que uma escolha não é óbvia a partir do
   código sozinho — por que essa estrutura de pastas, por que essa biblioteca (ou
   a ausência dela) e não outra, por que uma tela foi montada de um jeito
   específico. Não é pra documentar trivialidades.
5. **Escopo (por enquanto): só decisões de código** — arquitetura do front,
   componentes, estado, integração com a API, design system. Infraestrutura e
   deploy (CI/CD, hospedagem, variáveis de ambiente de build, Docker) ficam de
   fora por ora, porque ainda não há visão suficiente disso neste projeto; entra
   quando fizer sentido, como uma seção nova neste mesmo documento.
6. **Merge pra `main`:** o conteúdo acumulado em `documentacao` é integrado na
   `main` periodicamente (o combinado é por volta do dia 20 de cada mês). A
   branch `documentacao` não é apagada depois do merge — continua recebendo as
   próximas ADRs, com a numeração de onde parou.

## Template de uma ADR

```markdown
# ADR-000X: Título curto

- **Status:** Proposto | Aceito | Substituído por ADR-000Y | Descontinuado
- **Data:** AAAA-MM-DD

## Contexto
Qual problema motivou essa decisão? O que aconteceria sem ela?

## Decisão
O que foi feito, de forma direta.

## Alternativas consideradas
O que mais foi cogitado, e por que foi descartado. Se não houve alternativa real
avaliada, diga isso — é informação também.

## Consequências
O que fica mais fácil, o que fica mais difícil, que trade-off foi aceito.

## Onde encontrar no código
Arquivos/componentes principais envolvidos, caminho relativo ao repo.
```

## Alternativas consideradas

- **Wiki externa (Confluence, Notion):** descartado pelo mesmo motivo do backend —
  fica fora do fluxo de code review e do histórico de `git blame`.
- **Comentários só no código:** o projeto já usa bastante isso pra explicar *como*
  um trecho funciona (ver o padrão de comentários em minúsculas usado em todo o
  front), mas comentário de código some quando o trecho é refatorado, e não é o
  lugar certo pra registrar *alternativas descartadas*.
- **Um `docs/adr` próprio, sem seguir o padrão do backend:** descartado — os dois
  projetos são operados pela mesma equipe pequena; ter dois formatos de ADR
  diferentes só cria atrito sem benefício.

## Consequências

- Toda decisão não óbvia do front passa a ter um lugar certo pra ir.
- Tem custo: exige parar e escrever depois de decidir algo.
- Numeração imutável significa que, se uma ADR for descartada rapidamente, o
  número dela "queima" mesmo assim — é intencional.
- Ao aceitar documentação de infra depois, este arquivo (0000) é quem ganha uma
  seção nova explicando a mudança de escopo — não precisa de uma ADR-0000-B.

## Onde encontrar no código

Não se aplica — esta ADR descreve o processo, não uma decisão de código.
