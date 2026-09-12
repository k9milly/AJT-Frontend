import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TipoVeiculo } from '../../../core/models/veiculo.model';
import { Motorista } from '../../../core/models/motorista.model';
import { VeiculoService } from '../veiculo.service';
import { MotoristaService } from '../../motoristas/motorista.service';

@Component({
  selector: 'app-veiculo-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './veiculo-form.component.html',
})
export class VeiculoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(VeiculoService);
  private motoristaService = inject(MotoristaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tipos: TipoVeiculo[] = ['VAN', 'MICRO_ONIBUS', 'ONIBUS', 'CARRO'];
  motoristas = signal<Motorista[]>([]);

  veiculoId = signal<number | null>(null);
  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    placa: ['', Validators.required],
    modelo: ['', Validators.required],
    tipo: ['VAN' as TipoVeiculo, Validators.required],
    capacidade: [4, [Validators.required, Validators.min(1)]],
    motoristaId: this.fb.control<number | null>(null),
  });

  get modoEdicao(): boolean {
    return this.veiculoId() !== null;
  }

  ngOnInit(): void {
    this.motoristaService.listar().subscribe(lista => this.motoristas.set(lista));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    this.veiculoId.set(id);

    this.service.buscarPorId(id).subscribe(veiculo => {
      if (!veiculo) {
        this.erro.set('Veículo não encontrado.');
        return;
      }
      this.form.patchValue(veiculo);
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    const dados = this.form.getRawValue();

    const request$ = this.modoEdicao
      ? this.service.atualizar(this.veiculoId()!, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/admin/veiculos']);
      },
      error: (err: Error) => {
        this.salvando.set(false);
        this.erro.set(err.message);
      },
    });
  }
}
