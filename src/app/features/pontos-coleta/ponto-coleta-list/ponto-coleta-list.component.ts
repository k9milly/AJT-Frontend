import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PontoColeta } from '../../../core/models/ponto-coleta.model';
import { PontoColetaService } from '../ponto-coleta.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ponto-coleta-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './ponto-coleta-list.component.html',
})
export class PontoColetaListComponent implements OnInit {
  private service = inject(PontoColetaService);

  pontos = signal<PontoColeta[]>([]);
  carregando = signal(true);
  termoBusca = signal('');
  excluindoId = signal<number | null>(null);
  pontoParaExcluir = signal<PontoColeta | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe(lista => {
      this.pontos.set(lista);
      this.carregando.set(false);
    });
  }

  pontosFiltrados(): PontoColeta[] {
    const termo = this.termoBusca().trim().toLowerCase();
    if (!termo) {
      return this.pontos();
    }
    return this.pontos().filter(
      p => p.nome.toLowerCase().includes(termo) || p.cidade.toLowerCase().includes(termo),
    );
  }

  pedirExclusao(ponto: PontoColeta): void {
    this.pontoParaExcluir.set(ponto);
  }

  cancelarExclusao(): void {
    this.pontoParaExcluir.set(null);
  }

  confirmarExclusao(): void {
    const ponto = this.pontoParaExcluir();
    if (!ponto) {
      return;
    }

    this.excluindoId.set(ponto.id);
    this.service.excluir(ponto.id).subscribe(() => {
      this.excluindoId.set(null);
      this.pontoParaExcluir.set(null);
      this.carregar();
    });
  }
}
