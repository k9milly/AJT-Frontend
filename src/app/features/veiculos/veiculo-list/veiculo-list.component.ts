import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Veiculo } from '../../../core/models/veiculo.model';
import { Motorista } from '../../../core/models/motorista.model';
import { VeiculoService } from '../veiculo.service';
import { MotoristaService } from '../../motoristas/motorista.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-veiculo-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './veiculo-list.component.html',
})
export class VeiculoListComponent implements OnInit {
  private service = inject(VeiculoService);
  private motoristaService = inject(MotoristaService);

  veiculos = signal<Veiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  carregando = signal(true);
  termoBusca = signal('');
  excluindoId = signal<number | null>(null);
  veiculoParaExcluir = signal<Veiculo | null>(null);

  ngOnInit(): void {
    this.carregar();
    this.motoristaService.listar().subscribe(lista => this.motoristas.set(lista));
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe(lista => {
      this.veiculos.set(lista);
      this.carregando.set(false);
    });
  }

  veiculosFiltrados(): Veiculo[] {
    const termo = this.termoBusca().trim().toLowerCase();
    if (!termo) {
      return this.veiculos();
    }
    return this.veiculos().filter(
      v => v.placa.toLowerCase().includes(termo) || v.modelo.toLowerCase().includes(termo),
    );
  }

  nomeMotorista(motoristaId: number | null): string {
    if (!motoristaId) {
      return 'Sem motorista fixo';
    }
    return this.motoristas().find(m => m.id === motoristaId)?.nome ?? '—';
  }

  pedirExclusao(veiculo: Veiculo): void {
    this.veiculoParaExcluir.set(veiculo);
  }

  cancelarExclusao(): void {
    this.veiculoParaExcluir.set(null);
  }

  confirmarExclusao(): void {
    const veiculo = this.veiculoParaExcluir();
    if (!veiculo) {
      return;
    }

    this.excluindoId.set(veiculo.id);
    this.service.excluir(veiculo.id).subscribe(() => {
      this.excluindoId.set(null);
      this.veiculoParaExcluir.set(null);
      this.carregar();
    });
  }
}
