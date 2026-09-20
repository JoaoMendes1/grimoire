# 🏗️ ARQUITETURA.md — como o Grimoire funciona

> O mapa do sistema: o que existe, por onde passa uma requisição e o que cada peça
> faz. Escrito em 19/09/2026 a partir do código, não de memória.

---

## Visão geral

```
navegador                      servidor Go (Render)           serviços externos
─────────                      ────────────────────           ─────────────────
index.html                     chi router
app.js          ── JWT ──►     middleware.AuthSupabase  ──►   Supabase (JWKS)
supabase-js     ── login ─────────────────────────────►       Supabase Auth
                               handlers/words           ──►   Postgres (lib/pq)
                               handlers/categories      ──►   Postgres
                               handlers/translate       ──►   Google Translate
                               handlers/audio           ──►   Google TTS (via URL)
```

**O servidor Go faz duas coisas:** serve os arquivos estáticos e expõe a API. Não há
template nem renderização no servidor — o `static/` é entregue como está.

---

## Autenticação

1. O navegador chama `GET /api/config` e recebe a URL e a chave anon do Supabase.
2. O `supabase-js` faz o login com Google e guarda o token.
3. Toda chamada à API vai com `Authorization: Bearer <jwt>`.
4. O `AuthSupabase` valida o token **localmente**, contra o JWKS baixado no boot, e
   põe o `sub` no contexto como `UserIDKey`.
5. Cada handler lê esse `userID` e filtra as consultas por ele.

**O ponto que precisa ficar claro:** o isolamento entre usuários acontece no `WHERE
user_id = $1` de cada handler. A conexão com o banco usa a `DATABASE_URL` como
`postgres`, que ignora RLS. Ver item 1 do `PITFALLS.md`.

---

## Banco

Duas tabelas, criadas hoje pelo `database.InitDB()` a cada boot:

| Tabela | Colunas |
|---|---|
| `categories` | `id`, `name`, `user_id`, `created_at` |
| `vocabularies` | `id`, `term`, `translation`, `audio_url`, `status`, `user_id`, `category_id`, `created_at` |

`vocabularies.category_id` referencia `categories(id)` com `ON DELETE SET NULL`:
apagar uma categoria não apaga as palavras dela.

Índices em `categories(user_id)`, `vocabularies(user_id)` e `vocabularies(category_id)`.

RLS ligada nas duas, sem policy — ver `DECISIONS.md` de 19/09/2026.

**`status` existe com default `'Pendente'` e não é usado por nenhuma tela.** É resíduo
de uma etiqueta removida na Fase 2, e candidato a remoção.

---

## Rotas

| Método | Rota | Proteção |
|---|---|---|
| GET | `/api/config` | nenhuma — devolve só o que é público |
| POST | `/api/translate` | auth + rate limit |
| POST | `/api/audio` | auth + rate limit |
| GET POST | `/api/words` | auth |
| PUT DELETE | `/api/words/{id}` | auth |
| GET POST | `/api/categories` | auth |
| PUT DELETE | `/api/categories/{id}` | auth |

O rate limit só cobre as duas rotas que falam com serviços externos. Ver item 6 do
`PITFALLS.md`.

---

## Tradução

`POST /api/translate` recebe um termo e devolve a tradução com o idioma detectado.

1. Tenta o endpoint principal do Google, com `sl=auto&tl=pt`.
2. Se falhar ou vier vazio, tenta o endpoint alternativo.
3. Se o idioma detectado for português, refaz a chamada com `sl=pt&tl=en`.

O passo 3 é o que garante a regra de produto: **o inglês é sempre o termo principal**,
qualquer que seja o idioma digitado.

---

## Áudio

`POST /api/audio` **não gera áudio**: monta a URL do TTS do Google e devolve. Quem
baixa o som é o navegador.

Acima de 200 caracteres a resposta vem com URL vazia, de propósito, e o frontend usa o
`SpeechSynthesis`. Resposta vazia aqui não é erro.

---

## Frontend

Três arquivos em `static/`, sem build:

- `index.html` — a tela inteira, incluindo os modais
- `app.js` — estado, chamadas à API e renderização por `innerHTML`
- `style.css` — o tema sci-fi, complementando o Tailwind do CDN

Mais o `manifest.json` e o `sw.js`, que fazem o app instalável.

O `app.js` mantém estado em variáveis globais no topo do arquivo — lista de palavras,
categorias, filtro ativo, item em edição. Ver item 8 do `PITFALLS.md`.

---

## Deploy

Servidor Go no Render, com as variáveis `DATABASE_URL`, `SUPABASE_URL` e
`SUPABASE_PUBLIC_KEY`. O `PORT` vem do próprio Render.

O `README.md` ainda cita `SUPABASE_JWT_SECRET`, que deixou de ser necessário quando a
validação passou a ser por JWKS. **Está errado e precisa de correção.**

No free tier o serviço hiberna sem tráfego: a primeira requisição depois de um tempo
parado demora, e o mapa do rate limit começa vazio.