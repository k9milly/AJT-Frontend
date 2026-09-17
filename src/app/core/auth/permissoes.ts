import { Perfil } from '../models/auth.model';

// ---------------------------------------------------------------
// matriz de acesso por perfil (espelho do SecurityConfig do backend)
// ---------------------------------------------------------------
// o backend e quem garante a seguranca (responde 403). esta matriz existe so pra ux:
// esconder botoes e bloquear rotas que o perfil nao pode usar, em vez de deixar o usuario
// clicar e receber erro. se a regra mudar no backend, atualizar aqui tambem.
//
// | recurso                                | leitura | escrita                    | exclusao       |
// |----------------------------------------|---------|----------------------------|----------------|
// | usuarios                               | ADMIN   | ADMIN                      | ADMIN          |
// | motoristas, veiculos, ordens-servico   | todos   | ADMIN, GERENTE             | ADMIN, GERENTE |
// | paradas-os                             | todos   | ADMIN, GERENTE (*)         | ADMIN, GERENTE |
// | passageiros, transfers, pontos-coleta  | todos   | ADMIN, GERENTE, ATENDENTE  | ADMIN, GERENTE |
//
// (*) MOTORISTA pode apenas trocar o status da parada (PATCH so com statusParada)

export type Recurso =
  | 'usuarios'
  | 'motoristas'
  | 'veiculos'
  | 'ordens-servico'
  | 'paradas-os'
  | 'passageiros'
  | 'transfers'
  | 'pontos-coleta';

interface RegraAcesso {
  leitura: Perfil[];
  escrita: Perfil[];
  exclusao: Perfil[];
}

const TODOS: Perfil[] = ['ADMIN', 'GERENTE', 'ATENDENTE', 'MOTORISTA'];
const GESTAO: Perfil[] = ['ADMIN', 'GERENTE'];
const OPERACAO: Perfil[] = ['ADMIN', 'GERENTE', 'ATENDENTE'];

export const MATRIZ_ACESSO: Record<Recurso, RegraAcesso> = {
  'usuarios': { leitura: ['ADMIN'], escrita: ['ADMIN'], exclusao: ['ADMIN'] },
  'motoristas': { leitura: TODOS, escrita: GESTAO, exclusao: GESTAO },
  'veiculos': { leitura: TODOS, escrita: GESTAO, exclusao: GESTAO },
  'ordens-servico': { leitura: TODOS, escrita: GESTAO, exclusao: GESTAO },
  'paradas-os': { leitura: TODOS, escrita: GESTAO, exclusao: GESTAO },
  'passageiros': { leitura: TODOS, escrita: OPERACAO, exclusao: GESTAO },
  'transfers': { leitura: TODOS, escrita: OPERACAO, exclusao: GESTAO },
  'pontos-coleta': { leitura: TODOS, escrita: OPERACAO, exclusao: GESTAO },
};

// perfis que podem trocar so o status de uma parada (alem de quem ja tem escrita completa)
export const PERFIS_STATUS_PARADA: Perfil[] = ['ADMIN', 'GERENTE', 'MOTORISTA'];

export function podeLer(perfil: Perfil | null | undefined, recurso: Recurso): boolean {
  return !!perfil && MATRIZ_ACESSO[recurso].leitura.includes(perfil);
}

export function podeEscrever(perfil: Perfil | null | undefined, recurso: Recurso): boolean {
  return !!perfil && MATRIZ_ACESSO[recurso].escrita.includes(perfil);
}

export function podeExcluir(perfil: Perfil | null | undefined, recurso: Recurso): boolean {
  return !!perfil && MATRIZ_ACESSO[recurso].exclusao.includes(perfil);
}

export function podeAlterarStatusParada(perfil: Perfil | null | undefined): boolean {
  return !!perfil && PERFIS_STATUS_PARADA.includes(perfil);
}
