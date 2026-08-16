import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Passageiro } from '../../../core/models/passageiro.model';
import { PassageiroService } from '../passageiro.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-passageiro-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './passageiro-list.component.html',
})
export class PassageiroListComponent implements OnInit {
  private service = inject(PassageiroService);

  passageiros = signal<Passageiro[]>([]);
  carregando = signal(true);
  termoBusca = signal('');
  excluindoId = signal<number | null>(null);
  passageiroParaExcluir = signal<Passageiro | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe(lista => {
      this.passageiros.set(lista);
      this.carregando.set(false);
    });
  }

  passageirosFiltrados(): Passageiro[] {
    const termo = this.termoBusca().trim().toLowerCase();
    if (!termo) {
      return this.passageiros();
    }
    return this.passageiros().filter(
      p =>
        p.nome.toLowerCase().includes(termo) ||
        p.numeroDocumento.toLowerCase().includes(termo),
    );
  }

  pedirExclusao(passageiro: Passageiro): void {
    this.passageiroParaExcluir.set(passageiro);
  }

  cancelarExclusao(): void {
    this.passageiroParaExcluir.set(null);
  }

  confirmarExclusao(): void {
    const passageiro = this.passageiroParaExcluir();
    if (!passageiro) {
      return;
    }

    this.excluindoId.set(passageiro.id);
    this.service.excluir(passageiro.id).subscribe(() => {
      this.excluindoId.set(null);
      this.passageiroParaExcluir.set(null);
      this.carregar();
    });
  }
}
