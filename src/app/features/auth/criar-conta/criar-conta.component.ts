import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemDeErro } from '../../../core/http/erro-api';
import { IconeComponent } from '../../../shared/components/icone/icone.component';
import { textoObrigatorio } from '../../../shared/utils/validadores';

// "confirmar senha" tem que ser igual a senha (erro fica no grupo, a tela mostra embaixo do campo)
function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('senha')?.value;
  const confirmacao = grupo.get('confirmacao')?.value;
  return confirmacao && senha !== confirmacao ? { senhasDiferentes: true } : null;
}

// tela publica "Criar conta"
// mesmo visual do login. a conta nasce inativa e com perfil Atendente (regra do backend):
// depois de criar, a pessoa ve o aviso de que precisa esperar um administrador liberar
@Component({
  selector: 'app-criar-conta',
  imports: [ReactiveFormsModule, RouterLink, IconeComponent, MdbRippleModule],
  templateUrl: './criar-conta.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CriarContaComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  carregando = signal(false);
  erro = signal<string | null>(null);
  // username da conta criada: troca o formulario pela mensagem de sucesso
  criada = signal<string | null>(null);
  mostrarSenha = signal(false);

  // limites iguais aos do RegistroRequestDTO do backend
  form = this.fb.nonNullable.group({
    nome: ['', [textoObrigatorio, Validators.maxLength(100)]],
    username: ['', [textoObrigatorio, Validators.pattern(/^[a-zA-Z0-9._-]{3,50}$/)]],
    senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmacao: ['', [Validators.required]],
  }, { validators: senhasIguais });

  criar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nome, username, senha } = this.form.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);

    this.authService.registrar({ nome: nome.trim(), username: username.trim(), senha })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: usuario => {
          this.carregando.set(false);
          this.criada.set(usuario.username);
        },
        error: (err: unknown) => {
          this.carregando.set(false);
          // 400 = campo invalido ou username ja usado (mensagem do backend) | 0 = backend fora
          this.erro.set(mensagemDeErro(err, 'Não foi possível criar a conta. Tente novamente.'));
        },
      });
  }
}
