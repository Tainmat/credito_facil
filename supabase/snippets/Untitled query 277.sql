-- 1. Regras para a tabela de 'solicitacoes'
    -- Permite que QUALQUER cliente anônimo envie (insira) propostas pelo formulário
    CREATE POLICY "Permitir insercoes publicas" ON public.solicitacoes 
        FOR INSERT TO anon WITH CHECK (true);
  
    -- Permite controle total (ler, atualizar, deletar) APENAS para administradores autenticados
    CREATE POLICY "Controle total para administradores" ON public.solicitacoes 
        FOR ALL TO authenticated USING (true);
  
    -- 2. Regras para a tabela de 'transacoes_caixa'
    -- Permite controle total do fluxo de caixa APENAS para administradores autenticados
    CREATE POLICY "Controle total para administradores" ON public.transacoes_caixa 
        FOR ALL TO authenticated USING (true);
