# Refatoração Arquitetural: Camada de API Desacoplada e Custom Hooks de Queries/Mutations do TanStack Query

Este plano detalha a reestruturação da comunicação da aplicação `credito_facil` com o Supabase. 

Toda a manipulação direta do banco de dados será migrada para uma camada de API isolada em `src/api`. O controle de estados de dados do Supabase e as chamadas assíncronas do frontend passarão a ser gerenciados de forma granular por **Custom Hooks independentes** criados sob uma estrutura hierárquica baseada em intenção dentro de `src/hooks/services`.

---

## User Review Required

> [!IMPORTANT]
> **Alterações Estruturais Significativas:**
> 1. **Estrutura Granular de Hooks:** Em vez de hooks gigantes que fazem tudo, dividiremos cada Query e Mutation em arquivos separados e independentes dentro de `src/hooks/services/queries/` e `src/hooks/services/mutations/`.
> 2. **Instalação do TanStack Query:** Lembre-se de rodar `npm install @tanstack/react-query` na raiz do seu projeto local.
> 3. **Consumo de Estados Reativos:** O dashboard administrativo e a página de login agora serão extremamente limpos, consumindo diretamente esses hooks granulares.

---

## Proposed Changes

### 1. Configuração do TanStack Query

#### [NEW] [providers.tsx](file:///home/tainmat/projetos/credito_facil/src/app/providers.tsx) (Sobrescrever)
*   Integrar o `QueryClientProvider` no React 18/Next 14 encapsulando o `children`.

---

### 2. Camada de API (`src/api`)

Criaremos a pasta `src/api/` contendo as funções brutas de comunicação com o Supabase:

*   **`src/api/accounts/index.ts`**: Métodos `signIn`, `signOut`, `getSession` e helper `onAuthStateChange`.
*   **`src/api/solicitacoes/index.ts`**: Métodos `getSolicitacoes`, `createSolicitacao`, `updateSolicitacaoStatus`, `updateSolicitacaoPagamento`, `deleteSolicitacao` e tipagens.
*   **`src/api/transacoes/index.ts`**: Métodos `getTransacoes`, `createTransacao` e tipagens.

---

### 3. Nova Estrutura de Custom Hooks (`src/hooks/services`)

Criaremos a pasta `src/hooks/services/` com subpastas focadas na intenção do desenvolvedor:

```text
src/hooks/
└── services/
    ├── queries/
    │   ├── useBuscarSolicitacoesQuery.ts
    │   └── useBuscarTransacoesQuery.ts
    └── mutations/
        ├── useSignInMutation.ts
        ├── useSignOutMutation.ts
        ├── useCriarSolicitacaoMutation.ts
        ├── useAtualizarSolicitacaoStatusMutation.ts
        ├── useRegistrarPagamentoMutation.ts
        ├── useLimparPagamentoMutation.ts
        ├── useRemoverSolicitacaoMutation.ts
        └── useAdicionarTransacaoCaixaMutation.ts
```

#### Queries (`src/hooks/services/queries/`)

*   **[NEW] `useBuscarSolicitacoesQuery.ts`**: Retorna a query `['solicitacoes']` usando a chamada `getSolicitacoes()`.
*   **[NEW] `useBuscarTransacoesQuery.ts`**: Retorna a query `['transacoes']` usando a chamada `getTransacoes()`.

#### Mutations (`src/hooks/services/mutations/`)

*   **[NEW] `useSignInMutation.ts`**: Dispara a mutation de login chamando `signIn()`.
*   **[NEW] `useSignOutMutation.ts`**: Dispara a mutation de logout chamando `signOut()` e invalidando todas as queries de dados.
*   **[NEW] `useCriarSolicitacaoMutation.ts`**: Envia proposta de crédito e invalida a query `['solicitacoes']`.
*   **[NEW] `useAtualizarSolicitacaoStatusMutation.ts`**: Altera status de proposta e invalida a query `['solicitacoes']`.
*   **[NEW] `useRegistrarPagamentoMutation.ts`**: Registra pagamento de proposta e invalida a query `['solicitacoes']`.
*   **[NEW] `useLimparPagamentoMutation.ts`**: Reseta pagamento de proposta e invalida a query `['solicitacoes']`.
*   **[NEW] `useRemoverSolicitacaoMutation.ts`**: Deleta proposta e invalida a query `['solicitacoes']`.
*   **[NEW] `useAdicionarTransacaoCaixaMutation.ts`**: Registra nova transação (Aporte/Resgate) e invalida a query `['transacoes']`.

---

### 4. Migração e Limpeza dos Hooks Existentes

#### [MODIFY] [useSolicitacao.ts](file:///home/tainmat/projetos/credito_facil/src/app/solicitacao/useSolicitacao.ts)
*   Substituir a inserção manual assíncrona do Supabase pelo consumo do hook `useCriarSolicitacaoMutation`.

#### [MODIFY] [usePainelAdmin.ts](file:///home/tainmat/projetos/credito_facil/src/app/painel-admin/usePainelAdmin.ts)
*   Remover toda a manipulação do Supabase de dentro do hook.
*   Consumir `useBuscarSolicitacoesQuery` e `useBuscarTransacoesQuery`.
*   Consumir as mutations de modificação para transações, status, pagamentos e remoção.
*   Os cálculos financeiros (`caixaValor`, `financeiro.disponibilizado`, `financeiro.ganho`, `financeiro.disponivel` e `indicadores`) continuarão sendo calculados de forma síncrona a partir dos dados retornados pelas queries ativas do React Query.

#### [MODIFY] [page.tsx (login)](file:///home/tainmat/projetos/credito_facil/src/app/login/page.tsx)
*   Consumir a mutation `useSignInMutation` para efetuar login de forma controlada.

---

## Verification Plan

### Automated Tests
*   Executar `npm run lint` para checar importações e garantir sintaxe limpa.
*   Executar `npx tsc --noEmit` para conformidade estrita de tipagens TypeScript.

### Manual Verification
1.  Fazer login no painel administrador usando o formulário.
2.  Adicionar um aporte de capital no Caixa no painel administrador e verificar se a lista de transações e todos os cartões financeiros (Caixa, Disponível, Emprestado) se atualizam imediatamente.
3.  Simular o envio de uma proposta pelo portal público e conferir sua aparição instantânea no painel.
