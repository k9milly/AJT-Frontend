import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { RegistroAuditoria, TabelaAuditada } from '../../core/models/auditoria.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/auditoria (so leitura)
// leitura: ADMIN, GERENTE | o backend ja devolve do mais recente pro mais antigo
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auditoria`;

  // sem tabela = tudo | tabela = um recurso | tabela + registroId = historico de um registro so (HU11)
  listar(
    filtro: { tabela?: TabelaAuditada | null; registroId?: number | null } = {},
    pagina: ParametrosPagina = {},
  ): Observable<Pagina<RegistroAuditoria>> {
    return this.http.get<Pagina<RegistroAuditoria>>(this.base, {
      params: montarParametros(pagina, { tabela: filtro.tabela, registroId: filtro.registroId }),
    });
  }
}
