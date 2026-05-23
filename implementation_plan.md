# Configuração da Regra de Login e Segurança (Supabase RLS)

Esta etapa implementa e consolida as regras de autenticação reais e políticas de segurança RLS (Row Level Security) no Supabase local da aplicação `credito_facil`.

Isso garante que:
1. Usuários não autenticados (visitantes) só consigam **inserir** novas propostas de crédito e nada mais.
2. Apenas administradores logados (usuários autenticados) consigam ler, aprovar, deletar propostas e gerenciar as movimentações de caixa.

---

## Ações Necessárias no Supabase local

> [!IMPORTANT]
> **Políticas de Acesso (RLS):**
> Devemos habilitar a proteção contra acessos maliciosos nas tabelas `solicitacoes` e `transacoes_caixa` executando o SQL abaixo no editor SQL do Supabase local (`http://127.0.0.1:54323`).

### 1. Aplicar Políticas de Segurança RLS (SQL)

Execute a query SQL a seguir no **SQL Editor** do Supabase local:

```sql
-- Habilitar Row Level Security nas tabelas
ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_caixa ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (caso existam) para evitar conflitos
DROP POLICY IF EXISTS "Permitir insercao publica de propostas" ON solicitacoes;
DROP POLICY IF EXISTS "Permitir controle total para admins autenticados" ON solicitacoes;
DROP POLICY IF EXISTS "Permitir controle total de transacoes para admins" ON transacoes_caixa;

-- ==========================================
-- POLÍTICAS PARA A TABELA 'solicitacoes'
-- ==========================================

-- 1. Qualquer visitante (anon ou auth) pode criar propostas (INSERT)
CREATE POLICY "Permitir insercao publica de propostas" 
ON solicitacoes 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 2. Somente admins autenticados podem ver, atualizar ou deletar propostas (ALL)
CREATE POLICY "Permitir controle total para admins autenticados" 
ON solicitacoes 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA A TABELA 'transacoes_caixa'
-- ==========================================

-- 1. Somente admins autenticados podem ver ou operar transações de caixa (ALL)
CREATE POLICY "Permitir controle total de transacoes para admins" 
ON transacoes_caixa 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### 2. Criar Usuário Administrador Local

Para poder fazer login no painel, precisamos criar um usuário de teste na autenticação local do Supabase:

1. Acesse o console local em **http://127.0.0.1:54323**.
2. Clique no ícone de chave no menu lateral (**Authentication**).
3. Clique em **Add User** -> **Create User**.
4. Insira um e-mail (ex: `admin@creditofacil.com`) e uma senha forte de sua preferência.
5. **IMPORTANTE:** Certifique-se de marcar a opção **"Auto-confirm user"** para não depender de e-mail de confirmação.
6. Clique em **Create User**.

---

## Verificação e Testes

### Teste de Acesso Público
- Tente fazer uma requisição de leitura (`SELECT`) na tabela `solicitacoes` de forma anônima. Ela deve vir vazia ou dar erro de acesso devido ao RLS.
- Envie uma nova proposta no formulário de cliente e confirme que ela foi inserida normalmente (devido à regra de `INSERT` pública).

### Teste de Painel Administrativo
- Acesse `/login`.
- Faça o login com o e-mail e senha criados.
- Confirme que o painel admin carrega corretamente todas as propostas e o fluxo de caixa, o que atesta que o token do usuário autenticado foi enviado e aceito pelas políticas RLS.
- Clique em "Sair" e confirme o redirecionamento para o login, limpando a sessão.
