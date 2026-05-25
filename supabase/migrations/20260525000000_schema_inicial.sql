-- 1. Criar tabela 'solicitacoes'
CREATE TABLE IF NOT EXISTS public.solicitacoes (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    solicitante_nome TEXT,
    solicitante_cpf TEXT,
    solicitante_telefone TEXT,
    solicitante_valor NUMERIC,
    solicitante_pix TEXT,
    solicitante_data_pagamento TEXT,
    contato_nome TEXT,
    contato_cpf TEXT,
    contato_telefone TEXT,
    contato_relacionamento TEXT,
    pagamento_pago BOOLEAN DEFAULT false,
    pagamento_valor_pago NUMERIC,
    pagamento_pago_em TEXT
);

-- 2. Criar tabela 'transacoes_caixa'
CREATE TABLE IF NOT EXISTS public.transacoes_caixa (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('aporte', 'resgate')),
    valor NUMERIC NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Habilitar Row Level Security (RLS) nas tabelas
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_caixa ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir insercao publica de propostas" ON public.solicitacoes;
DROP POLICY IF EXISTS "Permitir controle total para admins autenticados" ON public.solicitacoes;
DROP POLICY IF EXISTS "Permitir controle total de transacoes para admins" ON public.transacoes_caixa;

-- 5. Criar políticas de acesso (RLS) para 'solicitacoes'
CREATE POLICY "Permitir insercao publica de propostas" 
ON public.solicitacoes 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir controle total para admins autenticados" 
ON public.solicitacoes 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Criar políticas de acesso (RLS) para 'transacoes_caixa'
CREATE POLICY "Permitir controle total de transacoes para admins" 
ON public.transacoes_caixa 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Habilitar replicação em tempo real (Realtime) para as tabelas
-- Habilitamos REPLICA IDENTITY FULL para que o payload completo dos updates seja enviado
ALTER TABLE public.solicitacoes REPLICA IDENTITY FULL;
ALTER TABLE public.transacoes_caixa REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação do realtime (se a publicação existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_caixa;
    END IF;
END $$;
