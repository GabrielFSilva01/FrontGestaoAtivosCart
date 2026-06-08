import React, { useMemo } from 'react';
import { useAppStore } from '../app/store/AppStore';
import { 
  PlusCircle, 
  UserCheck, 
  ClipboardCheck, 
  Wrench, 
  FileText 
} from 'lucide-react';
import { ItemHistoryRow } from '../lib/supabase/types';

interface LifeCycleTimelineProps {
  itemId: number;
}

export const LifeCycleTimeline: React.FC<LifeCycleTimelineProps> = ({ itemId }) => {
  const { itemHistoryList } = useAppStore();

  const filteredHistory = useMemo(() => {
    return itemHistoryList
      .filter((h: ItemHistoryRow) => Number(h.estoque_id) === itemId)
      .sort((a: ItemHistoryRow, b: ItemHistoryRow) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  }, [itemHistoryList, itemId]);

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('entrada')) {
      return <PlusCircle className="text-success" size={16} />;
    }
    if (act.includes('aloca') || act.includes('transf')) {
      return <UserCheck className="text-primary" size={16} />;
    }
    if (act.includes('audit')) {
      return <ClipboardCheck className="text-warning" size={16} />;
    }
    if (act.includes('manuten') || act.includes('repar')) {
      return <Wrench className="text-destructive" size={16} />;
    }
    return <FileText className="text-slate-400" size={16} />;
  };

  if (filteredHistory.length === 0) {
    return (
      <div className="timeline-empty-state">
        <p>Nenhum registro de histórico encontrado para este ativo.</p>
      </div>
    );
  }

  return (
    <div className="vertical-timeline-wrapper">
      {filteredHistory.map((event: ItemHistoryRow, idx: number) => (
        <div key={event.id} className="timeline-item">
          {/* Visual line connecting items */}
          {idx !== filteredHistory.length - 1 && <div className="timeline-connector-line"></div>}
          
          <div className="timeline-icon-bullet-wrapper">
            <div className="timeline-icon-bullet">
              {getActionIcon(event.acao)}
            </div>
          </div>

          <div className="timeline-content-card">
            <div className="timeline-content-header">
              <span className="timeline-action-badge">{event.acao}</span>
              <span className="timeline-time">
                {new Date(event.data_hora).toLocaleString('pt-BR')}
              </span>
            </div>
            
            {event.notas && <p className="timeline-notes">{event.notas}</p>}
            
            <div className="timeline-responsible">
              <span>Responsável: </span>
              <strong>{event.responsavel}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LifeCycleTimeline;
