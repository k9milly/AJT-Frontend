import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Recurso } from '../../core/auth/permissoes';
import { mensagemDeErro } from '../../core/http/erro-api';
import { OrdemServico } from '../../core/models/ordem-servico.model';
import { Transfer } from '../../core/models/transfer.model';
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
// o backend nao tem endpoint de resumo, entao os numeros saem do "totalElementos" das buscas
// paginadas por status (pedindo so 1 item, o suficiente pra ler o total sem trafegar dados).
// as listas mostram o que precisa de acao: transfers sem os e os ainda abertas.
@Component({
    selector: 'app-painel',
    imports: [RouterLink, IconeComponent, StatCardComponent, StatusBadgeComponent],
    templateUrl: './painel.component.html'
})
export class PainelComponent implements OnInit {
  private transferService = inject(TransferService);
  private ordemServicoService = inject(OrdemServicoService);
  auth = inject(AuthService);

  rotuloStatusTransfer = ROTULO_STATUS_TRANSFER;
  rotuloStatusOs = ROTULO_STATUS_OS;
  tomDoStatus = tomDoStatus;
  formatarData = formatarData;
  formatarHora = formatarHora;

  // indicadores (null = ainda carregando | "—" = api nao respondeu)
  aguardandoOs = signal<number | string | null>(null);
  confirmados = signal<number | string | null>(null);
  osAbertas = signal<number | string | null>(null);
  osEmAndamento = signal<number | string | null>(null);

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
    this.carregandoListas.set(true);
    [this.aguardandoOs, this.confirmados, this.osAbertas, this.osEmAndamento].forEach(indicador => indicador.set(null));

    // size 1: so interessa o totalElementos
    const soTotal = { page: 0, size: 1 };

    forkJoin({
      aguardando: this.transferService.buscarPorStatus('AGUARDANDO_OS', { page: 0, size: ITENS_POR_LISTA, sort: 'dataTransfer,asc' }),
      confirmados: this.transferService.buscarPorStatus('CONFIRMADO', soTotal),
      abertas: this.ordemServicoService.buscarPorStatus('ABERTA', { page: 0, size: ITENS_POR_LISTA, sort: 'dataServico,asc' }),
      emAndamento: this.ordemServicoService.buscarPorStatus('EM_ANDAMENTO', soTotal),
    }).subscribe({
      next: resultado => {
        this.aguardandoOs.set(resultado.aguardando.totalElementos);
        this.confirmados.set(resultado.confirmados.totalElementos);
        this.osAbertas.set(resultado.abertas.totalElementos);
        this.osEmAndamento.set(resultado.emAndamento.totalElementos);

        this.transfersSemOs.set(resultado.aguardando.conteudo);
        this.ordensAbertas.set(resultado.abertas.conteudo);
        this.carregandoListas.set(false);
      },
      error: (err: unknown) => {
        this.erro.set(mensagemDeErro(err, 'Não foi possível carregar o painel.'));
        [this.aguardandoOs, this.confirmados, this.osAbertas, this.osEmAndamento].forEach(indicador => indicador.set('—'));
        this.carregandoListas.set(false);
      },
    });
  }
}
