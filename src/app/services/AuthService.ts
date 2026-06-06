import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User, Profile, Role } from '../interfaces/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = (() => {
    try {
      return inject(SupabaseService);
    } catch {
      return new SupabaseService();
    }
  })();

  /**
   * Realiza o login com e-mail e senha
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Realiza o logout no Supabase
   */
  async signOut() {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;
  }

  /**
   * Envia e-mail de recuperação de senha
   */
  async resetPassword(email: string): Promise<any> {
    const redirectTo = `${window.location.origin}/update-password`;
    const { data, error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Reenvia o e-mail de confirmação de cadastro
   */
  async resendConfirmationEmail(email: string): Promise<any> {
    const redirectTo = `${window.location.origin}/login`;
    const { data, error } = await this.supabase.client.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    return data;
  }

  /**
   * Atualiza os dados do usuário autenticado (como a senha)
   */
  async updatePassword(password: string): Promise<any> {
    const { data, error } = await this.supabase.client.auth.updateUser({
      password,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Obtém o usuário atual autenticado e carrega seu perfil público correspondente
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error: userError } = await this.supabase.client.auth.getUser();
    if (userError || !user) {
      return null;
    }

    // Busca o perfil na tabela usuarios
    const { data: perfilData, error: perfilError } = await (this.supabase.client
      .from('usuarios')
      .select('id, nome, perfil_acesso_id, created_at, perfil_acesso(id, nome)')
      .eq('id', user.id)
      .maybeSingle() as any);

    if (perfilError) {
      console.error('Erro ao carregar perfil do usuário:', perfilError);
    }

    // Se o perfil público não existir, cria um perfil padrão para evitar erros no frontend
    if (!perfilData) {
      const defaultRole: Role = 'Membro Comum';
      const defaultProfile: Profile = {
        id: user.id,
        nome: user.email?.split('@')[0] || 'Usuário',
        perfil_acesso_id: 4, // ID padrão para Membro Comum ou similar
        created_at: new Date().toISOString(),
        perfil: defaultRole,
      };

      return {
        id: user.id,
        email: user.email,
        nome: defaultProfile.nome,
        profile: defaultProfile,
      };
    }

    // Extrai o nome do perfil de acesso resolvido pela relação
    // Trata perfil_acesso como qualquer/tipo adequado já que o supabase-js pode retornar arrays ou objetos
    const perfilAcessoObj = perfilData.perfil_acesso as any;
    let resolvedRole: Role = 'Membro Comum';
    if (perfilAcessoObj && perfilAcessoObj.nome) {
      resolvedRole = perfilAcessoObj.nome as Role;
    }

    const profile: Profile = {
      id: perfilData.id,
      nome: perfilData.nome,
      perfil_acesso_id: perfilData.perfil_acesso_id,
      created_at: perfilData.created_at,
      perfil: resolvedRole,
    };

    return {
      id: user.id,
      email: user.email,
      nome: profile.nome,
      profile: profile,
    };
  }
}
