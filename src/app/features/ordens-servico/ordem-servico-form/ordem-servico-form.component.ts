import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StatusOrdemServico, OrdemServico } from '../../../core/models/ordem-servico.model';
import { Motorista } from '../../../core/models/motorista.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { Transfer } from '../../../core/models/transfer.model';
import { Passageiro } from '../../../core/models/passageiro.model';
import { OrdemServicoService } from '../ordem-servico.service';
import { MotoristaService } from '../../motoristas/motorista.service';
import { VeiculoService } from '../../veiculos/veiculo.service';
import { TransferService } from '../../transfers/transfer.service';
import { PassageiroService } from '../../passageiros/passageiro.service';

@Component({
  selector: 'app-ordem-servico-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './ordem-servico-form.component.html',
})
export class OrdemServicoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(OrdemServicoService);
  private motoristaService = inject(MotoristaService);
  private veiculoService = inject(VeiculoService);
  private transferService = inject(TransferService);
  private passageiroService = inject(PassageiroService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  statusOpcoes: StatusOrdemServico[] = ['ABERTA', 'EM_ANDAMENTO', 'FINALIZADA'];

  motoristas = signal<Motorista[]>([]);
  veiculos = signal<Veiculo[]>([]);
  transfers = signal<Transfer[]>([]);
  passageiros = signal<Passageiro[]>([]);

  ordemId = signal<number | null>(null);
  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    motoristaId: this.fb.control<number | null>(null, Validators.required),
    veiculoId: this.fb.control<number | null>(null, Validators.required),
    data: ['', Validators.required],
    transferIds: this.fb.nonNullable.control<number[]>([]),
    status: ['ABERTA' as StatusOrdemServico, Validators.required],
    observacoes: [''],
  });

  get modoEdicao(): boolean {
    return this.ordemId() !== null;
  }

  ngOnInit(): void {
    this.motoristaService.listar().subscribe(lista => this.motoristas.set(lista));
    this.veiculoService.listar().subscribe(lista => this.veiculos.set(lista));
    this.transferService.listar().subscribe(lista => this.transfers.set(lista));
    this.passageiroService.listar().subscribe(lista => this.passageiros.set(lista));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    this.ordemId.set(id);

    this.service.buscarPorId(id).subscribe(ordem => {
      if (!ordem) {
        this.erro.set('Ordem de serviço não encontrada.');
        return;
      }
      this.form.patchValue(ordem);
    });
  }

  nomePassageiroDoTransfer(transferId: number): string {
    const transfer = this.transfers().find(t => t.id === transferId);
    if (!transfer) {
      return '';
    }
    return this.passageiros().find(p => p.id === transfer.passageiroId)?.nome ?? '—';
  }

  transferSelecionado(transferId: number): boolean {
    return this.form.controls.transferIds.value.includes(transferId);
  }

  alternarTransfer(transferId: number, selecionado: boolean): void {
    const atual = this.form.controls.transferIds.value;
    const novo = selecionado ? [...atual, transferId] : atual.filter(id => id !== transferId);
    this.form.controls.transferIds.setValue(novo);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    const dados = this.form.getRawValue() as Omit<OrdemServico, 'id'>;

    const request$ = this.modoEdicao
      ? this.service.atualizar(this.ordemId()!, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/ordens-servico']);
      },
      error: (err: Error) => {
        this.salvando.set(false);
        this.erro.set(err.message);
      },
    });
  }
}
