import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensagemDeErro, statusDoErro } from '../../core/http/erro-api';
import { OrdemServicoDoDia } from '../../core/models/ordem-servico.model';
import { ParadaOs, STATUS_PARADA, StatusParada } from '../../core/models/parada-os.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { OrdemServicoService } from '../ordens-servico/ordem-servico.service';
import { ParadaOsService } from '../ordens-servico/parada-os.service';
import { IconeComponent } from '../../shared/components/icone/icone.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  ROTULO_ACAO_PARADA,
  ROTULO_STATUS_OS,
  ROTULO_STATUS_PARADA,
  formatarData,
  formatarHora,
  hojeLocal,
  tomDoStatus,
} from '../../shared/utils/rotulos';

// ---------------------------------------------------------------
// minhas OS do dia (HU07), so pro perfil MOTORISTA
// ---------------------------------------------------------------
// uma chamada (GET /api/ordens-servico/minhas) traz as OS do motorista ligado ao usuario,
// ja com as paradas na ordem do roteiro. o motorista so muda o status de cada parada.
// sem cadastro de motorista ligado ao usuario, a lista vem vazia (o admin faz o vinculo em Usuarios).
@Component({
  selector: 'app-minhas-os',
  imports: [RouterLink, IconeComponent, StatusBadgeComponent],
  template: `
    <div class="max-w-4xl p-5 sm:p-6">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3 animate-surgir">
        <div>
          <h2 class="text-lg font-semibold text-foreground">Minhas ordens de serviço</h2>
          <p class="mt-0.5 text-xs text-muted-foreground">O roteiro do dia, parada por parada.</p>
        </div>
        <div>
          <label for="dia" class="ajt-rotulo">Dia</label>
          <input id="dia" type="date" class="ajt-campo ajt-dado" [value]="data()" (change)="trocarDia($any($event.target).value)" />
        </div>
      </div>

      @if (erro()) {
        <div class="ajt-alerta-erro mb-4 flex items-center justify-between gap-3">
          <span>{{ erro() }}</span>
          <button type="button" class="ajt-link-acao !text-status-danger" (click)="carregar()">Tentar de novo</button>
        </div>
      }

      @if (carregando()) {
        <div class="space-y-4">
          @for (i of [1, 2]; track i) {
            <div class="h-40 rounded-lg bg-muted animate-pulsar"></div>
          }
        </div>
      } @else if (!erro() && !ordens().length) {
        <div class="ajt-card flex flex-col items-center gap-2 px-5 py-12 text-center animate-surgir">
          <app-icone nome="check-circulo" class="size-7 text-status-success" />
          <p class="text-sm text-foreground">Nenhuma ordem de serviço em {{ formatarData(data()) }}.</p>
          <p class="text-xs text-muted-foreground">
            Se você esperava ver alguma, peça ao administrador para ligar seu usuário ao seu cadastro de motorista.
          </p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (item of ordens(); track item.ordem.id) {
            <div class="ajt-card overflow-hidden animate-surgir">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <h3 class="ajt-dado text-base font-semibold text-foreground">OS #{{ item.ordem.id }}</h3>
                  <app-status-badge [tom]="tomDoStatus(item.ordem.status)" [rotulo]="rotuloStatusOs[item.ordem.status]" />
                </div>
                <a [routerLink]="['/admin/ordens-servico', item.ordem.id]" class="flex items-center gap-1 text-xs text-muted-foreground no-underline hover:text-foreground">
                  Abrir OS <app-icone nome="avancar" class="size-3" />
                </a>
              </div>

              @if (!item.paradas.length) {
                <p class="px-5 py-6 text-center text-xs text-muted-foreground">Esta OS ainda não tem paradas.</p>
              } @else {
                <ol class="divide-y divide-border">
                  @for (parada of item.paradas; track parada.id) {
                    <li class="flex flex-wrap items-center gap-3 px-5 py-3">
                      <span class="ajt-dado flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {{ parada.ordemParada }}
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="text-[13px] font-medium text-foreground">{{ parada.localParada }}</p>
                        <p class="ajt-dado text-[11px] text-muted-foreground">
                          {{ formatarHora(parada.horarioPrevisto) }}
                          @if (parada.acao) { · {{ rotuloAcao[parada.acao] }} }
                        </p>
                      </div>
                      <select
                        #seletor
                        class="ajt-campo w-full sm:w-40"
                        [attr.aria-label]="'Status da parada ' + parada.ordemParada"
                        [disabled]="alterandoParadaId() === parada.id"
                        (change)="alterarStatus(parada, seletor)"
                      >
                        @for (status of statusParada; track status) {
                          <option [value]="status" [selected]="status === parada.statusParada">{{ rotuloStatusParada[status] }}</option>
                        }
                      </select>
                    </li>
                  }
                </ol>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MinhasOsComponent implements OnInit {
  private ordemServicoService = inject(OrdemServicoService);
  private paradaService = inject(ParadaOsService);
  private notificacao = inject(NotificacaoService);

  statusParada = STATUS_PARADA;
  rotuloStatusOs = ROTULO_STATUS_OS;
  rotuloStatusParada = ROTULO_STATUS_PARADA;
  rotuloAcao = ROTULO_ACAO_PARADA;
  tomDoStatus = tomDoStatus;
  formatarData = formatarData;
  formatarHora = formatarHora;

  data = signal(hojeLocal());
  ordens = signal<OrdemServicoDoDia[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  alterandoParadaId = signal<number | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.ordemServicoService.minhasDoDia(this.data()).subscribe({
      next: ordens => {
        this.ordens.set(ordens);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar suas ordens de serviço.'));
        this.carregando.set(false);
      },
    });
  }

  trocarDia(data: string): void {
    if (data && data !== this.data()) {
      this.data.set(data);
      this.carregar();
    }
  }

  // recebe o <select> pra voltar o valor antigo se a api recusar
  alterarStatus(parada: ParadaOs, seletor: HTMLSelectElement): void {
    const valor = seletor.value as StatusParada;
    if (valor === parada.statusParada) {
      return;
    }

    this.alterandoParadaId.set(parada.id);
    this.paradaService.alterarStatus(parada, valor).subscribe({
      next: atualizada => {
        this.ordens.update(lista => lista.map(item => ({
          ...item,
          paradas: item.paradas.map(p => (p.id === atualizada.id ? atualizada : p)),
        })));
        this.alterandoParadaId.set(null);
        this.notificacao.sucesso(`Parada ${atualizada.ordemParada}: ${this.rotuloStatusParada[atualizada.statusParada]}.`);
      },
      error: (err: unknown) => {
        this.alterandoParadaId.set(null);
        seletor.value = parada.statusParada;
        this.notificacao.erro(mensagemDeErro(err, 'Não foi possível alterar o status da parada.'));
        // 409: alguem mexeu na parada no meio tempo; recarrega pra mostrar o estado atual
        if (statusDoErro(err) === 409) {
          this.carregar();
        }
      },
    });
  }
}
