import { Usuario } from '../models/auth.model';

export interface UsuarioMock extends Usuario {
  senha: string;
}

export const USUARIOS_MOCK: UsuarioMock[] = [
  { id: 1, nome: 'Administrador', email: 'admin@ajt.com', senha: '123456', perfil: 'ADMIN' },
  { id: 2, nome: 'Gerente AJT', email: 'gerente@ajt.com', senha: '123456', perfil: 'GERENTE' },
  { id: 3, nome: 'Motorista AJT', email: 'motorista@ajt.com', senha: '123456', perfil: 'MOTORISTA' },
];
