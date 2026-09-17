import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParadaOs, ParadaOsRequest, StatusParada } from '../../core/models/parada-os.model';

// acesso a /api/paradas-os
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
// excecao: MOTORISTA pode apenas trocar o status (PATCH so com statusParada)
@Injectable({ providedIn: 'root' })
export class ParadaOsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/paradas-os`;

  // lista "filha": array simples, sem paginacao, ja ordenado pela ordem da parada
  listarPorOrdemServico(osId: number): Observable<ParadaOs[]> {
    return this.http.get<ParadaOs[]>(`${this.base}/ordem-servico/${osId}`);
  }

  criar(dados: ParadaOsRequest): Observable<ParadaOs> {
    return this.http.post<ParadaOs>(this.base, dados);
  }

  atualizar(id: number, dados: ParadaOsRequest): Observable<ParadaOs> {
    return this.http.put<ParadaOs>(`${this.base}/${id}`, dados);
  }

  // o corpo leva so o statusParada: se mandar qualquer outro campo o backend recusa pro MOTORISTA
  alterarStatus(id: number, statusParada: StatusParada): Observable<ParadaOs> {
    return this.http.patch<ParadaOs>(`${this.base}/${id}`, { statusParada });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
