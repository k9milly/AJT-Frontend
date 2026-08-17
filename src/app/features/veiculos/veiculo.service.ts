import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Veiculo } from '../../core/models/veiculo.model';
import { VEICULOS_MOCK } from '../../core/mock/veiculos.mock';

const STORAGE_KEY = 'ajt_veiculos';

@Injectable({ providedIn: 'root' })
export class VeiculoService {
  private veiculos = signal<Veiculo[]>(this.carregar());

  listar(): Observable<Veiculo[]> {
    return of(this.veiculos()).pipe(delay(250));
  }

  buscarPorId(id: number): Observable<Veiculo | undefined> {
    return of(this.veiculos().find(v => v.id === id)).pipe(delay(150));
  }

  criar(dados: Omit<Veiculo, 'id'>): Observable<Veiculo> {
    const novo: Veiculo = { ...dados, id: this.proximoId() };
    const lista = [...this.veiculos(), novo];
    return of(novo).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  atualizar(id: number, dados: Omit<Veiculo, 'id'>): Observable<Veiculo> {
    const existe = this.veiculos().some(v => v.id === id);
    if (!existe) {
      return throwError(() => new Error('Veículo não encontrado')).pipe(delay(250));
    }

    const atualizado: Veiculo = { ...dados, id };
    const lista = this.veiculos().map(v => (v.id === id ? atualizado : v));
    return of(atualizado).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  excluir(id: number): Observable<void> {
    const lista = this.veiculos().filter(v => v.id !== id);
    return of(void 0).pipe(delay(250), tap(() => this.salvar(lista)));
  }

  private proximoId(): number {
    const ids = this.veiculos().map(v => v.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private salvar(lista: Veiculo[]): void {
    this.veiculos.set(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  private carregar(): Veiculo[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(VEICULOS_MOCK));
    return VEICULOS_MOCK;
  }
}
