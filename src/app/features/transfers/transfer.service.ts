import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { StatusTransfer, Transfer, TransferRequest } from '../../core/models/transfer.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/transfers
// leitura: todos os perfis | escrita: ADMIN, GERENTE, ATENDENTE | exclusao: ADMIN, GERENTE
@Injectable({ providedIn: 'root' })
export class TransferService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/transfers`;

  listar(pagina: ParametrosPagina = {}): Observable<Pagina<Transfer>> {
    return this.http.get<Pagina<Transfer>>(this.base, { params: montarParametros(pagina) });
  }

  buscarPorId(id: number): Observable<Transfer> {
    return this.http.get<Transfer>(`${this.base}/${id}`);
  }

  buscarPorStatus(status: StatusTransfer, pagina: ParametrosPagina = {}): Observable<Pagina<Transfer>> {
    return this.http.get<Pagina<Transfer>>(`${this.base}/buscar`, {
      params: montarParametros(pagina, { status }),
    });
  }

  // com moeda estrangeira e sem valorBase, o backend consulta o cambio antes de salvar
  criar(dados: TransferRequest): Observable<Transfer> {
    return this.http.post<Transfer>(this.base, dados);
  }

  atualizar(id: number, dados: TransferRequest): Observable<Transfer> {
    return this.http.put<Transfer>(`${this.base}/${id}`, dados);
  }

  // vincula (ou desvincula, com null) o transfer a uma ordem de servico
  // o backend nao tem PATCH que aceite osId nulo, entao reenvia o transfer inteiro via PUT.
  // o valorBase atual vai junto pra o backend nao reconverter o valor com a cotacao de hoje
  alterarOrdemServico(transfer: Transfer, osId: number | null): Observable<Transfer> {
    const { id, ...dados } = transfer;
    return this.atualizar(id, { ...dados, osId });
  }

  // remove tambem os pontos de coleta do transfer (cascade no banco)
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
