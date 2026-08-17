import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Transfer } from '../../../core/models/transfer.model';
import { Passageiro } from '../../../core/models/passageiro.model';
import { PontoColeta } from '../../../core/models/ponto-coleta.model';
import { Motorista } from '../../../core/models/motorista.model';
import { TransferService } from '../transfer.service';
import { PassageiroService } from '../../passageiros/passageiro.service';
import { PontoColetaService } from '../../pontos-coleta/ponto-coleta.service';
import { MotoristaService } from '../../motoristas/motorista.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DatePipe, DecimalPipe],
  templateUrl: './transfer-list.component.html',
})
export class TransferListComponent implements OnInit {
  private service = inject(TransferService);
  private passageiroService = inject(PassageiroService);
  private pontoColetaService = inject(PontoColetaService);
  private motoristaService = inject(MotoristaService);

  transfers = signal<Transfer[]>([]);
  passageiros = signal<Passageiro[]>([]);
  pontos = signal<PontoColeta[]>([]);
  motoristas = signal<Motorista[]>([]);
  carregando = signal(true);
  excluindoId = signal<number | null>(null);
  transferParaExcluir = signal<Transfer | null>(null);

  ngOnInit(): void {
    this.carregar();
    this.passageiroService.listar().subscribe(lista => this.passageiros.set(lista));
    this.pontoColetaService.listar().subscribe(lista => this.pontos.set(lista));
    this.motoristaService.listar().subscribe(lista => this.motoristas.set(lista));
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe(lista => {
      this.transfers.set(lista);
      this.carregando.set(false);
    });
  }

  nomePassageiro(id: number): string {
    return this.passageiros().find(p => p.id === id)?.nome ?? '—';
  }

  nomePonto(id: number): string {
    return this.pontos().find(p => p.id === id)?.nome ?? '—';
  }

  nomeMotorista(id: number | null): string {
    if (!id) {
      return 'A definir';
    }
    return this.motoristas().find(m => m.id === id)?.nome ?? '—';
  }

  pedirExclusao(transfer: Transfer): void {
    this.transferParaExcluir.set(transfer);
  }

  cancelarExclusao(): void {
    this.transferParaExcluir.set(null);
  }

  confirmarExclusao(): void {
    const transfer = this.transferParaExcluir();
    if (!transfer) {
      return;
    }

    this.excluindoId.set(transfer.id);
    this.service.excluir(transfer.id).subscribe(() => {
      this.excluindoId.set(null);
      this.transferParaExcluir.set(null);
      this.carregar();
    });
  }
}
