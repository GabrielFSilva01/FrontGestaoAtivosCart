# ⚙️ Guia de Setup, Execução e Testes

Este guia fornece instruções detalhadas para configurar, executar localmente e testar o sistema **FrontGestaoAtivosCart**.

---

## 📌 Pré-requisitos

Certifique-se de ter instalado em seu ambiente:
* **Node.js:** Versão 18.x ou superior (recomendado LTS).
* **NPM:** Gerenciador de pacotes padrão (projeto configurado com `npm@11.7.0` ou compatível).
* **Angular CLI (opcional):** Pode ser instalado globalmente via `npm install -g @angular/cli`.

---

## 🚀 Instalação do Projeto

1. **Clonar o Repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd FrontGestaoAtivosCart
   ```

2. **Instalar Dependências:**
   ```bash
   npm install
   ```

---

## ⚙️ Configuração das Variáveis de Ambiente

As configurações de conexão com o banco de dados do Supabase ficam armazenadas na pasta `src/environments/`:

* **`src/environments/environment.ts` (Produção):**
* **`src/environments/environment.development.ts` (Desenvolvimento):**

Ambos os arquivos expõem o objeto `environment` estruturado da seguinte forma:

```typescript
export const environment = {
  production: false, // true no arquivo de produção
  supabaseUrl: 'https://seu-projeto-supabase.supabase.co',
  supabaseKey: 'sua-chave-anon-public-key-jwt-aqui'
};
```

> [!WARNING]
> Certifique-se de substituir os valores de `supabaseUrl` e `supabaseKey` pelos dados de conexão do seu projeto Supabase no console administrativo. Nunca submeta chaves administrativas privadas (`service_role_key`) no front-end, apenas a chave pública `anon`.

---

## 💻 Comandos e Scripts Úteis

Abaixo estão listados os comandos configurados no `package.json` para o fluxo de trabalho diário:

### 1. Iniciar Servidor de Desenvolvimento
Inicia a aplicação localmente com recarregamento automático no código Angular:
```bash
npm start
# ou executando diretamente pelo CLI do Angular:
ng serve
```
Após a inicialização completa, abra o navegador em `http://localhost:4200/`.

### 2. Compilar Pacote de Produção
Compila e otimiza o código da aplicação de forma otimizada para implantação rápida:
```bash
npm run build
```
Os arquivos gerados são gravados na pasta `dist/front-gestao-ativos-cart`.

### 3. Compilação Incremental Automática
Recompila o projeto incrementalmente a cada modificação nos arquivos no modo de desenvolvimento:
```bash
npm run watch
```

---

## 🧪 Execução das Suítes de Testes

Como o projeto possui uma infraestrutura híbrida, ele conta com duas frentes de validação automática:

### 1. Testes do React (Vitest)
A lógica dos componentes em React (`src/components/`) é testada de forma rápida através do runner do **Vitest**:
```bash
# Executar testes interativamente (Watch mode)
npm run test

# Executar testes e gerar relatório uma única vez (CI)
npx vitest run
```
* **Configurações de teste:** As regras de inclusão de arquivos (`*.spec.tsx` e `*.spec.ts`), mock e drivers JSDOM ficam centralizados no arquivo `vitest.config.ts`.
* **Setup:** Mocks de API e bibliotecas globais são importados em `src/setupTests.ts`.

### 2. Testes do Angular (Karma/Jasmine)
Para executar os testes dos Services (`src/app/services/`) e Guards (`src/app/guards/`) nativos do Angular:
```bash
ng test
```
Esse comando compila os testes e inicia o navegador padrão configurado no Karma para execução e reporte da cobertura lógica.

---

[⬅ Componentes e Telas](componentes.md) | [Ir para Início ➔](../README.md)
