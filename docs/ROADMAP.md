# 🗺️ Roadmap do Grimoire

Este documento mapeia a evolução do projeto: o que já está de pé, o que está em
andamento e a visão de futuro.

> **Decisão de arquitetura não mora aqui.** Escopo é o que vai ser feito; o porquê
> vai para o `DECISIONS.md`.

> **Revisão de 03/10/2026.** As fases 5 a 7 foram reescritas a partir do protótipo
> `docs/prototipos/grimoire-prototipo-v2.html`. A versão anterior descrevia um produto
> que não é mais o alvo: ela apostava em captura de diálogo por cima de jogos, uso que
> acabou quando o jogo ganhou legenda em português. O foco agora é frase vinda de
> qualquer lugar — Duolingo, série, leitura, conversa.

## 📍 Status (03/10/2026)

| Fase | Status |
|---|---|
| 1 · MVP Web | ✅ Concluída |
| 2 · Correções e refinamentos | ✅ Concluída |
| 3 · Nuvem, autenticação e segurança | ✅ Concluída |
| 3.5 · Dívida técnica, categorias e refatoração | ✅ Concluída |
| 4 · Nova identidade, flashcards e edição | ✅ Concluída |
| 4.5 · Dívida técnica e segurança | ✅ Concluída |
| 4.7 · Fundação: schema versionado e documentação | ✅ Concluída |
| 5 · Motor de revisão (SRS) | 🚀 Próxima |
| 6 · Taxonomia de rótulos | 🕐 Planejada |
| 7 · Relatório e curva de retenção | 🕐 Planejada |
| 8 · Worker de decodificação (IA) | 🕐 Planejada |
| 9 · Busca semântica (pgvector) | 🕐 Planejada |
| 10 · Modo Jogo: rank, XP e penalidade | 🕐 Planejada |

Infraestrutura: **VPS própria desde 22/09/2026** — ver "Manutenção", no fim do arquivo.

---

## 🧭 A ordem das fases 5 a 10 não é arbitrária

Cada fase existe onde está porque a seguinte depende dela:

- **SRS vem primeiro** porque é a única que mexe no schema de forma profunda. Força de
  memória, data da próxima revisão e histórico de acertos são colunas que o relatório,
  a fila do dia e o XP vão todos ler. Construir estatística antes é calcular sobre
  coluna que não existe.
- **Taxonomia vem antes da IA** porque o worker sugere rótulo. Sem tabela canônica de
  rótulos, ele grava texto livre e nasce a bagunça que o AniDeck levou meses para
  desfazer — "Code", "Código" e "Golang" como três coisas diferentes.
- **Relatório vem antes do worker** porque é a fase mais barata: é SQL sobre dado que
  já existe. Entrega retorno visível cedo, o que importa num projeto que já ficou dois
  meses parado.
- **pgvector vem depois do worker** porque é o mesmo worker que gera o embedding. Antes
  dele, não há o que indexar.
- **Gamificação vem por último** porque é a única camada desligável, e porque o peso do
  XP só faz sentido quando o número do SRS já é confiável.

### Restrição que atravessa todas elas

O protótipo tem dois modos: **Estudo** (formal, sem pontuação) e **Jogo** (rank, XP,
penalidade). Toda tela construída da Fase 5 em diante nasce consciente dos dois — o
elemento de jogo é marcado e escondido por preferência, não adicionado depois. Retrofit
de modo em tela pronta significa reescrever a tela.

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
      *(Substituído pela VPS própria em 22/09/2026.)*

## 🗂️ Fase 3.5: Dívida Técnica, Categorias e Refatoração (✅ Concluída)

- [x] Ambiente de homologação e roteiro de publicação. *(O ambiente vivia no Render e
      saiu junto com ele — ver Backlog.)*
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
- [x] **`sql/` versionado**, com README de convenção e snapshot do banco.
- [x] **`000_schema_inicial.sql`:** o DDL que só existia dentro do Go.
- [x] **`001_alinha_user_id.sql`:** `categories.user_id` vira `uuid`. O banco já tinha
      `uuid` em `vocabularies` e o Go declarava `TEXT` nas duas — divergência invisível,
      porque `CREATE TABLE IF NOT EXISTS` não altera tabela existente.
- [x] **`002_rls_policies.sql`:** policies de dono nas duas tabelas. A RLS estava
      ligada e sem policy nenhuma; o isolamento dependia só do `WHERE` no Go.
- [x] **`InitDB()` só conecta e confere.** Faz `Ping` e recusa subir se faltar tabela;
      não cria nem altera nada.
- [x] **`README.md` corrigido:** ele citava o `SUPABASE_JWT_SECRET`, abandonado desde
      a migração para JWKS.

---

## 🔁 Fase 5: Motor de revisão (SRS) (🚀 Próxima)

> Tela do protótipo: **Hoje**. É a fase que transforma arquivo de palavras em hábito
> diário, e a única que mexe no schema de forma profunda.

**Bloqueada por decisão aberta:** SM-2 ou FSRS. A escolha muda quais colunas entram em
`vocabularies`, então nenhum arquivo de `sql/` nasce antes dela. Registrar em
`DECISIONS.md`.

- [ ] **Decidir o algoritmo** e registrar a decisão com o custo aceito.
- [ ] **Colunas de revisão** em `vocabularies`: próxima revisão, força de memória,
      histórico de acertos e erros. Arquivo próprio em `sql/`, com `ALTER TABLE`.
- [ ] **Agendador como função pura em Go**, sem banco e sem rede: recebe o estado atual
      e a resposta, devolve o próximo estado. É o que torna o motor testável sem
      subir o Postgres — regra 18 do `AGENTS.md`.
- [ ] **Testes de mesa** do agendador: acerto no prazo, acerto atrasado, erro,
      primeira revisão, teto de intervalo.
- [ ] **Tela Hoje:** a fila do dia dimensionada pelo tempo disponível, não por número
      fixo. Quem tem 3 minutos recebe uma fila de 3 minutos.
- [ ] **Modo descanso:** pausa deliberada que não quebra sequência nem acumula dívida.
      Sem ele, a penalidade da Fase 10 pune quem viajou.
- [ ] **Teto diário** configurável, lido do banco e não do código.

## 🏷️ Fase 6: Taxonomia de rótulos

> Tela do protótipo: **Grimório**. Hoje existe `categories`, texto livre por usuário.
> Rótulo é outra coisa: vocabulário canônico com sinônimos, que o worker da Fase 8 vai
> usar como destino das sugestões.

- [ ] **Tabela de rótulos canônicos**, com nome de exibição e lista de sinônimos.
- [ ] **FK de `vocabularies` para o rótulo**, com `ON DELETE RESTRICT` — apagar rótulo
      em uso tem que falhar, não deixar frase órfã.
- [ ] **Migração das categorias atuais** para rótulos, mapeando duplicata por sinônimo.
- [ ] **Balde "sem rótulo"** visível na interface, com contagem. Dado sem classificação
      escondido é dado perdido.
- [ ] **Frase de origem:** de onde o termo veio (Duolingo, série, leitura, conversa).
      **Decisão aberta:** coluna nova `origin` ou reaproveitar o rótulo. São eixos
      diferentes — "Compras" é assunto, "Duolingo" é procedência — e misturar os dois
      numa coluna só impede filtrar por qualquer um deles.

## 📊 Fase 7: Relatório e curva de retenção

> Tela do protótipo: **Progresso**. A fase mais barata das seis: é SQL sobre dado que
> a Fase 5 já terá gravado.

- [ ] **Views no Postgres** para a curva de retenção, com `security_invoker` para a
      RLS continuar valendo.
- [ ] **HUD:** frases firmes, sequência de dias, revisões no período.
- [ ] **"Onde você erra":** acerto por rótulo, destacando o rótulo mais frágil.
- [ ] **Cálculo no banco, não no Go.** Agregação é o que o Postgres faz melhor, e
      puxar linha por linha para somar em memória não escala nem na primeira centena.

## 🤖 Fase 8: Worker de decodificação (IA)

> Tela do protótipo: **Capturar** — cola a frase, o worker resolve o resto. Substitui
> os endpoints internos do Google, que são a armadilha 5 do `PITFALLS.md`.

- [ ] **Fila de processamento** no banco: a frase entra com status pendente e a resposta
      do usuário é imediata. Chamada de IA dentro do request deixa o usuário esperando
      por algo que pode levar segundos.
- [ ] **Binário separado em `cmd/worker`**, com ciclo de intervalo fixo.
- [ ] **Trava de execução concorrente** com `atomic.Bool` e `CompareAndSwap`: ciclo
      lento não pode ser atropelado pelo seguinte.
- [ ] **Integração com o Gemini:** correção de grafia, tradução e frase de exemplo em
      uma passada só.
- [ ] **Sugestão de rótulo** contra a taxonomia da Fase 6, com nível de confiança.
- [ ] **Kill switch no banco:** desligar a IA sem deploy.
- [ ] **Erro de terceiro é 503**, nunca 500 — armadilha 7.

## 🔍 Fase 9: Busca semântica (pgvector)

> Depende do worker: é ele que gera o embedding. O `pgvector` está disponível no plano
> gratuito do Supabase.

- [ ] **Extensão `pgvector`** habilitada e coluna de embedding em `vocabularies`.
- [ ] **Geração do embedding** no mesmo ciclo do worker, para não haver segunda fila.
- [ ] **"Frases parecidas"** na ficha do termo: encontra o que a busca por texto não
      encontra.
- [ ] **Detecção de quase-duplicata** no momento de capturar, antes de gravar.

## 🎮 Fase 10: Modo Jogo — rank, XP e penalidade

> A única camada desligável. Em **modo Estudo** nada disto aparece; em **modo Jogo**,
> rank, nível e penalidade entram por cima das mesmas telas.

- [ ] **Preferência de modo** por usuário, lida no boot da interface.
- [ ] **Ledger de XP:** cada evento grava quanto valeu *na hora*. Mudar peso depois
      nunca é retroativo — recalcular histórico é como se perde a confiança no número.
- [ ] **Pesos no banco**, não no código: acerto no prazo, bônus por atraso com teto,
      revisão antecipada valendo zero.
- [ ] **Faixas de rank** derivadas de frases firmes, não de XP acumulado. XP mede
      esforço; rank tem que medir resultado.
- [ ] **Penalidade por abandono**, no espírito do Habitica: força de memória decai e a
      frase volta para a fila. O modo descanso da Fase 5 é o antídoto.
- [ ] **Insígnias** por marco atingido.

---

## 🧹 Dívida técnica conhecida

> Registrada em 19/09/2026, durante a retomada, e revista em 03/10/2026. Nenhum destes
> itens impede o uso, e todos têm o contexto completo no `PITFALLS.md`.

- [x] **`InitDB()` ainda cria schema.** Resolvido em 19/09/2026: só conecta e confere
      se as tabelas existem (item 3 do `PITFALLS.md`).
- [ ] **`audio_url` é dado derivado gravado no banco.** Montar a URL na hora elimina o
      risco de o áudio falar a palavra antiga depois de uma edição.
- [ ] **Coluna `status` não é usada por nenhuma tela.** Resíduo da etiqueta removida na
      Fase 2.
- [ ] **`vocabularies.user_id` aceita nulo**, e `categories.user_id` não. Vocabulário
      sem dono não deveria existir. Pré-requisito da FK para `auth.users`.
- [ ] **Sem testes.** Nenhum `_test.go` no projeto. Começar pelas funções puras:
      `processarTraducao` e a detecção de idioma.
- [ ] **Erro de terceiro devolvido como 500.** Falha do Google deveria ser 503.
- [ ] **Rate limit por IP, não por usuário.** As duas rotas são autenticadas, então
      limitar por `user_id` seria mais justo.
- [ ] **`app.js` com 15 variáveis globais.** Quebrar em módulos por assunto. A Fase 5
      adiciona tela nova, e tela nova sobre 15 globais são 17 globais.
- [ ] **Log com `fmt.Println`.** Sem nível e sem área, não se filtra no
      `docker compose logs`. O worker da Fase 8 roda sem ninguém olhando: sem log
      estruturado, falha dele é invisível.
- [ ] **Falha do banco no boot sai com código 0.** Variável faltando usa `os.Exit(1)`,
      mas erro no `InitDB` faz só `return` no `main.go`. Com `restart: unless-stopped`
      o container reinicia do mesmo jeito; com uma política `on-failure`, não
      reiniciaria.
- [ ] **Comentários de código ainda citam o Render**, no `main.go` (carga do `.env`) e
      no `rate_limit.go` (leitura do `X-Forwarded-For`).
- [ ] **A consulta que gera o snapshot não está no repositório.** Só a foto do banco
      está, em `sql/snapshot_schema.sql`.

## 📋 Backlog / ideias em avaliação

> Nada aqui é compromisso de escopo.

- [ ] **🔴 Testar a restauração do backup automático.** A rotina de 22/09 captura todo
      dia, mas nunca foi restaurada. Backup não restaurado é esperança, não backup.
- [ ] **Homologação sem destino.** O ambiente de homologação vivia no Render. Opções: um
      segundo container na mesma VPS apontando para uma branch `staging`, ou aceitar
      explicitamente que a validação passou a ser local.
- [ ] **Exportar o vocabulário** em CSV ou Anki.
- [ ] **Importar lista pronta** para não começar do zero.
- [ ] **Pesquisa por termo dentro do app**, já que a lista cresce sem limite.
- [ ] **Tailwind compilado** em vez do CDN, se o tempo de carregamento incomodar.
- [ ] **Sincronização instantânea** com o Realtime do Supabase. Faz sentido quando
      houver mais de um dispositivo ativo ao mesmo tempo; hoje não há.
- [ ] **Aplicativo nativo para Android.** O PWA cobre o uso atual. Vira fase se a
      captura por compartilhamento do sistema se mostrar necessária.

## 🗑️ Avaliado e descartado

- **Botão flutuante (overlay) para capturar diálogo por cima de jogos.**
  Descartado em 03/10/2026. Era o uso que originou o projeto: jogo sem legenda em
  português, tradução manual constante. O jogo ganhou legenda oficial e o uso acabou.
  Manter o item significaria construir uma tela de captura otimizada para um cenário
  que não acontece mais — e a captura por colagem da Fase 8 atende o uso real, que é
  frase vista no Duolingo, numa série ou numa leitura.

---

## 🔧 Manutenção

> Mudança de infraestrutura ou de documentação. **Não são fases** — não alteram o
> produto e não seguem a numeração.

### 03/10/2026 — Documentação alinhada com o código

- [x] `ARQUITETURA.md`, `DECISIONS.md`, `PITFALLS.md`, este roadmap e os dois README
      voltaram a descrever o que o código faz: schema em `sql/`, `InitDB` que só
      confere, policies de RLS e a VPS.
- [x] `sql/snapshot_query.sql` renomeado para `snapshot_schema.sql`: o arquivo guarda a
      foto do banco, não a consulta.

### 22/09/2026 — Saída do Render: VPS própria, deploy automático e backup diário

- [x] **VPS própria** (Integrator, Ubuntu 26.04 LTS), na mesma máquina dos outros
      projetos. O Render foi suspenso.
- [x] **Caddy como proxy reverso**, com HTTPS emitido e renovado sozinho.
- [x] **Domínio próprio:** `grimoire.joaomendes.dev.br`.
- [x] **Imagem em duas etapas** (Go → Alpine), 32 MB. Container com `expose`, nunca
      `ports` (item 11 do `PITFALLS.md`).
- [x] **Deploy por `git push` na `main`**, via GitHub Actions, com build na VPS.
- [x] **Backup diário automático às 3h** para o Google Drive, incluindo o `.env`.

**Descoberto no caminho, tudo no `PITFALLS.md`:** o Docker fura o UFW (11), deploy verde
não garante código novo (12) e o `.env` do servidor envelhece sozinho — foi o que
derrubou o Grimoire depois de uma senha rotacionada (13).

---

## 🧭 Notas de manutenção deste arquivo

- Fase concluída não é apagada: vira registro histórico com os itens marcados.
- Item abandonado vai para "avaliado e descartado", **com a justificativa** — para não
  ser reaberto sem contexto meses depois.
- Ideia nova vai para o Backlog. Só vira fase quando houver decisão explícita de fazer.
- Decisão estrutural vai para o `DECISIONS.md`, não para cá.
- Protótipo que muda o escopo exige revisão deste arquivo **no mesmo commit**. Roadmap
  descrevendo um produto e protótipo mostrando outro é pior que não ter nenhum dos dois.