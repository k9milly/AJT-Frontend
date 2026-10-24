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

// data de hoje no formato da api e do <input type="date"> ("2026-09-20"), no fuso do navegador
// (toISOString usaria UTC e, a noite, ja seria o dia seguinte)
export function hojeLocal(agora: Date = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// "2026-09-20" + "14:30" ja passou? compara no fuso do navegador, minuto a minuto
// (o minuto atual ainda vale, pra nao recusar quem agenda "pra agora")
export function dataHoraNoPassado(data: string, hora: string, agora: Date = new Date()): boolean {
  const quando = new Date(`${data}T${hora.slice(0, 5)}`);
  const inicioDoMinuto = new Date(agora);
  inicioDoMinuto.setSeconds(0, 0);
  return quando.getTime() < inicioDoMinuto.getTime();
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

// "45999990000" -> "(45) 99999-0000" | "4533334444" -> "(45) 3333-4444"
// fora desses tamanhos (ramal, numero estrangeiro) mostra como foi digitado
export function formatarTelefone(telefone: string | null | undefined): string {
  if (!telefone) {
    return '—';
  }
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return telefone;
}

// mascara de cpf conforme se digita: "12345678909" -> "123.456.789-09"
// descarta o que nao e digito e corta em 11 digitos
export function formatarCpf(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, '').slice(0, 11);

  if (digitos.length > 9) {
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  }
  if (digitos.length > 6) {
    return digitos.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  }
  if (digitos.length > 3) {
    return digitos.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  return digitos;
}

// mesma regra do backend (PassageiroService.cpfValido): 11 digitos, nao todos iguais
// e os 2 digitos verificadores conferem; aceita com ou sem pontuacao
export function cpfValido(cpf: string | null | undefined): boolean {
  const digitos = (cpf ?? '').replace(/[.\-\s]/g, '');
  if (!/^\d{11}$/.test(digitos) || new Set(digitos).size === 1) {
    return false;
  }
  const verificador = (quantidade: number) => {
    let soma = 0;
    for (let i = 0; i < quantidade; i++) {
      soma += Number(digitos[i]) * (quantidade + 1 - i);
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return verificador(9) === Number(digitos[9]) && verificador(10) === Number(digitos[10]);
}

// placa sempre no mesmo formato pra "ABC-1234" e "abc1234" nao virarem dois veiculos
// (sem hifen, sem espaco, maiuscula)
export function normalizarPlaca(placa: string | null | undefined): string {
  return (placa ?? '').replace(/[\s-]/g, '').toUpperCase();
}

// texto vazio vira null (campos opcionais do backend esperam null, nao "")
export function textoOuNulo(valor: string | null | undefined): string | null {
  const limpo = valor?.trim();
  return limpo ? limpo : null;
}
