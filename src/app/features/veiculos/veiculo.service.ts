import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { Veiculo, VeiculoRequest } from '../../core/models/veiculo.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/veiculos
// leitura: todos os perfis | escrita e exclusao: ADMIN, GERENTE
@Injectable({ providedIn: 'root' })
export class VeiculoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/veiculos`;

  listar(pagina: ParametrosPagina = {}): Observable<Pagina<Veiculo>> {
    return this.http.get<Pagina<Veiculo>>(this.base, { params: montarParametros(pagina) });
  }

  buscarPorId(id: number): Observable<Veiculo> {
    return this.http.get<Veiculo>(`${this.base}/${id}`);
  }

  // busca exata por placa; devolve 404 quando nao encontra
  buscarPorPlaca(placa: string): Observable<Veiculo> {
    return this.http.get<Veiculo>(`${this.base}/buscar`, { params: montarParametros({}, { placa }) });
  }

  criar(dados: VeiculoRequest): Observable<Veiculo> {
    return this.http.post<Veiculo>(this.base, dados);
  }

  atualizar(id: number, dados: VeiculoRequest): Observable<Veiculo> {
    return this.http.put<Veiculo>(`${this.base}/${id}`, dados);
  }

  // devolve 409 se o veiculo estiver vinculado a alguma ordem de servico
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
