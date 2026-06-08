import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../app/store/AppStore';
import { LifeCycleTimeline } from './LifeCycleTimeline';
import { InventoryItem, ReparoRow } from '../lib/supabase/types';
import { 
  ArrowLeft, 
  Wrench, 
  AlertOctagon, 
  CheckCircle2, 
  Info, 
  ClipboardCheck, 
  Tags 
} from 'lucide-react';

export const AssetHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const itemId = Number(id);
  const navigate = useNavigate();

  const { 
    inventory, 
    reparoList, 
    currentUser 
  } = useAppStore();

  const asset = inventory.find((item: InventoryItem) => item.type === 'ativo' && Number(item.id) === itemId);

  // Filter repairs for this specific asset
  const repairs = useMemo(() => {
    return reparoList.filter((r: ReparoRow) => Number(r.estoque_id) === itemId);
  }, [reparoList, itemId]);

  // Aggregate repair costs
  const totalRepairsCost = useMemo(() => {
    return repairs.reduce((sum: number, r: ReparoRow) => sum + (r.custo || 0), 0);
  }, [repairs]);

  // ROI replacement calculation (exceeds 50% value of a new item)
  const basePrice = asset?.preco || 0;
  const isHighCostROI = basePrice > 0 && totalRepairsCost > basePrice * 0.5;
  const roiPercentage = basePrice > 0 ? ((totalRepairsCost / basePrice) * 100).toFixed(0) : '0';

  const isAuditor = (currentUser?.profile?.perfil as string) === 'Auditor' || (currentUser?.profile?.perfil as string) === 'Gestor';

  const getConditionClass = (cond: string) => {
    switch (cond?.toLowerCase()) {
      case 'bom': return 'badge-success';
      case 'reparo': return 'badge-warning';
      case 'ruim': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getStatusClass = (stat: string) => {
    return stat?.toLowerCase() === 'ativo' ? 'badge-info' : 'badge-secondary';
  };

  if (!asset) {
    return (
      <div className="alert alert-error" style={{ marginTop: '2rem' }}>
        <p>Ativo patrimonial com ID {itemId} não foi localizado no inventário.</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex-btn mt-4">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="asset-history-container">
      {/* HEADER WITH ACTIONS */}
      <div className="history-header flex-header">
        <div>
          <button onClick={() => navigate(-1)} className="btn-back-link">
            <ArrowLeft size={16} />
            <span>Voltar para Navegação</span>
          </button>
          <h2>Histórico do Ativo</h2>
          <p className="subtitle">Código de Patrimônio: <strong>{asset.numeroPatrimonio || 'Sem Patrimônio'}</strong></p>
        </div>

        {isAuditor && (
          <Link to={`/auditoria/${itemId}`} className="btn btn-primary flex-btn">
            <ClipboardCheck size={16} />
            <span>Iniciar Auditoria</span>
          </Link>
        )}
      </div>

      {/* TWO COLUMN GRID */}
      <div className="history-grid">
        {/* LEFT COLUMN: SPECS & TIMELINE */}
        <div className="history-main-column">
          {/* Asset Specs Card */}
          <div className="history-card glass-card animate-fade-in">
            <div className="card-header">
              <h3>Ficha Técnica</h3>
            </div>
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">Nome do Ativo</span>
                <span className="spec-value">{asset.nome}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Preço de Reposição</span>
                <span className="spec-value">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(basePrice)}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Estado de Conservação</span>
                <div>
                  <span className={`badge ${getConditionClass(asset.condicao || '')}`}>
                    {asset.condicao?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="spec-item">
                <span className="spec-label">Status Operacional</span>
                <div>
                  <span className={`badge ${getStatusClass(asset.status || '')}`}>
                    {asset.status?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline of events */}
          <div className="history-card glass-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <h3>Linha do Tempo de Vida</h3>
              <p className="subtitle">Registro cronológico de auditorias e movimentações.</p>
            </div>
            <div className="timeline-card-content">
              <LifeCycleTimeline itemId={itemId} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAINTENANCE RESUMO DE CUSTOS & ROI */}
        <div className="history-sidebar-column">
          {/* ROI sostituição alert box */}
          {isHighCostROI ? (
            <div className="roi-alert-card bg-destructive-glow border-destructive animate-fade-in">
              <div className="roi-alert-header text-destructive">
                <AlertOctagon size={24} />
                <h4>Recomendação de Troca</h4>
              </div>
              <p className="roi-alert-text">
                O custo acumulado de manutenções (<strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRepairsCost)}</strong>) atingiu <strong>{roiPercentage}%</strong> do preço de um item novo (<strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(basePrice)}</strong>).
              </p>
              <div className="roi-alert-footer text-destructive-dark">
                Atenção: Substituição deste ativo é recomendada por motivos de depreciação acelerada.
              </div>
            </div>
          ) : (
            <div className="roi-alert-card bg-success-glow border-success animate-fade-in">
              <div className="roi-alert-header text-success">
                <CheckCircle2 size={24} />
                <h4>ROI Saudável</h4>
              </div>
              <p className="roi-alert-text">
                O custo acumulado de manutenções (<strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRepairsCost)}</strong>) representa apenas <strong>{roiPercentage}%</strong> do preço de reposição (<strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(basePrice)}</strong>).
              </p>
              <div className="roi-alert-footer text-success-dark">
                O ativo está mantendo um índice de custo-benefício saudável.
              </div>
            </div>
          )}

          {/* Maintenance Summary */}
          <div className="history-card glass-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
            <div className="card-header flex-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={18} className="text-primary" />
                <h3>Gestão de Reparos</h3>
              </div>
              <span className="rep-sum-badge">
                {repairs.length} OS
              </span>
            </div>

            <div className="rep-sidebar-content">
              <div className="rep-cost-summary">
                <span className="rep-cost-label">Custo Acumulado</span>
                <span className={`rep-cost-value ${isHighCostROI ? 'text-destructive' : 'text-slate-100'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRepairsCost)}
                </span>
              </div>

              {repairs.length > 0 ? (
                <div className="rep-sidebar-list">
                  {repairs.map((rep: ReparoRow) => (
                    <div key={rep.id} className="rep-sidebar-row">
                      <div className="rep-row-header">
                        <span className={`rep-status-dot ${rep.status === 'concluido' ? 'bg-success' : 'bg-warning'}`}></span>
                        <span className="rep-desc-text">{rep.descricao || 'Conserto Geral'}</span>
                      </div>
                      <div className="rep-row-meta">
                        <span>Preço: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rep.custo)}</span>
                        <span>•</span>
                        <span className="rep-status-name">{rep.status.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rep-empty">
                  <Info size={16} />
                  <span>Sem registros de ordens de serviço ativas.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetHistory;
