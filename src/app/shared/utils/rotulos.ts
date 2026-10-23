import { Perfil } from '../../core/models/auth.model';
import { StatusTransfer, Transfer } from '../../core/models/transfer.model';
import { StatusOrdemServico } from '../../core/models/ordem-servico.model';
import { AcaoParada, StatusParada } from '../../core/models/parada-os.model';
import { TomStatus } from '../components/status-badge/status-badge.component';

// ---------------------------------------------------------------
// textos amigaveis pros valores de enum que vem da api
// ---------------------------------------------------------------
// o backend trafega os valores "crus" (ex: AGUARDANDO_OS); a tela mostra o rotulo.
// a cor do badge tambem sai daqui, pra ficar igual em todas as telas que mostram o mesmo status.

export const ROTULO_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  ATENDENTE: 'Atendente',
  MOTORISTA: 'Motorista',
};

export const ROTULO_STATUS_TRANSFER: Record<StatusTransfer, string> = {
  AGUARDANDO_OS: 'Aguardando OS',
  CONFIRMADO: 'Confirmado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export const ROTULO_STATUS_OS: Record<StatusOrdemServico, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

export const ROTULO_STATUS_PARADA: Record<StatusParada, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const ROTULO_ACAO_PARADA: Record<AcaoParada, string> = {
  EMBARQUE: 'Embarque',
  DESEMBARQUE: 'Desembarque',
};

// tom (cor) do badge de cada status; usado pelo app-status-badge
// a mesma palavra tem a mesma cor em qualquer tela (ex: EM_ANDAMENTO sempre amarelo)
const TOM_STATUS: Record<string, TomStatus> = {
  // transfer
  AGUARDANDO_OS: 'warning',
  CONFIRMADO: 'info',
  CONCLUIDO: 'success',
  CANCELADO: 'neutral',
  // ordem de servico
  ABERTA: 'info',
  FINALIZADA: 'success',
  CANCELADA: 'neutral',
  // parada
  PENDENTE: 'neutral',
  CONCLUIDA: 'success',
  // comum aos tres
  EM_ANDAMENTO: 'warning',
};

export function tomDoStatus(status: string | null | undefined): TomStatus {
  return (status && TOM_STATUS[status]) || 'neutral';
}

// duas primeiras letras do nome pro avatar ("Maria Souza" -> "MS")
export function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) {
    return '?';
  }
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : partes[0][1] ?? '';
  return (primeira + ultima).toUpperCase();
}

// ---------------------------------------------------------------
// conversoes de data/hora entre a api e os inputs html
// ---------------------------------------------------------------

// api devolve "14:30:00"; o <input type="time"> trabalha com "14:30"
export function horaParaInput(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : '';
}

// o backend aceita "14:30" (LocalTime); campo vazio vira null pra nao mandar string vazia
export function horaParaApi(hora: string | null | undefined): string | null {
  return hora ? hora : null;
}

// "2026-09-20" -> "20/09/2026"
// feito na mao (sem new Date) pra nao correr risco de fuso horario jogar a data pro dia anterior
export function formatarData(data: string | null | undefined): string {
  if (!data) {
    return '—';
  }
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// "14:30:00" -> "14:30"
export function formatarHora(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : '—';
}

// 1234.5 + "USD" -> "US$ 1.234,50" (formato brasileiro, qualquer moeda iso)
export function formatarMoeda(valor: number | null | undefined, moeda: string | null | undefined = 'BRL'): string {
  if (valor === null || valor === undefined) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda || 'BRL' }).format(valor);
  } catch {
    // codigo de moeda desconhecido pelo navegador: mostra o numero com o codigo na frente
    return `${moeda} ${valor.toFixed(2)}`;
  }
}

// texto curto pra identificar um transfer em selects e tabelas
// ex: "#12 · 20/09/2026 14:30 · Aeroporto → Hotel"
export function descreverTransfer(transfer: Transfer): string {
  return `#${transfer.id} · ${formatarData(transfer.dataTransfer)} ${formatarHora(transfer.horaTransfer)}`
    + ` · ${transfer.origem} → ${transfer.destino}`;
}

// texto vazio vira null (campos opcionais do backend esperam null, nao "")
export function textoOuNulo(valor: string | null | undefined): string | null {
  const limpo = valor?.trim();
  return limpo ? limpo : null;
}
