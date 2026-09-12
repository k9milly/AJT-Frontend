import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  carregando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['admin@ajt.com', [Validators.required, Validators.email]],
    senha: ['123456', [Validators.required, Validators.minLength(6)]],
  });

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, senha } = this.form.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);

    this.authService.login(email, senha).subscribe({
      next: () => {
        this.carregando.set(false);
      this.router.navigate(['/admin/passageiros']);
      },
      error: (err: Error) => {
        this.carregando.set(false);
        this.erro.set(err.message);
      },
    });
  }
}
