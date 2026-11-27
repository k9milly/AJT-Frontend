import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Recurso } from '../../core/auth/permissoes';
import { mensagemDeErro } from '../../core/http/erro-api';
import { OrdemServico, OrdemServicoDoDia } from '../../core/models/ordem-servico.model';
import { Transfer } from '../../core/models/transfer.model';
import { PainelResumo } from '../../core/models/painel.model';
import { PainelService } from './painel.service';
import { TransferService } from '../transfers/transfer.service';
import { OrdemServicoService } from '../ordens-servico/ordem-servico.service';
import { IconeComponent, NomeIcone } from '../../shared/components/icone/icone.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  ROTULO_STATUS_OS,
  ROTULO_STATUS_TRANSFER,
  formatarData,
  formatarHora,
  formatarMoeda,
  tomDoStatus,
} from '../../shared/utils/rotulos';

interface Atalho {
  rota: string;
  // abre o modal de cadastro direto na tela de destino
  queryParams?: Record<string, string>;
  rotulo: string;
  icone: NomeIcone;
  recurso?: Recurso;
}

// quantos itens aparecem nas listas "pra resolver" do painel
const ITENS_POR_LISTA = 5;

// ---------------------------------------------------------------
// painel inicial (dashboard)
// ---------------------------------------------------------------
// para a equipe (ADMIN, GERENTE, ATENDENTE): indicadores do dia (RF012), faturamento (HU08) e
// pendencias (transfers sem OS e OS abertas).
// para o MOTORISTA: resumo e atalhos focados apenas nas proprias OS e paradas do dia (HU07).
@Component({
    selector: 'app-painel',
    imports: [RouterLink, IconeComponent, StatCardComponent, StatusBadgeComponent],
    templateUrl: './painel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelComponent implements OnInit {
  private painelService = inject(PainelService);
  private transferService = inject(TransferService);
  private ordemServicoService = inject(OrdemServicoService);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);

  private cargaSub?: Subscription;

  rotuloStatusTransfer = ROTULO_STATUS_TRANSFER;
  rotuloStatusOs = ROTULO_STATUS_OS;
  tomDoStatus = tomDoStatus;
  formatarData = formatarData;
  formatarHora = formatarHora;

  ehMotorista = computed(() => this.auth.perfil() === 'MOTORISTA');

  // resumo do dia da operacao (null = ainda carregando)
  resumo = signal<PainelResumo | null>(null);
  erroResumo = signal(false);

  // valor de cada card: null = carregando (placeholder) | "—" = api nao respondeu
  private doResumo<T>(ler: (resumo: PainelResumo) => T): T | string | null {
    if (this.erroResumo()) {
      return '—';
    }
    const resumo = this.resumo();
    return resumo ? ler(resumo) : null;
  }

  transfersHoje = computed(() => this.doResumo(r => r.totalTransfers));
  aguardandoOsHoje = computed(() => this.doResumo(r => r.transfersPorStatus.AGUARDANDO_OS));
  osAbertasHoje = computed(() => this.doResumo(r => r.ordensServicoPorStatus.ABERTA));
  osEmAndamentoHoje = computed(() => this.doResumo(r => r.ordensServicoPorStatus.EM_ANDAMENTO));

  // so ADMIN e GERENTE recebem o faturamento; pros outros perfis os cards nem aparecem
  mostraFaturamento = computed(() => this.auth.temPerfil('ADMIN', 'GERENTE'));
  faturamentoDia = computed(() => this.doResumo(r => formatarMoeda(r.faturamentoDia, 'BRL')));
  faturamentoMes = computed(() => this.doResumo(r => formatarMoeda(r.faturamentoMes, 'BRL')));

  // listas da equipe
  transfersSemOs = signal<Transfer[]>([]);
  ordensAbertas = signal<OrdemServico[]>([]);
  carregandoListas = signal(true);
  erro = signal<string | null>(null);

  // dados proprios do perfil MOTORISTA (HU07)
  minhasOsHoje = signal<OrdemServicoDoDia[] | null>(null);
  totalMinhasOsHoje = computed<number | string | null>(() => {
    if (this.erro()) {
      return '—';
    }
    const lista = this.minhasOsHoje();
    return lista ? lista.length : null;
  });
  paradasPendentesHoje = computed<number | string | null>(() => {
    if (this.erro()) {
      return '—';
    }
    const lista = this.minhasOsHoje();
    if (!lista) {
      return null;
    }
    return lista.reduce(
      (soma, item) => soma + item.paradas.filter(p => p.statusParada === 'PENDENTE' || p.statusParada === 'EM_ANDAMENTO').length,
      0,
    );
  });
  paradasConcluidasHoje = computed<number | string | null>(() => {
    if (this.erro()) {
      return '—';
    }
    const lista = this.minhasOsHoje();
    if (!lista) {
      return null;
    }
    return lista.reduce((soma, item) => soma + item.paradas.filter(p => p.statusParada === 'CONCLUIDA').length, 0);
  });

  // "quarta-feira, 17 de setembro"
  hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  primeiroNome = computed(() => this.auth.nomeExibicao().split(' ')[0]);

  private atalhosEquipe: Atalho[] = [
    { rota: '/admin/transfers', queryParams: { novo: '1' }, rotulo: 'Novo transfer', icone: 'rota', recurso: 'transfers' },
    { rota: '/admin/ordens-servico', queryParams: { novo: '1' }, rotulo: 'Nova ordem de serviço', icone: 'prancheta', recurso: 'ordens-servico' },
    { rota: '/admin/passageiros', queryParams: { novo: '1' }, rotulo: 'Novo passageiro', icone: 'pessoas', recurso: 'passageiros' },
    { rota: '/admin/pontos-coleta', rotulo: 'Pontos de coleta', icone: 'pino', recurso: 'pontos-coleta' },
  ];

  private atalhosMotorista: Atalho[] = [
    { rota: '/admin/minhas-os', rotulo: 'Minhas OS do dia', icone: 'calendario' },
    { rota: '/admin/ordens-servico', rotulo: 'Ordens de serviço', icone: 'prancheta' },
  ];

  // atalho de cadastro so aparece pra quem pode escrever naquele recurso
  atalhosVisiveis = computed(() => {
    if (this.ehMotorista()) {
      return this.atalhosMotorista;
    }
    return this.atalhosEquipe.filter(atalho =>
      !atalho.recurso || (atalho.queryParams ? this.auth.podeEscrever(atalho.recurso) : this.auth.podeLer(atalho.recurso)),
    );
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.cargaSub?.unsubscribe();
    this.erro.set(null);
    this.erroResumo.set(false);
    this.resumo.set(null);
    this.carregandoListas.set(true);

    if (this.ehMotorista()) {
      this.minhasOsHoje.set(null);
      this.cargaSub = this.ordemServicoService.minhasDoDia()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ordens => {
            this.minhasOsHoje.set(ordens);
            this.carregandoListas.set(false);
          },
          error: (err: unknown) => {
            this.erro.set(mensagemDeErro(err, 'Não foi possível carregar suas ordens de serviço.'));
            this.carregandoListas.set(false);
          },
        });
      return;
    }

    const sub = new Subscription();
    this.cargaSub = sub;

    sub.add(
      this.painelService.resumo()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: resumo => this.resumo.set(resumo),
          error: (err: unknown) => {
            this.erroResumo.set(true);
            this.erro.set(mensagemDeErro(err, 'Não foi possível carregar o painel.'));
          },
        }),
    );

    sub.add(
      forkJoin({
        aguardando: this.transferService.buscarPorStatus('AGUARDANDO_OS', { page: 0, size: ITENS_POR_LISTA, sort: 'dataTransfer,asc' }),
        abertas: this.ordemServicoService.buscarPorStatus('ABERTA', { page: 0, size: ITENS_POR_LISTA, sort: 'dataServico,asc' }),
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: resultado => {
            this.transfersSemOs.set(resultado.aguardando.conteudo);
            this.ordensAbertas.set(resultado.abertas.conteudo);
            this.carregandoListas.set(false);
          },
          error: (err: unknown) => {
            this.erro.set(mensagemDeErro(err, 'Não foi possível carregar o painel.'));
            this.carregandoListas.set(false);
          },
        }),
    );
  }
}
