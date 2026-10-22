import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { FiltroPassageiro, Passageiro, PassageiroRequest } from '../../core/models/passageiro.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/passageiros
// leitura: ADMIN, GERENTE, ATENDENTE | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
@Injectable({ providedIn: 'root' })
export class PassageiroService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/passageiros`;

  // filtros opcionais (RF015): campo vazio nao vai pra url
  listar(pagina: ParametrosPagina = {}, filtros: FiltroPassageiro = {}): Observable<Pagina<Passageiro>> {
    return this.http.get<Pagina<Passageiro>>(this.base, { params: montarParametros(pagina, { ...filtros }) });
  }

  buscarPorId(id: number): Observable<Passageiro> {
    return this.http.get<Passageiro>(`${this.base}/${id}`);
  }

  criar(dados: PassageiroRequest): Observable<Passageiro> {
    return this.http.post<Passageiro>(this.base, dados);
  }

  atualizar(id: number, dados: PassageiroRequest): Observable<Passageiro> {
    return this.http.put<Passageiro>(`${this.base}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
