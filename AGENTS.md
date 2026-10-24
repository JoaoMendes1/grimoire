# AGENTS.md

> Regras para quem trabalha neste repositório, pessoa ou IA. Ferramentas de IA (Claude Code,
> Cursor, Codex CLI etc.) leem este arquivo e o `docs/PITFALLS.md` antes de qualquer tarefa.

## Este repositório

**Grimoire** é um dicionário pessoal de vocabulário inglês ↔ português, com tradução
automática, áudio e flashcards, instalável como PWA. É de uso pessoal.

- **Endereço:** `https://grimoire.joaomendes.dev.br`
- **Stack:** Go 1.26 com chi e JWT do Supabase Auth, validado por JWKS · PostgreSQL no Supabase, por `lib/pq`
  (SQL direto) · frontend em HTML, CSS e JavaScript puro, em `static/`.
- **Documentação em `docs/`.** Na raiz ficam só este `AGENTS.md`, que as ferramentas de IA
  procuram ali, e o `README.md`, a porta de entrada do repositório.
- **Repositório público.** Nada de IP, nome de usuário do servidor, conteúdo de `.env`, regra
  de firewall ou porta aberta para a internet entra aqui, nem em documentação, nem em
  comentário. A porta interna do container (8080) pode aparecer: só existe na rede do compose.
- **A infraestrutura do servidor é mantida no repositório privado `infra`:** compose de
  produção e proxy. DNS, backup e variáveis do servidor também ficam fora daqui. Quando uma
  mudança exigir algo no servidor (variável nova, rota no proxy), indique o que precisa
  mudar lá.

## Regras deste projeto

Valem só aqui. Cada uma com o motivo, para não ser quebrada sem saber o custo.

**Processo**

- **Uma issue, um assunto.** Correção de bug e recurso novo não andam no mesmo commit.
- **Documentação junto do código, no mesmo commit.** Decisão registrada depois é decisão
  perdida.
- **Erro reproduzido antes de corrigido.** Correção sem sintoma observado conserta o
  problema errado.
- **Nunca conclua sobre dado sem consultar o banco.** Contagem, formato e valor nulo se
  verificam com `SELECT`, não com memória.

**Banco**

- **O schema vive em `sql/`**, em arquivos numerados, aplicados à mão no SQL Editor do
  Supabase. O servidor não cria nada no boot: conecta, faz `Ping` e confere se as tabelas
  existem.
- **Mudança de coluna é `ALTER`, num arquivo próprio.** Arquivo aplicado nunca é editado.
- **Toda tabela nasce com RLS ligada e policy escrita.** A conexão do Go roda como
  `postgres` e ignora RLS: o isolamento real é o `WHERE user_id = $1` de cada handler, e a
  policy é a camada que sobra quando alguém esquece o filtro.
- **Todo arquivo de `sql/` termina com a conferência**, comentada: a consulta que prova que
  ele fez o que dizia. Depois de aplicar, a data vai no `sql/README.md` e o snapshot é
  regenerado.
- **O mesmo valor não existe no código e no banco.** Se existir, um dos dois está errado e
  ninguém vai perceber.

**Go**

- **Campo numérico ausente vira zero.** Use ponteiro no JSON quando o zero for um valor
  possível e diferente de "não informado".
- **Função que decide algo fica pura**, sem banco e sem rede: quem precisa de dado recebe
  dado por parâmetro. É o que permite testar a regra sem subir o banco.
- **Mudou uma assinatura:** `go build ./...` antes do commit e, quando houver testes,
  `go test ./...`. O projeto ainda não tem testes automatizados.

**Frontend**

- **Texto de usuário só entra no `innerHTML` depois do `escapeHTML`.**
- **Sem `onclick` com string interpolada:** `data-*` mais `addEventListener`.
- **Estado global só quando não houver alternativa**, no topo do arquivo, com comentário do
  que ele guarda.

## Lições de outros projetos que valem aqui

Cada uma já custou caro em outro repositório.

- **Erro de serviço de terceiro é `503`, nunca `500`.** `500` diz "o meu código quebrou";
  `503`, "um serviço do qual eu dependo está fora". O motivo vai no corpo da resposta.
- **Variável de ambiente obrigatória faltando derruba o boot**, com o nome dela no log. Falha
  tardia, no meio de uma requisição, esconde que a causa era configuração.
- **Identidade vem do token.** O id do usuário sai do token validado, nunca do corpo, da URL
  ou da query string.
- **Recurso de outro usuário responde `404`, não `403`.** O `403` confirma que o recurso
  existe.
- **No servidor, nenhum container publica porta com `ports`.** O proxy alcança a aplicação
  pela rede interna (`expose`); porta publicada fica aberta mesmo sem regra no firewall.
- **Fim de linha LF em todos os arquivos**, pelo `.gitattributes`. Script com CRLF quebra no
  container Linux com um erro que não aponta a causa.
- **Chave de API fica no servidor.** O que vai para o navegador, qualquer visitante lê.

## Fluxo de trabalho obrigatório

1. **Toda alteração com decisão nasce de uma issue**, escrita antes do código, por um dos
   modelos em `.github/ISSUE_TEMPLATE/`: **Funcionalidade** ou **Bug**. A issue é
   obrigatória quando a alteração:
   - mexe em schema, dado de usuário, autenticação ou regra de negócio;
   - corrige bug, de qualquer tamanho: a causa é o que mais ensina, e some se não for escrita;
   - envolve escolha estrutural: biblioteca nova, padrão de componente, navegação;
   - muda como o projeto sobe ou é publicado: `Dockerfile`, deploy.

   Dispensam issue: texto de interface, ajuste visual dentro do padrão, documentação,
   configuração do repositório, refatoração sem mudança de comportamento e atualização de
   dependência sem mudança de código (`chore(deps)`). Na dúvida: daqui a três meses, alguém
   vai perguntar "por que foi feito assim?"? Se sim, abre issue.

2. **Toda alteração entra primeiro na branch `staging`** e é promovida para a `main`, que
   publica. Não há CI nem ambiente de homologação: a promoção depende de conferência local,
   com o sistema rodando.

3. **Commits:** `tipo(escopo): descrição curta (closes #NN)`. Tipos: `feat`, `fix`,
   `refactor`, `docs`, `chore`. O escopo é a label de área (`backend`, `frontend`,
   `database`...); documentação e configuração fora de uma área de código usam `infra`. O
   `closes #NN` só fecha a issue quando o commit chega à `main`.

**Labels:** catálogo do `modelo-projeto`, nome em inglês e descrição em português. Toda issue
recebe um tipo e uma ou mais áreas. Os modelos de issue aplicam `feature` e `bug` pelo nome
exato: renomear uma delas faz o modelo deixar de aplicá-la, sem erro.

| Grupo | Labels |
|---|---|
| Tipo | `feature`, `enhancement`, `bug`, `security`, `refactor`, `documentation`, `chore`, `decision` |
| Área | `backend`, `frontend`, `database`, `auth`, `infra`, `integration`, `ai`, `mobile`, `ui/ux` |

**Quadro** (GitHub Projects): **Todo → In Progress → Staging Done → Done**.

- A issue nova entra sozinha em Todo, pelo auto-add; a fechada vai sozinha para Done.
- A passagem para Staging Done é manual: o `closes` só age na `main`.
- Nunca arraste um cartão para Done à mão: isso fecha a issue antes de o código chegar à
  `main`.

```bash
# 1. Staging local atualizada
git checkout staging
git pull origin staging

# 2. Preparar e conferir, numa passada só, o que vai entrar no commit
git add -A && git status && git --no-pager diff --cached -M

# 3. Commitar e subir para a staging
git commit -m "tipo(escopo): descrição curta (closes #NN)"
git push origin staging

# 4. Com a conferência local feita: promover (dispara o deploy) e voltar à staging
git checkout main
git pull origin main
git merge staging --no-edit
git push origin main
git checkout staging
```

- `--no-edit` evita que o merge abra o Vim.

- **Revert sempre pelo código do commit** (`git revert a1b2c3d`), nunca por `HEAD`.
- **Action verde não garante código novo.** Antes de acusar o deploy, confira o commit na
  `main` do GitHub e no `git log --oneline -3` do servidor.
- **Em mais de uma máquina:** push antes de sair de uma, pull antes de começar na outra.

## Regras de código

Prefira a solução simples e defensável à mais abstrata: todo código daqui precisa poder ser
explicado, linha por linha, por quem o mantém.

4. **Comentários explicam o quê e o porquê**, em tom formal e impessoal, numa linha sempre
   que possível, e só onde o porquê não é óbvio: a razão da escolha e o que acontece se
   alguém desfizer. Número de issue não entra no código.

5. **Segurança não é uma fase separada.** Entrada de usuário, autenticação e dado sensível já
   nascem com validação.

6. **Verificação de dependências.** Antes de propor pacote, SDK, API ou versão de Action,
   confira se é a versão atual e mantida. Pacote obsoleto ou em fim de vida não entra. Sem
   certeza, pesquise antes de gerar o código.

7. **Suspeita não é achado.** Não aponte problema sem o arquivo na mão: se a conclusão
   depende do que uma função faz, leia a função. Peça o arquivo, ou o `grep` que localiza os
   pontos de uso, e só então conclua.

8. **Revisão antes do commit** em mudança não trivial (feature nova, autenticação, dado
   sensível): a saída de `git diff --cached` é lida antes do commit.

## Regras de documentação

9. **Um fato, um lugar.** Nada é copiado de um documento para outro; um aponta para o outro.

   | Arquivo | O que mora nele |
   |---|---|
   | `docs/ROADMAP.md` | Escopo: fases, MVP, dívidas, ideias. A cada entrega, no mesmo push: itens marcados com `[x]` e a issue |
   | `docs/DECISIONS.md` | Decisões estruturais, com o porquê e o custo aceito. Não é log de commit |
   | `docs/PITFALLS.md` | Armadilhas que já aconteceram. Corrigida é marcada, nunca apagada |
   | `docs/ARQUITETURA.md` | Como o sistema funciona hoje. Mudou o funcionamento, muda no mesmo commit |
   | `sql/` | Schema versionado. Arquivo aplicado nunca é editado |

10. **Fase nova não vai para o fim da fila.** Dívida ou requisito descoberto no caminho vira
    fase intermediária (ex.: 3.5), entre as duas que a originaram.

11. **Armadilha conhecida tem pergunta obrigatória.** Tarefa que toca a área de uma armadilha
    do `docs/PITFALLS.md` responde a pergunta dela, com o arquivo real na mão. A issue lista
    as armadilhas em jogo.

## Este projeto no portfólio

Este projeto aparece no portfólio **JVM Systems** (`joaomendes.dev.br`, repositório
`jvm-systems`), por um arquivo em `src/content/projetos/`. O site não afirma nada que o
código não sustente: entrega que muda o estado, a fase, a stack ou a capa muda também o
estudo de caso.
