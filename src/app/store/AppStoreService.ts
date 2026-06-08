import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { UsuarioService } from '../services/UsuarioService';
import { PerfilAcessoService } from '../services/PerfilAcessoService';
import { User } from '../interfaces/user.model';
import { Database } from '../../lib/supabase/types';

type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];
type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];
type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update'];
type PerfilAcessoRow = Database['public']['Tables']['perfil_acesso']['Row'];

@Injectable({
  providedIn: 'root',
})
export class AppStore {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private perfilAcessoService = inject(PerfilAcessoService);
  private router = inject(Router);

  // Estados globais utilizando Signals do Angular
  public readonly currentUser = signal<User | null>(null);
  public readonly inventory = signal<any[]>([]);
  public readonly loading = signal<boolean>(false);

  // Listagens de dados carregadas do Supabase
  public readonly usuariosList = signal<any[]>([]);
  public readonly perfisList = signal<PerfilAcessoRow[]>([]);

  /**
   * Define o usuário atual logado
   */
  setCurrentUser(user: User | null) {
    this.currentUser.set(user);
  }

  /**
   * Define os dados do inventário local
   */
  setInventory(items: any[]) {
    this.inventory.set(items);
  }

  /**
   * Define o estado de carregamento
   */
  setLoading(value: boolean) {
    this.loading.set(value);
  }

  /**
   * Inicializa a Store carregando todas as tabelas principais em um único Promise.all
   */
  async initializeStore(): Promise<void> {
    this.setLoading(true);
    try {
      // Executa as chamadas de busca de usuários e perfis em concorrência
      const [rawUsers, rawPerfis] = await Promise.all([
        this.usuarioService.getAllWithPerfil(),
        this.perfilAcessoService.getAll(),
      ]);

      // Mapeia perfis
      this.perfisList.set(rawPerfis);

      // Mapeia os dados brutos de usuários para interfaces TypeScript limpas no Signal
      const mappedUsers = rawUsers.map((item: any) => {
        const perfilAcessoObj = item.perfil_acesso as any;
        return {
          id: item.id,
          nome: item.nome,
          perfil_acesso_id: item.perfil_acesso_id,
          created_at: item.created_at,
          perfil_nome: (perfilAcessoObj && perfilAcessoObj.nome) ? perfilAcessoObj.nome : 'Membro Comum',
          perfil_acesso: perfilAcessoObj,
        };
      });

      this.usuariosList.set(mappedUsers.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error('Erro na inicialização simultânea da AppStore:', err);
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Cria um usuário no banco e sincroniza o estado local imediatamente
   */
  async syncCreateUsuario(userData: UsuarioInsert): Promise<void> {
    this.setLoading(true);
    try {
      const createdUser = await this.usuarioService.create(userData);

      // Mapeia e resolve o perfil localmente a partir de perfisList
      const profile = this.perfisList().find(p => p.id === createdUser.perfil_acesso_id);
      const mappedUser = {
        id: createdUser.id,
        nome: createdUser.nome,
        perfil_acesso_id: createdUser.perfil_acesso_id,
        created_at: createdUser.created_at,
        perfil_nome: profile ? profile.nome : 'Membro Comum',
        perfil_acesso: profile ? { id: profile.id, nome: profile.nome } : null,
      };

      // Atualiza a listagem local
      this.usuariosList.update(list => [...list, mappedUser].sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error('Erro ao sincronizar criação de usuário:', err);
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Atualiza um usuário no banco e sincroniza o estado local imediatamente
   */
  async syncUpdateUsuario(id: string, userData: UsuarioUpdate): Promise<void> {
    this.setLoading(true);
    try {
      const updatedUser = await this.usuarioService.update(id, userData);

      // Mapeia e resolve o perfil localmente a partir de perfisList
      const profile = this.perfisList().find(p => p.id === updatedUser.perfil_acesso_id);
      const mappedUser = {
        id: updatedUser.id,
        nome: updatedUser.nome,
        perfil_acesso_id: updatedUser.perfil_acesso_id,
        created_at: updatedUser.created_at,
        perfil_nome: profile ? profile.nome : 'Membro Comum',
        perfil_acesso: profile ? { id: profile.id, nome: profile.nome } : null,
      };

      // Sincroniza localmente
      this.usuariosList.update(list => 
        list.map(u => u.id === id ? mappedUser : u).sort((a, b) => a.nome.localeCompare(b.nome))
      );
    } catch (err) {
      console.error('Erro ao sincronizar atualização de usuário:', err);
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Exclui um usuário no banco e remove do estado local instantaneamente
   */
  async syncDeleteUsuario(id: string): Promise<void> {
    this.setLoading(true);
    try {
      await this.usuarioService.delete(id);

      // Sincroniza localmente
      this.usuariosList.update(list => list.filter(u => u.id !== id));
    } catch (err) {
      console.error('Erro ao sincronizar exclusão de usuário:', err);
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Realiza o logout: limpa todo o estado local ANTES de chamar o signOut do Supabase
   */
  async logout() {
    this.setLoading(true);
    try {
      // 1. Limpa todo o estado local
      this.currentUser.set(null);
      this.inventory.set([]);
      this.usuariosList.set([]);
      this.perfisList.set([]);
      
      // Remove qualquer flag de feedback de persistência se houver
      localStorage.removeItem('remember_me');

      // 2. Chama o signOut do Supabase
      await this.authService.signOut();

      // 3. Redireciona para a tela de login
      await this.router.navigate(['/login']);
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    } finally {
      this.setLoading(false);
    }
  }
}
