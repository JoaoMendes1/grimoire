-- 000_schema_inicial.sql
-- Retrato do schema como ele já existia quando a pasta sql/ foi criada.
--
-- NÃO É PARA APLICAR em banco de produção: as tabelas já estão lá, criadas pelo
-- antigo InitDB. Este arquivo existe para que o repositório saiba qual é o schema,
-- e para recriar o banco do zero em outro ambiente.
--
-- Reconstruído em 19/09/2026 a partir do snapshot, não da memória. Note que
-- vocabularies.user_id é uuid e categories.user_id passou a ser uuid no sql/001.

CREATE TABLE IF NOT EXISTS public.categories (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    user_id    UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.vocabularies (
    id          SERIAL PRIMARY KEY,
    term        TEXT NOT NULL,
    translation TEXT NOT NULL,
    audio_url   TEXT,
    status      TEXT DEFAULT 'Pendente',
    user_id     UUID,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id      ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabularies_user_id    ON public.vocabularies(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabularies_category_id ON public.vocabularies(category_id);

-- RLS ligada junto da criação: tabela nova sem RLS fica aberta ao PostgREST, e
-- o aviso do Supabase no editor é exatamente sobre isso. As policies vêm no 002.
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;