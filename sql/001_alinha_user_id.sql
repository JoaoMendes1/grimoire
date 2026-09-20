-- 001_alinha_user_id.sql
-- Faz categories.user_id virar uuid, como já é em vocabularies.
--
-- O InitDB declara TEXT nas duas tabelas, mas o banco tem uuid em vocabularies:
-- alguém alterou à mão e o Go nunca soube, porque CREATE TABLE IF NOT EXISTS
-- não altera tabela existente (item 3 do PITFALLS.md).
--
-- Alinhar antes de escrever as policies evita fazê-las duas vezes: com uuid dos
-- dois lados, a comparação com auth.uid() é direta, sem cast.
--
-- ORDEM: pode rodar antes do deploy. O lib/pq manda o user_id como texto e o
-- Postgres converte para uuid sozinho no parâmetro.
--
-- ANTES: rodar a conferência de uuid inválido (ver sql/README.md).

BEGIN;

ALTER TABLE public.categories
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

COMMIT;

-- CONFERÊNCIA
-- Esperado: as duas linhas com uuid.
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND column_name = 'user_id';