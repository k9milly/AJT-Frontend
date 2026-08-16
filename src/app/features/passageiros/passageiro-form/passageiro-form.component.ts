import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TipoDocumento } from '../../../core/models/passageiro.model';
import { PassageiroService } from '../passageiro.service';

@Component({
  selector: 'app-passageiro-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './passageiro-form.component.html',
})
export class PassageiroFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(PassageiroService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tiposDocumento: TipoDocumento[] = ['CPF', 'RG', 'CNH', 'PASSAPORTE'];

  passageiroId = signal<number | null>(null);
  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    tipoDocumento: ['CPF' as TipoDocumento, Validators.required],
    numeroDocumento: ['', Validators.required],
    nacionalidade: ['Brasileira', Validators.required],
  });

  get modoEdicao(): boolean {
    return this.passageiroId() !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    this.passageiroId.set(id);

    this.service.buscarPorId(id).subscribe(passageiro => {
      if (!passageiro) {
        this.erro.set('Passageiro não encontrado.');
        return;
      }
      this.form.patchValue(passageiro);
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
      ? this.service.atualizar(this.passageiroId()!, dados)
      : this.service.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/passageiros']);
      },
      error: (err: Error) => {
        this.salvando.set(false);
        this.erro.set(err.message);
      },
    });
  }
}
