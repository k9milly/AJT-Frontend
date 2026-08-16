import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Transfer } from '../../core/models/transfer.model';
import { TRANSFERS_MOCK } from '../../core/mock/transfers.mock';

const STORAGE_KEY = 'ajt_transfers';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private transfers = signal<Transfer[]>(this.carregar());

  listar(): Observable<Transfer[]> {
    return of(this.transfers()).pipe(delay(250));
  }

  buscarPorId(id: number): Observable<Transfer | undefined> {
    return of(this.transfers().find(t => t.id === id)).pipe(delay(150));
  }

  criar(dados: Omit<Transfer, 'id'>): Observable<Transfer> {
    const novo: Transfer = { ...dados, id: this.proximoId() };
    const lista = [...this.transfers(), novo];
    return of(novo).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  atualizar(id: number, dados: Omit<Transfer, 'id'>): Observable<Transfer> {
    const existe = this.transfers().some(t => t.id === id);
    if (!existe) {
      return throwError(() => new Error('Transfer não encontrado')).pipe(delay(250));
    }

    const atualizado: Transfer = { ...dados, id };
    const lista = this.transfers().map(t => (t.id === id ? atualizado : t));
    return of(atualizado).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  excluir(id: number): Observable<void> {
    const lista = this.transfers().filter(t => t.id !== id);
    return of(void 0).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  private proximoId(): number {
    const ids = this.transfers().map(t => t.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private salvar(lista: Transfer[]): void {
    this.transfers.set(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  private carregar(): Transfer[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(TRANSFERS_MOCK));
    return TRANSFERS_MOCK;
  }
}
