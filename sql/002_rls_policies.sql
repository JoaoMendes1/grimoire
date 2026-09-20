-- 002_rls_policies.sql
-- Policies de vocabularies e categories.
--
-- A RLS já está ligada nas duas tabelas e não existe policy nenhuma, o que hoje
-- bloqueia o PostgREST por completo. O isolamento real vive no WHERE user_id = $1
-- de cada handler Go, e a conexão via DATABASE_URL roda como postgres, que ignora
-- RLS — então um SELECT sem filtro devolveria o dado de todos os usuários.
--
-- Estas policies são a segunda camada: o banco passa a recusar o que o Go
-- esquecer. E liberam o caminho para ler dado direto do frontend um dia, sem
-- reabrir a discussão.
--
-- FOR ALL com USING e WITH CHECK: USING filtra o que é lido, atualizado e
-- apagado; WITH CHECK impede gravar linha com o user_id de outra pessoa.
--
-- O Go não muda de comportamento: postgres continua atravessando tudo.

ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocabularies_dono" ON public.vocabularies;
CREATE POLICY "vocabularies_dono"
    ON public.vocabularies
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_dono" ON public.categories;
CREATE POLICY "categories_dono"
    ON public.categories
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- O (SELECT auth.uid()) em vez de auth.uid() direto: assim o Postgres avalia a
-- função uma vez por consulta, e não uma vez por linha.

-- CONFERÊNCIA
-- Esperado: duas policies, cmd ALL, com o predicado visível.
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public';
--
-- TESTE REAL (fora do SQL Editor, que roda como postgres e ignora RLS):
-- curl -i "$SUPABASE_URL/rest/v1/vocabularies?select=*" \
--   -H "apikey: $SUPABASE_PUBLIC_KEY" -H "Authorization: Bearer $JWT_DE_OUTRA_CONTA"
-- Esperado: só as linhas daquela conta, nunca as suas.