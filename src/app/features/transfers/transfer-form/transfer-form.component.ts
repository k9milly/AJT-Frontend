import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StatusTransfer, Transfer } from '../../../core/models/transfer.model';
import { Passageiro } from '../../../core/models/passageiro.model';
import { PontoColeta } from '../../../core/models/ponto-coleta.model';
import { Motorista } from '../../../core/models/motorista.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { TransferService } from '../transfer.service';
import { PassageiroService } from '../../passageiros/passageiro.service';
import { PontoColetaService } from '../../pontos-coleta/ponto-coleta.service';
import { MotoristaService } from '../../motoristas/motorista.service';
import { VeiculoService } from '../../veiculos/veiculo.service';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './transfer-form.component.html',
})
export class TransferFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TransferService);
  private passageiroService = inject(PassageiroService);
  private pontoColetaService = inject(PontoColetaService);
  private motoristaService = inject(MotoristaService);
  private veiculoService = inject(VeiculoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  statusOpcoes: StatusTransfer[] = ['AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];

  passageiros = signal<Passageiro[]>([]);
  pontos = signal<PontoColeta[]>([]);
  motoristas = signal<Motorista[]>([]);
  veiculos = signal<Veiculo[]>([]);

  transferId = signal<number | null>(null);
  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    passageiroId: this.fb.control<number | null>(null, Validators.required),
    origemId: this.fb.control<number | null>(null, Validators.required),
    destinoId: this.fb.control<number | null>(null, Validators.required),
    motoristaId: this.fb.control<number | null>(null),
    veiculoId: this.fb.control<number | null>(null),
    dataHora: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0)]],
    status: ['AGENDADO' as StatusTransfer, Validators.required],
  });

  get modoEdicao(): boolean {
    return this.transferId() !== null;
  }

  ngOnInit(): void {
    this.passageiroService.listar().subscribe(lista => this.passageiros.set(lista));
    this.pontoColetaService.listar().subscribe(lista => this.pontos.set(lista));
    this.motoristaService.listar().subscribe(lista => this.motoristas.set(lista));
    this.veiculoService.listar().subscribe(lista => this.veiculos.set(lista));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    this.transferId.set(id);

    this.service.buscarPorId(id).subscribe(transfer => {
      if (!transfer) {
        this.erro.set('Transfer não encontrado.');
        return;
      }
      this.form.patchValue(transfer);
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    const dados = this.form.getRawValue() as Omit<Transfer, 'id'>;

    const request$ = this.modoEdicao
      ? this.service.atualizar(this.transferId()!, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/admin/transfers']);
      },
      error: (err: Error) => {
        this.salvando.set(false);
        this.erro.set(err.message);
      },
    });
  }
}
