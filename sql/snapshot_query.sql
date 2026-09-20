-- ============================================================
-- [1] TABELAS
-- ============================================================
-- categories
--     id                           integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass)
--     name                         text NOT NULL
--     user_id                      uuid NOT NULL
--     created_at                   timestamp without time zone DEFAULT CURRENT_TIMESTAMP

-- vocabularies
--     id                           integer NOT NULL DEFAULT nextval('vocabularies_id_seq'::regclass)
--     term                         text NOT NULL
--     translation                  text NOT NULL
--     audio_url                    text
--     status                       text DEFAULT 'Pendente'::text
--     created_at                   timestamp without time zone DEFAULT CURRENT_TIMESTAMP
--     user_id                      uuid
--     category_id                  integer

-- ============================================================
-- [2] RLS POR TABELA
-- ============================================================
-- categories               rls=true
-- vocabularies             rls=true

-- ============================================================
-- [3] POLICIES
-- ============================================================
-- categories · categories_dono (ALL)
--     USING: (( SELECT auth.uid() AS uid) = user_id)
--     WITH CHECK: (( SELECT auth.uid() AS uid) = user_id)
-- vocabularies · vocabularies_dono (ALL)
--     USING: (( SELECT auth.uid() AS uid) = user_id)
--     WITH CHECK: (( SELECT auth.uid() AS uid) = user_id)

-- ============================================================
-- [4] ÍNDICES
-- ============================================================
-- CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id)
-- CREATE INDEX idx_categories_user_id ON public.categories USING btree (user_id)
-- CREATE INDEX idx_vocabularies_category_id ON public.vocabularies USING btree (category_id)
-- CREATE INDEX idx_vocabularies_user_id ON public.vocabularies USING btree (user_id)
-- CREATE UNIQUE INDEX vocabularies_pkey ON public.vocabularies USING btree (id)

-- ============================================================
-- [5] FUNÇÕES
-- ============================================================
-- nenhuma função