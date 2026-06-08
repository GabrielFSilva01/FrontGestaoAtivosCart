import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../app/store/AppStore';
import { TreeNode } from '../lib/supabase/types';

// LAZY LOADING 
interface LazyRenderProps {
  children: React.ReactNode;
}

const LazyRender: React.FC<LazyRenderProps> = ({ children }) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Disconnect once visible
        }
      },
      { rootMargin: '100px' } // Load slightly before coming into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ minHeight: isIntersecting ? 'auto' : '20px' }}>
      {isIntersecting ? children : <div className="tree-loading-placeholder">Carregando...</div>}
    </div>
  );
};

// RECURSIVE TREE NODE COMPONENT
interface RecursiveTreeComponentProps {
  node: TreeNode;
  expandedNodes: Set<string>;
  toggleNode: (nodeKey: string) => void;
  onSelectNode: (node: TreeNode) => void;
  onAddItemClick: (node: TreeNode) => void;
}

const RecursiveTreeComponent: React.FC<RecursiveTreeComponentProps> = React.memo(({
  node,
  expandedNodes,
  toggleNode,
  onSelectNode,
  onAddItemClick
}) => {
  const { mercadologicalTree, nodeItemCounts } = useAppStore();
  const nodeKey = `${node.type}-${node.id}`;
  const isExpanded = expandedNodes.has(nodeKey);
  const itemCount = nodeItemCounts.get(nodeKey) || 0;

  // Query immediate children nodes (incremental level and parentId match)
  const children = useMemo(() => {
    if (!isExpanded) return [];
    return mercadologicalTree.filter(
      (child: TreeNode) => child.level === node.level + 1 && child.parentId === node.id
    );
  }, [isExpanded, mercadologicalTree, node.level, node.id]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(nodeKey);
    onSelectNode(node);
  };

  return (
    <div className="tree-node-wrapper">
      <div 
        className={`tree-node-row ${isExpanded ? 'expanded' : ''}`} 
        onClick={handleToggle}
      >
        <span className="folder-icon">
          {node.level < 5 ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`chevron ${isExpanded ? 'down' : 'right'}`}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          ) : null}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="folder">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </span>
        
        <span className="node-name">{node.nome}</span>
        
        <span className="badge node-badge">{itemCount} itens</span>

        <button 
          className="btn-add-item-action" 
          onClick={(e) => {
            e.stopPropagation();
            onAddItemClick(node);
          }}
          title="Adicionar Item nesta hierarquia"
        >
          + Adicionar
        </button>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="tree-node-children">
          <LazyRender>
            {children.map((child: TreeNode) => (
              <RecursiveTreeComponent
                key={`${child.type}-${child.id}`}
                node={child}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                onSelectNode={onSelectNode}
                onAddItemClick={onAddItemClick}
              />
            ))}
          </LazyRender>
        </div>
      )}
    </div>
  );
});

// MAIN TREE PAGE COMPONENT
export const TreePage: React.FC = () => {
  const { 
    mercadologicalTree, 
    produtoList, 
    addInventoryItem,
    nodeItemCounts 
  } = useAppStore();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductNode, setSelectedProductNode] = useState<TreeNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formType, setFormType] = useState<'ativo' | 'lote'>('ativo');
  const [formProdutoId, setFormProdutoId] = useState<number>(0);
  const [formPatrimonio, setFormPatrimonio] = useState('');
  const [formCondicao, setFormCondicao] = useState('bom');
  const [formStatus, setFormStatus] = useState('ativo');
  const [formQuantidade, setFormQuantidade] = useState<number>(1);
  const [formTipoConsumo, setFormTipoConsumo] = useState('consumo');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Breadcrumbs track computed from URL search parameter path (e.g. ?path=depId-catId-tipoId-linhaId-marcaId)
  const currentPathKeys = useMemo(() => {
    const p = searchParams.get('path');
    return p ? p.split('-') : [];
  }, [searchParams]);

  const breadcrumbs = useMemo(() => {
    const crumbs: { name: string; pathValue: string }[] = [];
    let accumKeys: string[] = [];

    currentPathKeys.forEach(key => {
      accumKeys.push(key);
      const [type, idStr] = key.split(':');
      const id = parseInt(idStr);
      const match = mercadologicalTree.find((n: TreeNode) => n.type === type && n.id === id);
      if (match) {
        crumbs.push({
          name: match.nome,
          pathValue: accumKeys.join('-')
        });
      }
    });

    return crumbs;
  }, [currentPathKeys, mercadologicalTree]);

  // Root level TreeNodes (Departamentos)
  const rootNodes = useMemo(() => {
    return mercadologicalTree.filter((n: TreeNode) => n.level === 1);
  }, [mercadologicalTree]);

  // Incremental local cache Search (< 50ms latency)
  const filteredSearchNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    const startTime = performance.now();
    
    const results = mercadologicalTree.filter((n: TreeNode) => 
      n.nome.toLowerCase().includes(lowerQuery)
    );
    
    const duration = performance.now() - startTime;
    console.log(`Busca incremental concluída em ${duration.toFixed(2)}ms`);
    return results;
  }, [searchQuery, mercadologicalTree]);

  // Expand breadcrumbs nodes on mount or url change
  useEffect(() => {
    if (currentPathKeys.length > 0) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        currentPathKeys.forEach(k => next.add(k.replace(':', '-')));
        return next;
      });
    }
  }, [currentPathKeys]);

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });
  };

  const handleSelectNode = (node: TreeNode) => {
    // Build new path selection query
    let newPath = '';
    const nodeKey = `${node.type}:${node.id}`;

    if (node.level === 1) {
      newPath = nodeKey;
    } else {
      // Find parent hierarchy keys from expanded paths
      const pathSegments: string[] = [];
      let current: TreeNode | null = node;

      while (current) {
        pathSegments.unshift(`${current.type}:${current.id}`);
        const parentLvl: number = current.level - 1;
        const parentId: number | null = current.parentId;
        const targetParentLvl: number = parentLvl;
        const targetParentId: number | null = parentId;
        current = mercadologicalTree.find((n: TreeNode) => n.level === targetParentLvl && n.id === targetParentId) || null;
      }
      newPath = pathSegments.join('-');
    }

    setSearchParams({ path: newPath });
  };

  const openAddItemModal = (node: TreeNode) => {
    setSelectedProductNode(node);
    
    // Find first product in hierarchy to pre-fill
    let matchedProdId = 0;
    if (node.type === 'marca') {
      const products = produtoList.filter((p: any) => p.marca_id === node.id);
      if (products.length > 0) matchedProdId = products[0].id;
    }
    
    setFormProdutoId(matchedProdId);
    setFormPatrimonio('');
    setFormQuantidade(1);
    setFormCondicao('bom');
    setFormStatus('ativo');
    setShowAddModal(true);
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProdutoId) {
      showToast('Por favor, selecione um produto.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInventoryItem({
        type: formType,
        produtoId: formProdutoId,
        numeroPatrimonio: formType === 'ativo' ? formPatrimonio : undefined,
        condicao: formType === 'ativo' ? formCondicao : undefined,
        status: formType === 'ativo' ? formStatus : undefined,
        quantidade: formType === 'lote' ? formQuantidade : 1,
        tipoConsumo: formType === 'lote' ? formTipoConsumo : undefined
      });

      showToast('Item adicionado com sucesso!', 'success');
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao adicionar item de inventário.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products dropdown matching chosen node
  const prefilteredProducts = useMemo(() => {
    if (!selectedProductNode) return produtoList;
    const node = selectedProductNode;

    if (node.type === 'marca') {
      return produtoList.filter((p: any) => p.marca_id === node.id);
    }
    // For other levels, we could recursively filter, but showing all or matching node brands works nicely
    return produtoList;
  }, [selectedProductNode, produtoList]);

  return (
    <div className="tree-page-wrapper">
      {/* TOAST ALERT OVERLAY */}
      {toastMessage && (
        <div className={`toast-container animate-fade-in ${toastType}`}>
          <div className="toast-content">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="tree-header">
        <h2>Navegação de Hierarquia</h2>
        <p className="subtitle">Explore a árvore mercadológica de ativos e insumos cadastrados.</p>
      </div>

      {/* SEARCH BAR (LATENCY < 50ms) */}
      <div className="tree-search-wrapper">
        <div className="search-input-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nó mercadológico... (ex: Celulares)"
          />
        </div>
      </div>

      {/* BREADCRUMBS PATH BAR */}
      {breadcrumbs.length > 0 && (
        <div className="breadcrumbs-bar animate-fade-in">
          <span className="root-crumb" onClick={() => setSearchParams({})}>
            Hierarquia
          </span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.pathValue}>
              <span className="divider">&gt;</span>
              <span 
                className={`crumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                onClick={() => setSearchParams({ path: crumb.pathValue })}
              >
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* SEARCH RESULTS OR FULL RECURSIVE TREE */}
      {searchQuery.trim() ? (
        <div className="search-results-container animate-fade-in">
          <h3>Resultados da busca ({filteredSearchNodes.length})</h3>
          {filteredSearchNodes.length > 0 ? (
            <div className="search-results-list">
              {filteredSearchNodes.map((node: TreeNode) => {
                const count = nodeItemCounts.get(`${node.type}-${node.id}`) || 0;
                return (
                  <div 
                    key={`${node.type}-${node.id}`} 
                    className="search-result-row"
                    onClick={() => {
                      setSearchParams({ path: `${node.type}:${node.id}` });
                      setSearchQuery('');
                    }}
                  >
                    <span className="node-type-pill">{node.type}</span>
                    <span className="node-name">{node.nome}</span>
                    <span className="badge node-badge">{count} itens</span>
                    <button 
                      className="btn-add-item-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddItemModal(node);
                      }}
                    >
                      + Adicionar
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-results">Nenhum resultado encontrado para "{searchQuery}".</p>
          )}
        </div>
      ) : (
        <div className="tree-explorer-card animate-fade-in">
          <div className="tree-root-container">
            {rootNodes.map((node: TreeNode) => (
              <RecursiveTreeComponent
                key={`${node.type}-${node.id}`}
                node={node}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                onSelectNode={handleSelectNode}
                onAddItemClick={openAddItemModal}
              />
            ))}
          </div>
        </div>
      )}

      {/* ADD INVENTORY ITEM MODAL */}
      {showAddModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="modal-container glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Item ao Inventário</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="hierarchy-prefill-banner">
              <strong>Contexto Selecionado:</strong> {selectedProductNode?.type.toUpperCase()} &gt; {selectedProductNode?.nome}
            </div>

            <form onSubmit={handleAddItemSubmit} className="modal-form">
              {/* Type selector */}
              <div className="form-group">
                <label>Tipo de Item</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <label className="checkbox-container" style={{ paddingLeft: '1.75rem' }}>
                    <input 
                      type="radio" 
                      name="itemType" 
                      checked={formType === 'ativo'} 
                      onChange={() => setFormType('ativo')} 
                    />
                    <span className="checkmark" style={{ borderRadius: '50%' }}></span>
                    Ativo (Patrimoniado)
                  </label>
                  <label className="checkbox-container" style={{ paddingLeft: '1.75rem' }}>
                    <input 
                      type="radio" 
                      name="itemType" 
                      checked={formType === 'lote'} 
                      onChange={() => setFormType('lote')} 
                    />
                    <span className="checkmark" style={{ borderRadius: '50%' }}></span>
                    Lote (Consumível)
                  </label>
                </div>
              </div>

              {/* Product selector */}
              <div className="form-group">
                <label htmlFor="modal-produto">Produto</label>
                <select 
                  id="modal-produto"
                  value={formProdutoId}
                  onChange={(e) => setFormProdutoId(Number(e.target.value))}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {prefilteredProducts.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Conditional Ativo Inputs */}
              {formType === 'ativo' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="modal-patrimonio">Número do Patrimônio</label>
                    <input
                      type="text"
                      id="modal-patrimonio"
                      value={formPatrimonio}
                      onChange={(e) => setFormPatrimonio(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Ex: PAT-9921"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-condicao">Condição</label>
                    <select
                      id="modal-condicao"
                      value={formCondicao}
                      onChange={(e) => setFormCondicao(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="bom">Bom</option>
                      <option value="reparo">Reparo</option>
                      <option value="ruim">Ruim</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-status">Status</label>
                    <select
                      id="modal-status"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="baixado">Baixado</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Conditional Lote Inputs */}
                  <div className="form-group">
                    <label htmlFor="modal-quantidade">Quantidade</label>
                    <input
                      type="number"
                      id="modal-quantidade"
                      value={formQuantidade}
                      onChange={(e) => setFormQuantidade(Number(e.target.value))}
                      disabled={isSubmitting}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-consumo">Tipo de Consumo</label>
                    <select
                      id="modal-consumo"
                      value={formTipoConsumo}
                      onChange={(e) => setFormTipoConsumo(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="consumo">Consumo</option>
                      <option value="revenda">Revenda</option>
                    </select>
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Confirmar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreePage;
