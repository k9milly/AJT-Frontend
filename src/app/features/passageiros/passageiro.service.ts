import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Passageiro } from '../../core/models/passageiro.model';
import { PASSAGEIROS_MOCK } from '../../core/mock/passageiros.mock';

const STORAGE_KEY = 'ajt_passageiros';

@Injectable({ providedIn: 'root' })
export class PassageiroService {
  private passageiros = signal<Passageiro[]>(this.carregar());

  listar(): Observable<Passageiro[]> {
    return of(this.passageiros()).pipe(delay(250));
  }

  buscarPorId(id: number): Observable<Passageiro | undefined> {
    return of(this.passageiros().find(p => p.id === id)).pipe(delay(150));
  }

  criar(dados: Omit<Passageiro, 'id'>): Observable<Passageiro> {
    const novo: Passageiro = { ...dados, id: this.proximoId() };
    const lista = [...this.passageiros(), novo];
    return of(novo).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  atualizar(id: number, dados: Omit<Passageiro, 'id'>): Observable<Passageiro> {
    const existe = this.passageiros().some(p => p.id === id);
    if (!existe) {
      return throwError(() => new Error('Passageiro não encontrado')).pipe(delay(250));
    }

    const atualizado: Passageiro = { ...dados, id };
    const lista = this.passageiros().map(p => (p.id === id ? atualizado : p));
    return of(atualizado).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  excluir(id: number): Observable<void> {
    const lista = this.passageiros().filter(p => p.id !== id);
    return of(void 0).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  private proximoId(): number {
    const ids = this.passageiros().map(p => p.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private salvar(lista: Passageiro[]): void {
    this.passageiros.set(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  private carregar(): Passageiro[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(PASSAGEIROS_MOCK));
    return PASSAGEIROS_MOCK;
  }
}
