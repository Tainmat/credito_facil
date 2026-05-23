-- Habilitar o envio de eventos Realtime para as tabelas do Crédito Fácil
    alter publication supabase_realtime add table solicitacoes;
    alter publication supabase_realtime add table transacoes_caixa;
