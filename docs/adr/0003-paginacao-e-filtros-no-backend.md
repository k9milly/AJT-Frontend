# ADR-0003: Paginação e filtros resolvidos no backend, não no cliente

- **Status:** Aceito
- **Data:** 2026-09-17

## Contexto

O AJT-Backend pagina toda listagem (`GET /api/{recurso}?page=0&size=20&sort=...`,
ver `AJT-Backend/docs/adr/0005-paginacao-padrao-nas-listagens.md`) e devolve um
envelope `{ conteudo, pagina, tamanho, totalElementos, totalPaginas, primeira,
ultima }` em vez de um array simples. A fase anterior do front (CRUD mockado)
carregava a lista inteira do `localStorage` de uma vez e filtrava/paginava no
próprio componente com `Array.filter`. Ao trocar pra API real, esse padrão
deixou de fazer sentido: buscar todos os registros só pra filtrar no cliente
ignora a paginação que o backend já faz, e não escala.

## Decisão

Cada `service` de recurso expõe métodos que repassam os parâmetros de página e
filtro direto pra API via query params, e devolvem o envelope de página tal
como veio:

```ts
listar(pagina: ParametrosPagina = {}): Observable<Pagina<Motorista>> {
  return this.http.get<Pagina<Motorista>>(this.base, { params: montarParametros(pagina) });
}

buscarPorStatus(status: StatusTransfer, pagina: ParametrosPagina = {}): Observable<Pagina<Transfer>> {
  return this.http.get<Pagina<Transfer>>(`${this.base}/buscar`, {
    params: montarParametros(pagina, { status }),
  });
}
```

O componente guarda só a página atual (`pagina = signal<Pagina<T> | null>(null)`)
e troca de página/filtro disparando uma nova chamada HTTP — nunca fatiando um
array já carregado. O componente `PaginacaoComponent` (botões anterior/próxima)
só emite o número da página pedida; quem decide o que fazer com isso é a tela.

## Alternativas consideradas

- **Carregar tudo e paginar/filtrar no cliente:** era o padrão da fase mockada.
  Descartado porque o backend já faz isso de forma correta e indexada
  (ver ADR-0007 do backend, correção de N+1), e replicar a lógica no front
  duplicaria regra de filtro (ex.: "quais status contam como ativo") em dois
  lugares.
- **Cache de páginas já visitadas no cliente (evitar recarregar ao voltar):**
  cogitado, descartado por simplicidade — nenhuma tela hoje sofre com
  recarregar ao trocar de página, e cache client-side de dado que pode ter
  mudado no servidor traz risco de mostrar informação desatualizada.
- **Um serviço de paginação genérico (`PaginatedResource<T>`) compartilhado por
  todos os recursos:** cogitado, descartado pelo mesmo motivo do formulário
  genérico na ADR-0002 — os filtros variam por recurso (status do transfer,
  nacionalidade do passageiro, cnh do motorista) o bastante pra tornar a
  abstração mais complexa que o ganho.

## Consequências

- Toda tela de listagem segue o mesmo formato de chamada (`{ page, size, sort }`
  + filtros específicos), o que deixa o padrão previsível entre features.
- Trocar de página ou aplicar um filtro sempre bate na rede — não tem
  navegação "instantânea" entre páginas já vistas.
- Listas "filhas" que o backend não pagina (`/paradas-os/ordem-servico/{id}`,
  `/pontos-coleta/transfer/{id}`) precisam de tratamento à parte: o front
  embrulha o array simples num envelope de página única com `paginaUnica()`
  pra reaproveitar o mesmo componente de tabela.

## Onde encontrar no código

- Contrato do envelope de página: `src/app/core/models/api.model.ts`
  (interface `Pagina<T>`, função `paginaUnica`)
- Montagem de query params: `src/app/core/http/parametros.ts`
- Exemplo de service com paginação + filtro: `src/app/features/transfers/transfer.service.ts`
- Componente de paginação: `src/app/shared/components/paginacao/paginacao.component.ts`
- Uso de `paginaUnica` numa lista filha: `src/app/features/pontos-coleta/pontos-coleta.component.ts`
