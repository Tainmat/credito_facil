-- Campos para diferenciar solicitacoes de credito e pagamento de boleto
ALTER TABLE public.solicitacoes
ADD COLUMN IF NOT EXISTS tipo_solicitacao TEXT NOT NULL DEFAULT 'credito',
ADD COLUMN IF NOT EXISTS boleto_nome TEXT,
ADD COLUMN IF NOT EXISTS boleto_tipo TEXT,
ADD COLUMN IF NOT EXISTS boleto_tamanho BIGINT,
ADD COLUMN IF NOT EXISTS boleto_storage_path TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'solicitacoes_tipo_solicitacao_check'
          AND conrelid = 'public.solicitacoes'::regclass
    ) THEN
        ALTER TABLE public.solicitacoes
        ADD CONSTRAINT solicitacoes_tipo_solicitacao_check
        CHECK (tipo_solicitacao IN ('credito', 'boleto'));
    END IF;
END $$;

-- Bucket privado para anexos de boletos
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'boletos',
    'boletos',
    false,
    5242880,
    ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Permitir upload publico de boletos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura autenticada de boletos" ON storage.objects;

CREATE POLICY "Permitir upload publico de boletos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'boletos');

CREATE POLICY "Permitir leitura autenticada de boletos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'boletos');
