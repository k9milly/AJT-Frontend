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

  /** Formatação visual do CPF (000.000.000-00). Validação de dígito verificador fica a cargo do backend. */
  aplicarMascaraDocumento(valorDigitado: string): void {
    if (this.form.controls.tipoDocumento.value !== 'CPF') {
      return;
    }

    const digitos = valorDigitado.replace(/\D/g, '').slice(0, 11);
    let formatado = digitos;

    if (digitos.length > 9) {
      formatado = digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (digitos.length > 6) {
      formatado = digitos.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (digitos.length > 3) {
      formatado = digitos.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    this.form.controls.numeroDocumento.setValue(formatado, { emitEvent: false });
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
