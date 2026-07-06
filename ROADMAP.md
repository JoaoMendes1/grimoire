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
- [x] **Higiene do Repositório:** Configurar `.gitignore` para blindar o banco de dados (`.db`) e arquivos binários (`.deb`).

## Fase 3: Identidade Visual e Gamificação (A Fazer)

- [ ] **Fundação Visual (HUD):** Implementar tipografia tech (Chakra Petch / JetBrains Mono), texturas de grid, scanlines e glassmorphism (blur) nos painéis.
- [ ] **Sistema de Flashcards:** Atualizar o backend para aceitar "frase de contexto" e criar animação de virar o card (flip) na interface.
- [ ] **Identidade de Categorias:** Criar cores e ícones específicos para Combate, Lore e Interface para facilitar a leitura visual.
- [ ] **Micro-interações:** Adicionar efeito de digitação na tradução, animações de salvamento e swipe-to-delete no celular.
- [ ] **Gamificação:** Criar painel de estatísticas com contagem de palavras, desempenho semanal e sequência de dias (streak).
- [ ] **Nova Interface de Login:** Implementar tela inicial com elementos de Glassmorphism, animações de fundo e botão de Autenticação com Google (OAuth2).

## Fase 4: Preparação para Nuvem (A Fazer)

- [ ] Hospedar a API Go em plataforma de nuvem (ex: Railway, Render).
- [ ] Migrar banco de dados SQLite local para banco relacional em nuvem (ex: PostgreSQL via Supabase).
- [ ] Configurar variáveis de ambiente seguras (CORS, Chaves de API, OAuth Secrets).