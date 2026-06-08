# 📖 Introdução e Regras de Negócio

O **Sistema de Gestão de Ativos e Cartões** é uma solução corporativa desenvolvida para gerenciar o inventário físico de equipamentos patrimoniados (laptops, celulares, periféricos) e lotes de insumos consumíveis (como cartões de benefícios corporativos, cartões de combustível, crachás e suprimentos).

---

## 📦 Tipos de Elementos no Inventário

O sistema opera com uma distinção rígida entre dois tipos de itens no inventário:

### 1. Ativos (Patrimoniados)
* **Definição:** Equipamentos individuais com identificação exclusiva (Número de Patrimônio).
* **Rastreabilidade:** Possuem ciclo de vida individualizado, com histórico de movimentações, manutenções e auditorias físicas.
* **Quantidade:** Sempre unitária no estoque (`quantidade = 1`).
* **Estados de Conservação:** `bom` (funcional), `reparo` (manutenção pendente) ou `ruim` (danificado/inativo).
* **Status Operacional:** `ativo` (em uso/circulação) ou `baixado` (descartado).

### 2. Lotes (Consumíveis)
* **Definição:** Itens gerenciados por volume/quantidade e não individualmente (ex: cartões de benefícios).
* **Rastreabilidade:** Controle de saldo consolidado por produto.
* **Quantidade:** Variável e cumulativa (entrada e saída de unidades).
* **Tipos de Consumo:** Classificados como `consumo` interno ou `revenda` corporativa.

---

## 👥 Matriz de Perfis e Permissões Corporativas

O sistema implementa controle de acesso baseado em regras organizacionais (RBAC). A segurança RLS (Row-Level Security) do banco de dados reflete diretamente a seguinte estrutura de permissões no front-end:

| Função / Permissão | Gestor (Admin) | Gerente (Auditor) | Supervisor | Membro Comum (Operador) |
| :--- | :---: | :---: | :---: | :---: |
| **Visualizar Inventário** | Sim | Sim | Sim | Sim |
| **Adicionar Itens (Ativos/Lotes)**| Sim | Não | Não | Não |
| **Transferir Ativos entre Equipes**| Sim | Não | Não | Não |
| **Visualizar Logs de Segurança** | Sim | Não | Não | Não |
| **Convidar Colaboradores** | Sim | Não | Não | Não |
| **Gerenciar Usuários (CRUD)** | Sim | Não | Não | Não |
| **Submeter Checklist de Auditoria**| Sim | Sim (Auditor) | Não | Não |
| **Assinar Digitalmente Inspeções** | Sim | Sim | Não | Não |

> [!NOTE]
> No código, os papéis de `Gestor` e `Gerente/Auditor` herdam as atribuições mais críticas de governança física e auditoria de segurança. `Membros Comuns` têm perfil puramente operacional de consulta das informações de sua respectiva alocação.

---

## 🔍 Regras de Auditoria Física e Inspeção

Durante um checklist de auditoria realizado na visualização de um ativo individual, regras de negócio rígidas são aplicadas na interface (`AuditFlow.tsx`):

### 1. Validação Condicional de Avaria (Estado Danificado)
Se o auditor alterar o estado de conservação do ativo para **Ruim (Danificado)**:
* **Upload Fotográfico Obrigatório:** É estritamente obrigatório anexar uma foto que evidencie a avaria física. O formulário bloqueia a conclusão se nenhuma foto for enviada ao bucket `audit-photos`.
* **Descrição da Avaria Obrigatória:** O campo de notas da auditoria torna-se obrigatório, exigindo que o auditor insira um texto descritivo com as justificativas técnicas do dano.

### 2. Assinatura Digital do Auditor
Qualquer submissão de checklist de auditoria exige uma assinatura válida desenhada na tela pelo auditor no componente de canvas:
* O sistema não aceita submissões vazias ou não assinadas (validação de toque/traço no canvas).
* A imagem da assinatura é convertida para Base64 e anexada como parte dos dados de validação gravados no histórico (`item_history`).

---

[⬅ Voltar para a página inicial](../README.md) | [Ir para Arquitetura e Estrutura ➔](arquitetura.md)
