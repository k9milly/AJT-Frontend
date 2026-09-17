import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemDeErro } from '../../../core/http/erro-api';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { IconeComponent } from '../../../shared/components/icone/icone.component';

// valida no front que "nova senha" e "confirmacao" sao iguais (o backend nao recebe a confirmacao)
export function senhasIguaisValidator(grupo: AbstractControl): ValidationErrors | null {
  const nova = grupo.get('novaSenha')?.value;
  const confirmacao = grupo.get('confirmacao')?.value;
  return nova && confirmacao && nova !== confirmacao ? { senhasDiferentes: true } : null;
}

// tela de troca de senha
// usada em dois casos:
// 1. obrigatoria: o login devolveu trocarSenha = true (ex: admin do seed ou usuario criado pelo admin)
// 2. voluntaria: o usuario clicou em "trocar senha" no topo do painel
@Component({
    selector: 'app-trocar-senha',
    imports: [ReactiveFormsModule, IconeComponent, MdbFormsModule, MdbRippleModule],
    templateUrl: './trocar-senha.component.html',
    styleUrl: './trocar-senha.component.scss'
})
export class TrocarSenhaComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificacao = inject(NotificacaoService);
  authService = inject(AuthService);

  salvando = signal(false);
  erro = signal<string | null>(null);

  // regras iguais ao TrocaSenhaRequestDTO: nova senha entre 8 e 72 caracteres
  form = this.fb.nonNullable.group(
    {
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', Validators.required],
    },
    { validators: senhasIguaisValidator },
  );

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { senhaAtual, novaSenha } = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);

    // o auth service ja troca o token guardado pelo novo que vem na resposta
    this.authService.trocarSenha({ senhaAtual, novaSenha }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.notificacao.sucesso('Senha alterada com sucesso.');
        this.router.navigateByUrl('/admin/painel');
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(err, 'Não foi possível trocar a senha.'));
      },
    });
  }

  // na troca obrigatoria nao existe "voltar pro painel": a saida e deslogar
  sair(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  voltar(): void {
    this.router.navigateByUrl('/admin/painel');
  }
}
