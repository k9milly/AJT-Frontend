import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { Motorista, MotoristaRequest } from '../../core/models/motorista.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/motoristas
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
@Injectable({ providedIn: 'root' })
export class MotoristaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/motoristas`;

  listar(pagina: ParametrosPagina = {}): Observable<Pagina<Motorista>> {
    return this.http.get<Pagina<Motorista>>(this.base, { params: montarParametros(pagina) });
  }

  buscarPorId(id: number): Observable<Motorista> {
    return this.http.get<Motorista>(`${this.base}/${id}`);
  }

  // busca exata por cnh; devolve 404 quando nao encontra
  buscarPorCnh(cnh: string): Observable<Motorista> {
    return this.http.get<Motorista>(`${this.base}/buscar`, { params: montarParametros({}, { cnh }) });
  }

  criar(dados: MotoristaRequest): Observable<Motorista> {
    return this.http.post<Motorista>(this.base, dados);
  }

  atualizar(id: number, dados: MotoristaRequest): Observable<Motorista> {
    return this.http.put<Motorista>(`${this.base}/${id}`, dados);
  }

  // devolve 409 se o motorista estiver vinculado a alguma ordem de servico
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
