import { Database } from './database.types';

// Strict Role definition as specified in requirements
export type Role = 'Gestor' | 'Gerente' | 'Supervisor' | 'Membro Comum';

// Profile corresponds to public.usuarios row with resolved role name
export interface Profile {
  id: string;
  nome: string;
  perfil_acesso_id: number;
  created_at: string;
  perfil: Role;
}

// Consolidates auth details and the user's role profile
export interface User {
  id: string;
  email?: string;
  nome: string;
  profile: Profile;
}
