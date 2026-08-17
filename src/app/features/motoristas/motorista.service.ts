import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Motorista } from '../../core/models/motorista.model';
import { MOTORISTAS_MOCK } from '../../core/mock/motoristas.mock';

const STORAGE_KEY = 'ajt_motoristas';

@Injectable({ providedIn: 'root' })
export class MotoristaService {
  private motoristas = signal<Motorista[]>(this.carregar());

  listar(): Observable<Motorista[]> {
    return of(this.motoristas()).pipe(delay(250));
  }

  buscarPorId(id: number): Observable<Motorista | undefined> {
    return of(this.motoristas().find(m => m.id === id)).pipe(delay(150));
  }

  criar(dados: Omit<Motorista, 'id'>): Observable<Motorista> {
    const novo: Motorista = { ...dados, id: this.proximoId() };
    const lista = [...this.motoristas(), novo];
    return of(novo).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  atualizar(id: number, dados: Omit<Motorista, 'id'>): Observable<Motorista> {
    const existe = this.motoristas().some(m => m.id === id);
    if (!existe) {
      return throwError(() => new Error('Motorista não encontrado')).pipe(delay(250));
    }

    const atualizado: Motorista = { ...dados, id };
    const lista = this.motoristas().map(m => (m.id === id ? atualizado : m));
    return of(atualizado).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  excluir(id: number): Observable<void> {
    const lista = this.motoristas().filter(m => m.id !== id);
    return of(void 0).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  private proximoId(): number {
    const ids = this.motoristas().map(m => m.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private salvar(lista: Motorista[]): void {
    this.motoristas.set(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  private carregar(): Motorista[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOTORISTAS_MOCK));
    return MOTORISTAS_MOCK;
  }
}
