# 💳 FrontGestaoAtivosCart — Sistema de Gestão de Ativos e Cartões

[![Angular](https://img.shields.io/badge/Angular-v21.2-dd0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![React](https://img.shields.io/badge/React-v19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-769f39?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)

Bem-vindo ao repositório do front-end do **Sistema de Gestão de Ativos e Cartões**. Esta aplicação foi desenvolvida com foco em alta performance, usabilidade móvel/desktop premium e segurança de auditoria em conformidade com políticas corporativas.

---

## 📌 Visão Geral do Projeto

O sistema é uma plataforma para inventariado e controle patrimonial de dispositivos e cartões de benefícios corporativos de uma organização. Ele oferece recursos integrados para governança de equipes, rastreamento mercadológico recursivo, logs de auditoria detalhados e fluxos de inspeção física com captura fotográfica e assinatura digital dos auditores.

### Destaques do Desenvolvimento:
* **Interface Premium & Responsiva:** Design baseado em variáveis CSS customizadas, animações fluidas de transição e suporte total a temas (Light/Dark).
* **Arquitetura Híbrida Angular/React:** Estrutura inovadora que utiliza Angular como container de rotas e bootstrap principal, e implementações equivalentes em React para testes unitários integrados com Vitest.
* **Segurança e RLS:** Controle robusto de permissões associado a perfis de usuário (`Gestor`, `Gerente`, `Supervisor`, `Membro Comum` e `Auditor`), integrados ao mecanismo de autenticação do Supabase.

---

## 📂 Guia de Navegação da Documentação

Para compreender a fundo os detalhes técnicos, fluxos de negócio e regras de desenvolvimento da aplicação, consulte as seções específicas abaixo:

1. 📖 **[Introdução e Regras de Negócio](docs/introducao.md)**
   * Apresentação da solução e conceitos de ativos/lotes.
   * Matriz de perfis corporativos e permissões operacionais.
   * Regras para auditoria física (exigência de fotos e descrição em caso de avaria).

2. 🏗️ **[Arquitetura e Estrutura do Projeto](docs/arquitetura.md)**
   * Justificativa e funcionamento da arquitetura híbrida Angular/React.
   * Mapeamento da árvore mercadológica de 5 níveis de granularidade.
   * Estrutura de diretórios do front-end e diagrama de fluxo de bootstrap.

3. ☁️ **[Integração com Supabase e RLS](docs/supabase.md)**
   * Dicionário de tabelas públicas consumidas.
   * Fluxo de autenticação (`AuthService`) e injeção flexível de dependências.
   * Configuração de segurança RLS (Row Level Security) nas requisições.

4. 💾 **[Gerenciamento de Estado e Sincronização](docs/gerenciamento_estado.md)**
   * Comparação entre o `AppStore` (React Context) e `AppStoreService` (Angular Signals).
   * Arquitetura de **Hidratação de Dados em 2 Fases** para carregamento instantâneo de UI.
   * Algoritmo bottom-up de contagem de itens em nós mercadológicos.

5. 🧩 **[Comportamento e Design dos Componentes](docs/componentes.md)**
   * Detalhamento de interfaces chaves: `Dashboard`, `TreePage` e `AuditFlow`.
   * Canvas de assinatura digital com bloqueio de gestos em dispositivos móveis.
   * Otimizações de desempenho e busca incremental com latência inferior a 50ms.

6. ⚙️ **[Guia de Setup, Execução e Testes](docs/guia_setup.md)**
   * Pré-requisitos e instalação de dependências.
   * Configurações de variáveis de ambiente (`environment.ts`).
   * Como rodar servidores locais (`ng serve` / `npm run dev`) e scripts de build.
   * Suite de testes unitários com Karma/Jasmine (Angular) e Vitest (React).

---

## ⚡ Inicialização Rápida

Se você já possui o projeto clonado e quer executá-lo imediatamente em sua máquina:

```bash
# Instalar dependências
npm install

# Iniciar o servidor local (Angular)
npm start

# Executar testes unitários (Vitest - React)
npm run test
```

O servidor local ficará ativo em `http://localhost:4200/`.
