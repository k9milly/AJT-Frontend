import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoriaCnh } from '../../../core/models/motorista.model';
import { MotoristaService } from '../motorista.service';

@Component({
  selector: 'app-motorista-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './motorista-form.component.html',
})
export class MotoristaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MotoristaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categorias: CategoriaCnh[] = ['A', 'B', 'AB', 'D', 'E'];

  motoristaId = signal<number | null>(null);
  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cnh: ['', Validators.required],
    categoriaCnh: ['B' as CategoriaCnh, Validators.required],
    telefone: ['', Validators.required],
    ativo: [true],
  });

  get modoEdicao(): boolean {
    return this.motoristaId() !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    this.motoristaId.set(id);

    this.service.buscarPorId(id).subscribe(motorista => {
      if (!motorista) {
        this.erro.set('Motorista não encontrado.');
        return;
      }
      this.form.patchValue(motorista);
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
      ? this.service.atualizar(this.motoristaId()!, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
      this.router.navigate(['/admin/motoristas']);
      },
      error: (err: Error) => {
        this.salvando.set(false);
        this.erro.set(err.message);
      },
    });
  }
}
