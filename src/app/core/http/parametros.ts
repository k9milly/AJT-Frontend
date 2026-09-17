import { HttpParams } from '@angular/common/http';
import { ParametrosPagina } from '../models/api.model';

// monta os query params de paginacao (?page=0&size=20&sort=campo,asc)
// "extras" recebe filtros especificos do recurso (ex: status, nacionalidade)
// valores nulos, indefinidos ou vazios sao ignorados pra nao mandar "?status=" pro backend
export function montarParametros(
  pagina: ParametrosPagina = {},
  extras: Record<string, string | number | null | undefined> = {},
): HttpParams {
  let params = new HttpParams();

  const todos = { ...pagina, ...extras };
  for (const [chave, valor] of Object.entries(todos)) {
    if (valor === null || valor === undefined || valor === '') {
      continue;
    }
    params = params.set(chave, String(valor));
  }

  return params;
}
