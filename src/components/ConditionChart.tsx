import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { InventoryItem } from '../lib/supabase/types';

interface ConditionChartProps {
  items: InventoryItem[];
}

export const ConditionChart: React.FC<ConditionChartProps> = ({ items }) => {
  const chartData = useMemo(() => {
    let bomCount = 0;
    let reparoCount = 0;
    let danificadoCount = 0;

    items.forEach(item => {
      if (item.type === 'ativo') {
        const cond = item.condicao?.toLowerCase();
        if (cond === 'bom') {
          bomCount++;
        } else if (cond === 'reparo') {
          reparoCount++;
        } else {
          danificadoCount++;
        }
      }
    });

    const total = bomCount + reparoCount + danificadoCount;

    return [
      { name: 'Bom', value: bomCount, color: '#10b981', percentage: total > 0 ? ((bomCount / total) * 100).toFixed(0) : '0' },
      { name: 'Para Reparo', value: reparoCount, color: '#f59e0b', percentage: total > 0 ? ((reparoCount / total) * 100).toFixed(0) : '0' },
      { name: 'Danificado', value: danificadoCount, color: '#ef4444', percentage: total > 0 ? ((danificadoCount / total) * 100).toFixed(0) : '0' }
    ].filter(d => d.value > 0 || total === 0); // Keep empty items if total is 0 to show empty states
  }, [items]);

  const isEmpty = useMemo(() => {
    return chartData.every(d => d.value === 0);
  }, [chartData]);

  if (isEmpty) {
    return (
      <div className="chart-empty-state">
        <p>Nenhum ativo patrimoniado cadastrado para exibir conservação.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              borderColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              color: '#f8fafc'
            }} 
            formatter={(value: any, name: any) => [`${value} itens`, name]}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            content={({ payload }) => {
              if (!payload) return null;
              return (
                <ul className="custom-legend flex justify-center gap-4" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  {payload.map((entry: any, index: number) => {
                    const dataObj = chartData.find(d => d.name === entry.value);
                    return (
                      <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }}></span>
                        <span>{entry.value} ({dataObj?.percentage}%)</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConditionChart;
