# 🏗️ ARQUITETURA.md — como o Grimoire funciona

> O mapa do sistema: o que existe, por onde passa uma requisição e o que cada peça
> faz. Escrito em 19/09/2026 a partir do código, não de memória.
>
> Atualizado em 22/09/2026 com a migração do Render para VPS própria, e em 03/10/2026
> com o schema versionado e as policies de RLS.

---

## Visão geral

```
navegador          Caddy              servidor Go (container)      serviços externos
─────────          ─────              ───────────────────────      ─────────────────
index.html         HTTPS              chi router
app.js          ── JWT ──────────►    middleware.AuthSupabase  ──► Supabase (JWKS)
supabase-js     ── login ───────────────────────────────────────►  Supabase Auth
                                      handlers/words           ──► Postgres (lib/pq)
                                      handlers/categories      ──► Postgres
                                      handlers/translate       ──► Google Translate
                                      handlers/audio           ──► Google TTS (via URL)
```

**O servidor Go faz duas coisas:** serve os arquivos estáticos e expõe a API. Não há
template nem renderização no servidor — o `static/` é entregue como está.

**O Caddy fica na frente**, detém as portas 80 e 443, emite o certificado e encaminha
para o container pelo nome do serviço (`grimoire:8080`).

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
`postgres`, que ignora RLS. As policies do `sql/002` são a segunda camada: valem para
quem acessa pela API do Supabase com JWT, não para o Go. Ver item 1 do `PITFALLS.md`.

---

## Banco

Duas tabelas. O schema vive em `sql/`, versionado e aplicado à mão no Supabase — ver
`sql/README.md`.

O `database.InitDB()` **não cria nem altera tabela**: abre a conexão, faz `Ping` e
confere se as duas tabelas existem. Se faltar alguma, o servidor não sobe. Até
19/09/2026 era ele quem criava o schema a cada boot — ver item 3 do `PITFALLS.md`.

| Tabela | Colunas |
|---|---|
| `categories` | `id`, `name`, `user_id` (`uuid`, obrigatório), `created_at` |
| `vocabularies` | `id`, `term`, `translation`, `audio_url`, `status`, `user_id` (`uuid`, aceita nulo), `category_id`, `created_at` |

`vocabularies.category_id` referencia `categories(id)` com `ON DELETE SET NULL`:
apagar uma categoria não apaga as palavras dela.

Índices em `categories(user_id)`, `vocabularies(user_id)` e `vocabularies(category_id)`.

RLS ligada nas duas, com uma policy de dono em cada: `vocabularies_dono` e
`categories_dono`, `FOR ALL`, com `USING` e `WITH CHECK` comparando `auth.uid()` com
`user_id`. Ver `sql/002_rls_policies.sql`.

**Não há FK de `user_id` para `auth.users`.** Excluir uma conta deixa o vocabulário
dela órfão. Ver as decisões pendentes no `DECISIONS.md`.

**`status` existe com default `'Pendente'` e não é usado por nenhuma tela.** É resíduo
de uma etiqueta removida na Fase 2, e candidato a remoção.

### Conexão a partir de fora

Desde a migração, o acesso administrativo ao banco (`pg_dump` do backup, por exemplo)
usa o **Session pooler** do Supabase, na porta 5432. A conexão direta é IPv6-only e o
endereço IPv4 dedicado é add-on pago do plano Pro.

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

Desde 22/09/2026 o Grimoire roda em **VPS própria** (Integrator, Ubuntu 26.04 LTS), na
mesma máquina dos outros projetos, em container Docker atrás do **Caddy** como proxy
reverso. **O Render foi suspenso.**

| Item | Valor |
|---|---|
| URL | `https://grimoire.joaomendes.dev.br` |
| Certificado | emitido e renovado sozinho pelo Caddy, via Let's Encrypt |
| Imagem | build em duas etapas (Go → Alpine), **32 MB** |
| Variáveis | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLIC_KEY`, `PORT` |

As variáveis vivem no `.env` da pasta do projeto no servidor e entram no container pelo
`env_file` do compose. O `.env` não vai para o Git, e é copiado no backup diário. Ele
não se atualiza sozinho — ver item 13 do `PITFALLS.md`.

### Por que `expose` e não `ports`

O container declara `expose: 8080`, não `ports`. Só o Caddy alcança a porta.

Isso é deliberado: **o Docker escreve regras direto no `iptables` e fura o UFW**. Porta
publicada com `-p` fica acessível pela internet mesmo sem regra no firewall — foi
testado e comprovado durante a migração. Ver item 11 do `PITFALLS.md`.

### Publicar

**`git push` na `main`.** Uma GitHub Action conecta na VPS por SSH e roda:

```bash
cd ~/grimoire && git pull origin main
docker build -t grimoire .
cd ~/infra && docker compose up -d --force-recreate grimoire
docker image prune -f
```

O build acontece na VPS. Não há registro de imagens — decisão consciente: build de
~90 s numa máquina ociosa não justifica a peça extra.

A Action fica verde mesmo quando o `git pull` não trouxe nada. Ver item 12 do
`PITFALLS.md`.

### O que mudou em relação ao Render

- **Não há mais hibernação.** O container está sempre de pé, e a primeira visita do dia
  não demora mais.
- **O mapa do rate limit** só zera em deploy ou restart de verdade, não a cada
  acordada.
- **O IP de saída virou fixo**, e é o mesmo dos outros projetos da máquina. Um bloqueio
  do Google atinge sempre esse endereço. Ver item 5 do `PITFALLS.md`.
- **Atualização de sistema e backup passaram a ser responsabilidade própria.** O
  `unattended-upgrades` cuida das correções de segurança; o backup roda às 3h todo dia
  para o Google Drive. **A restauração desse backup nunca foi testada.**