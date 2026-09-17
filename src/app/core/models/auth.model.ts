// ---------------------------------------------------------------
// autenticacao e perfis de acesso
// ---------------------------------------------------------------

// perfis aceitos pelo backend (enum Role); qualquer outro valor devolve 400
export type Perfil = 'ADMIN' | 'GERENTE' | 'ATENDENTE' | 'MOTORISTA';

export const PERFIS: Perfil[] = ['ADMIN', 'GERENTE', 'ATENDENTE', 'MOTORISTA'];

export interface LoginRequest {
  username: string;
  senha: string;
}

// resposta de POST /api/auth/login e de PUT /api/auth/senha
// "expiraEm" vem em segundos; "trocarSenha" true obriga a ir pra tela de troca antes de usar o painel
export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEm: number;
  username: string;
  role: Perfil;
  trocarSenha: boolean;
}

export interface TrocaSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

// o que o front guarda da sessao no localStorage
// "expiraEmMs" e o instante absoluto (Date.now() + expiraEm) pra saber se o token venceu sem chamar a api
// "nome" so existe depois do GET /api/auth/me (o login nao devolve o nome)
export interface Sessao {
  token: string;
  username: string;
  role: Perfil;
  trocarSenha: boolean;
  expiraEmMs: number;
  nome?: string;
}
