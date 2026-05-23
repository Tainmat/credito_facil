-- 1. Criação da tabela de Solicitações de Empréstimo                                                                  
    CREATE TABLE IF NOT EXISTS public.solicitacoes (                                                                       
        id TEXT PRIMARY KEY,                                                                                               
        status TEXT DEFAULT 'Pendente'::text NOT NULL,                                                                     
        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,                                              
        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,                                              
                                                                                                                           
        -- Solicitante                                                                                                     
        solicitante_nome TEXT,                                                                                             
        solicitante_cpf TEXT,                                                                                              
        solicitante_telefone TEXT,                                                                                         
        solicitante_valor NUMERIC,                                                                                         
        solicitante_pix TEXT,                                                                                              
        solicitante_data_pagamento DATE,                                                                                   
                                                                                                                           
        -- Contato de confiança / Guarantor                                                                                
        contato_nome TEXT,                                                                                                 
        contato_cpf TEXT,                                                                                                  
        contato_telefone TEXT,                                                                                             
        contato_relacionamento TEXT,                                                                                       
                                                                                                                           
        -- Status do Pagamento (Retorno do empréstimo)                                                                     
        pagamento_pago BOOLEAN DEFAULT false NOT NULL,                                                                     
        pagamento_valor_pago NUMERIC,                                                                                      
        pagamento_pago_em TIMESTAMPTZ                                                                                      
    );                                                                                                                     
                                                                                                                           
    -- 2. Criação da tabela de Transações do Caixa (Aportes e Resgates)                                                    
    CREATE TABLE IF NOT EXISTS public.transacoes_caixa (                                                                   
        id TEXT PRIMARY KEY,                                                                                               
        tipo TEXT NOT NULL CHECK (tipo IN ('aporte', 'resgate')),                                                          
        valor NUMERIC NOT NULL CHECK (valor > 0),                                                                          
        descricao TEXT,                                                                                                    
        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL                                               
    );        