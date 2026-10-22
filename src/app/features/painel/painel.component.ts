import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Recurso } from '../../core/auth/permissoes';
import { mensagemDeErro } from '../../core/http/erro-api';
import { OrdemServico } from '../../core/models/ordem-servico.model';
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
  recurso: Recurso;
}

// quantos itens aparecem nas listas "pra resolver" do painel
const ITENS_POR_LISTA = 5;

// ---------------------------------------------------------------
// painel inicial (dashboard)
// ---------------------------------------------------------------
// os indicadores sao do dia (RF012) e vem prontos do GET /api/painel/resumo (uma consulta
// agregada no backend). o faturamento (HU08) so vem preenchido pra ADMIN e GERENTE.
// as listas mostram o que precisa de acao, de qualquer dia: transfers sem os e os ainda abertas.
@Component({
    selector: 'app-painel',
    imports: [RouterLink, IconeComponent, StatCardComponent, StatusBadgeComponent],
    templateUrl: './painel.component.html'
})
export class PainelComponent implements OnInit {
  private painelService = inject(PainelService);
  private transferService = inject(TransferService);
  private ordemServicoService = inject(OrdemServicoService);
  auth = inject(AuthService);

  rotuloStatusTransfer = ROTULO_STATUS_TRANSFER;
  rotuloStatusOs = ROTULO_STATUS_OS;
  tomDoStatus = tomDoStatus;
  formatarData = formatarData;
  formatarHora = formatarHora;

  // resumo do dia (null = ainda carregando)
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

  transfersSemOs = signal<Transfer[]>([]);
  ordensAbertas = signal<OrdemServico[]>([]);
  carregandoListas = signal(true);
  erro = signal<string | null>(null);

  // "quarta-feira, 17 de setembro"
  hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  primeiroNome = computed(() => this.auth.nomeExibicao().split(' ')[0]);

  private atalhos: Atalho[] = [
    { rota: '/admin/transfers', queryParams: { novo: '1' }, rotulo: 'Novo transfer', icone: 'rota', recurso: 'transfers' },
    { rota: '/admin/ordens-servico', queryParams: { novo: '1' }, rotulo: 'Nova ordem de serviço', icone: 'prancheta', recurso: 'ordens-servico' },
    { rota: '/admin/passageiros', queryParams: { novo: '1' }, rotulo: 'Novo passageiro', icone: 'pessoas', recurso: 'passageiros' },
    { rota: '/admin/pontos-coleta', rotulo: 'Pontos de coleta', icone: 'pino', recurso: 'pontos-coleta' },
  ];

  // atalho de cadastro so aparece pra quem pode escrever naquele recurso
  atalhosVisiveis = computed(() =>
    this.atalhos.filter(atalho => atalho.queryParams ? this.auth.podeEscrever(atalho.recurso) : this.auth.podeLer(atalho.recurso)),
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.erro.set(null);
    this.erroResumo.set(false);
    this.resumo.set(null);
    this.carregandoListas.set(true);

    this.painelService.resumo().subscribe({
      next: resumo => this.resumo.set(resumo),
      error: (err: unknown) => {
        this.erroResumo.set(true);
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar o painel.'));
      },
    });

    forkJoin({
      aguardando: this.transferService.buscarPorStatus('AGUARDANDO_OS', { page: 0, size: ITENS_POR_LISTA, sort: 'dataTransfer,asc' }),
      abertas: this.ordemServicoService.buscarPorStatus('ABERTA', { page: 0, size: ITENS_POR_LISTA, sort: 'dataServico,asc' }),
    }).subscribe({
      next: resultado => {
        this.transfersSemOs.set(resultado.aguardando.conteudo);
        this.ordensAbertas.set(resultado.abertas.conteudo);
        this.carregandoListas.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar o painel.'));
        this.carregandoListas.set(false);
      },
    });
  }
}
