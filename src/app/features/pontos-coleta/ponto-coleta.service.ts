import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { PontoColeta, PontoColetaRequest } from '../../core/models/ponto-coleta.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/pontos-coleta
// leitura: todos os perfis | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
@Injectable({ providedIn: 'root' })
export class PontoColetaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pontos-coleta`;

  listar(pagina: ParametrosPagina = {}): Observable<Pagina<PontoColeta>> {
    return this.http.get<Pagina<PontoColeta>>(this.base, { params: montarParametros(pagina) });
  }

  // lista "filha": array simples, sem paginacao, ja ordenado pela ordem da parada
  listarPorTransfer(transferId: number): Observable<PontoColeta[]> {
    return this.http.get<PontoColeta[]>(`${this.base}/transfer/${transferId}`);
  }

  buscarPorId(id: number): Observable<PontoColeta> {
    return this.http.get<PontoColeta>(`${this.base}/${id}`);
  }

  criar(dados: PontoColetaRequest): Observable<PontoColeta> {
    return this.http.post<PontoColeta>(this.base, dados);
  }

  atualizar(id: number, dados: PontoColetaRequest): Observable<PontoColeta> {
    return this.http.put<PontoColeta>(`${this.base}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
