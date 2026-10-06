# 📖 Grimoire

Dicionário pessoal de vocabulário inglês ↔ português, com temática *Sci-Fi / Terminal*.
Registra o termo, a tradução e o áudio, organiza por categoria e serve de base de
estudo por flashcards.

Backend em Go, banco no Supabase, frontend em HTML, CSS e JavaScript puro. Instalável
como PWA.

🌐 **No ar:** https://grimoire.joaomendes.dev.br

---

## 🛠 Stack

| Camada | O que é |
|---|---|
| **Backend** | Go, roteamento com `chi` |
| **Banco e autenticação** | Supabase (PostgreSQL) + login com Google, JWT validado localmente via JWKS |
| **Frontend** | HTML5, CSS3 e JavaScript sem framework |
| **Estilo** | Tailwind CSS pelo CDN, com tema próprio em `style.css` |
| **Hospedagem** | VPS própria, em container Docker atrás do Caddy |

## ✨ O que ele faz hoje

- **Login com Google**, sem senha própria.
- **Tradução automática bidirecional**, detectando o idioma enquanto se digita. O
  inglês fica sempre como termo principal, qualquer que seja o idioma de entrada.
- **Categorias dinâmicas**, criadas na hora, com cor derivada do nome.
- **Edição em modal**, com tradução automática e redimensionamento do campo.
- **Áudio em dois motores**: URL do TTS do Google e, para textos longos, a voz nativa
  do navegador.
- **Flashcards**, escondendo a tradução até o toque.
- **Filtro por categoria e busca instantânea.**
- **PWA instalável**, com ícone e tela cheia.

## 🚀 Rodando localmente

Exige Go instalado e um projeto no Supabase.

```bash
git clone <repo>
cd grimoire
cp .env.example .env    # preencha as três variáveis abaixo
go run cmd/web/main.go
```

O servidor sobe em `http://localhost:8080`.

### Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Conexão Postgres do Supabase |
| `SUPABASE_URL` | Usada para baixar o JWKS e entregue ao frontend |
| `SUPABASE_PUBLIC_KEY` | Chave anon, entregue ao frontend pelo `/api/config` |
| `PORT` | Opcional; o padrão é `8080`, a porta que o container expõe ao Caddy |

As três primeiras são obrigatórias: sem qualquer uma delas, o servidor **aborta no
boot** de propósito, em vez de falhar no meio de uma requisição.

> O `SUPABASE_JWT_SECRET` **não é mais usado**. Ele existia quando o token era
> validado com segredo compartilhado; desde a migração para JWKS, a validação usa a
> chave pública do Supabase. Se ainda estiver em algum `.env`, pode ser removido.

### Banco

O schema **não é criado pelo Go**. Ele vive em `sql/`, versionado, e é aplicado à mão
no SQL Editor do Supabase. Em banco novo, aplique na ordem: `000`, `001`, `002`.

Ver `sql/README.md` para a convenção.

## 🚢 Publicando

`git push` na `main`. Uma GitHub Action entra na VPS por SSH, atualiza o código,
gera a imagem e recria o container. Os detalhes — e por que o container usa `expose`
e não `ports` — estão em `docs/ARQUITETURA.md`.

## 📂 Estrutura

```
cmd/web/          ponto de entrada e rotas
internal/
  database/       conexão e conferência de schema
  handlers/       words, categories, translate, audio
  middleware/     autenticação JWT e rate limit
  models/         contratos de request e response
static/           index.html, app.js, style.css, manifest, service worker
sql/              schema versionado e snapshot do banco
docs/             arquitetura, decisões, armadilhas e roadmap
AGENTS.md         regras para quem mexe no repositório
```

## 📚 Documentação

| Arquivo | Para quê |
|---|---|
| `AGENTS.md` | Como trabalhar neste repositório. **Leia antes de mexer** |
| `docs/ARQUITETURA.md` | Como o sistema funciona por dentro |
| `docs/DECISIONS.md` | O que foi decidido e por quê |
| `docs/PITFALLS.md` | Armadilhas conhecidas, com sintoma e conferência |
| `docs/ROADMAP.md` | O que foi feito e o que vem |
| `sql/README.md` | Convenção do schema versionado |

## 📄 Licença

Ver `LICENSE`.
