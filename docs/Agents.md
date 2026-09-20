# 🤖 AGENTS.md — como trabalhar neste repositório

> Regras de execução para qualquer pessoa ou IA que mexa no Grimoire. Leia este
> arquivo e o `PITFALLS.md` antes de escrever a primeira linha.

---

## 1. Fluxo de trabalho

1. **Issue antes de código.** Toda mudança nasce de uma issue, no formato da seção 8.
   Correção de uma linha também: sem issue, o histórico não explica o porquê.
2. **Uma issue, um assunto.** Correção de bug e recurso novo não andam no mesmo commit.
3. **Documentação junto do código, no mesmo commit.** Decisão registrada depois é
   decisão perdida.

## 2. Verdade sobre o código

4. **Nunca afirme nada sobre o código sem abrir o arquivo.** Suspeita não é achado.
   Se a conclusão depende do que uma função faz, leia a função.
5. **Nunca conclua sobre dado sem consultar o banco.** Contagem, formato e valor nulo
   se verificam com `SELECT`, não com memória.
6. **Erro reproduzido antes de corrigido.** Correção sem sintoma observado conserta o
   problema errado.

## 3. Como entregar mudança de código

> Estas quatro regras são as mais importantes deste arquivo. Todas nasceram de
> arquivo quebrado em sessão real.

7. **Mudança grande é arquivo inteiro.** Se a alteração toca mais de três pontos do
   mesmo arquivo, ou reorganiza a estrutura dele, entregue o arquivo completo para
   substituir. Colar por partes num arquivo que já mudou duas vezes produz um
   Frankenstein que não compila e ninguém sabe onde quebrou.
8. **Mudança pequena vem com o bloco inteiro que sai e o bloco inteiro que entra.**
   Nunca "a primeira linha é X, a última é Y": num arquivo com dezenas de `}` e
   `</div>`, âncora ambígua é erro garantido. O bloco a remover vai visível, do jeito
   exato que está no arquivo, para dar para conferir antes de apagar.
9. **A âncora do Ctrl+F tem que ser única no arquivo.** Antes de mandar, verifique se
   aquele texto aparece uma vez só. Se aparecer duas, inclua as linhas vizinhas até a
   busca ficar única.
10. **Depois de duas substituições no mesmo arquivo, mande o arquivo inteiro.** As
    âncoras do terceiro passo foram escritas contra uma versão que não existe mais.

## 4. Banco de dados

11. **O schema vive em `sql/`, versionado.** Arquivo numerado, aplicado à mão no SQL
    Editor do Supabase, nunca editado depois de aplicado — correção é arquivo novo.
12. **`CREATE TABLE IF NOT EXISTS` não altera tabela existente.** Mudança de coluna
    exige `ALTER`, e num arquivo próprio.
13. **Toda tabela nasce com RLS ligada e policy escrita.** O filtro no Go é a primeira
    camada; a policy é a que sobra quando alguém esquece o `WHERE`.
14. **Todo arquivo `sql/` traz a conferência junto**, comentada no fim: a consulta que
    prova que ele fez o que dizia.
15. **Depois de aplicar, registre a data no `sql/README.md` e regenere o snapshot.**

## 5. Go

16. **Erro de terceiro não é 500.** `500` significa "meu código quebrou". Falha de API
    externa é `503`, com corpo dizendo o motivo.
17. **Campo numérico ausente vira zero.** Use ponteiro no JSON quando o zero for um
    valor possível e diferente de "não informado".
18. **Função que decide algo fica pura e testável**, sem banco e sem rede. Quem precisa
    de dado recebe dado por parâmetro.
19. **Mudou assinatura, rode os testes.** O que compila pode ter quebrado um mock.

## 6. Frontend

20. **Nada de texto de usuário em `innerHTML` sem passar pelo `escapeHTML`.**
21. **Sem `onclick` com string interpolada.** `data-*` mais `addEventListener`.
22. **Estado global só quando não houver alternativa**, e sempre no topo do arquivo,
    com comentário do que ele guarda.

## 7. Comentário

23. **Comentário explica o porquê, não o quê.** `// TagDesejada é uma tag desejada`
    não informa nada. O que vale é a razão da escolha e o que acontece se alguém
    desfizer.
24. **Um fato, um lugar.** Se o mesmo valor existe no código e no banco, um dos dois
    está errado e ninguém vai perceber.

## 8. Formato de issue

```markdown
Título: <tipo>: <descrição curta> #NN

**🏷️ Labels:** `bug` | `feat` | `refactor`, e a área

### 🎯 Objetivo
O problema em uma ou duas frases, com o sintoma observado.

### 📋 Tarefas
- [ ] passos concretos

### ✅ Critérios de Aceite
- [ ] o que precisa ser verdade no fim
- [ ] Testes unitários criados (caminho feliz e cenários de erro)

### ⚠️ Armadilhas em jogo
Itens do PITFALLS.md que esta mudança toca.
```

## 9. Commit

```
<tipo>(<área>): <o que mudou> (closes #NN)
```

Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`.
O `closes` só no commit que completa a issue.