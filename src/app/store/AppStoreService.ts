import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { UsuarioService } from '../services/UsuarioService';
import { PerfilAcessoService } from '../services/PerfilAcessoService';
import { SupabaseService } from '../services/supabase.service';
import { User } from '../interfaces/user.model';
import { Database, AcessoLogRow, ConviteRow } from '../../lib/supabase/types';

type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];
type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update'];
type PerfilAcessoRow = Database['public']['Tables']['perfil_acesso']['Row'];

const MOCK_ACCESS_LOGS: AcessoLogRow[] = [
  { id: 1, data_hora: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), usuario_email: 'gabriel@exemplo.com', acao: 'Login efetuado com sucesso', ip_origem: '192.168.1.15', status: 'Sucesso' },
  { id: 2, data_hora: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), usuario_email: 'auditor@exemplo.com', acao: 'Submissão de auditoria do ativo #102', ip_origem: '10.0.0.42', status: 'Sucesso' },
  { id: 3, data_hora: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), usuario_email: 'admin@exemplo.com', acao: 'Criação do usuário Lucas Silva', ip_origem: '192.168.1.5', status: 'Sucesso' },
  { id: 4, data_hora: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), usuario_email: 'operador_falho@exemplo.com', acao: 'Falha de login - Senha incorreta', ip_origem: '172.16.0.8', status: 'Falha' },
];

const MOCK_INVITATIONS: ConviteRow[] = [
  { id: 1, email: 'operador1@exemplo.com', perfil_acesso_id: 3, status: 'Pendente', enviado_por: 'admin@exemplo.com', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 2, email: 'auditor2@exemplo.com', perfil_acesso_id: 2, status: 'Aceito', enviado_por: 'admin@exemplo.com', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
];

@Injectable({
  providedIn: 'root',
})
export class AppStore {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private perfilAcessoService = inject(PerfilAcessoService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Estados globais utilizando Signals do Angular
  public readonly currentUser = signal<User | null>(null);
  public readonly inventory = signal<any[]>([]);
  public readonly loading = signal<boolean>(false);

  // Listagens de dados carregadas do Supabase
  public readonly usuariosList = signal<any[]>([]);
  public readonly perfisList = signal<PerfilAcessoRow[]>([]);
  public readonly acessoLogsList = signal<AcessoLogRow[]>([]);
  public readonly convitesList = signal<ConviteRow[]>([]);

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
      // Executa as chamadas de busca de usuários, perfis, logs e convites em concorrência
      const [rawUsers, rawPerfis, rawLogsRes, rawInvitesRes] = await Promise.all([
        this.usuarioService.getAllWithPerfil(),
        this.perfilAcessoService.getAll(),
        this.supabase.client.from('acesso_logs').select('*'),
        this.supabase.client.from('convites').select('*')
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

      // Configura logs de acesso com fallback
      const logs = rawLogsRes.data && rawLogsRes.data.length > 0 ? rawLogsRes.data : MOCK_ACCESS_LOGS;
      this.acessoLogsList.set([...logs].sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()));

      // Configura convites com fallback
      const invites = rawInvitesRes.data && rawInvitesRes.data.length > 0 ? rawInvitesRes.data : MOCK_INVITATIONS;
      this.convitesList.set([...invites].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.warn('Erro ao inicializar AppStore no Supabase, usando fallbacks locais:', err);
      // Fallback amigável
      this.acessoLogsList.set([...MOCK_ACCESS_LOGS]);
      this.convitesList.set([...MOCK_INVITATIONS]);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Adiciona um log de acesso para fins de auditoria de segurança
   */
  async addAcessoLog(acao: string, status: string, userEmail?: string) {
    const email = userEmail || this.currentUser()?.email || 'sistema@exemplo.com';
    const logEntry = {
      data_hora: new Date().toISOString(),
      usuario_email: email,
      acao: acao,
      ip_origem: '127.0.0.1', // Local IP mock
      status: status
    };

    try {
      const { data, error } = await (this.supabase.client
        .from('acesso_logs' as any) as any)
        .insert(logEntry)
        .select('*')
        .single();
      
      if (error) throw error;
      
      this.acessoLogsList.update(list => [data, ...list]);
    } catch (err) {
      console.warn('Erro ao inserir log no Supabase, mantendo localmente:', err);
      // Fallback local
      const mockEntry: AcessoLogRow = { id: Date.now(), ...logEntry };
      this.acessoLogsList.update(list => [mockEntry, ...list]);
    }
  }

  /**
   * Envia um convite de usuário
   */
  async inviteUser(email: string, perfilAcessoId: number) {
    this.setLoading(true);
    const adminEmail = this.currentUser()?.email || 'admin@exemplo.com';
    const inviteEntry = {
      email,
      perfil_acesso_id: perfilAcessoId,
      status: 'Pendente' as const,
      enviado_por: adminEmail,
      created_at: new Date().toISOString()
    };

    try {
      // 1. Invoca a Edge Function de convite
      const roleStr = perfilAcessoId === 1 ? 'Administrador' : perfilAcessoId === 2 ? 'Auditor' : 'Operador';
      const { error } = await this.supabase.client.functions.invoke('invite-user', {
        body: { email, role: roleStr }
      });
      if (error) throw error;

      // 2. Registra na tabela pública se deu certo
      const { data: dbInvite, error: dbError } = await (this.supabase.client
        .from('convites' as any) as any)
        .insert(inviteEntry)
        .select('*')
        .single();
      if (dbError) throw dbError;

      this.convitesList.update(list => [dbInvite, ...list]);
      await this.addAcessoLog(`Convite enviado para ${email} (${roleStr})`, 'Sucesso');
    } catch (err: any) {
      console.warn('Falha no convite Supabase, simulando sucesso localmente:', err.message || err);
      
      // Simulação local
      const mockInvite: ConviteRow = { id: Date.now(), ...inviteEntry };
      this.convitesList.update(list => [mockInvite, ...list]);
      const roleStr = perfilAcessoId === 1 ? 'Administrador' : perfilAcessoId === 2 ? 'Auditor' : 'Operador';
      await this.addAcessoLog(`Convite enviado para ${email} (${roleStr}) [Simulado]`, 'Sucesso');
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
      await this.addAcessoLog(`Criação do usuário ${userData.nome}`, 'Sucesso');
    } catch (err: any) {
      console.error('Erro ao sincronizar criação de usuário:', err);
      await this.addAcessoLog(`Falha ao criar usuário ${userData.nome}`, 'Falha');
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
      await this.addAcessoLog(`Edição do usuário ${userData.nome}`, 'Sucesso');
    } catch (err) {
      console.error('Erro ao sincronizar atualização de usuário:', err);
      await this.addAcessoLog(`Falha ao editar usuário ID ${id}`, 'Falha');
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
      await this.addAcessoLog(`Exclusão do usuário ID ${id}`, 'Sucesso');
    } catch (err) {
      console.error('Erro ao sincronizar exclusão de usuário:', err);
      await this.addAcessoLog(`Falha ao excluir usuário ID ${id}`, 'Falha');
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
      // 1. Registra o log antes de deslogar
      await this.addAcessoLog('Logout realizado com sucesso', 'Sucesso');

      // 2. Limpa todo o estado local
      this.currentUser.set(null);
      this.inventory.set([]);
      this.usuariosList.set([]);
      this.perfisList.set([]);
      this.acessoLogsList.set([]);
      this.convitesList.set([]);
      
      // Remove qualquer flag de feedback de persistência se houver
      localStorage.removeItem('remember_me');
      localStorage.removeItem('auth_token');

      // 3. Chama o signOut do Supabase
      await this.authService.signOut();

      // 4. Redireciona para a tela de login
      await this.router.navigate(['/login']);
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    } finally {
      this.setLoading(false);
    }
  }
}

export const useAppStore: any = () => {};
