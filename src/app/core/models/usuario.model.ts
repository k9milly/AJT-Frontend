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
}

// corpo de criacao/edicao (UsuarioRequestDTO)
// senha e obrigatoria so no cadastro; na edicao, se vier nula a senha atual e mantida
export interface UsuarioRequest {
  nome: string;
  username: string;
  senha: string | null;
  role: Perfil;
  ativo: boolean;
}
