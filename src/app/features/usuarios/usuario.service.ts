import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, ParametrosPagina } from '../../core/models/api.model';
import { Usuario, UsuarioRequest } from '../../core/models/usuario.model';
import { montarParametros } from '../../core/http/parametros';

// acesso a /api/usuarios
// leitura, escrita e exclusao: somente ADMIN
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  listar(pagina: ParametrosPagina = {}): Observable<Pagina<Usuario>> {
    return this.http.get<Pagina<Usuario>>(this.base, { params: montarParametros(pagina) });
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  // usuario criado pelo admin nasce com trocarSenha = true (troca no primeiro acesso)
  criar(dados: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, dados);
  }

  // senha nula mantem a atual; senha preenchida redefine e obriga nova troca no proximo acesso
  atualizar(id: number, dados: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
