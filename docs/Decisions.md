# 🧭 DECISIONS.md — decisões de arquitetura do Grimoire

> Decisão estrutural mora aqui, não no `ROADMAP.md`. Escopo é o que vai ser feito;
> decisão é por que foi feito daquele jeito — e é o que evita que alguém desfaça sem
> saber o custo.
>
> Formato: data, decisão, motivo. Entradas mais recentes no topo.
>
> **As entradas de 19/09/2026 foram reconstruídas** a partir do código, do README e do
> `ROADMAP.md`, numa leitura completa do repositório. As datas são as do roadmap
> quando existiam; onde não havia data, ficou "anterior a 19/09/2026".

| Data | Decisão | Motivo |
|---|---|---|
| 22/09/2026 | Backup diário automático para o Google Drive | O plano Free do Supabase não tem backup automático. Uma rotina na VPS roda às 3h, faz `pg_dump` pelo **Session pooler** (a conexão direta é IPv6-only, e o IPv4 dedicado é add-on pago do Pro) e copia também o `.env` do servidor. **Pendência assumida:** a restauração nunca foi testada. Backup não restaurado é esperança, não backup. |
| 22/09/2026 | Deploy por `git push` na `main`, com GitHub Actions e build na própria VPS | Depois da migração, publicar exigia entrar no servidor e rodar `git pull`, `docker build` e `docker compose up` à mão. A Action faz isso por SSH. **Build na VPS e não registro de imagens:** build de ~90 s numa máquina ociosa não justifica a peça extra. **Consequência aceita:** a Action fica verde mesmo quando o `git pull` não trouxe nada, porque tecnicamente nada falhou — ver item 12 do `PITFALLS.md`. |
| 22/09/2026 | Migração do Render para VPS própria (Integrator), com Docker e Caddy como proxy reverso | O free tier do Render hibernava sem tráfego: a primeira visita depois de um tempo parado demorava, e o mapa do rate limit zerava a cada acordada. A migração foi feita junto com a do AniDeck, para a mesma máquina. **Caddy:** certificado emitido e renovado sozinho, sem certbot. **Container usa `expose`, nunca `ports`:** o Docker escreve regras direto no `iptables` e fura o UFW — testado e confirmado na migração (item 11 do `PITFALLS.md`). **Consequências aceitas:** atualização de sistema e backup passaram a ser responsabilidade própria, e o IP de saída virou fixo e compartilhado com os outros projetos — um bloqueio do Google atinge sempre o mesmo endereço (item 5). **Não muda o banco:** o Supabase continua. |
| 19/09/2026 | Schema versionado em `sql/`; o `InitDB` só conecta e confere | O `InitDB` criava as tabelas a cada boot com `CREATE TABLE IF NOT EXISTS`, que cria mas nunca altera. Isso escondeu por semanas que `vocabularies.user_id` já era `uuid` no banco enquanto o Go declarava `TEXT`. Hoje todo DDL vive em arquivos numerados, e o `InitDB` faz `Ping` e recusa subir se faltar tabela. **Custo aceito:** aplicar o SQL é passo manual, e a ordem em relação ao deploy é responsabilidade humana. |
| 19/09/2026 | `user_id` alinhado em `uuid` nas duas tabelas antes de escrever as policies | `vocabularies` já tinha `uuid` no banco, e `categories` tinha `TEXT`. Alinhar primeiro (`sql/001`) evitou escrever as policies duas vezes: com `uuid` dos dois lados, a comparação com `auth.uid()` é direta, sem cast. |
| 19/09/2026 | Documentação-base criada: `AGENTS.md`, `PITFALLS.md`, `DECISIONS.md` e `ARQUITETURA.md` | O projeto ficou dois meses parado e a retomada exigiu reler o código inteiro para lembrar o que estava decidido. Os documentos existem para que a próxima retomada custe minutos, não uma tarde. |
| 19/09/2026 | Policies de RLS escritas mesmo com o acesso sendo só pelo backend | As tabelas tinham RLS ligada e nenhuma policy, o que já bloqueava o PostgREST. O isolamento real está no `WHERE user_id = $1` de cada handler, e a conexão via `DATABASE_URL` roda como `postgres`, ignorando RLS. Escrever as policies dá uma segunda camada — um `SELECT` sem filtro deixa de vazar tudo — e libera o caminho para ler dado direto do frontend no futuro. **Executado no `sql/002`, já sem cast**, porque o `sql/001` alinhou o tipo antes (ver entrada acima). |
| anterior a 19/09/2026 | Validação de JWT local via JWKS, em vez de chamada ao `/auth/v1/user` | A validação remota adicionava uma ida ao Supabase em toda requisição autenticada, somando latência e criando dependência de rede num caminho que não precisa dela. O JWKS é baixado uma vez no boot e revalidado de hora em hora. Consequência aceita: o servidor não sobe se o Supabase estiver fora no momento do boot. |
| anterior a 19/09/2026 | Fail-fast no boot: sem `DATABASE_URL`, `SUPABASE_URL` ou `SUPABASE_PUBLIC_KEY`, o processo aborta | Variável faltando produzia falha tardia e confusa — erro de banco em tempo de requisição, quando a causa era configuração. Abortar no boot transforma um mistério em uma linha de log. |
| anterior a 19/09/2026 | Rate limit próprio, por IP, só nas rotas `/api/translate` e `/api/audio` | São as duas rotas que fazem proxy para serviços externos. Sem limite, um laço no frontend gastaria a cota e faria o Google bloquear o IP do servidor — o que derrubaria a tradução para todos os usuários, não só para quem abusou. O CRUD não precisa: o custo dele é do próprio banco. |
| anterior a 19/09/2026 | Tradução com fallback para um segundo endpoint do Google | O endpoint principal falha de forma intermitente. Com o fallback, a falha vira lentidão em vez de erro. Consequência aceita: o fallback assume `en` como idioma detectado, então a inversão pt→en não acontece por esse caminho. |
| anterior a 19/09/2026 | Áudio com dois motores: URL do Google TTS e `SpeechSynthesis` do navegador | O TTS do Google não lida com texto longo, então acima de 200 caracteres o servidor devolve URL vazia de propósito, e o frontend cai na voz nativa. O limite está no `AudioHandler` e é a razão de a resposta vazia não ser erro. |
| Fase 3 | Migração de SQLite para Supabase (PostgreSQL) | O banco local impedia usar o mesmo vocabulário em máquinas diferentes, que é o uso real do produto. Trouxe junto a autenticação com Google, sem servidor de sessão próprio. |
| Fase 3 | Login exclusivamente com Google (OAuth2), sem senha própria | Não ter senha significa não ter recuperação de senha, não ter política de senha e não ter vazamento de hash. Consequência aceita: quem não tem conta Google não entra. |
| Fase 4 | Frontend em HTML, CSS e JavaScript puro, com Tailwind via CDN | Evita build, `node_modules` e pipeline de deploy para um app de uma tela. Consequência aceita: o Tailwind compila no navegador a cada carregamento, e o `app.js` cresceu sem módulos. |
| Fase 4.5 | `escapeHTML` obrigatório em todo dado de usuário renderizado, e `data-*` no lugar de `onclick` interpolado | Issue #46. Termo e tradução são texto livre e iam direto para `innerHTML`. |

---

## Decisões pendentes

Questões abertas que ainda não foram decididas, registradas para não se perderem.

As duas primeiras **bloqueiam a Fase 5 do roadmap**: ambas mudam o schema, e nenhum
arquivo de `sql/` deve nascer antes delas.

- **SM-2 ou FSRS para a repetição espaçada?** O SM-2 cabe em uma função de vinte linhas
  e se explica inteiro; o FSRS acerta mais a previsão de esquecimento, ao custo de
  dezessete parâmetros e de um modelo que não dá para conferir de cabeça. A escolha
  define quais colunas entram em `vocabularies` — por isso vem antes do primeiro
  `ALTER TABLE`.
- **Como a procedência da frase entra no modelo: coluna `origin` nova ou reaproveitar o
  rótulo?** São eixos diferentes — "Compras" é assunto, "Duolingo" é procedência. Numa
  coluna só, filtrar por qualquer um dos dois deixa de ser possível. O custo da coluna
  nova é mais um campo na tela de captura.
- **FK de `user_id` para `auth.users`, com `ON DELETE CASCADE`?** O tipo já é `uuid`
  nas duas tabelas (`sql/001`); falta a FK, que resolve o vocabulário órfão na exclusão
  de conta. Antes dela, `vocabularies.user_id` precisa deixar de aceitar nulo — e isso
  exige conferir com `SELECT` se existe linha sem dono.
- **O Grimoire é caderno pessoal ou produto para outras pessoas?** Muda desde a tela
  inicial até a necessidade de uma política de privacidade.

**Resolvida em 03/10/2026 — a repetição espaçada entra, e é a Fase 5.** Era a pergunta
central da retomada. O protótipo v2 a respondeu na prática: sem SRS, as telas Hoje e
Progresso não têm o que mostrar, e a penalidade do modo Jogo não tem em que se apoiar.
O que continua aberto é o algoritmo, não o "se".