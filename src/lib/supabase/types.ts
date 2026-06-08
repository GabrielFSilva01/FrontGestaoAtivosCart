import { Database as OriginalDatabase } from '../../app/interfaces/database.types';

export interface DepartamentoRow {
  id: number;
  nome: string;
}

export interface CategoriaRow {
  id: number;
  nome: string;
  departamento_id: number;
}

export interface TipoRow {
  id: number;
  nome: string;
  categoria_id: number;
}

export interface LinhaRow {
  id: number;
  nome: string;
  tipo_id: number;
}

export interface MarcaRow {
  id: number;
  nome: string;
  linha_id: number;
}

export interface ProdutoRow {
  id: number;
  nome: string;
  preco: number;
  marca_id: number;
}

export interface EstoqueRow {
  id: number;
  produto_id: number;
  numero_patrimonio: string;
  condicao: string;
  status: string;
  equipe_id: number | null;
}

export interface SaldoEstoqueRow {
  id: number;
  produto_id: number;
  quantidade: number;
  tipo_consumo: string;
}

export interface MovimentoEstoqueRow {
  id: number;
  produto_id: number;
  tipo_movimentacao: string;
  quantidade: number;
  created_at: string;
}

export interface EquipesRow {
  id: number;
  nome: string;
}

export interface ReparoRow {
  id: number;
  estoque_id: number;
  custo: number;
  status: string;
  descricao: string | null;
}

export interface FornecedorRow {
  id: number;
  nome: string;
}

export interface ImagemProdutoRow {
  id: number;
  produto_id: number;
  url: string;
}

export interface UsuariosEquipesRow {
  usuario_id: string;
  equipe_id: number;
}

export interface ItemHistoryRow {
  id: number;
  estoque_id: number;
  data_hora: string;
  responsavel: string;
  acao: string;
  notas: string | null;
}

export interface AcessoLogRow {
  id: number;
  data_hora: string;
  usuario_email: string;
  acao: string;
  ip_origem: string;
  status: string;
}

export interface ConviteRow {
  id: number;
  email: string;
  perfil_acesso_id: number;
  status: 'Pendente' | 'Aceito' | 'Expirado';
  enviado_por: string;
  created_at: string;
}

export interface ExtendedDatabase {
  public: {
    Tables: {
      perfil_acesso: OriginalDatabase['public']['Tables']['perfil_acesso']
      usuarios: {
        Row: OriginalDatabase['public']['Tables']['usuarios']['Row'] & {
          ativo?: boolean;
          tema?: 'dark' | 'light';
        }
        Insert: OriginalDatabase['public']['Tables']['usuarios']['Insert']
        Update: OriginalDatabase['public']['Tables']['usuarios']['Update']
        Relationships: OriginalDatabase['public']['Tables']['usuarios']['Relationships']
      }
      departamento: { Row: DepartamentoRow; Insert: Partial<DepartamentoRow>; Update: Partial<DepartamentoRow>; Relationships: [] }
      categoria: { Row: CategoriaRow; Insert: Partial<CategoriaRow>; Update: Partial<CategoriaRow>; Relationships: [] }
      tipo: { Row: TipoRow; Insert: Partial<TipoRow>; Update: Partial<TipoRow>; Relationships: [] }
      linha: { Row: LinhaRow; Insert: Partial<LinhaRow>; Update: Partial<LinhaRow>; Relationships: [] }
      marca: { Row: MarcaRow; Insert: Partial<MarcaRow>; Update: Partial<MarcaRow>; Relationships: [] }
      produto: { Row: ProdutoRow; Insert: Partial<ProdutoRow>; Update: Partial<ProdutoRow>; Relationships: [] }
      estoque: { Row: EstoqueRow; Insert: Partial<EstoqueRow>; Update: Partial<EstoqueRow>; Relationships: [] }
      saldo_estoque: { Row: SaldoEstoqueRow; Insert: Partial<SaldoEstoqueRow>; Update: Partial<SaldoEstoqueRow>; Relationships: [] }
      movimento_estoque: { Row: MovimentoEstoqueRow; Insert: Partial<MovimentoEstoqueRow>; Update: Partial<MovimentoEstoqueRow>; Relationships: [] }
      equipes: { Row: EquipesRow; Insert: Partial<EquipesRow>; Update: Partial<EquipesRow>; Relationships: [] }
      reparo: { Row: ReparoRow; Insert: Partial<ReparoRow>; Update: Partial<ReparoRow>; Relationships: [] }
      fornecedor: { Row: FornecedorRow; Insert: Partial<FornecedorRow>; Update: Partial<FornecedorRow>; Relationships: [] }
      imagem_produto: { Row: ImagemProdutoRow; Insert: Partial<ImagemProdutoRow>; Update: Partial<ImagemProdutoRow>; Relationships: [] }
      usuarios_equipes: { Row: UsuariosEquipesRow; Insert: Partial<UsuariosEquipesRow>; Update: Partial<UsuariosEquipesRow>; Relationships: [] }
      item_history: { Row: ItemHistoryRow; Insert: Partial<ItemHistoryRow>; Update: Partial<ItemHistoryRow>; Relationships: [] }
      acesso_logs: { Row: AcessoLogRow; Insert: Partial<AcessoLogRow>; Update: Partial<AcessoLogRow>; Relationships: [] }
      convites: { Row: ConviteRow; Insert: Partial<ConviteRow>; Update: Partial<ConviteRow>; Relationships: [] }
    }
    Views: OriginalDatabase['public']['Views']
    Functions: OriginalDatabase['public']['Functions']
    Enums: OriginalDatabase['public']['Enums']
    CompositeTypes: OriginalDatabase['public']['CompositeTypes']
  }
}

export type Database = ExtendedDatabase;

export type DepartamentoNode = {
  type: 'departamento';
  level: 1;
  id: number;
  nome: string;
  parentId: null;
};

export type CategoriaNode = {
  type: 'categoria';
  level: 2;
  id: number;
  nome: string;
  parentId: number;
};

export type TipoNode = {
  type: 'tipo';
  level: 3;
  id: number;
  nome: string;
  parentId: number;
};

export type LinhaNode = {
  type: 'linha';
  level: 4;
  id: number;
  nome: string;
  parentId: number;
};

export type MarcaNode = {
  type: 'marca';
  level: 5;
  id: number;
  nome: string;
  parentId: number;
};

export type TreeNode = DepartamentoNode | CategoriaNode | TipoNode | LinhaNode | MarcaNode;

export interface InventoryItem {
  id: string | number;
  type: 'ativo' | 'lote';
  produtoId: string | number;
  nome: string;
  preco: number;
  fotoUrl?: string | null;
  
  // Ativos (estoque) specific
  numeroPatrimonio?: string;
  condicao?: string;
  status?: string;
  equipeId?: string | number | null;
  
  // Lotes (saldo_estoque) specific
  quantidade?: number;
  
  // Reparos/Manutenções associated
  custosManutencao?: number;
  statusManutencao?: string | null;
}
