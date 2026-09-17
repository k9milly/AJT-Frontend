import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { OrdemServico, OrdemServicoRequest, StatusOrdemServico } from '../../core/models/ordem-servico.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/ordens-servico
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
@Injectable({ providedIn: 'root' })
export class OrdemServicoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ordens-servico`;

  listar(pagina: ParametrosPagina = {}): Observable<Pagina<OrdemServico>> {
    return this.http.get<Pagina<OrdemServico>>(this.base, { params: montarParametros(pagina) });
  }

  buscarPorId(id: number): Observable<OrdemServico> {
    return this.http.get<OrdemServico>(`${this.base}/${id}`);
  }

  buscarPorStatus(status: StatusOrdemServico, pagina: ParametrosPagina = {}): Observable<Pagina<OrdemServico>> {
    return this.http.get<Pagina<OrdemServico>>(`${this.base}/buscar`, {
      params: montarParametros(pagina, { status }),
    });
  }

  criar(dados: OrdemServicoRequest): Observable<OrdemServico> {
    return this.http.post<OrdemServico>(this.base, dados);
  }

  atualizar(id: number, dados: OrdemServicoRequest): Observable<OrdemServico> {
    return this.http.put<OrdemServico>(`${this.base}/${id}`, dados);
  }

  // troca so o status, reenviando o resto da os como esta (PUT exige o corpo completo)
  alterarStatus(ordem: OrdemServico, status: StatusOrdemServico): Observable<OrdemServico> {
    const { id, ...dados } = ordem;
    return this.atualizar(id, { ...dados, status });
  }

  // remove tambem as paradas da os (cascade no banco); devolve 409 se houver transfer vinculado
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
