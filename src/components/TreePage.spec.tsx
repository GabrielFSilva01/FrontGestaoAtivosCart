import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreePage } from './TreePage';
import { useAppStore } from '../app/store/AppStore';
import { TreeNode } from '../lib/supabase/types';

// Mock react-router-dom search params
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

// Mock the global store hook
const mockAddInventoryItem = vi.fn();
vi.mock('../app/store/AppStore', () => ({
  useAppStore: vi.fn(),
}));

// Mock IntersectionObserver to enable immediate rendering for LazyRender component in tests
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor(public callback: any) {
    // Immediately notify that the element is intersecting to trigger lazy loading content rendering
    setTimeout(() => {
      this.callback([{ isIntersecting: true }]);
    }, 0);
  }
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

describe('TreePage Component', () => {
  const mockTree: TreeNode[] = [
    { type: 'departamento', level: 1, id: 1, nome: 'Tecnologia da Informação', parentId: null },
    { type: 'categoria', level: 2, id: 10, nome: 'Hardware de Computador', parentId: 1 },
    { type: 'tipo', level: 3, id: 100, nome: 'Computadores Portáteis', parentId: 10 },
    { type: 'linha', level: 4, id: 1000, nome: 'Notebooks Corporativos', parentId: 100 },
    { type: 'marca', level: 5, id: 10000, nome: 'Marca Dell', parentId: 1000 },
  ];

  const mockProducts = [
    { id: 50, nome: 'Dell Latitude 3420', preco: 4500, marca_id: 10000 },
  ];

  const mockCounts = new Map<string, number>([
    ['departamento-1', 10],
    ['categoria-10', 10],
    ['tipo-100', 10],
    ['linha-1000', 10],
    ['marca-10000', 10],
  ]);

  const defaultStoreState = {
    mercadologicalTree: mockTree,
    produtoList: mockProducts,
    nodeItemCounts: mockCounts,
    addInventoryItem: mockAddInventoryItem,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.mocked(useAppStore).mockReturnValue(defaultStoreState as any);
  });

  it('renders tree page with root level departments visible initially (happy path)', () => {
    // Arrange: Render page
    render(<TreePage />);

    // Assert: Verify headers and search bar are present
    expect(screen.getByText('Navegação de Hierarquia')).toBeInTheDocument();
    
    // Root level department 'Tecnologia da Informação' should be visible
    expect(screen.getByText('Tecnologia da Informação')).toBeInTheDocument();
    expect(screen.getByText('10 itens')).toBeInTheDocument(); // Badge count

    // Child level 'Hardware de Computador' should NOT be visible initially
    expect(screen.queryByText('Hardware de Computador')).not.toBeInTheDocument();
  });

  it('expands a tree node when clicked to load sub-hierarchy levels', async () => {
    // Arrange: Render page
    render(<TreePage />);

    // Act: Click on the root node 'Tecnologia da Informação' to expand it
    const rootNodeRow = screen.getByText('Tecnologia da Informação');
    fireEvent.click(rootNodeRow);

    // Assert: Child level node 'Hardware de Computador' should render (wait for lazy intersection observer)
    await waitFor(() => {
      expect(screen.getByText('Hardware de Computador')).toBeInTheDocument();
    });

    // Check search params are updated with new hierarchy path
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('opens and submits modal to add a new inventory active item', async () => {
    // Arrange: Mock successful item creation
    mockAddInventoryItem.mockResolvedValue(true);
    render(<TreePage />);

    // Click '+ Adicionar' button on root node row to open modal
    const addButtons = screen.getAllByRole('button', { name: '+ Adicionar' });
    fireEvent.click(addButtons[0]);

    // Assert: Modal dialog elements are in the document
    expect(screen.getByText('Adicionar Item ao Inventário')).toBeInTheDocument();

    const productSelect = screen.getByLabelText('Produto');
    const patrimonioInput = screen.getByLabelText('Número do Patrimônio');
    const condicaoSelect = screen.getByLabelText('Condição');
    const statusSelect = screen.getByLabelText('Status');
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });

    // Act: Populate form inputs
    fireEvent.change(productSelect, { target: { value: '50' } });
    fireEvent.change(patrimonioInput, { target: { value: 'PAT-9911' } });
    fireEvent.change(condicaoSelect, { target: { value: 'bom' } });
    fireEvent.change(statusSelect, { target: { value: 'ativo' } });

    // Submit form
    fireEvent.click(confirmBtn);

    // Assert: addInventoryItem mock is called with correct parameters
    await waitFor(() => {
      expect(mockAddInventoryItem).toHaveBeenCalledWith({
        type: 'ativo',
        produtoId: 50,
        numeroPatrimonio: 'PAT-9911',
        condicao: 'bom',
        status: 'ativo',
        quantidade: 1,
        tipoConsumo: undefined,
      });
    });

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText('Adicionar Item ao Inventário')).not.toBeInTheDocument();
    });
  });

  it('filters results incrementally in search view', () => {
    // Arrange: Render page
    render(<TreePage />);
    const searchInput = screen.getByPlaceholderText('Buscar nó mercadológico... (ex: Celulares)');

    // Act: Type search query
    fireEvent.change(searchInput, { target: { value: 'Hardware' } });

    // Assert: Filtered search results are rendered
    expect(screen.getByText('Resultados da busca (1)')).toBeInTheDocument();
    expect(screen.getByText('Hardware de Computador')).toBeInTheDocument();
  });
});
