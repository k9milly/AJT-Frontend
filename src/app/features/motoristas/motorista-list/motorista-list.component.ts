import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Motorista } from '../../../core/models/motorista.model';
import { MotoristaService } from '../motorista.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-motorista-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './motorista-list.component.html',
})
export class MotoristaListComponent implements OnInit {
  private service = inject(MotoristaService);

  motoristas = signal<Motorista[]>([]);
  carregando = signal(true);
  termoBusca = signal('');
  excluindoId = signal<number | null>(null);
  motoristaParaExcluir = signal<Motorista | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe(lista => {
      this.motoristas.set(lista);
      this.carregando.set(false);
    });
  }

  motoristasFiltrados(): Motorista[] {
    const termo = this.termoBusca().trim().toLowerCase();
    if (!termo) {
      return this.motoristas();
    }
    return this.motoristas().filter(
      m => m.nome.toLowerCase().includes(termo) || m.cnh.toLowerCase().includes(termo),
    );
  }

  pedirExclusao(motorista: Motorista): void {
    this.motoristaParaExcluir.set(motorista);
  }

  cancelarExclusao(): void {
    this.motoristaParaExcluir.set(null);
  }

  confirmarExclusao(): void {
    const motorista = this.motoristaParaExcluir();
    if (!motorista) {
      return;
    }

    this.excluindoId.set(motorista.id);
    this.service.excluir(motorista.id).subscribe(() => {
      this.excluindoId.set(null);
      this.motoristaParaExcluir.set(null);
      this.carregar();
    });
  }
}
