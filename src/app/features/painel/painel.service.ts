import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PainelResumo } from '../../core/models/painel.model';

// acesso a /api/painel
// leitura: todos os perfis (o backend so preenche o faturamento pra ADMIN e GERENTE)
@Injectable({ providedIn: 'root' })
export class PainelService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/painel`;

  // sem data o backend usa o dia de hoje no fuso de sao paulo
  resumo(data?: string): Observable<PainelResumo> {
    const params = data ? new HttpParams().set('data', data) : undefined;
    return this.http.get<PainelResumo>(`${this.base}/resumo`, { params });
  }
}
