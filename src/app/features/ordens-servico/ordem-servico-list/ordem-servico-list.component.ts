import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { OrdemServico } from '../../../core/models/ordem-servico.model';
import { Motorista } from '../../../core/models/motorista.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { OrdemServicoService } from '../ordem-servico.service';
import { MotoristaService } from '../../motoristas/motorista.service';
import { VeiculoService } from '../../veiculos/veiculo.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ordem-servico-list',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmDialogComponent],
  templateUrl: './ordem-servico-list.component.html',
})
export class OrdemServicoListComponent implements OnInit {
  private service = inject(OrdemServicoService);
  private motoristaService = inject(MotoristaService);
  private veiculoService = inject(VeiculoService);

  ordens = signal<OrdemServico[]>([]);
  motoristas = signal<Motorista[]>([]);
  veiculos = signal<Veiculo[]>([]);
  carregando = signal(true);
  excluindoId = signal<number | null>(null);
  ordemParaExcluir = signal<OrdemServico | null>(null);

  ngOnInit(): void {
    this.carregar();
    this.motoristaService.listar().subscribe(lista => this.motoristas.set(lista));
    this.veiculoService.listar().subscribe(lista => this.veiculos.set(lista));
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe(lista => {
      this.ordens.set(lista);
      this.carregando.set(false);
    });
  }

  nomeMotorista(id: number): string {
    return this.motoristas().find(m => m.id === id)?.nome ?? '—';
  }

  placaVeiculo(id: number): string {
    return this.veiculos().find(v => v.id === id)?.placa ?? '—';
  }

  pedirExclusao(ordem: OrdemServico): void {
    this.ordemParaExcluir.set(ordem);
  }

  cancelarExclusao(): void {
    this.ordemParaExcluir.set(null);
  }

  confirmarExclusao(): void {
    const ordem = this.ordemParaExcluir();
    if (!ordem) {
      return;
    }

    this.excluindoId.set(ordem.id);
    this.service.excluir(ordem.id).subscribe(() => {
      this.excluindoId.set(null);
      this.ordemParaExcluir.set(null);
      this.carregar();
    });
  }
}
