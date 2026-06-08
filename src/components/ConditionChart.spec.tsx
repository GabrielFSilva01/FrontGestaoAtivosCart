import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConditionChart } from './ConditionChart';
import { InventoryItem } from '../lib/supabase/types';

// Mock Recharts to enable robust assertions on calculations and custom legends
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data }: any) => (
    <div data-testid="pie" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Cell: ({ fill }: any) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: ({ content }: any) => {
    // Simulate Recharts payload calling the custom legend renderer in the component
    const mockPayload = [
      { value: 'Bom', color: '#10b981' },
      { value: 'Para Reparo', color: '#f59e0b' },
      { value: 'Danificado', color: '#ef4444' },
    ];
    return <div data-testid="legend">{content({ payload: mockPayload })}</div>;
  },
}));

describe('ConditionChart Component', () => {
  it('renders empty state when there are no assets/ativos in the items list', () => {
    // Arrange: items containing only consumables (lote), which are ignored by the chart
    const items: InventoryItem[] = [
      { id: '1', type: 'lote', produtoId: 100, nome: 'Insumo', preco: 10, quantidade: 50 },
    ];

    // Act: Render chart
    render(<ConditionChart items={items} />);

    // Assert: Verify empty state banner
    expect(
      screen.getByText('Nenhum ativo patrimoniado cadastrado para exibir conservação.')
    ).toBeInTheDocument();
  });

  it('aggregates asset conditions and renders custom legend with percentages (happy path)', () => {
    // Arrange: Mix of asset items with different conditions
    const items: InventoryItem[] = [
      { id: '1', type: 'ativo', produtoId: 10, nome: 'Ativo 1', preco: 100, condicao: 'Bom' },
      { id: '2', type: 'ativo', produtoId: 10, nome: 'Ativo 2', preco: 100, condicao: 'bom' }, // case-insensitive
      { id: '3', type: 'ativo', produtoId: 20, nome: 'Ativo 3', preco: 200, condicao: 'reparo' },
      { id: '4', type: 'ativo', produtoId: 30, nome: 'Ativo 4', preco: 300, condicao: 'ruim' }, // Ruim falls to 'Danificado'
    ];

    // Act: Render chart
    render(<ConditionChart items={items} />);

    // Assert: Verify chart structure and calculations
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

    const pie = screen.getByTestId('pie');
    expect(pie).toBeInTheDocument();

    const chartData = JSON.parse(pie.getAttribute('data-data') || '[]');
    
    // We expect 3 groups (Bom = 2, Reparo = 1, Danificado = 1; Total = 4)
    expect(chartData).toHaveLength(3);

    const bomData = chartData.find((d: any) => d.name === 'Bom');
    const reparoData = chartData.find((d: any) => d.name === 'Para Reparo');
    const danificadoData = chartData.find((d: any) => d.name === 'Danificado');

    expect(bomData.value).toBe(2);
    expect(bomData.percentage).toBe('50'); // 2 / 4 = 50%

    expect(reparoData.value).toBe(1);
    expect(reparoData.percentage).toBe('25'); // 1 / 4 = 25%

    expect(danificadoData.value).toBe(1);
    expect(danificadoData.percentage).toBe('25'); // 1 / 4 = 25%

    // Verify Legend lists items with percentages in the DOM
    expect(screen.getByText('Bom (50%)')).toBeInTheDocument();
    expect(screen.getByText('Para Reparo (25%)')).toBeInTheDocument();
    expect(screen.getByText('Danificado (25%)')).toBeInTheDocument();
  });
});
