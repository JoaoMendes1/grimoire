# ⚠️ PITFALLS.md — armadilhas do Grimoire

> Cada item nasceu de algo observado neste repositório. Armadilha corrigida não é
> apagada: recebe a marcação de resolvida, com a data, para o raciocínio continuar
> disponível.
>
> Aberto em 19/09/2026, a partir da leitura completa do código.

---

## 1. RLS ligada não é o mesmo que dado protegido

As tabelas `vocabularies` e `categories` têm `rowsecurity = true` e **nenhuma policy**.
Isso bloqueia o acesso pelo PostgREST — e é por isso que a chave anon exposta em
`/api/config` não é um vazamento hoje.

Mas a proteção real está no `WHERE user_id = $1` de cada handler Go, porque a conexão
usa a `DATABASE_URL` como `postgres`, que **ignora RLS**.

Consequência: um `SELECT` sem filtro devolve o dado de todos os usuários, e nada no
banco impede isso.

Conferência:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('vocabularies', 'categories');

SELECT tablename, policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'public';
```

## 2. `user_id` é `TEXT`, e `auth.uid()` é `uuid`

O schema declara `user_id TEXT`. Qualquer policy que compare com `auth.uid()` precisa
de cast explícito — sem ele o Postgres recusa a comparação e a policy nunca bate.

Consequências que continuam de pé enquanto a coluna for `TEXT`:

- não há FK para `auth.users`, então excluir uma conta deixa vocabulário órfão;
- não há `ON DELETE CASCADE`, e a limpeza teria que ser feita à mão;
- nada impede gravar um `user_id` que não existe.

## 3. `CREATE TABLE IF NOT EXISTS` não altera tabela existente

O schema é criado no `database.InitDB()`, a cada boot. Em banco vazio funciona; em
banco que já tem as tabelas, **toda mudança de coluna é silenciosamente ignorada**.

O sintoma é o pior possível: o código espera uma coluna nova, o boot diz
"Schema e Índices verificados com sucesso", e o erro só aparece no primeiro `INSERT`.

Regra: schema vive em `sql/` versionado, e `InitDB` só conecta.

## 4. `audio_url` é dado derivado gravado no banco

A URL do áudio é montada a partir do termo (`AudioHandler`) e depois **gravada** na
linha do vocabulário.

Se o termo for editado e a URL não for regravada junto, o áudio continua falando a
palavra antiga — sem erro, sem aviso. O `UpdateWordHandler` já grava os dois, então
hoje funciona; o risco é a próxima pessoa esquecer.

Valor derivado não deveria ser persistido: montar a URL na hora elimina a classe
inteira de bug.

## 5. Tradução e áudio usam endpoints internos do Google

`translate_a/single`, `clients5.google.com/translate_a/t` e `translate_tts` não são API
pública. Não têm contrato, não têm aviso de mudança e podem bloquear o IP do servidor.

O fallback na tradução e o rate limit nas rotas reduzem o dano, mas não removem a
dependência. Qualquer um desses endpoints pode parar de responder num dia qualquer, e
o sintoma será "a tradução parou" sem nada no log.

## 6. O rate limit é por IP, e o Render fica atrás de proxy

O `RateLimitAPI` lê o `X-Forwarded-For` e cai no `RemoteAddr` quando ele não existe.
Funciona, com duas ressalvas:

- o mapa de IPs vive em memória e some a cada restart — no free tier, isso acontece a
  cada hibernação;
- vários usuários atrás do mesmo IP dividem a mesma cota.

Limitar por `user_id` em vez de IP seria mais justo, já que as duas rotas são
autenticadas.

## 7. Erro de terceiro devolvido como 500

Os handlers respondem `500` para falha de banco e para falha de API externa. Quando o
Google recusar a tradução, o log dirá "erro interno" e o diagnóstico vai para o lado
errado — foi exatamente esse o custo no AniDeck quando a AniList caiu.

Falha de terceiro é `503`, com o motivo no corpo.

## 8. Estado global no `app.js`

Quatorze variáveis `let` no topo do arquivo guardam desde a lista de palavras até qual
campo foi editado por último. Toda função lê e escreve nelas.

O efeito prático: mudar o comportamento de uma tela exige ler o arquivo inteiro para
saber quem mais toca naquela variável.

## 9. `innerHTML` com dado do usuário

Existe `escapeHTML` e ele é usado — a Issue #46 tratou disso. A armadilha é que a
proteção depende de lembrar: qualquer `innerHTML` novo escrito sem ele reabre o
problema, e nada no código impede.

Regra: texto de usuário passa por `escapeHTML`, sempre.

## 10. Log com `fmt.Println` e emoji

O boot e os erros saem com emoji e texto livre. Em desenvolvimento é agradável; no
painel de logs do Render, com semanas de histórico, não há como filtrar por nível nem
por área.