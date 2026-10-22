import { Component, signal } from '@angular/core';
import { TabelaAuditada } from '../../core/models/auditoria.model';
import { HistoricoListaComponent } from './historico-lista.component';

// ---------------------------------------------------------------
// tela de historico (HU11): quem alterou o que e quando
// ---------------------------------------------------------------
// so ADMIN e GERENTE (rota com roleGuard; o backend responde 403 pros outros).
// o historico de um transfer so tambem abre pela listagem de transfers (botao "Histórico").
@Component({
  selector: 'app-historico',
  imports: [HistoricoListaComponent],
  template: `
    <div class="max-w-4xl p-5 sm:p-6">
      <div class="mb-5 animate-surgir">
        <h2 class="text-lg font-semibold text-foreground">Histórico de alterações</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Criações, mudanças de status e de valor, e exclusões, do mais recente para o mais antigo.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap gap-2 text-sm animate-surgir" style="animation-delay: 40ms">
        @for (opcao of filtros; track opcao.rotulo) {
          <button
            type="button"
            [class]="'rounded-md px-3 py-1.5 transition-colors ' + (tabela() === opcao.tabela ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted')"
            (click)="tabela.set(opcao.tabela)"
          >
            {{ opcao.rotulo }}
          </button>
        }
      </div>

      <div class="ajt-card overflow-hidden animate-surgir" style="animation-delay: 80ms">
        <app-historico-lista [tabela]="tabela()" />
      </div>
    </div>
  `,
})
export class HistoricoComponent {
  tabela = signal<TabelaAuditada | null>(null);

  filtros: { rotulo: string; tabela: TabelaAuditada | null }[] = [
    { rotulo: 'Tudo', tabela: null },
    { rotulo: 'Transfers', tabela: 'transfers' },
    { rotulo: 'Ordens de serviço', tabela: 'ordens_servico' },
  ];
}
