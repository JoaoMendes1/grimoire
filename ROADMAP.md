# Roadmap do Projeto

Este documento mapeia a evolução do projeto, detalhando o que já foi estabelecido, as correções imediatas, a nova identidade visual e a visão futura de lançamento.

## Fase 1: MVP Web (✅ Concluído)
- [x] Criar servidor backend estruturado em Go.
- [x] Configurar banco de dados local SQLite.
- [x] Desenvolver rotas da API (GET, POST, DELETE).
- [x] Construir interface de usuário "Terminal" com Tailwind CSS.
- [x] Separar as camadas de visualização em `index.html`, `style.css` e `app.js`.
- [x] Implementar tradução automática via API externa.
- [x] Adicionar reprodução de áudio híbrida (API + Web Speech).

## Fase 2: Correções e Refinamentos (✅ Concluído)
- [x] **Issue #10 - Segurança:** Corrigir middleware de autenticação no backend para bloquear requisições sem PIN válido.
- [x] **Issue #11 - Usabilidade de Áudio:** Implementar trava no JavaScript para pausar áudios em execução antes de iniciar um novo.
- [x] **Issue #12 - Limpeza Visual:** Remover a etiqueta "SALVO" da listagem de palavras para reduzir poluição visual.
- [x] **Issue #13 - Tradução Bidirecional:** Atualizar API Go para detectar o idioma automaticamente e traduzir nos dois sentidos (Inglês <-> Português).
- [x] **Issue #21 - Estabilidade:** Corrigir bloqueio silencioso de mídia no Service Worker e prevenir erro de leitura no banco de dados.
- [x] **Higiene do Repositório:** Configurar `.gitignore` para blindar o banco de dados (`.db`) e arquivos binários (`.exe`).

## Fase 3: Nuvem e Autenticação (Prioridade Atual)
- [ ] **Migração de Banco de Dados:** Mudar do SQLite para Supabase (PostgreSQL) para garantir sincronização instantânea.
- [ ] **Hospedagem:** Subir a API Go em nuvem (Render ou Railway).
- [ ] **Login com Google (OAuth2):** Vincular os registros à conta pessoal usando a autenticação nativa do Supabase.

## Fase 4: Nova Identidade, Flashcards e Edição
- [ ] **Tela de Login:** Implementar a interface imersiva com animações.
- [ ] **Fundação Visual (HUD):** Aplicar tipografia tech e efeitos de vidro nos painéis.
- [ ] **Sistema de Flashcards:** Atualizar interface para cartões com animação de virar (flip) e frase de contexto.
- [ ] **Edição de Termos:** Criar funcionalidade e interface para editar palavras já salvas.

## Fase 5: Motor de Decodificação (IA)
- [ ] **Integração LLM:** Trocar a API de tradução comum pela API do Gemini.
- [ ] **Auto-Correção e Contexto Inteligente:** IA corrige a grafia em inglês, traduz e formula a frase de exemplo automaticamente antes de salvar.

## Fase 6: App Mobile (Android) e Tempo Real
- [ ] **Aplicativo Nativo:** Criar versão Android do Terminal Vocab.
- [ ] **Botão Flutuante (Overlay):** Recurso para sobrepor jogos (ex: Wuthering Waves) e ler diálogos da tela.
- [ ] **Sincronização Instantânea:** Usar a função Realtime do Supabase para o card aparecer no notebook no exato momento em que for capturado no celular.

## Fase 7: Retenção e Gamificação
- [ ] **Repetição Espaçada (SRS):** Algoritmo que agenda revisões antes do esquecimento.
- [ ] **Estatísticas HUD:** Painel com termos registrados e sequência de dias.