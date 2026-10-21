import { Perfil } from './auth.model';

// usuario como o backend devolve (UsuarioResponseDTO) em /api/usuarios e /api/auth/me
export interface Usuario {
  id: number;
  nome: string;
  username: string;
  role: Perfil;
  ativo: boolean;
  trocarSenha: boolean;
  ultimoLogin: string | null;
  criadoEm: string;
  // HU07: cadastro de motorista ligado ao usuario (so perfil MOTORISTA); define quais OS ele ve
  motoristaId: number | null;
  // lock otimista do backend (RNF008): reenviar na edicao pra receber 409 se outra pessoa salvou antes
  versao: number;
}

// corpo de criacao/edicao (UsuarioRequestDTO)
// senha e obrigatoria so no cadastro; na edicao, se vier nula a senha atual e mantida
export interface UsuarioRequest {
  nome: string;
  username: string;
  senha: string | null;
  role: Perfil;
  ativo: boolean;
  // so pro perfil MOTORISTA; nulo desfaz o vinculo
  motoristaId: number | null;
  versao?: number;
}
