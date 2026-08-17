import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { OrdemServico } from '../../core/models/ordem-servico.model';
import { ORDENS_SERVICO_MOCK } from '../../core/mock/ordens-servico.mock';

const STORAGE_KEY = 'ajt_ordens_servico';

@Injectable({ providedIn: 'root' })
export class OrdemServicoService {
  private ordens = signal<OrdemServico[]>(this.carregar());

  listar(): Observable<OrdemServico[]> {
    return of(this.ordens()).pipe(delay(250));
  }

  buscarPorId(id: number): Observable<OrdemServico | undefined> {
    return of(this.ordens().find(o => o.id === id)).pipe(delay(150));
  }

  criar(dados: Omit<OrdemServico, 'id'>): Observable<OrdemServico> {
    const novo: OrdemServico = { ...dados, id: this.proximoId() };
    const lista = [...this.ordens(), novo];
    return of(novo).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  atualizar(id: number, dados: Omit<OrdemServico, 'id'>): Observable<OrdemServico> {
    const existe = this.ordens().some(o => o.id === id);
    if (!existe) {
      return throwError(() => new Error('Ordem de serviço não encontrada')).pipe(delay(250));
    }

    const atualizado: OrdemServico = { ...dados, id };
    const lista = this.ordens().map(o => (o.id === id ? atualizado : o));
    return of(atualizado).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  excluir(id: number): Observable<void> {
    const lista = this.ordens().filter(o => o.id !== id);
    return of(void 0).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  private proximoId(): number {
    const ids = this.ordens().map(o => o.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private salvar(lista: OrdemServico[]): void {
    this.ordens.set(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  private carregar(): OrdemServico[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ORDENS_SERVICO_MOCK));
    return ORDENS_SERVICO_MOCK;
  }
}
