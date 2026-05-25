# 💸 Crédito Fácil - Microcrédito Inteligente

O **Crédito Fácil** é uma plataforma de gerenciamento e concessão de microcrédito rápido e descomplicado. Ela conecta um portal de propostas para clientes a um painel administrativo seguro em tempo real, permitindo a análise de propostas de crédito, controle de fluxos de caixa (aportes/retiradas), monitoramento de pagamentos, amortizações e juros/multas por atraso.

---

## 🛠️ Stack Tecnológica

O projeto foi construído utilizando as ferramentas de ponta do desenvolvimento moderno:

*   **Frontend (Core):** [Next.js 14 (App Router)](https://nextjs.org/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
*   **Gerenciamento de Servidor & Cache:** [TanStack Query v5 (React Query)](https://tanstack.com/query/latest)
*   **Banco de Dados & Autenticação:** [Supabase (PostgreSQL)](https://supabase.com/) rodando localmente via Docker
*   **Comunicação em Tempo Real:** [Supabase Realtime WebSockets](https://supabase.com/docs/guides/realtime) para reatividade instantânea no dashboard administrativo.

---

## 📐 Arquitetura do Projeto

O código do projeto foi estruturado sob um desacoplamento rígido de responsabilidades e padrões de arquitetura limpa:

*   **`src/api/`**: Contém a camada pura de dados e comunicação com o banco (Supabase). As telas não conhecem a existência do SDK.
*   **`src/hooks/services/`**: Organizado em `queries` e `mutations`, contém Custom Hooks granulares focados em intenção (ex: `useAdicionarTransacaoCaixaMutation`).
*   **`src/app/`**: Estrutura de rotas do Next.js (Portal de Propostas, Login e Painel Admin).

---

## 🚀 Como Iniciar o Projeto Localmente

Siga o passo a passo a seguir para rodar toda a infraestrutura local (Banco de Dados + Aplicação).

### Pré-requisitos
*   **Node.js** (v18 ou superior recomendado)
*   **Docker Desktop** (ativo e rodando na sua máquina)

---

### Passo 1: Inicializar e Subir o Supabase Local (Docker)

O banco de dados PostgreSQL, a autenticação e o realtime rodam localmente via Docker. Graças às **migrações automáticas** configuradas na pasta `supabase/migrations/`, todas as tabelas, políticas de segurança RLS e a replicação de tempo real (Realtime) são provisionadas de forma 100% automática ao iniciar o banco!

1.  Certifique-se de que o Docker Desktop está aberto.
2.  No terminal do projeto, inicialize a infraestrutura do Supabase:
    ```bash
    npx supabase start
    ```
3.  Pronto! Todo o esquema do banco foi criado de forma automática. A URL do painel administrativo do Supabase (Studio) estará rodando em:
    *   **Supabase Studio:** [http://127.0.0.1:54323](http://127.0.0.1:54323)

---

### Passo 3: Criar seu Usuário Administrador de Testes

1.  No Supabase Studio local, acesse a aba **Authentication** (ícone de chave no menu lateral).
2.  Clique em **Add User** ➔ **Create User**.
3.  Insira um e-mail (ex: `admin@creditofacil.com`) e a senha que preferir.
4.  **Importante:** Certifique-se de marcar a opção **"Auto-confirm user"** para ativar o login imediatamente sem confirmação de e-mail.
5.  Clique em **Create User**.

---

### Passo 4: Rodar o Servidor de Desenvolvimento da Aplicação

1.  Instale todas as dependências locais do projeto (caso não tenha feito):
    ```bash
    npm install
    ```
2.  Execute o servidor do Next.js:
    ```bash
    npm run dev
    ```
3.  Acesse a aplicação no navegador:
    *   **Portal Público de Propostas:** [http://localhost:3000/solicitacao](http://localhost:3000/solicitacao)
    *   **Painel Administrativo:** [http://localhost:3000/login](http://localhost:3000/login)

---

## 🛠️ Comandos Disponíveis

No terminal da raiz do projeto, você pode executar:

*   `npm run dev`: Inicia o servidor Next.js local em `localhost:3000`
*   `npm run build`: Cria a versão de build otimizada para produção
*   `npm run lint`: Executa a checagem estrita de regras sintáticas e ESLint
*   `npx tsc --noEmit`: Roda a checagem rigorosa de conformidade de tipos TypeScript
*   `npm test`: Roda os testes unitários via Jest
*   `npx supabase stop`: Interrompe e desliga todos os contêineres Docker do Supabase
