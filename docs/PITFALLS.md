# ⚠️ PITFALLS.md — armadilhas do Grimoire

> Cada item nasceu de algo observado neste repositório. Armadilha corrigida não é
> apagada: recebe a marcação de resolvida, com a data, para o raciocínio continuar
> disponível.
>
> Aberto em 19/09/2026, a partir da leitura completa do código. Atualizado em
> 03/10/2026: itens 1 a 3 resolvidos, itens 5, 6 e 10 revistos para a VPS, e itens 11 a
> 13 novos, vindos da migração de 22/09.

---

## 1. RLS ligada não é o mesmo que dado protegido

> ✅ **Resolvida em 19/09/2026** pelo `sql/002_rls_policies.sql`.

**Como era:** as tabelas `vocabularies` e `categories` tinham `rowsecurity = true` e
**nenhuma policy**. Isso bloqueava o PostgREST, mas a proteção real estava só no
`WHERE user_id = $1` de cada handler Go.

**Como está:** cada tabela tem uma policy de dono (`FOR ALL`, com `USING` e
`WITH CHECK`). Um `SELECT` sem filtro pela API do Supabase devolve só as linhas de quem
está logado.

**O que continua valendo:** a conexão do Go usa a `DATABASE_URL` como `postgres`, que
**ignora RLS**. Para o backend, a policy não existe: um handler novo sem o `WHERE`
devolve o dado de todos os usuários. A policy protege o acesso pela chave anon, que é
pública em `/api/config`.

Conferência:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('vocabularies', 'categories');

SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'public';
```

## 2. `user_id` declarado `TEXT` no Go e `uuid` no banco

> ✅ **Tipo resolvido em 19/09/2026** pelo `sql/001_alinha_user_id.sql`. A FK continua
> aberta.

**Como era:** o Go declarava `user_id TEXT` nas duas tabelas, mas `vocabularies` já
tinha `uuid` no banco, alterado à mão. Ninguém percebeu, porque o boot não alterava
tabela existente (item 3).

**Como está:** `uuid` nas duas, e as policies comparam com `auth.uid()` sem cast.

**O que continua de pé:**

- não há FK para `auth.users`, então excluir uma conta deixa vocabulário órfão;
- não há `ON DELETE CASCADE`, e a limpeza teria que ser feita à mão;
- `vocabularies.user_id` aceita nulo, e `categories.user_id` não.

## 3. `CREATE TABLE IF NOT EXISTS` não altera tabela existente

> ✅ **Resolvida em 19/09/2026.** O `InitDB` só conecta e confere.

**Como era:** o schema era criado no `database.InitDB()`, a cada boot. Em banco vazio
funcionava; em banco que já tinha as tabelas, **toda mudança de coluna era
silenciosamente ignorada**, e o boot ainda anunciava "Schema e Índices verificados com
sucesso".

**Como está:** o schema vive em `sql/`, e o `InitDB` faz `Ping` e recusa subir se faltar
tabela.

**O que continua valendo:** o `000_schema_inicial.sql` ainda usa `IF NOT EXISTS`, porque
serve para recriar o banco do zero. Mudança de coluna em banco existente é sempre
`ALTER`, num arquivo novo.

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

**Desde 22/09/2026 o IP de saída é fixo** e compartilhado com os outros projetos da VPS.
Um bloqueio do Google atinge sempre esse endereço, e derruba a tradução e o áudio até
ser levantado.

## 6. O rate limit é por IP e confia no `X-Forwarded-For`

O `RateLimitAPI` lê o primeiro IP do `X-Forwarded-For` e cai no `RemoteAddr` quando o
header não existe.

Com o Caddy na frente, o header chega com o IP de quem conectou: o Caddy descarta o
valor mandado pelo cliente, a menos que `trusted_proxies` esteja configurado.

Ressalvas:

- **o Go confia no header sem conferir.** Se o container um dia for publicado com
  `ports` (item 11), o header passa a vir direto do cliente, que pode mandar um IP
  diferente a cada requisição e escapar do limite;
- o mapa de IPs vive em memória e zera a cada deploy ou restart;
- vários usuários atrás do mesmo IP dividem a mesma cota.

Limitar por `user_id` em vez de IP seria mais justo, já que as duas rotas são
autenticadas. O comentário no `rate_limit.go` ainda fala do Render.

## 7. Erro de terceiro devolvido como 500

Os handlers respondem `500` para falha de banco e para falha de API externa. Quando o
Google recusar a tradução, o log dirá "erro interno" e o diagnóstico vai para o lado
errado — foi exatamente esse o custo no AniDeck quando a AniList caiu.

Falha de terceiro é `503`, com o motivo no corpo.

## 8. Estado global no `app.js`

Quinze variáveis `let` no topo do arquivo guardam desde a lista de palavras até qual
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
`docker compose logs`, com semanas de histórico, não há como filtrar por nível nem por
área.

## 11. 🧱 O Docker fura o UFW

**Descoberto na migração (22/09/2026), testado e confirmado.** O Docker escreve regras
direto no `iptables`, **abaixo** do UFW. Uma porta publicada com `-p` fica acessível
pela internet mesmo sem regra nenhuma no firewall — `ufw status` continua dizendo que só
22, 80 e 443 estão abertas, e a 8080 responde de fora.

O firewall **parece** correto. Ninguém descobre auditando a configuração; só testando de
fora.

Regra: o container do Grimoire declara `expose`, nunca `ports`. Só o Caddy publica
porta. Aqui o risco é duplo: além de expor o Go, publicar a porta quebra a confiança no
`X-Forwarded-For` (item 6).

Conferência, de fora da máquina:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://SEU_IP:8080
```

> **Pergunta obrigatória:** este serviço precisa ser alcançável de fora, ou só pelo
> Caddy? Se for só pelo Caddy, por que tem `ports`?

## 12. 🟢 Deploy verde não garante código novo

A Action reporta sucesso mesmo quando o `git pull` não trouxe alteração nenhuma, porque
tecnicamente nada falhou. Verde diz que o processo rodou, não que ele tinha o que fazer.

O caso típico: o commit chega ao GitHub **depois** que a Action rodou, e ela publica,
corretamente, a versão anterior.

Conferência antes de acusar o deploy:

```bash
cd ~/grimoire && git log --oneline -3
```

> **Pergunta obrigatória:** o commit que eu quero publicar está na `main` do GitHub
> **antes** de a Action rodar?

## 13. 🔑 O `.env` do servidor é uma cópia que envelhece sozinha

O `.env` vive na pasta do projeto no servidor, não vem do Git e não é derivado de nada.
Toda credencial rotacionada no Supabase precisa ser reescrita lá à mão.

**Incidente (22/09/2026):** a senha do banco foi redefinida no painel do Supabase
durante a configuração do backup. O Grimoire continuou no ar com a conexão já aberta e
só caiu no restart seguinte, horas depois, sem ligação aparente com o que tinha sido
feito.

O fail-fast funcionou — o boot recusou subir. O que ele não faz é dizer que a causa foi
uma ação tomada em outro sistema.

Conferência sem expor valor:

```bash
grep -o '^[A-Z_]*=' ~/grimoire/.env
```

> **Pergunta obrigatória:** rotacionei credencial no Supabase? Então o `.env` do
> servidor já está errado — e o sintoma só vai aparecer no próximo restart.