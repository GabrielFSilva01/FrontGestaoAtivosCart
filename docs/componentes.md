# 🧩 Comportamento e Design dos Componentes

O **FrontGestaoAtivosCart** utiliza uma interface focada em UX fluida, baseada em Glassmorphism (efeitos translúcidos de vidro via `backdrop-filter`), micro-animações CSS e controles robustos para interação móvel. Esta seção documenta os comportamentos técnicos fundamentais dos componentes.

---

## 💻 Componentes Principais

### 1. Painel Geral (`Dashboard`)
* **Métricas Gerais:** Exibe cartões de KPIs animados (Valor do Inventário, Itens em Manutenção, Taxa de Perda e Rotatividade) com efeitos de gradientes e sombras dinâmicas no hover.
* **Navegação por Abas:** Alterna o conteúdo principal entre a listagem de Usuários (com paginação de skeletons durante o carregamento), o Painel de Convites Corporativos e os Logs de Auditoria de Acesso.
* **Modais Dialog:** Implementa modais customizados que interceptam cliques externos para fechamento automático e possuem estados desabilitados durante o envio de dados.

### 2. Navegação de Árvore (`TreePage`)
* **Breadcrumbs Interativo:** Racha a rota atual do usuário obtida via parâmetros de pesquisa da URL (`?path=tipo:12-linha:4-marca:9`) e constrói dinamicamente links de retorno hierárquicos clicáveis.
* **Busca Incremental:** Campo de pesquisa textual em memória que exibe instantaneamente os nós correspondentes, permitindo atalho rápido de seleção.

### 3. Inspeção e Checklist (`AuditFlow`)
* **Validação Cruzada de Avarias:** Formulário dinâmico que escuta o estado do seletor de conservação. Caso marcado como `ruim` (danificado), altera o estado de validação do formulário, passando a exigir registro fotográfico e notas descritivas.
* **Mecanismo de Assinatura:** Canvas de captura para formalização legal do checklist.

---

## 📱 Assinatura Digital: Bloqueio de Gestos de Toque

Desenhar em telas de toque (celulares/tablets) apresenta um desafio clássico: o gesto de arrastar o dedo para desenhar a assinatura dispara a rolagem da página inteira no navegador. 

Para neutralizar esse comportamento e garantir uma assinatura limpa, o componente `AuditFlow.tsx` implementa um override de eventos diretamente no DOM utilizando `preventDefault` passivo configurado como falso:

```javascript
// AuditFlow.tsx
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const preventDefault = (e: Event) => {
    // Se o toque ocorrer exatamente sobre o canvas de assinatura, bloqueia a rolagem global
    if (e.target === canvas) {
      e.preventDefault();
    }
  };

  // Registra os listeners com passive: false para permitir o preventDefault
  document.body.addEventListener('touchstart', preventDefault, { passive: false });
  document.body.addEventListener('touchend', preventDefault, { passive: false });
  document.body.addEventListener('touchmove', preventDefault, { passive: false });

  // Limpeza de listeners na desmontagem do componente
  return () => {
    document.body.removeEventListener('touchstart', preventDefault);
    document.body.removeEventListener('touchend', preventDefault);
    document.body.removeEventListener('touchmove', preventDefault);
  };
}, []);
```

Esse bloco garante que qualquer interação com o mouse ou toque dentro da área do Canvas seja capturada puramente para o desenho do traço (convertido e salvo em formato Base64 via `canvas.toDataURL()`), enquanto o restante da tela mantém a rolagem normal.

---

## ⚡ Renderização Otimizada: Lazy Render e Recursão

Renderizar uma árvore mercadológica de 5 níveis com centenas de sub-pastas pode degradar drasticamente o desempenho do navegador se todos os elementos forem adicionados ao DOM simultaneamente. O sistema resolve isso com duas otimizações em `TreePage.tsx`:

### 1. Componentes Recursivos Memoizados
O nó da árvore é renderizado recursivamente via `RecursiveTreeComponent`. Ele é envolto em `React.memo` para evitar que a re-renderização de uma pasta isolada force a atualização visual de toda a árvore de forma desnecessária.

### 2. Lazy Rendering via `IntersectionObserver`
Quando uma pasta é expandida, seus nós filhos imediatos não são renderizados de imediato se estiverem abaixo da linha de dobra visual (viewport). O componente `LazyRender` monitora a visibilidade usando a API `IntersectionObserver`:

* **Placeholder:** Enquanto o nó filho não está visível, renderiza-se um placeholder leve em texto (`Carregando...`).
* **Trigger:** Um `rootMargin: '100px'` é configurado para disparar o carregamento real do componente 100 pixels antes do nó entrar na área visível da tela, garantindo uma rolagem suave e sem travamentos percebidos pelo usuário.

---

## 🔍 Busca Incremental com Latência < 50ms

A busca mercadológica em tempo real (`TreePage.tsx`) foi otimizada para evitar latências de rede e processamento:

```typescript
// TreePage.tsx
const filteredSearchNodes = useMemo(() => {
  if (!searchQuery.trim()) return [];
  const lowerQuery = searchQuery.toLowerCase();
  
  const startTime = performance.now();
  
  // Busca direta em memória
  const results = mercadologicalTree.filter((n: TreeNode) => 
    n.nome.toLowerCase().includes(lowerQuery)
  );
  
  const duration = performance.now() - startTime;
  console.log(`Busca incremental concluída em ${duration.toFixed(2)}ms`);
  return results;
}, [searchQuery, mercadologicalTree]);
```

### Por que é tão rápido?
* **Sem Requisições HTTP Adicionais:** Como a árvore foi totalmente cacheada localmente na Fase 2 de Hidratação da Store, a busca funciona inteiramente no cliente.
* **Complexidade Algorítmica $O(N)$:** Filtra a lista linear em um único loop simples de busca de string.
* **Memoização Dinâmica:** O uso do `useMemo` garante que o cálculo só seja refeito se o termo digitado (`searchQuery`) ou os nós da árvore (`mercadologicalTree`) sofrerem alteração. Em testes práticos com centenas de categorias, a resposta da busca é processada em menos de **5 milissegundos**.

---

[⬅ Gerenciamento de Estado](gerenciamento_estado.md) | [Ir para Guia de Setup ➔](guia_setup.md)
