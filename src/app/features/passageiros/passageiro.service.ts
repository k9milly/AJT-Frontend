import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { Passageiro, PassageiroRequest } from '../../core/models/passageiro.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/passageiros
// leitura: todos os perfis | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
@Injectable({ providedIn: 'root' })
export class PassageiroService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/passageiros`;

  listar(pagina: ParametrosPagina = {}): Observable<Pagina<Passageiro>> {
    return this.http.get<Pagina<Passageiro>>(this.base, { params: montarParametros(pagina) });
  }

  buscarPorId(id: number): Observable<Passageiro> {
    return this.http.get<Passageiro>(`${this.base}/${id}`);
  }

  // unico filtro que o backend oferece pra passageiros (ignora maiusculas/minusculas)
  buscarPorNacionalidade(nacionalidade: string, pagina: ParametrosPagina = {}): Observable<Pagina<Passageiro>> {
    return this.http.get<Pagina<Passageiro>>(`${this.base}/buscar`, {
      params: montarParametros(pagina, { nacionalidade }),
    });
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
