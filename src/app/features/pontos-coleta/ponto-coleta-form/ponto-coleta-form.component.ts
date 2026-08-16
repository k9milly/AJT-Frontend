import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TipoPontoColeta } from '../../../core/models/ponto-coleta.model';
import { PontoColetaService } from '../ponto-coleta.service';

@Component({
  selector: 'app-ponto-coleta-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ponto-coleta-form.component.html',
})
export class PontoColetaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(PontoColetaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tipos: TipoPontoColeta[] = ['HOTEL', 'AEROPORTO', 'RODOVIARIA', 'OUTRO'];

  pontoId = signal<number | null>(null);
  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    tipo: ['HOTEL' as TipoPontoColeta, Validators.required],
    endereco: ['', Validators.required],
    cidade: ['', Validators.required],
  });

  get modoEdicao(): boolean {
    return this.pontoId() !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    this.pontoId.set(id);

    this.service.buscarPorId(id).subscribe(ponto => {
      if (!ponto) {
        this.erro.set('Ponto de coleta não encontrado.');
        return;
      }
      this.form.patchValue(ponto);
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
      ? this.service.atualizar(this.pontoId()!, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/pontos-coleta']);
      },
      error: (err: Error) => {
        this.salvando.set(false);
        this.erro.set(err.message);
      },
    });
  }
}
