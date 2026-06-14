import { Injectable } from '@angular/core';
import { ApiClient } from './api.client';
import { User, Profile, Role } from '../interfaces/user.model';

export interface BackendUserInfo {
  id: string;
  email: string;
  role: string;
  equipeId: string | null;
}

export interface BackendAuthResponse {
  token: string;
  user: BackendUserInfo;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Realiza o login com e-mail e senha no Spring Boot
   */
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await ApiClient.post<BackendAuthResponse>('/api/auth/login', {
      email,
      password,
    });

    if (!res || !res.token) {
      throw new Error('Resposta de autenticação inválida.');
    }

    // Salva o token no localStorage
    localStorage.setItem('auth_token', res.token);

    const user = this.mapBackendUser(res.user);
    return { user, token: res.token };
  }

  /**
   * Realiza o logout
   */
  async signOut(): Promise<void> {
    localStorage.removeItem('auth_token');
  }

  /**
   * Envia e-mail de recuperação de senha
   */
  async resetPassword(email: string): Promise<void> {
    await ApiClient.post('/api/auth/recover-password', { email });
  }

  /**
   * Reenvia o e-mail de confirmação de cadastro (Simulado para compatibilidade)
   */
  async resendConfirmationEmail(email: string): Promise<any> {
    return { success: true, message: 'Confirmação reenviada (simulado).' };
  }

  /**
   * Atualiza os dados do usuário autenticado (Simulado para compatibilidade)
   */
  async updatePassword(password: string): Promise<any> {
    return { success: true, message: 'Senha atualizada com sucesso (simulado).' };
  }

  /**
   * Obtém o usuário atual autenticado e carrega seu perfil público correspondente
   */
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    try {
      const userInfo = await ApiClient.get<BackendUserInfo>('/api/auth/me');
      return this.mapBackendUser(userInfo);
    } catch (err) {
      console.error('Erro ao carregar usuário atual do Spring Boot:', err);
      // Se falhar o /me, provavelmente o token é inválido ou expirou.
      localStorage.removeItem('auth_token');
      return null;
    }
  }

  /**
   * Helper para mapear o usuário retornado pelo back-end para o modelo do front-end
   */
  private mapBackendUser(userInfo: BackendUserInfo): User {
    const nome = userInfo.email.split('@')[0] || 'Usuário';

    // Mapeamento de perfis de acesso:
    // GESTOR -> Gestor (id: 1)
    // ENCARREGADO -> Auditor / Gerente (id: 2)
    // ANALISTA -> Supervisor (id: 3)
    // VISUALIZADOR -> Membro Comum (id: 4)
    let profileRole: Role = 'Membro Comum';
    let profileId = 4;

    if (userInfo.role === 'GESTOR') {
      profileRole = 'Gestor';
      profileId = 1;
    } else if (userInfo.role === 'ENCARREGADO') {
      // Usaremos 'Auditor' para passar pelas checagens de permissão de auditorias
      profileRole = 'Auditor' as any;
      profileId = 2;
    } else if (userInfo.role === 'ANALISTA') {
      profileRole = 'Supervisor';
      profileId = 3;
    }

    const profile: Profile = {
      id: userInfo.id,
      nome: nome,
      perfil_acesso_id: profileId,
      created_at: new Date().toISOString(),
      perfil: profileRole,
      tema: 'light',
      ativo: true,
    };

    return {
      id: userInfo.id,
      email: userInfo.email,
      nome: nome,
      profile: profile,
    };
  }
}
