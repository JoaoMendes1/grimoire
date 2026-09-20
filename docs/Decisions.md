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
| 19/09/2026 | Documentação-base criada: `AGENTS.md`, `PITFALLS.md`, `DECISIONS.md` e `ARQUITETURA.md` | O projeto ficou dois meses parado e a retomada exigiu reler o código inteiro para lembrar o que estava decidido. Os documentos existem para que a próxima retomada custe minutos, não uma tarde. |
| 19/09/2026 | Policies de RLS serão escritas mesmo com o acesso sendo só pelo backend | Hoje as tabelas têm RLS ligada e nenhuma policy, o que já bloqueia o PostgREST. O isolamento real está no `WHERE user_id = $1` de cada handler, e a conexão via `DATABASE_URL` roda como `postgres`, ignorando RLS. Escrever as policies dá uma segunda camada — um `SELECT` sem filtro deixa de vazar tudo — e libera o caminho para ler dado direto do frontend no futuro. Custo aceito: `user_id` é `TEXT` e a comparação com `auth.uid()` exige cast. |
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

Questões abertas que ainda não foram decididas, registradas para não se perderem:

- **`user_id` vira `uuid` com FK para `auth.users`?** Resolve órfão na exclusão de conta
  e dispensa o cast nas policies. Custo: migração de dado existente.
- **O Grimoire é caderno pessoal ou produto para outras pessoas?** Muda desde a tela
  inicial até a necessidade de uma política de privacidade.
- **A repetição espaçada entra?** É o que transforma arquivo de palavras em hábito
  diário, e exige campos novos no schema — por isso é melhor decidir antes de mexer no
  banco.