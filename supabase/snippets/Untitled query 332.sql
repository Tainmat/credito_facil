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
