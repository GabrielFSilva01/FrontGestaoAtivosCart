import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DepartmentChart } from './DepartmentChart';
import { useAppStore } from '../app/store/AppStore';
import { InventoryItem } from '../lib/supabase/types';

// Mock Recharts components for reliable, layout-independent rendering in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ tickFormatter }: any) => (
    <div data-testid="y-axis" data-formatter={tickFormatter ? 'true' : 'false'} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: ({ fill }: any) => <div data-testid="cell" data-fill={fill} />,
}));

// Mock the global AppStore hook
vi.mock('../app/store/AppStore', () => ({
  useAppStore: vi.fn(),
}));

describe('DepartmentChart Component', () => {
  const mockStoreData = {
    departamentoList: [
      { id: 1, nome: 'Tecnologia da Informação' },
      { id: 2, nome: 'Recursos Humanos' },
    ],
    categoriaList: [
      { id: 10, nome: 'Notebooks', departamento_id: 1 },
      { id: 20, nome: 'Móveis', departamento_id: 2 },
    ],
    tipoList: [
      { id: 100, nome: 'Portáteis', categoria_id: 10 },
      { id: 200, nome: 'Cadeiras', categoria_id: 20 },
    ],
    linhaList: [
      { id: 1000, nome: 'Linha Dell', tipo_id: 100 },
      { id: 2000, nome: 'Linha Escritório', tipo_id: 200 },
    ],
    marcaList: [
      { id: 10000, nome: 'Dell', linha_id: 1000 },
      { id: 20000, nome: 'Flexform', linha_id: 2000 },
    ],
    produtoList: [
      { id: 500, nome: 'Dell Latitude 3420', preco: 4500, marca_id: 10000 },
      { id: 600, nome: 'Cadeira Ergonômica', preco: 1200, marca_id: 20000 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppStore).mockReturnValue(mockStoreData as any);
  });

  it('renders empty state message when no items are provided', () => {
    // Arrange: Render standard empty items array
    render(<DepartmentChart items={[]} />);

    // Assert: Verify that the empty state feedback message is in the document
    expect(
      screen.getByText('Nenhum item cadastrado para exibir estatísticas por departamento.')
    ).toBeInTheDocument();
  });

  it('correctly maps inventory items to their parent department and renders chart (happy path)', () => {
    // Arrange: Mock inventory items belonging to TI and RH
    const items: InventoryItem[] = [
      { id: '1', type: 'ativo', produtoId: 500, nome: 'Notebook 1', preco: 4500 }, // TI (Level 1)
      { id: '2', type: 'ativo', produtoId: 500, nome: 'Notebook 2', preco: 4500 }, // TI (Level 1)
      { id: '3', type: 'lote', produtoId: 600, nome: 'Cadeiras', preco: 1200, quantidade: 3 }, // RH (Level 1)
    ];

    // Act: Render component with mapped items
    render(<DepartmentChart items={items} />);

    // Assert: Verify that the Recharts components wrapper are rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    const barChart = screen.getByTestId('bar-chart');
    expect(barChart).toBeInTheDocument();

    // Verify correct aggregation data passed to the BarChart (TI = 2, RH = 3)
    const passedData = JSON.parse(barChart.getAttribute('data-data') || '[]');
    expect(passedData).toHaveLength(2);
    
    const tiGroup = passedData.find((d: any) => d.name === 'Tecnologia da Informação');
    const rhGroup = passedData.find((d: any) => d.name === 'Recursos Humanos');

    expect(tiGroup).toBeDefined();
    expect(tiGroup.value).toBe(2);

    expect(rhGroup).toBeDefined();
    expect(rhGroup.value).toBe(3);
  });

  it('handles items with zero or negative quantities gracefully', () => {
    // Arrange: Item with zero quantity
    const items: InventoryItem[] = [
      { id: '1', type: 'lote', produtoId: 500, nome: 'Notebook 1', preco: 4500, quantidade: 0 },
    ];

    // Act: Render component
    render(<DepartmentChart items={items} />);

    // Assert: Verify empty state is displayed because no valid positive inventory is present
    expect(
      screen.getByText('Nenhum item cadastrado para exibir estatísticas por departamento.')
    ).toBeInTheDocument();
  });

  it('sorts departments descending and limits to top 5 categories', () => {
    // Arrange: Create inventory items distributed across multiple departments
    // To make this simple, we can group under unclassified, or adapt the mocked store to have 6 departments
    const customStore = {
      ...mockStoreData,
      departamentoList: [
        { id: 1, nome: 'Dep 1' },
        { id: 2, nome: 'Dep 2' },
        { id: 3, nome: 'Dep 3' },
        { id: 4, nome: 'Dep 4' },
        { id: 5, nome: 'Dep 5' },
        { id: 6, nome: 'Dep 6' },
      ],
      categoriaList: [
        { id: 10, nome: 'Cat 1', departamento_id: 1 },
        { id: 20, nome: 'Cat 2', departamento_id: 2 },
        { id: 30, nome: 'Cat 3', departamento_id: 3 },
        { id: 40, nome: 'Cat 4', departamento_id: 4 },
        { id: 50, nome: 'Cat 5', departamento_id: 5 },
        { id: 60, nome: 'Cat 6', departamento_id: 6 },
      ],
      tipoList: [
        { id: 100, nome: 'Tipo 1', categoria_id: 10 },
        { id: 200, nome: 'Tipo 2', categoria_id: 20 },
        { id: 300, nome: 'Tipo 3', categoria_id: 30 },
        { id: 400, nome: 'Tipo 4', categoria_id: 40 },
        { id: 500, nome: 'Tipo 5', categoria_id: 50 },
        { id: 600, nome: 'Tipo 6', categoria_id: 60 },
      ],
      linhaList: [
        { id: 1000, nome: 'Linha 1', tipo_id: 100 },
        { id: 2000, nome: 'Linha 2', tipo_id: 200 },
        { id: 3000, nome: 'Linha 3', tipo_id: 300 },
        { id: 4000, nome: 'Linha 4', tipo_id: 400 },
        { id: 5000, nome: 'Linha 5', tipo_id: 500 },
        { id: 6000, nome: 'Linha 6', tipo_id: 600 },
      ],
      marcaList: [
        { id: 10000, nome: 'Marca 1', linha_id: 1000 },
        { id: 20000, nome: 'Marca 2', linha_id: 2000 },
        { id: 30000, nome: 'Marca 3', linha_id: 3000 },
        { id: 40000, nome: 'Marca 4', linha_id: 4000 },
        { id: 50000, nome: 'Marca 5', linha_id: 5000 },
        { id: 60000, nome: 'Marca 6', linha_id: 6000 },
      ],
      produtoList: [
        { id: 11, nome: 'Prod 1', preco: 10, marca_id: 10000 },
        { id: 22, nome: 'Prod 2', preco: 10, marca_id: 20000 },
        { id: 33, nome: 'Prod 3', preco: 10, marca_id: 30000 },
        { id: 44, nome: 'Prod 4', preco: 10, marca_id: 40000 },
        { id: 55, nome: 'Prod 5', preco: 10, marca_id: 50000 },
        { id: 66, nome: 'Prod 6', preco: 10, marca_id: 60000 },
      ],
    };

    vi.mocked(useAppStore).mockReturnValue(customStore as any);

    const items: InventoryItem[] = [
      { id: '1', type: 'ativo', produtoId: 11, nome: 'Item 1', preco: 10 }, // Dep 1 = 1
      { id: '2', type: 'lote', produtoId: 22, nome: 'Item 2', preco: 10, quantidade: 5 }, // Dep 2 = 5 (Highest)
      { id: '3', type: 'ativo', produtoId: 33, nome: 'Item 3', preco: 10 }, // Dep 3 = 1
      { id: '4', type: 'lote', produtoId: 44, nome: 'Item 4', preco: 10, quantidade: 3 }, // Dep 4 = 3
      { id: '5', type: 'ativo', produtoId: 55, nome: 'Item 5', preco: 10 }, // Dep 5 = 1
      { id: '6', type: 'lote', produtoId: 66, nome: 'Item 6', preco: 10, quantidade: 2 }, // Dep 6 = 2
    ];

    // Act: Render the component
    render(<DepartmentChart items={items} />);

    // Assert: Verify that the top 5 sorted values are resolved and others are sliced out
    const barChart = screen.getByTestId('bar-chart');
    const passedData = JSON.parse(barChart.getAttribute('data-data') || '[]');
    
    // Limits to top 5
    expect(passedData).toHaveLength(5);
    
    // Sort verification: index 0 should be 'Dep 2' with value 5
    expect(passedData[0].name).toBe('Dep 2');
    expect(passedData[0].value).toBe(5);
    
    // index 1 should be 'Dep 4' with value 3
    expect(passedData[1].name).toBe('Dep 4');
    expect(passedData[1].value).toBe(3);
  });
});
