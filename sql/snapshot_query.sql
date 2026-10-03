-- snapshot_query.sql
--
-- Rode no SQL Editor do Supabase e cole o resultado em snapshot_schema.sql.
-- Não aplique este arquivo: ele só lê o catálogo do Postgres.
--
-- São cinco consultas independentes. Rode uma de cada vez — o SQL Editor mostra
-- apenas o resultado da última quando várias vão juntas.

-- =============================================================================
-- [1] TABELAS — colunas e tipos
-- =============================================================================
SELECT
    '-- ' || table_name || E'\n' ||
    string_agg(
        '--     ' || rpad(column_name, 28) || ' ' || data_type ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL
             THEN ' DEFAULT ' || column_default ELSE '' END,
        E'\n' ORDER BY ordinal_position
    ) AS snapshot
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- =============================================================================
-- [2] RLS POR TABELA — ligada ou não
-- =============================================================================
SELECT '-- ' || rpad(tablename, 24) || ' rls=' || rowsecurity AS snapshot
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- [3] POLICIES — o predicado, não só o nome
--
-- O qual e o with_check são o que importa: policy com USING (true) está ligada
-- e não protege nada.
-- =============================================================================
SELECT
    '-- ' || tablename || ' · ' || policyname || ' (' || cmd || ')' || E'\n' ||
    '--     USING: '      || COALESCE(qual, '—') || E'\n' ||
    '--     WITH CHECK: ' || COALESCE(with_check, '—') AS snapshot
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- [4] ÍNDICES
-- =============================================================================
SELECT '-- ' || indexdef AS snapshot
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- [5] FUNÇÕES E PERMISSÃO DE EXECUÇÃO
--
-- SECURITY DEFINER atravessa a RLS: quem pode executar importa tanto quanto o
-- corpo da função.
-- =============================================================================
SELECT
    '-- ' || p.proname ||
    CASE WHEN p.prosecdef THEN ' [SECURITY DEFINER]' ELSE ' [invoker]' END ||
    E'\n--     execute: ' || COALESCE(array_to_string(p.proacl, ', '), 'padrão') AS snapshot
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;