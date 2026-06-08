import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useAppStore } from '../app/store/AppStore';
import {
  InventoryItem,
  ProdutoRow,
  MarcaRow,
  LinhaRow,
  TipoRow,
  CategoriaRow,
  DepartamentoRow
} from '../lib/supabase/types';

interface DepartmentChartProps {
  items: InventoryItem[];
}

export const DepartmentChart: React.FC<DepartmentChartProps> = ({ items }) => {
  const { 
    departamentoList, 
    categoriaList, 
    tipoList, 
    linhaList, 
    marcaList, 
    produtoList 
  } = useAppStore();

  const chartData = useMemo(() => {
    const depVolumeMap = new Map<number, number>();

    // Cache mappings for faster traversal
    const productMap = new Map<number, ProdutoRow>(produtoList.map((p: ProdutoRow) => [p.id, p]));
    const brandMap = new Map<number, MarcaRow>(marcaList.map((m: MarcaRow) => [m.id, m]));
    const lineMap = new Map<number, LinhaRow>(linhaList.map((l: LinhaRow) => [l.id, l]));
    const typeMap = new Map<number, TipoRow>(tipoList.map((t: TipoRow) => [t.id, t]));
    const catMap = new Map<number, CategoriaRow>(categoriaList.map((c: CategoriaRow) => [c.id, c]));
    const depMap = new Map<number, DepartamentoRow>(departamentoList.map((d: DepartamentoRow) => [d.id, d]));

    items.forEach(item => {
      const qty = item.type === 'ativo' ? 1 : (item.quantidade || 0);
      if (qty <= 0) return;

      const prod = productMap.get(Number(item.produtoId));
      if (!prod) {
        // Fallback for unknown items
        depVolumeMap.set(-1, (depVolumeMap.get(-1) || 0) + qty);
        return;
      }

      const brand = brandMap.get(prod.marca_id);
      const line = brand ? lineMap.get(brand.linha_id) : null;
      const typeNode = line ? typeMap.get(line.tipo_id) : null;
      const cat = typeNode ? catMap.get(typeNode.categoria_id) : null;
      const dep = cat ? depMap.get(cat.departamento_id) : null;

      const depId = dep ? dep.id : -1;
      depVolumeMap.set(depId, (depVolumeMap.get(depId) || 0) + qty);
    });

    // Convert to Array and resolve names
    const dataList = Array.from(depVolumeMap.entries()).map(([depId, value]) => {
      let name = 'Outros / Não Classificado';
      if (depId !== -1) {
        const depObj = depMap.get(depId);
        if (depObj) name = depObj.nome;
      }
      return { name, value };
    });

    // Sort descending and select top 5
    return dataList
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items, departamentoList, categoriaList, tipoList, linhaList, marcaList, produtoList]);

  const isEmpty = useMemo(() => {
    return chartData.length === 0 || chartData.every(d => d.value === 0);
  }, [chartData]);

  if (isEmpty) {
    return (
      <div className="chart-empty-state">
        <p>Nenhum item cadastrado para exibir estatísticas por departamento.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            width={120}
            tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 15)}...` : value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f8fafc'
            }}
            formatter={(value: any) => [`${value} itens`, 'Volume']}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === 0 ? '#818cf8' : '#6366f1'} // Gradient feel highlight top
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentChart;
