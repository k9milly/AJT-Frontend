import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { AuthService } from '../../../core/auth/auth.service';
import { MENSAGENS_ERRO, mensagemDeErro } from '../../../core/http/erro-api';
import { IconeComponent } from '../../../shared/components/icone/icone.component';

// tela de login do painel
// layout em duas metades sobre o mesmo fundo escuro (marca + contexto | formulario),
// igual ao lancamentosVendas; o fundo nao muda com o tema claro/escuro do painel.
// depois de entrar: se o backend pedir troca de senha vai pra /trocar-senha, senao pro painel
@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink, IconeComponent, MdbRippleModule],
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  carregando = signal(false);
  erro = signal<string | null>(null);
  aviso = signal<string | null>(null);
  mostrarSenha = signal(false);

  // limites iguais aos do LoginRequestDTO do backend
  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    senha: ['', [Validators.required, Validators.maxLength(72)]],
  });

  ngOnInit(): void {
    // quem ja esta logado nao precisa ver o login de novo
    if (this.authService.isAutenticado()) {
      this.irParaDestino();
      return;
    }

    // o interceptor manda pra ca com ?sessao=expirada quando a api responde 401
    if (this.route.snapshot.queryParamMap.get('sessao') === 'expirada') {
      this.aviso.set(MENSAGENS_ERRO.sessaoExpirada);
    }
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, senha } = this.form.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);
    this.aviso.set(null);

    this.authService.login(username.trim(), senha).subscribe({
      next: () => {
        this.carregando.set(false);
        this.irParaDestino();
      },
      error: (err: unknown) => {
        this.carregando.set(false);
        // 401 = usuario/senha errados | 429 = bloqueado por excesso de tentativas | 0 = backend fora
        this.erro.set(mensagemDeErro(err, 'Não foi possível entrar. Tente novamente.'));
      },
    });
  }

  private irParaDestino(): void {
    const destino = this.authService.precisaTrocarSenha() ? '/trocar-senha' : '/admin/painel';
    this.router.navigateByUrl(destino);
  }
}
