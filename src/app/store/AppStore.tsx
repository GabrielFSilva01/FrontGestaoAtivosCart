import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { User } from '../interfaces/user.model';
import {
  Database,
  TreeNode,
  InventoryItem,
  DepartamentoRow,
  CategoriaRow,
  TipoRow,
  LinhaRow,
  MarcaRow,
  ProdutoRow,
  EstoqueRow,
  SaldoEstoqueRow,
  MovimentoEstoqueRow,
  EquipesRow,
  ReparoRow,
  FornecedorRow,
  ImagemProdutoRow,
  UsuariosEquipesRow,
  ItemHistoryRow,
  AcessoLogRow,
  ConviteRow
} from '../../lib/supabase/types';
import { UsuarioService } from '../services/UsuarioService';
import { PerfilAcessoService } from '../services/PerfilAcessoService';
import { AuthService } from '../services/AuthService';
import { SupabaseService } from '../services/supabase.service';

type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];
type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update'];
type PerfilAcessoRow = Database['public']['Tables']['perfil_acesso']['Row'];

// Re-export original Angular AppStore for compilation and runtime compatibility
export * from './AppStoreService';

export interface AppStoreContextType {
  currentUser: User | null;
  inventory: InventoryItem[];
  loading: boolean;
  usuariosList: any[];
  perfisList: PerfilAcessoRow[];

  // Raw table states
  departamentoList: DepartamentoRow[];
  categoriaList: CategoriaRow[];
  tipoList: TipoRow[];
  linhaList: LinhaRow[];
  marcaList: MarcaRow[];
  produtoList: ProdutoRow[];
  estoqueList: EstoqueRow[];
  saldoEstoqueList: SaldoEstoqueRow[];
  movimentoEstoqueList: MovimentoEstoqueRow[];
  equipesList: EquipesRow[];
  reparoList: ReparoRow[];
  fornecedorList: FornecedorRow[];
  imagemProdutoList: ImagemProdutoRow[];
  usuariosEquipesList: UsuariosEquipesRow[];
  itemHistoryList: ItemHistoryRow[];
  acessoLogsList: AcessoLogRow[];
  convitesList: ConviteRow[];

  // Mapped Trees & Badge Counts
  mercadologicalTree: TreeNode[];
  nodeItemCounts: Map<string, number>;

  // Actions / Mutations
  setCurrentUser: (user: User | null) => void;
  setInventory: (items: InventoryItem[]) => void;
  setLoading: (value: boolean) => void;
  initializeStore: () => Promise<void>;

  addInventoryItem: (item: {
    type: 'ativo' | 'lote';
    produtoId: number;
    numeroPatrimonio?: string;
    condicao?: string;
    status?: string;
    equipeId?: number | null;
    quantidade?: number;
    tipoConsumo?: string;
  }) => Promise<void>;

  updateInventoryItem: (
    id: string | number,
    type: 'ativo' | 'lote',
    updates: {
      condicao?: string;
      status?: string;
      equipeId?: number | null;
      quantidade?: number;
    }
  ) => Promise<void>;

  initiateTransfer: (
    itemId: string | number,
    fromTeamId: string | number | null,
    toTeamId: string | number
  ) => Promise<void>;

  submitAudit: (
    itemId: number,
    condicao: string,
    status: string,
    auditorName: string,
    notas: string,
    fotoUrl: string | null,
    assinaturaUrl: string
  ) => Promise<void>;

  syncCreateUsuario: (userData: UsuarioInsert) => Promise<void>;
  syncUpdateUsuario: (id: string, userData: UsuarioUpdate) => Promise<void>;
  syncDeleteUsuario: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  addAcessoLog: (acao: string, status: string, userEmail?: string) => Promise<void>;
  inviteUser: (email: string, perfilAcessoId: number) => Promise<void>;
}

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

const AppContext = createContext<AppStoreContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoadingState] = useState<boolean>(false);
  const [usuariosList, setUsuariosListState] = useState<any[]>([]);
  const [perfisList, setPerfisListState] = useState<PerfilAcessoRow[]>([]);


  const [departamentoList, setDepartamentoList] = useState<DepartamentoRow[]>([]);
  const [categoriaList, setCategoriaList] = useState<CategoriaRow[]>([]);
  const [tipoList, setTipoList] = useState<TipoRow[]>([]);
  const [linhaList, setLinhaList] = useState<LinhaRow[]>([]);
  const [marcaList, setMarcaList] = useState<MarcaRow[]>([]);
  const [produtoList, setProdutoList] = useState<ProdutoRow[]>([]);
  const [estoqueList, setEstoqueList] = useState<EstoqueRow[]>([]);
  const [saldoEstoqueList, setSaldoEstoqueList] = useState<SaldoEstoqueRow[]>([]);
  const [movimentoEstoqueList, setMovimentoEstoqueList] = useState<MovimentoEstoqueRow[]>([]);
  const [equipesList, setEquipesList] = useState<EquipesRow[]>([]);
  const [reparoList, setReparoList] = useState<ReparoRow[]>([]);
  const [fornecedorList, setFornecedorList] = useState<FornecedorRow[]>([]);
  const [imagemProdutoList, setImagemProdutoList] = useState<ImagemProdutoRow[]>([]);
  const [usuariosEquipesList, setUsuariosEquipesList] = useState<UsuariosEquipesRow[]>([]);
  const [itemHistoryList, setItemHistoryList] = useState<ItemHistoryRow[]>([]);
  const [acessoLogsList, setAcessoLogsList] = useState<AcessoLogRow[]>([]);
  const [convitesList, setConvitesList] = useState<ConviteRow[]>([]);

  // Services
  const supabase = useMemo(() => new SupabaseService(), []);
  const usuarioService = useMemo(() => new UsuarioService(), []);
  const perfilAcessoService = useMemo(() => new PerfilAcessoService(), []);
  const authService = useMemo(() => new AuthService(), []);

  const setCurrentUser = (user: User | null) => setCurrentUserState(user);
  const setLoading = (value: boolean) => setLoadingState(value);


  useEffect(() => {
    if (currentUser) {
      const profile = currentUser.profile as any;
      if (profile) {
        if (profile.active === false || profile.ativo === false) {
          console.warn('Sessão encerrada por inatividade cadastrada.');
          logout();
          return;
        }

        const theme = profile.tema || 'light';
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, [currentUser]);

  // Load session on mount to restore persistent user states
  useEffect(() => {
    const loadSession = async () => {
      setLoadingState(true);
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUserState(user);
          await initializeStore();
        }
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
      } finally {
        setLoadingState(false);
      }
    };
    loadSession();
  }, []);


  const fetchTable = async <K extends keyof Database['public']['Tables']>(
    tableName: K
  ): Promise<Database['public']['Tables'][K]['Row'][]> => {
    try {
      const { data, error } = await (supabase.client.from(tableName as any) as any).select('*');
      if (error) {
        console.warn(`Erro no banco do Supabase para a tabela ${tableName}:`, error.message);
        return [];
      }
      return data || [];
    } catch (e: any) {
      console.warn(`Exception ao carregar tabela ${tableName}:`, e.message || e);
      return [];
    }
  };


  const initializeStore = async () => {
    setLoadingState(true);
    try {

      const [
        rawUsers,
        rawPerfis,
        rawDepartamentos,
        rawCategorias,
        rawLogs,
        rawInvites
      ] = await Promise.all([
        usuarioService.getAllWithPerfil(),
        perfilAcessoService.getAll(),
        fetchTable('departamento'),
        fetchTable('categoria'),
        fetchTable('acesso_logs'),
        fetchTable('convites')
      ]);

      setPerfisListState(rawPerfis);
      setDepartamentoList(rawDepartamentos as DepartamentoRow[]);
      setCategoriaList(rawCategorias as CategoriaRow[]);

      const logs = rawLogs && rawLogs.length > 0 ? rawLogs : MOCK_ACCESS_LOGS;
      setAcessoLogsList((logs as AcessoLogRow[]).sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()));

      const invites = rawInvites && rawInvites.length > 0 ? rawInvites : MOCK_INVITATIONS;
      setConvitesList((invites as ConviteRow[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // Map users list
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
      setUsuariosListState(mappedUsers.sort((a, b) => a.nome.localeCompare(b.nome)));

      // Release UI immediately
      setLoadingState(false);

      // PHASE 2: Fetch and load remaining sub-level hierarchical tables asynchronously
      Promise.all([
        fetchTable('tipo'),
        fetchTable('linha'),
        fetchTable('marca'),
        fetchTable('produto'),
        fetchTable('estoque'),
        fetchTable('saldo_estoque'),
        fetchTable('movimento_estoque'),
        fetchTable('equipes'),
        fetchTable('reparo'),
        fetchTable('fornecedor'),
        fetchTable('imagem_produto'),
        fetchTable('usuarios_equipes'),
        fetchTable('item_history')
      ]).then(([
        rawTipos,
        rawLinhas,
        rawMarcas,
        rawProdutos,
        rawEstoque,
        rawSaldoEstoque,
        rawMovimentos,
        rawEquipes,
        rawReparos,
        rawFornecedores,
        rawImagens,
        rawUserTeams,
        rawItemHistory
      ]) => {
        setTipoList(rawTipos as TipoRow[]);
        setLinhaList(rawLinhas as LinhaRow[]);
        setMarcaList(rawMarcas as MarcaRow[]);
        setProdutoList(rawProdutos as ProdutoRow[]);
        setEstoqueList(rawEstoque as EstoqueRow[]);
        setSaldoEstoqueList(rawSaldoEstoque as SaldoEstoqueRow[]);
        setMovimentoEstoqueList(rawMovimentos as MovimentoEstoqueRow[]);
        setEquipesList(rawEquipes as EquipesRow[]);
        setReparoList(rawReparos as ReparoRow[]);
        setFornecedorList(rawFornecedores as FornecedorRow[]);
        setImagemProdutoList(rawImagens as ImagemProdutoRow[]);
        setUsuariosEquipesList(rawUserTeams as UsuariosEquipesRow[]);
        setItemHistoryList(rawItemHistory as ItemHistoryRow[]);
      }).catch(e => {
        console.error('Erro na hidratação em background das sub-tabelas:', e);
      });

    } catch (err) {
      console.error('Erro na inicialização da AppStore:', err);
      setLoadingState(false);
      throw err;
    }
  };

  // Strictly Typed Discriminated Union Tree Mapper
  const mercadologicalTree = useMemo<TreeNode[]>(() => {
    const tree: TreeNode[] = [];

    // Level 1: Departamento (parentId is null)
    departamentoList.forEach(d => {
      tree.push({ type: 'departamento', level: 1, id: d.id, nome: d.nome, parentId: null });
    });

    // Level 2: Categoria (parentId is departamento_id)
    categoriaList.forEach(c => {
      tree.push({ type: 'categoria', level: 2, id: c.id, nome: c.nome, parentId: c.departamento_id });
    });

    // Level 3: Tipo (parentId is categoria_id)
    tipoList.forEach(t => {
      tree.push({ type: 'tipo', level: 3, id: t.id, nome: t.nome, parentId: t.categoria_id });
    });

    // Level 4: Linha (parentId is tipo_id)
    linhaList.forEach(l => {
      tree.push({ type: 'linha', level: 4, id: l.id, nome: l.nome, parentId: l.tipo_id });
    });

    // Level 5: Marca (parentId is linha_id)
    marcaList.forEach(m => {
      tree.push({ type: 'marca', level: 5, id: m.id, nome: m.nome, parentId: m.linha_id });
    });

    return tree;
  }, [departamentoList, categoriaList, tipoList, linhaList, marcaList]);

  // Dynamic Programming / Bottom-up pre-calculation for tree node total inventory badge counts
  const nodeItemCounts = useMemo(() => {
    const counts = new Map<string, number>();

    // 1. Calculate count for each product (ativos count + lotes quantities sum)
    const productCounts = new Map<number, number>();
    produtoList.forEach(p => {
      const activeCount = estoqueList.filter(e => e.produto_id === p.id).length;
      const loteCount = saldoEstoqueList
        .filter(s => s.produto_id === p.id)
        .reduce((sum, s) => sum + (s.quantidade || 0), 0);
      productCounts.set(p.id, activeCount + loteCount);
    });

    // 2. Sum for Brands (level 5)
    marcaList.forEach(m => {
      const products = produtoList.filter(p => p.marca_id === m.id);
      const total = products.reduce((sum, p) => sum + (productCounts.get(p.id) || 0), 0);
      counts.set(`marca-${m.id}`, total);
    });

    // 3. Sum for Linhas (level 4)
    linhaList.forEach(l => {
      const marcas = marcaList.filter(m => m.linha_id === l.id);
      const total = marcas.reduce((sum, m) => sum + (counts.get(`marca-${m.id}`) || 0), 0);
      counts.set(`linha-${l.id}`, total);
    });

    // 4. Sum for Tipos (level 3)
    tipoList.forEach(t => {
      const linhas = linhaList.filter(l => l.tipo_id === t.id);
      const total = linhas.reduce((sum, l) => sum + (counts.get(`linha-${l.id}`) || 0), 0);
      counts.set(`tipo-${t.id}`, total);
    });

    // 5. Sum for Categorias (level 2)
    categoriaList.forEach(c => {
      const tipos = tipoList.filter(t => t.categoria_id === c.id);
      const total = tipos.reduce((sum, t) => sum + (counts.get(`tipo-${t.id}`) || 0), 0);
      counts.set(`categoria-${c.id}`, total);
    });

    // 6. Sum for Departamentos (level 1)
    departamentoList.forEach(d => {
      const categorias = categoriaList.filter(c => c.departamento_id === d.id);
      const total = categorias.reduce((sum, c) => sum + (counts.get(`categoria-${c.id}`) || 0), 0);
      counts.set(`departamento-${d.id}`, total);
    });

    return counts;
  }, [
    departamentoList,
    categoriaList,
    tipoList,
    linhaList,
    marcaList,
    produtoList,
    estoqueList,
    saldoEstoqueList
  ]);

  // Hybrid Inventory Mappings
  const inventory = useMemo<InventoryItem[]>(() => {
    const items: InventoryItem[] = [];

    // Map estoque (ativos)
    estoqueList.forEach(item => {
      const product = produtoList.find(p => p.id === item.produto_id);
      const image = imagemProdutoList.find(img => img.produto_id === item.produto_id);
      const itemRepairs = reparoList.filter(r => r.estoque_id === item.id);

      const custoReparos = itemRepairs.reduce((sum, r) => sum + (r.custo || 0), 0);
      const repairStatus = itemRepairs.length > 0 ? itemRepairs[0].status : null;

      items.push({
        id: item.id,
        type: 'ativo',
        produtoId: item.produto_id,
        nome: product ? product.nome : 'Ativo Desconhecido',
        preco: product ? product.preco : 0,
        fotoUrl: image ? image.url : null,
        numeroPatrimonio: item.numero_patrimonio,
        condicao: item.condicao,
        status: item.status,
        equipeId: item.equipe_id,
        custosManutencao: custoReparos,
        statusManutencao: repairStatus
      });
    });

    // Map saldo_estoque (lotes)
    saldoEstoqueList.forEach(item => {
      const product = produtoList.find(p => p.id === item.produto_id);
      const image = imagemProdutoList.find(img => img.produto_id === item.produto_id);

      items.push({
        id: item.id,
        type: 'lote',
        produtoId: item.produto_id,
        nome: product ? product.nome : 'Lote Desconhecido',
        preco: product ? product.preco : 0,
        fotoUrl: image ? image.url : null,
        quantidade: item.quantidade
      });
    });

    return items;
  }, [estoqueList, saldoEstoqueList, produtoList, imagemProdutoList, reparoList]);

  const setInventoryStateWrapper = (items: InventoryItem[]) => {
    // Wrapper for compatibility, state is calculated reactively by useMemo
  };

  // MUTATIONS (SYNC)
  const addInventoryItem = async (item: {
    type: 'ativo' | 'lote';
    produtoId: number;
    numeroPatrimonio?: string;
    condicao?: string;
    status?: string;
    equipeId?: number | null;
    quantidade?: number;
    tipoConsumo?: string;
  }) => {
    setLoadingState(true);
    try {
      if (item.type === 'ativo') {
        const { error } = await (supabase.client.from('estoque' as any) as any).insert({
          produto_id: item.produtoId,
          numero_patrimonio: item.numeroPatrimonio,
          condicao: item.condicao || 'bom',
          status: item.status || 'ativo',
          equipe_id: item.equipeId || null
        });
        if (error) throw error;

        await (supabase.client.from('movimento_estoque' as any) as any).insert({
          produto_id: item.produtoId,
          tipo_movimentacao: 'entrada_ativo',
          quantidade: 1
        });
      } else {
        const { data: existing, error: findError } = await (supabase.client
          .from('saldo_estoque' as any) as any)
          .select('*')
          .eq('produto_id', item.produtoId)
          .maybeSingle();
        if (findError) throw findError;

        if (existing) {
          const { error } = await (supabase.client
            .from('saldo_estoque' as any) as any)
            .update({ quantidade: (existing.quantidade || 0) + (item.quantidade || 0) })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await (supabase.client.from('saldo_estoque' as any) as any).insert({
            produto_id: item.produtoId,
            quantidade: item.quantidade || 1,
            tipo_consumo: item.tipoConsumo || 'consumo'
          });
          if (error) throw error;
        }

        await (supabase.client.from('movimento_estoque' as any) as any).insert({
          produto_id: item.produtoId,
          tipo_movimentacao: 'entrada_lote',
          quantidade: item.quantidade || 1
        });
      }

      // Reload states in non-blocking way
      await initializeStore();
    } catch (err) {
      console.error('Erro ao adicionar item de inventário:', err);
      throw err;
    } finally {
      setLoadingState(false);
    }
  };

  const updateInventoryItem = async (
    id: string | number,
    type: 'ativo' | 'lote',
    updates: {
      condicao?: string;
      status?: string;
      equipeId?: number | null;
      quantidade?: number;
    }
  ) => {
    setLoadingState(true);
    try {
      if (type === 'ativo') {
        const { error } = await (supabase.client
          .from('estoque' as any) as any)
          .update({
            condicao: updates.condicao,
            status: updates.status,
            equipe_id: updates.equipeId
          })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.client
          .from('saldo_estoque' as any) as any)
          .update({
            quantidade: updates.quantidade
          })
          .eq('id', id);
        if (error) throw error;
      }
      await initializeStore();
    } catch (err) {
      console.error('Erro ao atualizar item de inventário:', err);
      throw err;
    } finally {
      setLoadingState(false);
    }
  };

  const initiateTransfer = async (
    itemId: string | number,
    fromTeamId: string | number | null,
    toTeamId: string | number
  ) => {
    setLoadingState(true);
    try {
      const { data: itemData, error: updateError } = await (supabase.client
        .from('estoque' as any) as any)
        .update({ equipe_id: toTeamId })
        .eq('id', itemId)
        .select('*')
        .single();
      if (updateError) throw updateError;

      await (supabase.client.from('movimento_estoque' as any) as any).insert({
        produto_id: itemData.produto_id,
        tipo_movimentacao: 'transferencia',
        quantidade: 1
      });
      await initializeStore();
    } catch (err) {
      console.error('Erro ao transferir item de inventário:', err);
      throw err;
    } finally {
      setLoadingState(false);
    }
  };

  const submitAudit = async (
    itemId: number,
    condicao: string,
    status: string,
    auditorName: string,
    notas: string,
    fotoUrl: string | null,
    assinaturaUrl: string
  ) => {
    const isAuditor = (currentUser?.profile?.perfil as string) === 'Auditor' || (currentUser?.profile?.perfil as string) === 'Gestor';
    if (!isAuditor) {
      throw new Error('Permissão negada: Apenas auditores autorizados podem concluir auditorias.');
    }

    setLoadingState(true);
    try {
      const updatePromise = (supabase.client.from('estoque' as any) as any)
        .update({ condicao, status })
        .eq('id', itemId);

      const historyPromise = (supabase.client.from('item_history' as any) as any)
        .insert({
          estoque_id: itemId,
          data_hora: new Date().toISOString(),
          responsavel: auditorName,
          acao: 'Auditoria',
          notas: `${notas || ''}${fotoUrl ? ` [Foto: ${fotoUrl}]` : ''}${assinaturaUrl ? ` [Assinado]` : ''}`
        });

      const [updateRes, historyRes] = await Promise.all([updatePromise, historyPromise]);

      if (updateRes.error) throw updateRes.error;
      if (historyRes.error) throw historyRes.error;

      await initializeStore();
      await addAcessoLog(`Auditoria submetida para ativo #${itemId}`, 'Sucesso');
    } catch (err: any) {
      console.error('Erro ao submeter auditoria:', err);
      await addAcessoLog(`Falha ao submeter auditoria para ativo #${itemId}`, 'Falha');
      throw err;
    } finally {
      setLoadingState(false);
    }
  };

  const addAcessoLog = async (acao: string, status: string, userEmail?: string) => {
    const email = userEmail || currentUser?.email || 'sistema@exemplo.com';
    const logEntry = {
      data_hora: new Date().toISOString(),
      usuario_email: email,
      acao: acao,
      ip_origem: '127.0.0.1',
      status: status
    };

    try {
      const { data, error } = await (supabase.client
        .from('acesso_logs' as any) as any)
        .insert(logEntry)
        .select('*')
        .single();
      
      if (error) throw error;
      
      setAcessoLogsList(list => [data as AcessoLogRow, ...list]);
    } catch (err) {
      console.warn('Erro ao inserir log no Supabase, mantendo localmente:', err);
      const mockEntry: AcessoLogRow = { id: Date.now(), ...logEntry };
      setAcessoLogsList(list => [mockEntry, ...list]);
    }
  };

  const inviteUser = async (email: string, perfilAcessoId: number) => {
    setLoadingState(true);
    const adminEmail = currentUser?.email || 'admin@exemplo.com';
    const inviteEntry = {
      email,
      perfil_acesso_id: perfilAcessoId,
      status: 'Pendente' as const,
      enviado_por: adminEmail,
      created_at: new Date().toISOString()
    };

    try {
      const roleStr = perfilAcessoId === 1 ? 'Administrador' : perfilAcessoId === 2 ? 'Auditor' : 'Operador';
      
      let error = null;
      if (supabase.client.functions && typeof supabase.client.functions.invoke === 'function') {
        const res = await supabase.client.functions.invoke('invite-user', {
          body: { email, role: roleStr }
        });
        error = res.error;
      } else {
        error = new Error('Auth Admin Endpoint Offline');
      }
      
      if (error) throw error;

      const { data: dbInvite, error: dbError } = await (supabase.client
        .from('convites' as any) as any)
        .insert(inviteEntry)
        .select('*')
        .single();
      if (dbError) throw dbError;

      setConvitesList(list => [dbInvite as ConviteRow, ...list]);
      await addAcessoLog(`Convite enviado para ${email} (${roleStr})`, 'Sucesso');
    } catch (err: any) {
      console.warn('Falha no convite Supabase, simulando sucesso localmente:', err.message || err);
      const mockInvite: ConviteRow = { id: Date.now(), ...inviteEntry };
      setConvitesList(list => [mockInvite, ...list]);
      const roleStr = perfilAcessoId === 1 ? 'Administrador' : perfilAcessoId === 2 ? 'Auditor' : 'Operador';
      await addAcessoLog(`Convite enviado para ${email} (${roleStr}) [Simulado]`, 'Sucesso');
    } finally {
      setLoadingState(false);
    }
  };

  const syncCreateUsuario = async (userData: UsuarioInsert) => {
    setLoadingState(true);
    try {
      const createdUser = await usuarioService.create(userData);
      const profile = perfisList.find(p => p.id === createdUser.perfil_acesso_id);
      const mappedUser = {
        id: createdUser.id,
        nome: createdUser.nome,
        perfil_acesso_id: createdUser.perfil_acesso_id,
        created_at: createdUser.created_at,
        perfil_nome: profile ? profile.nome : 'Membro Comum',
        perfil_acesso: profile ? { id: profile.id, nome: profile.nome } : null,
      };

      setUsuariosListState(list => [...list, mappedUser].sort((a, b) => a.nome.localeCompare(b.nome)));
      await addAcessoLog(`Criação do usuário ${userData.nome}`, 'Sucesso');
    } catch (err) {
      console.error('Erro ao sincronizar criação de usuário:', err);
      await addAcessoLog(`Falha ao criar usuário`, 'Falha');
      throw err;
    } finally {
      setLoadingState(false);
    }
  };

  const syncUpdateUsuario = async (id: string, userData: UsuarioUpdate) => {
    setLoadingState(true);
    try {
      const updatedUser = await usuarioService.update(id, userData);
      const profile = perfisList.find(p => p.id === updatedUser.perfil_acesso_id);
      const mappedUser = {
        id: updatedUser.id,
        nome: updatedUser.nome,
        perfil_acesso_id: updatedUser.perfil_acesso_id,
        created_at: updatedUser.created_at,
        perfil_nome: profile ? profile.nome : 'Membro Comum',
        perfil_acesso: profile ? { id: profile.id, nome: profile.nome } : null,
        tema: (updatedUser as any).tema || 'light',
        ativo: (updatedUser as any).ativo !== false
      };

      setUsuariosListState(list =>
        list.map(u => u.id === id ? mappedUser : u).sort((a, b) => a.nome.localeCompare(b.nome))
      );

      // If updating the currently logged-in user profile, sync local state
      if (currentUser && id === currentUser.id) {
        setCurrentUserState({
          ...currentUser,
          nome: updatedUser.nome,
          profile: {
            ...currentUser.profile,
            nome: updatedUser.nome,
            tema: (updatedUser as any).tema || 'light',
            ativo: (updatedUser as any).ativo !== false
          }
        });
      }
      await addAcessoLog(`Edição do usuário ${userData.nome}`, 'Sucesso');
    } catch (err) {
      console.error('Erro ao sincronizar atualização de usuário:', err);
      await addAcessoLog(`Falha ao editar usuário ID ${id}`, 'Falha');
      throw err;
    } finally {
      setLoadingState(false);
    }
  };

  const syncDeleteUsuario = async (id: string) => {
    setLoadingState(true);
    try {
      await usuarioService.delete(id);
      setUsuariosListState(list => list.filter(u => u.id !== id));
      await addAcessoLog(`Exclusão do usuário ID ${id}`, 'Sucesso');
    } catch (err) {
      console.error('Erro ao sincronizar exclusão de usuário:', err);
      await addAcessoLog(`Falha ao excluir usuário ID ${id}`, 'Falha');
      throw err;
    } finally {
      setLoadingState(false);
    }
  };

  const logout = async () => {
    setLoadingState(true);
    try {
      await addAcessoLog('Logout realizado com sucesso', 'Sucesso');
      setCurrentUserState(null);
      setDepartamentoList([]);
      setCategoriaList([]);
      setTipoList([]);
      setLinhaList([]);
      setMarcaList([]);
      setProdutoList([]);
      setEstoqueList([]);
      setSaldoEstoqueList([]);
      setMovimentoEstoqueList([]);
      setEquipesList([]);
      setReparoList([]);
      setFornecedorList([]);
      setImagemProdutoList([]);
      setUsuariosEquipesList([]);
      setItemHistoryList([]);
      setUsuariosListState([]);
      setPerfisListState([]);
      setAcessoLogsList([]);
      setConvitesList([]);

      localStorage.removeItem('remember_me');
      await authService.signOut();
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        inventory,
        loading,
        usuariosList,
        perfisList,
        departamentoList,
        categoriaList,
        tipoList,
        linhaList,
        marcaList,
        produtoList,
        estoqueList,
        saldoEstoqueList,
        movimentoEstoqueList,
        equipesList,
        reparoList,
        fornecedorList,
        imagemProdutoList,
        usuariosEquipesList,
        itemHistoryList,
        acessoLogsList,
        convitesList,
        mercadologicalTree,
        nodeItemCounts,
        setCurrentUser,
        setInventory: setInventoryStateWrapper,
        setLoading,
        initializeStore,
        addInventoryItem,
        updateInventoryItem,
        initiateTransfer,
        submitAudit,
        syncCreateUsuario,
        syncUpdateUsuario,
        syncDeleteUsuario,
        logout,
        addAcessoLog,
        inviteUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppStoreProvider = AppProvider;

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore deve ser usado dentro de um AppStoreProvider');
  }
  return context;
};

export const useApp = useAppStore;
