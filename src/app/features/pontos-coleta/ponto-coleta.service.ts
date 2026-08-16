import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { PontoColeta } from '../../core/models/ponto-coleta.model';
import { PONTOS_COLETA_MOCK } from '../../core/mock/pontos-coleta.mock';

const STORAGE_KEY = 'ajt_pontos_coleta';

@Injectable({ providedIn: 'root' })
export class PontoColetaService {
  private pontos = signal<PontoColeta[]>(this.carregar());

  listar(): Observable<PontoColeta[]> {
    return of(this.pontos()).pipe(delay(250));
  }

  buscarPorId(id: number): Observable<PontoColeta | undefined> {
    return of(this.pontos().find(p => p.id === id)).pipe(delay(150));
  }

  criar(dados: Omit<PontoColeta, 'id'>): Observable<PontoColeta> {
    const novo: PontoColeta = { ...dados, id: this.proximoId() };
    const lista = [...this.pontos(), novo];
    return of(novo).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  atualizar(id: number, dados: Omit<PontoColeta, 'id'>): Observable<PontoColeta> {
    const existe = this.pontos().some(p => p.id === id);
    if (!existe) {
      return throwError(() => new Error('Ponto de coleta não encontrado')).pipe(delay(250));
    }

    const atualizado: PontoColeta = { ...dados, id };
    const lista = this.pontos().map(p => (p.id === id ? atualizado : p));
    return of(atualizado).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  excluir(id: number): Observable<void> {
    const lista = this.pontos().filter(p => p.id !== id);
    return of(void 0).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  private proximoId(): number {
    const ids = this.pontos().map(p => p.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private salvar(lista: PontoColeta[]): void {
    this.pontos.set(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  private carregar(): PontoColeta[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(PONTOS_COLETA_MOCK));
    return PONTOS_COLETA_MOCK;
  }
}
