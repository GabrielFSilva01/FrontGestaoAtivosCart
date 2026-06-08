import React, { useMemo } from 'react';
import { useAppStore } from '../app/store/AppStore';
import { ConditionChart } from './ConditionChart';
import { DepartmentChart } from './DepartmentChart';
import { 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  Activity,
  ArrowRight
} from 'lucide-react';

// Relative date formatter helper
const formatRelativeDate = (dateStr: string): string => {
  if (!dateStr) return 'Data indefinida';
  const date = new Date(dateStr);
  const now = new Date();
  
  // Normalize time zones/offsets
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffTime / (1000 * 60));
      return diffMins <= 1 ? 'Agora mesmo' : `Há ${diffMins} minutos`;
    }
    return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  }
  
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  
  // Default fallback to locale date
  return date.toLocaleDateString('pt-BR');
};

// Movement description helper
const formatMovementType = (type: string): string => {
  switch (type) {
    case 'entrada_ativo':
      return 'Entrada de Ativo';
    case 'entrada_lote':
      return 'Entrada de Lote';
    case 'transferencia':
      return 'Transferência';
    case 'baixa_perda':
    case 'perda':
      return 'Baixa por Perda';
    default:
      return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

export const Index: React.FC = () => {
  const { 
    inventory, 
    movimentoEstoqueList, 
    produtoList,
    loading 
  } = useAppStore();

  // 1. Valor Total do Inventário: Soma de preço * quantidade
  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const qty = item.type === 'ativo' ? 1 : (item.quantidade || 0);
      return sum + (item.preco || 0) * qty;
    }, 0);
  }, [inventory]);

  // 2. Itens em Manutenção: Contagem de itens com status de reparo ou condicao === 'reparo'
  const itemsInMaintenance = useMemo(() => {
    return inventory.filter(item => 
      item.type === 'ativo' && 
      (item.condicao === 'reparo' || (item.statusManutencao && item.statusManutencao !== 'concluido'))
    ).length;
  }, [inventory]);

  // 3. Taxa de Perda (30 dias): (Discrepâncias de auditoria / Total inventário) * 100
  const lossRate = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const movements30Days = movimentoEstoqueList.filter(
      m => new Date(m.created_at) >= last30Days
    );

    const totalLossQty = movements30Days
      .filter(m => {
        const type = m.tipo_movimentacao.toLowerCase();
        return type.includes('perda') || type.includes('baixa') || type.includes('discrepancia') || type.includes('dano');
      })
      .reduce((sum, m) => sum + (m.quantidade || 0), 0);

    const totalInvItems = inventory.reduce((sum, item) => {
      const qty = item.type === 'ativo' ? 1 : (item.quantidade || 0);
      return sum + qty;
    }, 0);

    return totalInvItems > 0 ? ((totalLossQty / totalInvItems) * 100).toFixed(1) : '0.0';
  }, [movimentoEstoqueList, inventory]);

  // 4. Rotatividade: Volume de transferências entre equipes nos últimos 30 dias
  const transferVolume = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    return movimentoEstoqueList
      .filter(m => {
        const isRecent = new Date(m.created_at) >= last30Days;
        const isTransfer = m.tipo_movimentacao.toLowerCase().includes('transfer');
        return isRecent && isTransfer;
      })
      .reduce((sum, m) => sum + (m.quantidade || 1), 0);
  }, [movimentoEstoqueList]);

  // 5. Alertas de Estoque Crítico: Itens de consumo (lotes) com quantidade < 5 unidades
  const criticalStockAlerts = useMemo(() => {
    return inventory.filter(item => item.type === 'lote' && (item.quantidade || 0) < 5);
  }, [inventory]);

  // 6. Feed de Atividade Recente: Últimas 5 movimentações
  const recentActivities = useMemo(() => {
    const productMap = new Map(produtoList.map(p => [p.id, p]));

    return [...movimentoEstoqueList]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(m => {
        const prod = productMap.get(Number(m.produto_id));
        return {
          id: m.id,
          tipo: m.tipo_movimentacao,
          quantidade: m.quantidade,
          data: m.created_at,
          produtoNome: prod ? prod.nome : 'Produto Desconhecido'
        };
      });
  }, [movimentoEstoqueList, produtoList]);

  // Loading skeleton placeholder render helper
  if (loading) {
    return (
      <div className="dashboard-page-container">
        <div className="dashboard-header animate-pulse">
          <div style={{ height: '28px', width: '220px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }}></div>
          <div style={{ height: '16px', width: '380px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
        </div>

        <div className="stat-cards-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton animate-pulse" style={{ height: '120px', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}></div>
          ))}
        </div>

        <div className="charts-grid" style={{ marginTop: '2rem' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: '340px', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      {/* HEADER BAR */}
      <div className="dashboard-header animate-fade-in">
        <h2>Dashboard Operacional</h2>
        <p className="subtitle">Painel de controle com análises consolidadas e métricas de desempenho de inventário.</p>
      </div>

      {/* STAT CARDS GRID (1 col mobile, 4 cols desktop) */}
      <div className="stat-cards-grid animate-fade-in">
        {/* Card 1: Valor Total */}
        <div className="stat-card border-left-primary">
          <div className="stat-card-header">
            <span className="stat-card-title">Valor do Inventário</span>
            <span className="stat-card-icon-wrapper text-primary">
              <DollarSign size={20} />
            </span>
          </div>
          <div className="stat-card-value">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInventoryValue)}
          </div>
          <div className="stat-card-subtext">Valor acumulado de ativos e lotes</div>
        </div>

        {/* Card 2: Manutenção */}
        <div className="stat-card border-left-warning">
          <div className="stat-card-header">
            <span className="stat-card-title">Em Manutenção</span>
            <span className="stat-card-icon-wrapper text-warning">
              <Wrench size={20} />
            </span>
          </div>
          <div className="stat-card-value">{itemsInMaintenance}</div>
          <div className="stat-card-subtext">Ativos com reparo ativo pendente</div>
        </div>

        {/* Card 3: Taxa de Perda */}
        <div className="stat-card border-left-destructive">
          <div className="stat-card-header">
            <span className="stat-card-title">Taxa de Perda (30d)</span>
            <span className="stat-card-icon-wrapper text-destructive">
              <AlertTriangle size={20} />
            </span>
          </div>
          <div className="stat-card-value">{lossRate}%</div>
          <div className="stat-card-subtext">Auditorias e baixas recentes</div>
        </div>

        {/* Card 4: Rotatividade */}
        <div className="stat-card border-left-success">
          <div className="stat-card-header">
            <span className="stat-card-title">Rotatividade (30d)</span>
            <span className="stat-card-icon-wrapper text-success">
              <RefreshCw size={20} />
            </span>
          </div>
          <div className="stat-card-value">{transferVolume}</div>
          <div className="stat-card-subtext">Transferências entre equipes</div>
        </div>
      </div>

      {/* CHARTS SECTIONS GRID */}
      <div className="charts-grid animate-fade-in">
        {/* Department Volume Chart */}
        <div className="chart-card-wrapper">
          <div className="chart-card-header">
            <h3>Volume por Departamento (Top 5)</h3>
            <p className="subtitle">Departamentos com maior quantidade total de itens.</p>
          </div>
          <div className="chart-card-content">
            <DepartmentChart items={inventory} />
          </div>
        </div>

        {/* Condition Pie Chart */}
        <div className="chart-card-wrapper">
          <div className="chart-card-header">
            <h3>Conservação de Ativos</h3>
            <p className="subtitle">Estado físico dos ativos patrimoniados.</p>
          </div>
          <div className="chart-card-content">
            <ConditionChart items={inventory} />
          </div>
        </div>
      </div>

      {/* PANELS GRID: CRITICAL STOCK & RECENT FEED */}
      <div className="panels-grid animate-fade-in">
        {/* Critical Stock alerts */}
        <div className="panel-card-wrapper border-top-warning">
          <div className="panel-card-header">
            <div className="panel-title-container">
              <ShieldAlert className="text-warning" size={20} />
              <h3>Estoque Crítico (Insumos)</h3>
            </div>
            <p className="subtitle">Itens de consumo com quantidade abaixo de 5 unidades.</p>
          </div>
          <div className="panel-card-content scrollbar-custom">
            {criticalStockAlerts.length > 0 ? (
              <div className="critical-alerts-list">
                {criticalStockAlerts.map(item => (
                  <div key={item.id} className="critical-alert-row">
                    <div className="alert-item-details">
                      <span className="alert-item-name">{item.nome}</span>
                      <span className="alert-item-price">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco || 0)} /un
                      </span>
                    </div>
                    <span className="alert-item-badge destructive-badge">
                      {item.quantidade} un. restando
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty-state">
                <span className="empty-icon text-success">✓</span>
                <p>Nenhum item consumível com estoque crítico detectado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="panel-card-wrapper border-top-primary">
          <div className="panel-card-header">
            <div className="panel-title-container">
              <Activity className="text-primary" size={20} />
              <h3>Atividade Recente</h3>
            </div>
            <p className="subtitle">Últimas movimentações registradas no fluxo de estoque.</p>
          </div>
          <div className="panel-card-content scrollbar-custom">
            {recentActivities.length > 0 ? (
              <div className="recent-activities-list">
                {recentActivities.map(act => (
                  <div key={act.id} className="activity-row">
                    <div className="activity-icon-bullet">
                      <ArrowRight size={14} className="text-slate-400" />
                    </div>
                    <div className="activity-row-details">
                      <div className="activity-title">
                        <strong>{formatMovementType(act.tipo)}</strong>: {act.produtoNome}
                      </div>
                      <div className="activity-meta">
                        <span>Qtd: {act.quantidade}</span>
                        <span className="meta-dot">•</span>
                        <span>{formatRelativeDate(act.data)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty-state">
                <p>Nenhuma movimentação recente encontrada no histórico.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
