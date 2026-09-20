# 🗺️ Roadmap do Grimoire

Este documento mapeia a evolução do projeto: o que já está de pé, o que está em
andamento e a visão de futuro.

> **Decisão de arquitetura não mora aqui.** Escopo é o que vai ser feito; o porquê
> vai para o `DECISIONS.md`.

## 📍 Status (19/09/2026)

| Fase | Status |
|---|---|
| 1 · MVP Web | ✅ Concluída |
| 2 · Correções e refinamentos | ✅ Concluída |
| 3 · Nuvem, autenticação e segurança | ✅ Concluída |
| 3.5 · Dívida técnica, categorias e refatoração | ✅ Concluída |
| 4 · Nova identidade, flashcards e edição | ✅ Concluída |
| 4.5 · Dívida técnica e segurança | ✅ Concluída |
| 4.7 · Fundação: schema versionado e documentação | ✅ Concluída |
| 5 · Motor de decodificação (IA) | 🚀 Próxima |
| 6 · App mobile e tempo real | 🕐 Planejada |
| 7 · Retenção e gamificação | 🕐 Planejada |

---

## 🏗️ Fase 1: MVP Web (✅ Concluída)

- [x] Servidor backend estruturado em Go.
- [x] Banco de dados local SQLite.
- [x] Rotas da API (GET, POST, DELETE).
- [x] Interface "Terminal" com Tailwind CSS.
- [x] Camadas separadas em `index.html`, `style.css` e `app.js`.
- [x] Tradução automática via API externa.
- [x] Reprodução de áudio híbrida (API + Web Speech).

## 🔧 Fase 2: Correções e Refinamentos (✅ Concluída)

- [x] **#10 — Segurança:** middleware de autenticação bloqueando requisição sem PIN.
- [x] **#11 — Áudio:** trava para pausar o áudio em execução antes de iniciar outro.
- [x] **#12 — Limpeza visual:** remoção da etiqueta "SALVO" da listagem.
- [x] **#13 — Tradução bidirecional:** detecção automática de idioma nos dois sentidos.
- [x] **#21 — Estabilidade:** bloqueio silencioso de mídia no Service Worker e erro de
      leitura no banco.
- [x] **Higiene do repositório:** `.gitignore` blindando `.db` e binários.

## ☁️ Fase 3: Nuvem, Autenticação e Segurança (✅ Concluída)

- [x] **#22 — Migração de banco:** SQLite para Supabase (PostgreSQL).
- [x] **Login com Google (OAuth2)** pela autenticação nativa do Supabase.
- [x] **#26 — Segurança e refatoração:** injeção de dependências no contexto e remoção
      de credenciais fixas do frontend.
- [x] **#27 — Fail-fast:** o boot aborta se faltar variável crítica.
- [x] **Hospedagem:** deploy no Render com múltiplas origens de redirecionamento.

## 🗂️ Fase 3.5: Dívida Técnica, Categorias e Refatoração (✅ Concluída)

- [x] Ambiente de homologação e roteiro de publicação.
- [x] Ajuste de schema: `user_id` dessincronizado, tabela `categories` criada e
      relacionada com `vocabularies`.
- [x] Inversão de idioma: o inglês é sempre o termo principal ao salvar.
- [x] Rotas CRUD de categorias.
- [x] `PUT /api/words/{id}` para edição de termos.
- [x] Auth: validação remota substituída por validação local de JWT.
- [x] Resiliência: fallback na API de tradução.
- [x] `README.md` atualizado para PostgreSQL e nuvem.

## 🎨 Fase 4: Nova Identidade, Flashcards e Edição (✅ Concluída)

- [x] Edição imersiva em modal, com atualização de áudio e quebra de cache.
- [x] Tradução bidirecional dentro dos modais, com auto-resize.
- [x] Dashboard de categorias, com chips e cores derivadas por hash.
- [x] Interface com animações, orbes e estados vazios tratados.
- [x] Flashcards em accordion, escondendo a tradução.
- [x] Contadores dinâmicos e filtro instantâneo por categoria.
- [x] UX mobile-first: botão flutuante e formulários em tela cheia.
- [x] Modal de confirmação para ações destrutivas e trava contra categoria duplicada.

## 🛡️ Fase 4.5: Dívida Técnica e Segurança (✅ Concluída)

- [x] **#46 — XSS:** sanitização de `term`, `translation` e nome de categoria antes do
      `innerHTML`; `data-*` no lugar de `onclick` interpolado.
- [x] **#54 — UX e identidade:** favicon, botões de copiar e tela de carregamento.
- [x] **Auth JWT local via JWKS**, sem ida ao Supabase a cada requisição.
- [x] **Índices** em `vocabularies(user_id)` e `categories(user_id)`.
- [x] **Rate limiting** em `/api/translate` e `/api/audio`.

## 🧱 Fase 4.7: Fundação — schema versionado e documentação (✅ Concluída)

> Nasceu da retomada de 19/09/2026, depois de dois meses parado. A leitura completa do
> código mostrou que o projeto funcionava, mas não se explicava: nenhuma decisão
> registrada, nenhuma armadilha anotada, e o schema existindo em dois lugares que
> discordavam entre si.

- [x] **Documentação-base:** `AGENTS.md`, `ARQUITETURA.md`, `DECISIONS.md` e
      `PITFALLS.md`.
- [x] **`sql/` versionado**, com README de convenção e consulta de snapshot.
- [x] **`000_schema_inicial.sql`:** o DDL que só existia dentro do Go.
- [x] **`001_alinha_user_id.sql`:** `categories.user_id` vira `uuid`. O banco já tinha
      `uuid` em `vocabularies` e o Go declarava `TEXT` nas duas — divergência invisível,
      porque `CREATE TABLE IF NOT EXISTS` não altera tabela existente.
- [x] **`002_rls_policies.sql`:** policies de dono nas duas tabelas. A RLS estava
      ligada e sem policy nenhuma; o isolamento dependia só do `WHERE` no Go.
- [x] **`README.md` corrigido:** ele citava o `SUPABASE_JWT_SECRET`, abandonado desde
      a migração para JWKS.

## 🤖 Fase 5: Motor de Decodificação (IA) (🚀 Próxima)

- [ ] **Integração com o Gemini** no lugar da API de tradução atual.
- [ ] **Auto-correção e contexto:** a IA corrige a grafia em inglês, traduz e formula
      a frase de exemplo antes de salvar.
- [ ] **Frase de origem:** guardar onde o termo foi encontrado. Palavra solta se
      esquece; palavra com contexto fica.

## 📱 Fase 6: App Mobile (Android) e Tempo Real

- [ ] **Aplicativo nativo** para Android.
- [ ] **Botão flutuante (overlay)** para capturar diálogo por cima de jogos.
- [ ] **Sincronização instantânea** com o Realtime do Supabase.

## 🔁 Fase 7: Retenção e Gamificação

- [ ] **Repetição espaçada (SRS):** revisão agendada antes do esquecimento. É o que
      transforma o Grimoire de arquivo de palavras em hábito diário — e exige campos
      novos no schema.
- [ ] **HUD de estatísticas:** termos registrados e sequência de dias.

---

## 🧹 Dívida técnica conhecida

> Registrada em 19/09/2026, durante a retomada. Nenhum destes itens impede o uso, e
> todos têm o contexto completo no `PITFALLS.md`.

- [ ] **`InitDB()` ainda cria schema.** Deve passar a só conectar e conferir se as
      tabelas existem. É o que permitiu a divergência de tipo do `user_id`.
- [ ] **`audio_url` é dado derivado gravado no banco.** Montar a URL na hora elimina o
      risco de o áudio falar a palavra antiga depois de uma edição.
- [ ] **Coluna `status` não é usada por nenhuma tela.** Resíduo da etiqueta removida na
      Fase 2.
- [ ] **`vocabularies.user_id` aceita nulo**, e `categories.user_id` não. Vocabulário
      sem dono não deveria existir.
- [ ] **Sem testes.** Nenhum `_test.go` no projeto. Começar pelas funções puras:
      `processarTraducao` e a detecção de idioma.
- [ ] **Erro de terceiro devolvido como 500.** Falha do Google deveria ser 503.
- [ ] **Rate limit por IP, não por usuário.** As duas rotas são autenticadas, então
      limitar por `user_id` seria mais justo.
- [ ] **`app.js` com 14 variáveis globais.** Quebrar em módulos por assunto.
- [ ] **Log com `fmt.Println`.** Sem nível e sem área, não se filtra no Render.

## 📋 Backlog / ideias em avaliação

> Nada aqui é compromisso de escopo.

- [ ] **Exportar o vocabulário** em CSV ou Anki.
- [ ] **Importar lista pronta** para não começar do zero.
- [ ] **Pesquisa por termo dentro do app**, já que a lista cresce sem limite.
- [ ] **Tailwind compilado** em vez do CDN, se o tempo de carregamento incomodar.

---

## 🧭 Notas de manutenção deste arquivo

- Fase concluída não é apagada: vira registro histórico com os itens marcados.
- Item abandonado vai para "avaliado e descartado", **com a justificativa** — para não
  ser reaberto sem contexto meses depois.
- Ideia nova vai para o Backlog. Só vira fase quando houver decisão explícita de fazer.
- Decisão estrutural vai para o `DECISIONS.md`, não para cá.