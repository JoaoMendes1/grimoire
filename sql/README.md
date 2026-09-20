# 🗄️ sql/ — schema versionado do Grimoire

> Todo DDL do projeto vive aqui, num arquivo numerado por ordem de aplicação.
>
> **Até 19/09/2026 o schema era criado pelo `database.InitDB()` a cada boot.** Isso
> funcionava em banco vazio e falhava em silêncio em banco existente: o
> `CREATE TABLE IF NOT EXISTS` cria, mas nunca altera. Uma coluna nova nunca chegava
> ao banco, e o boot mesmo assim anunciava "schema verificado com sucesso".

---

## Como usar

1. Crie o arquivo com o próximo número livre e um nome que diga o que ele faz.
2. Aplique **à mão**, no SQL Editor do Supabase, lendo o que vai rodar.
3. Rode a conferência que está comentada no fim do arquivo.
4. Registre a data na tabela abaixo.
5. Regenere o `snapshot_schema.sql` (ver seção própria).

## Regras

- **Arquivo aplicado nunca é editado.** Correção é arquivo novo, com o motivo no
  cabeçalho. Editar um arquivo já aplicado faz o repositório mentir sobre o banco.
- **Todo arquivo se explica no cabeçalho:** o que muda, por quê, e o que acontece se
  for revertido.
- **Todo arquivo termina com a conferência**, comentada: a consulta que prova que ele
  fez o que prometeu. Contagem não basta — confira o predicado.
- **Destrutivo vem embrulhado.** `DELETE` e `DROP` de teste vão em `BEGIN; ... ROLLBACK;`
  para serem vistos sem serem aplicados.
- **Ordem em relação ao deploy importa.** Se o arquivo remove algo que o código ainda
  usa, ele roda **depois** do deploy. Se adiciona algo que o código novo exige, roda
  antes. O cabeçalho diz qual é o caso.

## Arquivos

| Arquivo | O que faz | Aplicado em |
|---|---|---|
| `001_alinha_user_id.sql` | `categories.user_id` vira `uuid`, como já era em `vocabularies` | 19/09/2026 |
| `002_rls_policies.sql` | Policies de dono em `vocabularies` e `categories` | 19/09/2026 |

## O snapshot

O `snapshot_schema.sql` é a **foto do banco agora**: tabelas, colunas, índices,
policies e funções. Ele não é aplicado nunca — serve para responder "como está hoje?"
sem abrir o Supabase, e para o próximo arquivo ser escrito contra o estado real.

Gerar com a consulta em `snapshot_query.sql`, colando o resultado por cima do arquivo
anterior. O commit do snapshot vai junto do arquivo que causou a mudança.