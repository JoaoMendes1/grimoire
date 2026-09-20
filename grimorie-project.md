# Project Structure

```
├── cmd
│   └── web
│       └── main.go
├── docs
│   ├── Agents.md
│   ├── Arquitetura.md
│   ├── Decisions.md
│   ├── Pitfalls.md
│   └── ROADMAP.md
├── internal
│   ├── database
│   │   └── db.go
│   ├── handlers
│   │   ├── audio.go
│   │   ├── categories.go
│   │   ├── translate.go
│   │   └── words.go
│   ├── middleware
│   │   ├── auth.go
│   │   └── rate_limit.go
│   └── models
│       └── vocab.go
├── sql
│   ├── 000_schema_inicial.sql
│   ├── 001_alinha_user_id.sql
│   ├── 002_rls_policies.sql
│   ├── README.md
│   └── snapshot_query.sql
├── static
│   ├── icons
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── app.js
│   ├── index.html
│   ├── manifest.json
│   ├── style.css
│   └── sw.js
├── go.mod
├── go.sum
├── LICENSE
└── README.md
```

# File Contents

## README.md

````markdown
# 📖 Grimoire

Dicionário pessoal de vocabulário inglês ↔ português, com temática *Sci-Fi / Terminal*.
Registra o termo, a tradução e o áudio, organiza por categoria e serve de base de
estudo por flashcards.

Backend em Go, banco no Supabase, frontend em HTML, CSS e JavaScript puro. Instalável
como PWA.

---

## 🛠 Stack

| Camada | O que é |
|---|---|
| **Backend** | Go, roteamento com `chi` |
| **Banco e autenticação** | Supabase (PostgreSQL) + login com Google, JWT validado localmente via JWKS |
| **Frontend** | HTML5, CSS3 e JavaScript sem framework |
| **Estilo** | Tailwind CSS pelo CDN, com tema próprio em `style.css` |
| **Hospedagem** | Render |

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
| `PORT` | Opcional; o padrão é `8080` e o Render define sozinho |

As três primeiras são obrigatórias: sem qualquer uma delas, o servidor **aborta no
boot** de propósito, em vez de falhar no meio de uma requisição.

> O `SUPABASE_JWT_SECRET` **não é mais usado**. Ele existia quando o token era
> validado com segredo compartilhado; desde a migração para JWKS, a validação usa a
> chave pública do Supabase. Se ainda estiver configurado no Render, pode ser removido.

### Banco

O schema **não é criado pelo Go**. Ele vive em `sql/`, versionado, e é aplicado à mão
no SQL Editor do Supabase. Em banco novo, aplique na ordem: `000`, `001`, `002`.

Ver `sql/README.md` para a convenção.

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
docs/             regras, arquitetura, decisões e armadilhas
```

## 📚 Documentação

| Arquivo | Para quê |
|---|---|
| `docs/AGENTS.md` | Como trabalhar neste repositório. **Leia antes de mexer** |
| `docs/ARQUITETURA.md` | Como o sistema funciona por dentro |
| `docs/DECISIONS.md` | O que foi decidido e por quê |
| `docs/PITFALLS.md` | Armadilhas conhecidas, com sintoma e conferência |
| `ROADMAP.md` | O que foi feito e o que vem |
| `sql/README.md` | Convenção do schema versionado |

## 📄 Licença

Ver `LICENSE`.
````

## LICENSE

```
MIT License

Copyright (c) 2026 João Victor Mendes 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

## go.sum

```sum
[File content not included]
```

## go.mod

```mod
module grimoire

go 1.26.4

require (
	github.com/MicahParks/keyfunc/v2 v2.1.0
	github.com/go-chi/chi/v5 v5.3.0
	github.com/golang-jwt/jwt/v5 v5.3.1
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.12.3
	golang.org/x/time v0.15.0
)

```

## static/app.js

```javascript
let clienteSupabase;
let audioAtual = null; 
let botaoAudioAtual = null; 
let timerDigitacao;
let ultimaListaPalavras = [];
let idiomaOrigemAtual = [];
let categoriasAtuais = []; 
let palavraEmEdicaoId = null;
let ultimoCampoEditado = null; 
let filtroAtivo = 'Todos';
let termoBuscaAtual = '';

let catSelecionadaDesktop = null;
let catSelecionadaMobile = null;
let catSelecionadaEdit = null;
let acaoConfirmacaoPendente = null;

// --- UTILITÁRIOS DE SEGURANÇA ---
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- DELEGAÇÃO DE EVENTOS GLOBAL ---
document.addEventListener('click', function(e) {
    // Intercepta qualquer clique em elementos que tenham o atributo 'data-action'
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    
    // Ações de Palavras
    if (action === 'tocar-audio') {
        e.stopPropagation(); // Evita que o card expanda ao clicar no áudio
        tocarAudio(btn, btn.getAttribute('data-index'));
    }
    if (action === 'editar-palavra') {
        e.stopPropagation();
        prepararEdicao(btn.getAttribute('data-index'));
    }
    if (action === 'excluir-palavra') {
        e.stopPropagation();
        excluirPalavra(btn.getAttribute('data-id'));
    }
    // Ação de expandir/recolher card
    if (action === 'revelar-card') {
        // O 'btn' neste caso é o próprio card
        btn.classList.toggle('revealed');
    }

    // Ação de Copiar Texto
    if (action === 'copiar-texto' || action === 'copiar-input') {
        e.stopPropagation(); // Trava o card para não abrir/fechar
        
        let texto = '';
        if (action === 'copiar-texto') texto = btn.getAttribute('data-texto');
        if (action === 'copiar-input') texto = document.getElementById(btn.getAttribute('data-alvo')).value;
        
        if (!texto) return;

        navigator.clipboard.writeText(texto).then(() => {
            const icon = btn.querySelector('i');
            if(icon) {
                const classOriginal = icon.className;
                icon.className = 'ph-fill ph-check-circle text-[#00e676] pointer-events-none text-base';
                setTimeout(() => { icon.className = classOriginal; }, 2000);
            }
        });
    }
    
    // Ações de Categorias (Swatches)
    
    // Ações de Categorias (Swatches)
    if (action === 'selecionar-categoria') {
        const id = btn.getAttribute('data-id') === 'null' ? null : parseInt(btn.getAttribute('data-id'));
        const origem = btn.getAttribute('data-origem');
        if (origem === 'desktop') selecionarCatDesktop(id);
        if (origem === 'mobile') selecionarCatMobile(id);
        if (origem === 'edit') selecionarCatEdit(id);
    }

    // Ação de Filtros
    if (action === 'selecionar-filtro') {
        const nome = btn.getAttribute('data-nome');
        selecionarFiltro(nome);
    }
    
    // Ações do Gerenciador de Categorias
    if (action === 'editar-categoria') iniciarEdicaoCategoria(btn.getAttribute('data-id'));
    if (action === 'salvar-categoria') salvarEdicaoCategoria(btn.getAttribute('data-id'));
    if (action === 'excluir-categoria') excluirCategoria(btn.getAttribute('data-id'));
});

// --- DELEGAÇÃO DE EVENTOS DE TECLADO ---
document.addEventListener('keydown', function(e) {
    const target = e.target;
    // Salvar categoria no gerenciador com "Enter"
    if (e.key === 'Enter' && target.matches('[data-action="enter-salvar-categoria"]')) {
        e.preventDefault(); // Evita qualquer comportamento padrão de formulário
        salvarEdicaoCategoria(target.getAttribute('data-id'));
    }
});

// Efeito de Loading Sci-Fi
function iniciarEfeitoLoading() {
    const textos = [
        "> Inicializando núcleo de dados...",
        "> Decodificando chaves de segurança...",
        "> Estabelecendo conexão remota...",
        "> Sincronizando módulos..."
    ];
    let i = 0;
    const elemento = document.getElementById('loading-text');
    if(elemento) {
        return setInterval(() => {
            i = (i + 1) % textos.length;
            elemento.textContent = textos[i];
        }, 800);
    }
    return null;
}
const loadingInterval = iniciarEfeitoLoading();

async function iniciarApp() {
    const res = await fetch('/api/config');
    const config = await res.json();
    clienteSupabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

    const { data: { session } } = await clienteSupabase.auth.getSession();
    
    // Para a animação do terminal antes de esconder a tela
    if (loadingInterval) clearInterval(loadingInterval);
    document.getElementById('tela-loading').style.display = 'none';

    if (session) {
        document.getElementById('tela-login').style.display = 'none'; 
        document.getElementById('tela-app').style.display = 'block';
        document.getElementById('assinatura').style.display = 'block';
        await carregarCategorias();
        carregarLista(); 
    } else {
        document.getElementById('tela-login').style.display = 'flex'; 
        document.getElementById('tela-app').style.display = 'none';
        document.getElementById('assinatura').style.display = 'block';
    }

    clienteSupabase.auth.onAuthStateChange(async (event, sessionChange) => {
        if(sessionChange && !session) { 
            document.getElementById('tela-login').style.display = 'none'; 
            document.getElementById('tela-app').style.display = 'block';
            await carregarCategorias();
            carregarLista();  
        } else if (!sessionChange) { 
            document.getElementById('tela-login').style.display = 'flex'; 
            document.getElementById('tela-app').style.display = 'none';
        }
    });

    configurarAutoResize();
}
iniciarApp();

async function getHeaders() {
    const { data } = await clienteSupabase.auth.getSession();
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (data.session?.access_token || '') };
}

window.entrarComGoogle = async function() { await clienteSupabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } }); }
window.sair = async function() { await clienteSupabase.auth.signOut(); document.getElementById('lista-palavras').innerHTML = ''; }

// AUTO RESIZE PERFEITO PARA AS CAIXAS DE TEXTO
function configurarAutoResize() {
    const textareas = document.querySelectorAll('.auto-resize');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
}

function dispararResize(elementId) {
    const el = document.getElementById(elementId);
    if(el) {
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight) + 'px';
    }
}

// TRADUÇÃO INTELIGENTE
function configurarTraducao(idOrigem, idDestino) {
    const campoOrigem = document.getElementById(idOrigem);
    const campoDestino = document.getElementById(idDestino);
    campoOrigem.addEventListener('input', function() {
        clearTimeout(timerDigitacao);
        const termo = this.value.trim();
        ultimoCampoEditado = idOrigem; 
        if (!termo) { campoDestino.value = ''; dispararResize(idDestino); return; }
        timerDigitacao = setTimeout(async () => {
            if (ultimoCampoEditado !== idOrigem) return;
            try {
                const res = await fetch('/api/translate', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termo }) });
                const dados = await res.json();
                campoDestino.value = dados.translation || "Erro";
                idiomaOrigemAtual = dados.sourceLang || 'en'; 
                dispararResize(idDestino);
            } catch (error) {}
        }, 600); 
    });
}
configurarTraducao('novo-termo', 'traducao-automatica'); configurarTraducao('traducao-automatica', 'novo-termo');
configurarTraducao('novo-termo-mobile', 'traducao-mobile'); configurarTraducao('traducao-mobile', 'novo-termo-mobile');
configurarTraducao('edit-termo', 'edit-traducao'); configurarTraducao('edit-traducao', 'edit-termo');

// MATEMÁTICA DE CORES
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
}

function obterEstiloCategoria(id, nome = "") {
    if (!id) return { corHex: '#00e676', bgTransparente: 'bg-[#00e676]/10', texto: 'text-[#00e676]' }; 
    const paleta = ['#00e5ff', '#b388ff', '#ffc107', '#f472b6', '#34d399', '#fb923c', '#818cf8', '#a78bfa', '#f87171', '#2dd4bf', '#e879f9', '#facc15'];
    const index = nome ? hashCode(nome) % paleta.length : id % paleta.length;
    const cor = paleta[index];
    return { corHex: cor, bgTransparente: `bg-[${cor}]/10`, texto: `text-[${cor}]` }; 
}

// SISTEMA DE CHIPS
async function carregarCategorias() {
    const res = await fetch('/api/categories', { method: 'GET', headers: await getHeaders()});
    categoriasAtuais = await res.json(); 
    atualizarSwatchesForms();
}

function renderSwatches(containerId, varSelecionada, origem) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    const lista = [{id: null, name: 'Sem Categoria'}, ...categoriasAtuais];
    wrap.innerHTML = lista.map(cat => {
        const isSel = varSelecionada == cat.id;
        const estilo = obterEstiloCategoria(cat.id, cat.name);
        const bg = isSel ? hexToRgba(estilo.corHex, 0.2) : hexToRgba(estilo.corHex, 0.05);
        return `<button type="button" class="cat-swatch ${isSel ? 'selected' : ''} flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-[11px] font-semibold" style="background:${bg}; color:${estilo.corHex};" data-action="selecionar-categoria" data-id="${cat.id}" data-origem="${origem}">
                  <span class="w-3.5 h-3.5 rounded-full inline-block" style="background:${estilo.corHex};"></span>${escapeHTML(cat.name)}
                </button>`;
    }).join('');
}

window.selecionarCatDesktop = function(id) { catSelecionadaDesktop = id; atualizarSwatchesForms(); }
window.selecionarCatMobile = function(id) { catSelecionadaMobile = id; atualizarSwatchesForms(); }
window.selecionarCatEdit = function(id) { catSelecionadaEdit = id; atualizarSwatchesForms(); }

function atualizarSwatchesForms() {
    renderSwatches('cat-swatches-desktop', catSelecionadaDesktop, 'desktop');
    renderSwatches('cat-swatches-mobile', catSelecionadaMobile, 'mobile');
    renderSwatches('cat-swatches-edit', catSelecionadaEdit, 'edit');
}

window.toggleNovaCategoriaUI = function(origem) { document.getElementById(`new-cat-row-${origem}`).classList.toggle('hidden'); }

window.salvarNovaCategoriaUI = async function(origem) {
    const input = document.getElementById(`new-cat-input-${origem}`);
    const nome = input.value.trim();
    if (!nome) return;

    const existente = categoriasAtuais.find(c => c.name.toLowerCase() === nome.toLowerCase());
    if (existente) {
        input.value = ''; document.getElementById(`new-cat-row-${origem}`).classList.add('hidden');
        if(origem === 'desktop') selecionarCatDesktop(existente.id);
        if(origem === 'mobile') selecionarCatMobile(existente.id);
        return; 
    }

    const res = await fetch('/api/categories', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ name: nome }) });
    const dados = await res.json();
    await carregarCategorias();
    input.value = ''; document.getElementById(`new-cat-row-${origem}`).classList.add('hidden');
    if(origem === 'desktop') selecionarCatDesktop(dados.id);
    if(origem === 'mobile') selecionarCatMobile(dados.id);
}

// GERENCIADOR DE CATEGORIAS
window.abrirGerenciadorCategorias = function() { renderizarListaGerenciador(); document.getElementById('modal-gerenciador-categorias').classList.replace('hidden', 'flex'); }
window.fecharGerenciadorCategorias = function() { document.getElementById('modal-gerenciador-categorias').classList.replace('flex', 'hidden'); }

function renderizarListaGerenciador() {
    const container = document.getElementById('lista-categorias-gerenciador');
    if(categoriasAtuais.length === 0) { container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Nenhuma categoria criada.</p>'; return; }
    
    container.innerHTML = categoriasAtuais.map(cat => {
        const estilo = obterEstiloCategoria(cat.id, cat.name);
        const nomeSeguro = escapeHTML(cat.name);
        return `
            <div class="flex items-center justify-between p-3 rounded-xl bg-[#1f2937]/30 border border-[#1f2937] hover:border-[#374151] transition-colors group">
                <div class="flex items-center gap-2 flex-1" id="cat-display-${cat.id}">
                    <span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${estilo.corHex};"></span>
                    <span class="text-sm font-semibold text-gray-300">${nomeSeguro}</span>
                </div>
                <div class="hidden flex-1 items-center gap-2" id="cat-edit-${cat.id}">
                    <input type="text" id="cat-input-${cat.id}" value="${nomeSeguro}" class="input-dark w-full px-3 py-1.5 rounded-lg text-xs" data-action="enter-salvar-categoria" data-id="${cat.id}">
                    <button data-action="salvar-categoria" data-id="${cat.id}" class="text-[#00e5ff] hover:text-white p-1"><i class="ph-fill ph-check-circle text-lg pointer-events-none"></i></button>
                </div>
                <div class="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity ml-2" id="cat-actions-${cat.id}">
                    <button data-action="editar-categoria" data-id="${cat.id}" class="text-gray-400 hover:text-white transition-colors"><i class="ph-fill ph-pencil-simple text-base pointer-events-none"></i></button>
                    <button data-action="excluir-categoria" data-id="${cat.id}" class="text-gray-400 hover:text-red-500 transition-colors"><i class="ph-fill ph-trash text-base pointer-events-none"></i></button>
                </div>
            </div>`;
    }).join('');
}

window.iniciarEdicaoCategoria = function(id) {
    document.getElementById(`cat-display-${id}`).classList.add('hidden');
    document.getElementById(`cat-actions-${id}`).classList.add('hidden');
    document.getElementById(`cat-edit-${id}`).classList.remove('hidden'); document.getElementById(`cat-edit-${id}`).classList.add('flex');
    document.getElementById(`cat-input-${id}`).focus();
}

window.salvarEdicaoCategoria = async function(id) {
    const novoNome = document.getElementById(`cat-input-${id}`).value.trim();
    if (!novoNome) return;
    await fetch('/api/categories/' + id, { method: 'PUT', headers: await getHeaders(), body: JSON.stringify({ name: novoNome }) });
    await carregarCategorias(); renderizarListaGerenciador(); carregarLista(); 
}

window.excluirCategoria = function(id) {
    abrirConfirmacao("Excluir Categoria?", "As palavras desta categoria ficarão 'Sem Categoria'.", async () => {
        await fetch('/api/categories/' + id, { method: 'DELETE', headers: await getHeaders() });
        await carregarCategorias(); renderizarListaGerenciador(); carregarLista();
    });
}

// CONFIRMAÇÃO GLOBAL
window.abrirConfirmacao = function(titulo, descricao, acaoConfirma) {
    document.getElementById('confirm-title').textContent = titulo;
    document.getElementById('confirm-desc').textContent = descricao;
    acaoConfirmacaoPendente = acaoConfirma;
    document.getElementById('modal-confirmacao').classList.replace('hidden', 'flex');
}

window.fecharConfirmacao = function() {
    acaoConfirmacaoPendente = null;
    document.getElementById('modal-confirmacao').classList.replace('flex', 'hidden');
}

document.getElementById('confirm-action-btn').addEventListener('click', () => {
    if(acaoConfirmacaoPendente) acaoConfirmacaoPendente();
    fecharConfirmacao();
});

// FILTROS
function renderizarFiltros() {
    const wrap = document.getElementById('filter-chips');
    const nomesCategorias = ['Todos', ...categoriasAtuais.map(c => c.name), 'Sem Categoria'];
    
    wrap.innerHTML = nomesCategorias.map(nome => {
        let estilo = nome === 'Todos' ? { corHex: '#9ca3af' } : (nome === 'Sem Categoria' ? obterEstiloCategoria(null) : obterEstiloCategoria(categoriasAtuais.find(c => c.name === nome)?.id, nome));
        const ativo = filtroAtivo === nome;
        const styleAtivo = ativo ? `background-color: ${estilo.corHex}; color: #000; border-color: transparent;` : `color: ${estilo.corHex}; border-color: ${nome === 'Todos' ? '#374151' : hexToRgba(estilo.corHex, 0.4)};`;
        
        // Sanitiza o nome para não quebrar o HTML nem executar scripts
        const nomeSeguro = escapeHTML(nome);
        
        return `<button data-action="selecionar-filtro" data-nome="${nomeSeguro}" class="whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${ativo ? 'shadow-[0_0_10px_rgba(255,255,255,0.15)]' : 'hover:bg-white/5'}" style="${styleAtivo}">${nomeSeguro}</button>`;
    }).join('');
}
window.selecionarFiltro = function(nome) { filtroAtivo = nome; renderizarFiltros(); aplicarFiltrosEBuscar(); }
window.filtrarLista = function(termo) { termoBuscaAtual = termo.toLowerCase(); aplicarFiltrosEBuscar(); }

// PALAVRAS (Salvar, Listar, Editar)
window.salvarPalavra = async function(origem = 'desktop') {
    const sufixo = origem === 'mobile' ? '-mobile' : '';
    const termo = document.getElementById('novo-termo' + sufixo).value.trim();
    const traducao = document.getElementById('traducao' + (origem === 'mobile' ? '-mobile' : '-automatica')).value.trim();
    const categoriaId = origem === 'mobile' ? catSelecionadaMobile : catSelecionadaDesktop;
    
    if (!termo || !traducao) return;

    let termoFinal = termo; let traducaoFinal = traducao; 
    const origemPt = idiomaOrigemAtual.toLowerCase().startsWith('pt');
    if ((ultimoCampoEditado && ultimoCampoEditado.includes('termo') && origemPt) || (ultimoCampoEditado && ultimoCampoEditado.includes('traducao') && !origemPt)) {
        termoFinal = traducao; traducaoFinal = termo;  
    }

    const resAud = await fetch('/api/audio', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termoFinal }) });
    const dadosAud = await resAud.json();

    await fetch('/api/words', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termoFinal, translation: traducaoFinal, audioUrl: dadosAud.audioUrl || "", category_id: categoriaId }) });

    document.getElementById('novo-termo' + sufixo).value = ''; dispararResize('novo-termo' + sufixo);
    document.getElementById('traducao' + (origem === 'mobile' ? '-mobile' : '-automatica')).value = ''; dispararResize('traducao' + (origem === 'mobile' ? '-mobile' : '-automatica'));

    if(origem === 'mobile') fecharModalMobile();
    carregarLista();
}


async function carregarLista() {
    fetch('/api/words', { method: 'GET', headers: await getHeaders() }).then(res => res.json()).then(dados => {
        ultimaListaPalavras = dados; renderizarFiltros(); aplicarFiltrosEBuscar();
    });
}

function aplicarFiltrosEBuscar() {
    const lista = document.getElementById('lista-palavras');
    const emptyState = document.getElementById('empty-state');
    lista.innerHTML = '';

    const palavrasFiltradas = ultimaListaPalavras.filter(palavra => {
        let nomeCat = "Sem Categoria";
        if (palavra.category_id) { const cat = categoriasAtuais.find(c => c.id === palavra.category_id); if (cat) nomeCat = cat.name; }
        const passaFiltro = filtroAtivo === 'Todos' || nomeCat === filtroAtivo;
        const passaBusca = !termoBuscaAtual || (palavra.term + " " + palavra.translation).toLowerCase().includes(termoBuscaAtual);
        return passaFiltro && passaBusca;
    });

    document.getElementById('stat-line').textContent = `${palavrasFiltradas.length} REGISTRO${palavrasFiltradas.length !== 1 ? 'S' : ''} · ${categoriasAtuais.length} CATEGORIAS`;

    if (palavrasFiltradas.length === 0) { emptyState.classList.replace('hidden', 'flex'); return; }
    emptyState.classList.replace('flex', 'hidden');

    palavrasFiltradas.forEach((palavra, index) => {
        let nomeCategoria = "Sem Categoria";
        if (palavra.category_id) { const cat = categoriasAtuais.find(c => c.id === palavra.category_id); if (cat) nomeCategoria = cat.name; }
        const estilo = obterEstiloCategoria(palavra.category_id, nomeCategoria !== "Sem Categoria" ? nomeCategoria : "");

       lista.innerHTML += `
            <div class="registro-item panel p-5 pl-6 sm:p-6 sm:pl-7 rounded-2xl flex flex-col relative overflow-hidden transition-all cursor-pointer group border border-[#1f2937]/50" data-action="revelar-card">
                <div class="absolute left-0 top-0 bottom-0 w-1 opacity-80" style="background-color: ${estilo.corHex};"></div>
                <div class="flex justify-between items-start mb-3">
                    <span class="text-[9px] font-bold ${estilo.texto} uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5" style="border-color:${hexToRgba(estilo.corHex,0.3)}; background:${hexToRgba(estilo.corHex,0.1)};">
                        ${escapeHTML(nomeCategoria)}
                    </span>
                    <div class="flex items-center gap-3 text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity" data-action="stop-propagation">
                        <button data-action="tocar-audio" data-index="${index}" class="btn-audio hover:text-[#00e5ff] p-1 transition-colors"><i class="ph-fill ph-speaker-high text-lg pointer-events-none"></i></button>
                        <button data-action="editar-palavra" data-index="${index}" class="hover:text-white p-1 transition-colors"><i class="ph-fill ph-pencil-simple text-lg pointer-events-none"></i></button>
                        <button data-action="excluir-palavra" data-id="${palavra.id}" class="hover:text-red-500 p-1 transition-colors"><i class="ph-fill ph-trash text-lg pointer-events-none"></i></button>
                        <i class="ph ph-caret-down chevron text-sm ml-1 text-gray-400 pointer-events-none"></i>
                    </div>
                </div>
                
                <div class="flex justify-between items-start gap-4">
                    <h3 class="text-[15px] sm:text-[17px] font-semibold text-white leading-snug pr-2">${escapeHTML(palavra.term || "")}</h3>
                    <button data-action="copiar-texto" data-texto="${escapeHTML(palavra.term || "")}" class="text-gray-500 hover:text-white p-1 transition-colors shrink-0"><i class="ph ph-copy pointer-events-none text-base"></i></button>
                </div>
                
                <div class="flashcard-reveal">
                    <div>
                        <div class="h-px w-full bg-[#1f2937] my-3 relative"><div class="absolute left-0 top-0 h-full w-12" style="background: linear-gradient(90deg, ${estilo.corHex}, transparent);"></div></div>
                        
                        <div class="flex justify-between items-start gap-4">
                            <p class="text-[13px] sm:text-[14px] text-gray-400 leading-relaxed pb-1">${escapeHTML(palavra.translation || "")}</p>
                            <button data-action="copiar-texto" data-texto="${escapeHTML(palavra.translation || "")}" class="text-gray-500 hover:text-[#00e5ff] p-1 transition-colors shrink-0"><i class="ph ph-copy pointer-events-none text-base"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

window.prepararEdicao = function(index) {
    const palavra = ultimaListaPalavras[index]; palavraEmEdicaoId = palavra.id;
    document.getElementById('edit-termo').value = palavra.term || ""; 
    document.getElementById('edit-traducao').value = palavra.translation || "";
    selecionarCatEdit(palavra.category_id); 
    
    document.getElementById('modal-edicao').classList.replace('hidden', 'flex');

    setTimeout(() => {
        dispararResize('edit-termo');
        dispararResize('edit-traducao');
    }, 10);
}

window.fecharModal = function() { palavraEmEdicaoId = null; document.getElementById('modal-edicao').classList.replace('flex', 'hidden'); }

window.salvarEdicao = async function() {
    if (!palavraEmEdicaoId) return;
    const termo = document.getElementById('edit-termo').value.trim();
    const traducao = document.getElementById('edit-traducao').value.trim();
    
    // Força o servidor a recriar o áudio do texto atualizado
    const resAud = await fetch('/api/audio', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termo }) });
    const dadosAud = await resAud.json();

    await fetch('/api/words/' + palavraEmEdicaoId, { 
        method: 'PUT', headers: await getHeaders(), 
        body: JSON.stringify({ term: termo, translation: traducao, category_id: catSelecionadaEdit, audioUrl: dadosAud.audioUrl || "" }) 
    });
    fecharModal(); carregarLista();
}

window.excluirPalavra = function(id) {
    abrirConfirmacao("Excluir Registro?", "Esta ação é irreversível.", async () => {
        await fetch('/api/words/' + id, { method: 'DELETE', headers: await getHeaders() });
        carregarLista();
    });
}

// CORREÇÃO DO CACHE DE ÁUDIO NO NAVEGADOR
function resetarBotaoAudio() { 
    document.querySelectorAll('.btn-audio').forEach(btn => btn.classList.remove('text-[#00e5ff]'));
    botaoAudioAtual = null; 
}

window.tocarAudio = async function(botao, index) {
    const urlOriginal = ultimaListaPalavras[index].audioUrl || ""; 
    const texto = ultimaListaPalavras[index].term || "";
    
    if (botaoAudioAtual === botao) { if (audioAtual) audioAtual.pause(); window.speechSynthesis.cancel(); resetarBotaoAudio(); return; }
    
    if (audioAtual) { audioAtual.pause(); audioAtual.currentTime = 0; } 
    window.speechSynthesis.cancel(); resetarBotaoAudio(); 
    
    botaoAudioAtual = botao; botaoAudioAtual.classList.add('text-[#00e5ff]'); 
    
    try {
        // 1. O botão não toca mais direto! Ele "pede permissão" ao servidor Go primeiro.
        const response = await fetch('/api/audio', {
            method: 'POST',
            headers: await getHeaders(), // Injeta o token JWT de segurança
            body: JSON.stringify({ term: texto }) 
        });

        // 2. O Escudo em ação: Se você clicar rápido demais, o Go devolve o erro 429
        if (response.status === 429) {
            console.warn("🛡️ Servidor Go bloqueou a reprodução por excesso de cliques rápidos.");
            resetarBotaoAudio(); // Desliga a cor do botão
            return; // Aborta tudo AQUI antes de acessar o Google e tomar bloqueio de IP
        }

        if (!response.ok) throw new Error('Falha no servidor ao processar o áudio');

        // 3. O Go liberou! Pegamos o JSON da resposta
        const dadosAud = await response.json();
        
        // Usamos a URL retornada pelo Go (ou a do banco de dados como garantia)
        const urlSegura = dadosAud.audioUrl || urlOriginal;

        if (urlSegura && urlSegura.startsWith('http')) { 
            // Quebra o cache do navegador
            const urlSemCache = urlSegura + (urlSegura.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime(); // Evita cache
            
            audioAtual = new Audio(urlSemCache); 
            audioAtual.onended = resetarBotaoAudio; 
            audioAtual.play().catch(() => resetarBotaoAudio()); 
        } else { 
            // Plano B (Fallback nativo do navegador)
            const sintese = new SpeechSynthesisUtterance(texto); 
            sintese.lang = 'en-US'; 
            sintese.onend = resetarBotaoAudio; 
            window.speechSynthesis.speak(sintese); 
        }

    } catch (erro) {
        console.error('Erro na requisição de áudio:', erro);
        resetarBotaoAudio();
    }
}
// MOBILE
let scrollPosicaoAnterior = 0;

window.abrirModalMobile = function() {
    document.getElementById('modal-mobile').classList.replace('hidden', 'flex');

    scrollPosicaoAnterior = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosicaoAnterior}px`;
    document.body.style.width = '100%';

    const assinatura = document.getElementById('assinatura');
    if (assinatura) assinatura.style.display = 'none';
}

window.fecharModalMobile = function() {
    document.getElementById('modal-mobile').classList.replace('flex', 'hidden');

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPosicaoAnterior);

    const assinatura = document.getElementById('assinatura');
    if (assinatura) assinatura.style.display = 'block';
}

// 🚀 AUTOSCROLL DO TECLADO
document.querySelectorAll('#modal-mobile textarea, #modal-mobile input').forEach(campo => {
    campo.addEventListener('focus', () => {
        setTimeout(() => {
            campo.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 350);
    });
});


```

## static/icons/icon-192.png

```png
[Binary file content not included]
```

## static/icons/icon-512.png

```png
[Binary file content not included]
```

## static/index.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <title>Grimoire</title>
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">

    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link rel="stylesheet" href="style.css">
    <style>
        body { background-color: #000; color: #fff; }
        .input-dark { background-color: #0d1117; border: 1px solid #1f2937; color: #fff; transition: all 0.2s; }
        .input-dark:focus { border-color: #00e5ff; box-shadow: 0 0 0 3px rgba(0,229,255,0.12); outline: none; }
        .cat-swatch { border: 1.5px solid #262b36; transition: all 0.15s ease; cursor: pointer; }
        .cat-swatch.selected { box-shadow: 0 0 0 2px rgba(255,255,255,0.15); border-color: transparent; }
        
        /* FIX: Remove a barra de rolagem dos campos de texto no mobile e garante a expansão limpa */
        textarea { overflow-y: hidden; resize: none; min-height: 48px; }

        /* Animações da Tela de Login Original (Issue #41) */
        .drift-text { position: absolute; white-space: nowrap; color: #66fcf1; opacity: 0.15; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; animation: drift linear infinite; pointer-events: none; z-index: 0; }
        @keyframes drift { from { transform: translateY(110vh); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } to { transform: translateY(-10vh); opacity: 0; } }
    </style>
</head>

<body class="min-h-screen flex flex-col items-center antialiased">

    <div id="tela-loading" class="fixed inset-0 bg-[#05070a] z-50 flex flex-col items-center justify-center font-mono">
        <i class="ph ph-circle-notch animate-spin text-[#00e5ff] text-4xl mb-6"></i>
        <div id="loading-text" class="text-[#45a29e] text-[10px] tracking-widest uppercase mb-4 h-4">> Inicializando núcleo de dados...</div>
        <div class="sci-fi-loader"></div>
    </div>

    <div id="tela-login" class="flex flex-col items-center justify-center w-full min-h-[90vh] relative z-10 px-4 overflow-hidden" style="display:none;">
        
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>

        <div class="drift-text" style="left:10%; animation-duration:18s; animation-delay:0s;">> initializing grimoire protocols...</div>
        <div class="drift-text" style="left:75%; animation-duration:22s; animation-delay:4s;">> connection secured.</div>
        <div class="drift-text" style="left:25%; animation-duration:25s; animation-delay:8s;">> fetching vocabulary database...</div>
        <div class="drift-text" style="left:65%; animation-duration:19s; animation-delay:12s;">> decrypting target language...</div>

        <div class="w-full flex flex-col items-center justify-center mb-10 animate-fade-up text-center relative z-10">
            <div class="w-16 h-16 rounded-2xl bg-[#0f151d] border border-[#66fcf1]/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(102,252,241,0.15)] relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#66fcf1" viewBox="0 0 16 16">
                    <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm.5 3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm6.5 2a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1h-3z"/>
                </svg>
                <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-[#05070a] shadow-[0_0_8px_#22c55e]"></div>
            </div>

            <h1 class="text-4xl font-display font-bold leading-tight tracking-tight text-white">GRIMOIRE</h1>
            <h2 class="text-2xl font-mono font-bold text-gray-300 mt-1 flex items-center gap-2">
                <span class="text-[#66fcf1] animate-pulse">//</span> TERMINAL
            </h2>
            <p class="text-[#45a29e] font-mono text-xs tracking-[0.2em] uppercase mt-6 border-b border-gray-800 pb-2 inline-block">Acesso Restrito</p>
        </div>

        <div class="panel w-full max-w-md p-8 sm:p-10 rounded-2xl flex flex-col gap-6 relative animate-fade-up delay-100 z-10">
            <div class="text-center mb-2">
                <p class="text-gray-400 text-sm font-mono opacity-80">Conexão criptografada necessária para acessar os registros de exploração no terminal central.</p>
            </div>

            <button id="btn-login-ui" onclick="iniciarLoginAnimado(this)" class="w-full relative overflow-hidden rounded-xl bg-white text-[#05070a] h-14 flex items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(102,252,241,0.25)] border border-transparent">
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="shrink-0 google-logo">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span class="font-bold text-[14px] tracking-wide">Continuar com o Google</span>
            </button>

            <div class="flex items-center gap-4 mt-2">
                <div class="h-px bg-gray-800 flex-1"></div>
                <span class="font-mono text-[10px] text-gray-500 tracking-widest">SESSÃO PRIVADA</span>
                <div class="h-px bg-gray-800 flex-1"></div>
            </div>

            <div class="font-mono text-xs text-center text-gray-500 mt-2 flex items-center justify-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#66fcf1] animate-pulse shadow-[0_0_8px_#66fcf1]"></div>
                Conexão Segura Ativa
            </div>
        </div>

        <footer class="absolute bottom-6 w-full text-center animate-fade-up delay-200 z-10">
            <div class="font-mono text-[10px] text-[#66fcf1] opacity-60 tracking-widest uppercase">
                <span id="terminal-status" class="cursor-blink">> Status: Aguardando Autenticação</span>
            </div>
        </footer>
    </div>

    <div id="tela-app" style="display:none;" class="w-full max-w-7xl relative z-20 pb-24 lg:pb-10 p-4 sm:p-6 md:p-10">
        <header class="flex justify-between items-start mb-6 pb-4 border-b border-[#1f2937]">
            <div>
                <h1 class="font-display font-bold text-xl text-[#00e5ff] tracking-widest italic">// GRIMOIRE</h1>
                <p class="font-mono text-[9px] uppercase tracking-[0.2em] mt-1 text-gray-500">Registro de Dados</p>
            </div>
            <button onclick="sair()" class="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2 tracking-widest uppercase mt-1">
                <i class="ph ph-sign-out text-lg"></i> Sair
            </button>
        </header>

        <div class="flex flex-col lg:flex-row gap-8">
            
            <aside class="panel p-6 rounded-2xl w-full lg:w-[360px] flex-shrink-0 h-fit sticky top-6 z-10 hidden lg:block">
                <h3 class="text-sm font-mono font-bold text-gray-300 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <span class="text-gray-500">+</span> NOVO REGISTRO
                </h3>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between items-end mb-1.5">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inglês</label>
                            <button type="button" data-action="copiar-input" data-alvo="novo-termo" class="text-gray-500 hover:text-white transition-colors"><i class="ph ph-copy pointer-events-none"></i></button>
                        </div>
                        <textarea id="novo-termo" rows="1" class="input-dark w-full px-4 py-3 rounded-lg text-sm auto-resize"></textarea>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-1.5">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tradução</label>
                            <button type="button" data-action="copiar-input" data-alvo="traducao-automatica" class="text-gray-500 hover:text-white transition-colors"><i class="ph ph-copy pointer-events-none"></i></button>
                        </div>
                        <textarea id="traducao-automatica" rows="1" class="input-dark w-full px-4 py-3 rounded-lg text-sm auto-resize"></textarea>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-2">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoria</label>
                            <div class="flex gap-3">
                                <button type="button" onclick="abrirGerenciadorCategorias()" class="text-[12px] text-gray-500 hover:text-white transition-colors flex items-center"><i class="ph-fill ph-gear"></i></button>
                                <button type="button" onclick="toggleNovaCategoriaUI('desktop')" class="text-[10px] text-[#00e5ff] font-bold uppercase tracking-widest hover:opacity-75 flex items-center gap-1"><i class="ph ph-plus"></i> Nova</button>
                            </div>
                        </div>
                        <div id="cat-swatches-desktop" class="flex flex-wrap gap-2 mb-2"></div>
                        <div id="new-cat-row-desktop" class="hidden flex gap-2">
                            <input id="new-cat-input-desktop" type="text" placeholder="Nome..." class="input-dark flex-1 rounded-lg px-3 py-2.5 text-xs" onkeypress="if(event.key === 'Enter') salvarNovaCategoriaUI('desktop')">
                            <button type="button" onclick="salvarNovaCategoriaUI('desktop')" class="px-3 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] text-xs font-bold">OK</button>
                        </div>
                    </div>

                    <button onclick="salvarPalavra('desktop')" class="w-full bg-gradient-to-r from-[#5ee7df] to-[#b490ca] text-[#05070a] font-bold text-xs uppercase tracking-widest py-4 rounded-xl mt-2 flex justify-center items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                        <i class="ph-fill ph-download-simple text-lg"></i> Salvar no Terminal
                    </button>
                </div>
            </aside>

            <main class="w-full lg:flex-1 flex flex-col gap-5 z-0">
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between px-1">
                        <div class="flex items-center gap-2 font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse"></span>
                            <span id="stat-line">0 REGISTROS</span>
                        </div>
                        <div class="flex items-center gap-1 font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                            <i class="ph ph-funnel"></i> Filtros
                        </div>
                    </div>
                    <div id="filter-chips" class="flex gap-2 overflow-x-auto hide-scrollbar pb-2"></div>
                </div>

                <div class="relative group mt-1">
                    <i class="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base"></i>
                    <input type="text" id="campo-busca" oninput="filtrarLista(this.value)" placeholder="Buscar no banco de dados..." class="input-dark w-full pl-10 pr-5 py-3.5 rounded-xl text-sm font-mono placeholder:font-sans shadow-inner">
                </div>
                
                <div id="lista-palavras" class="flex flex-col gap-4 mt-2"></div>

                <div id="empty-state" class="hidden flex-col items-center text-center gap-3 py-14 text-gray-500">
                    <i class="ph ph-book-open text-4xl text-gray-700"></i>
                    <p class="text-sm font-medium text-gray-400">Nenhum registro encontrado</p>
                </div>
            </main>
        </div>

        <button onclick="abrirModalMobile()" class="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#5ee7df] to-[#b490ca] flex items-center justify-center text-[#05070a] shadow-[0_0_20px_rgba(94,231,223,0.35)] hover:scale-105 active:scale-95 transition-transform z-40">
            <i class="ph ph-plus text-2xl font-bold"></i>
        </button>

        <div id="modal-mobile" class="fixed inset-0 bg-[#090b10] z-[60] hidden flex-col transition-opacity overflow-y-auto hide-scrollbar">
           <div class="p-6 min-h-[100dvh] flex flex-col max-w-md mx-auto w-full pt-10 pb-40">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-sm font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><i class="ph-fill ph-terminal-window text-[#00e5ff]"></i> NOVO REGISTRO</h3>
                    <button onclick="fecharModalMobile()" class="text-gray-500 hover:text-white bg-[#1f2937]/50 w-8 h-8 rounded-full flex items-center justify-center"><i class="ph ph-x text-lg"></i></button>
                </div>
                <div class="space-y-5">
                    <div>
                        <div class="flex justify-between items-end mb-1.5">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inglês</label>
                            <button type="button" data-action="copiar-input" data-alvo="novo-termo-mobile" class="text-gray-500 hover:text-white transition-colors"><i class="ph ph-copy pointer-events-none"></i></button>
                        </div>
                        <textarea id="novo-termo-mobile" rows="1" class="input-dark w-full px-4 py-3.5 rounded-xl text-sm auto-resize"></textarea>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-1.5">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tradução</label>
                            <button type="button" data-action="copiar-input" data-alvo="traducao-mobile" class="text-gray-500 hover:text-white transition-colors"><i class="ph ph-copy pointer-events-none"></i></button>
                        </div>
                        <textarea id="traducao-mobile" rows="1" class="input-dark w-full px-4 py-3.5 rounded-xl text-sm auto-resize"></textarea>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-2">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoria</label>
                            <div class="flex gap-3">
                                <button type="button" onclick="abrirGerenciadorCategorias()" class="text-[12px] text-gray-500 hover:text-white transition-colors flex items-center"><i class="ph-fill ph-gear"></i></button>
                                <button type="button" onclick="toggleNovaCategoriaUI('mobile')" class="text-[10px] text-[#00e5ff] font-bold uppercase tracking-widest flex items-center gap-1"><i class="ph ph-plus"></i> Nova</button>
                            </div>
                        </div>
                        <div id="cat-swatches-mobile" class="flex flex-wrap gap-2 mb-2"></div>
                        <div id="new-cat-row-mobile" class="hidden flex gap-2">
                            <input id="new-cat-input-mobile" type="text" placeholder="Nome..." class="input-dark flex-1 rounded-lg px-3 py-2.5 text-xs" onkeypress="if(event.key === 'Enter') salvarNovaCategoriaUI('mobile')">
                            <button type="button" onclick="salvarNovaCategoriaUI('mobile')" class="px-3 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] text-xs font-bold">OK</button>
                        </div>
                    </div>
                    <button onclick="salvarPalavra('mobile')" class="w-full bg-gradient-to-r from-[#5ee7df] to-[#b490ca] text-[#05070a] font-bold text-xs uppercase tracking-widest py-4 rounded-xl mt-4 flex justify-center items-center active:scale-95 transition-all">
                        <i class="ph-fill ph-download-simple text-lg mr-2"></i> Salvar
                    </button>
                </div>
            </div>
        </div>

        <div id="modal-edicao" class="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-[60] hidden items-center justify-center p-4">
            <div class="panel w-full max-w-lg p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#1f2937]">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-sm font-mono font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                        <i class="ph-fill ph-pencil-simple text-[#00e5ff] text-lg"></i> Edição
                    </h3>
                    <button onclick="fecharModal()" class="text-gray-500 hover:text-white transition-colors bg-[#1f2937]/30 w-8 h-8 rounded-full flex items-center justify-center"><i class="ph ph-x"></i></button>
                </div>
                <div class="space-y-5">
                    <div>
                        <div class="flex justify-between items-end mb-1.5">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inglês</label>
                            <button type="button" data-action="copiar-input" data-alvo="edit-termo" class="text-gray-500 hover:text-white transition-colors"><i class="ph ph-copy pointer-events-none"></i></button>
                        </div>
                        <textarea id="edit-termo" rows="1" class="input-dark w-full px-4 py-3.5 rounded-xl text-sm auto-resize"></textarea>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-1.5">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tradução</label>
                            <button type="button" data-action="copiar-input" data-alvo="edit-traducao" class="text-gray-500 hover:text-white transition-colors"><i class="ph ph-copy pointer-events-none"></i></button>
                        </div>
                        <textarea id="edit-traducao" rows="1" class="input-dark w-full px-4 py-3.5 rounded-xl text-sm auto-resize"></textarea>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Categoria</label>
                        <div id="cat-swatches-edit" class="flex flex-wrap gap-2"></div>
                    </div>
                    <div class="pt-2 mt-2">
                        <button onclick="salvarEdicao()" class="w-full py-4 rounded-xl font-bold text-[#05070a] bg-gradient-to-r from-[#5ee7df] to-[#b490ca] hover:opacity-90 transition-opacity text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(94,231,223,0.3)]">
                            <i class="ph-fill ph-check-circle inline-block mr-1"></i> Atualizar Registro
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div id="modal-gerenciador-categorias" class="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-[70] hidden items-center justify-center p-4">
            <div class="panel w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#1f2937]">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-sm font-mono font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                        <i class="ph-fill ph-gear text-[#00e5ff] text-lg"></i> Categorias
                    </h3>
                    <button onclick="fecharGerenciadorCategorias()" class="text-gray-500 hover:text-white transition-colors bg-[#1f2937]/30 w-8 h-8 rounded-full flex items-center justify-center"><i class="ph ph-x"></i></button>
                </div>
                
                <div id="lista-categorias-gerenciador" class="space-y-2 max-h-64 overflow-y-auto hide-scrollbar">
                </div>
            </div>
        </div>

        <div id="modal-confirmacao" class="fixed inset-0 bg-[#000]/85 backdrop-blur-sm z-[100] hidden items-center justify-center p-4">
            <div class="panel w-full max-w-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-red-500/30 text-center">
                <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-500 text-3xl">
                    <i class="ph-fill ph-warning-circle"></i>
                </div>
                <h3 id="confirm-title" class="text-lg font-bold text-white mb-2">Excluir Registro?</h3>
                <p id="confirm-desc" class="text-sm text-gray-400 mb-6">Esta ação não pode ser desfeita.</p>
                <div class="flex gap-3">
                    <button onclick="fecharConfirmacao()" class="w-1/2 py-3 rounded-xl font-bold text-gray-400 bg-[#1f2937]/50 hover:bg-[#1f2937] transition-colors text-xs uppercase tracking-widest">Cancelar</button>
                    <button id="confirm-action-btn" class="w-1/2 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors text-xs uppercase tracking-widest">Excluir</button>
                </div>
            </div>
        </div>

    </div>

    <div id="assinatura" class="fixed bottom-4 right-4 sm:bottom-5 sm:right-6 z-[100] opacity-60 hover:opacity-100 transition-opacity duration-300 pointer-events-none sm:pointer-events-auto" style="display:none;">
        <div class="font-mono text-[8px] sm:text-[11px] tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2 cursor-default group">
            <span class="text-[#9d8bff] transition-colors group-hover:text-[#66fcf1]">//</span> 
            <span>Desenvolvido por</span> 
            <span class="font-bold text-white group-hover:text-[#66fcf1] drop-shadow-[0_0_8px_rgba(102,252,241,0.8)] transition-all">
                João Victor Mendes
            </span>
            <span class="w-1.5 h-3 bg-[#66fcf1] animate-pulse ml-0.5 shadow-[0_0_5px_#66fcf1]"></span>
        </div>
    </div>

    <script>
        // Lógica Exata da Issue #41 para o botão de Login
        function iniciarLoginAnimado(btn) {
            if(btn.disabled) return;
            btn.disabled = true;
            
            btn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="font-mono tracking-wider text-gray-700 font-bold text-sm">DECODIFICANDO...</span>
            `;
            
            const status = document.getElementById('terminal-status');
            if (status) {
                status.innerText = "> Status: Estabelecendo handshake seguro...";
                status.classList.remove('cursor-blink');
            }

            setTimeout(() => {
                entrarComGoogle();
            }, 1000);
        }
    </script>
    <script src="/app.js?v=20"></script>
</body>
</html>
```

## static/manifest.json

```json
{
  "name": "Terminal Vocab (Grimoire)",
  "short_name": "Grimoire",
  "description": "Dicionário pessoal para registrar e estudar vocabulário em inglês.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0c10",
  "theme_color": "#0b0c10",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}

```

## static/style.css

```css
:root {
    --void: #05070a;
    --teal: #00e5ff;
    --violet: #9d8bff;
    --text: #e8f2f1;
    --font-display: 'Chakra Petch', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}

body {
    background-color: #000;
    color: var(--text);
    font-family: var(--font-body);
}

/* Fundo Premium v2 */
body::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: -1;
}

.panel {
    background-color: #0d131f;
    border: 1px solid #1f2937;
}

/* Estilo de Input Premium Inspirado no seu v2 */
.input-dark {
    background-color: #0d1117;
    border: 1px solid #1f2937;
    color: #fff;
    font-family: var(--font-body);
    transition: all 0.2s ease;
}

.input-dark:focus {
    outline: none;
    border-color: var(--teal);
    background-color: #0d1117;
    box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.12);
}

.btn-primary {
    background: linear-gradient(135deg, var(--teal), var(--violet));
    color: #05070a;
    font-weight: 700;
    font-family: var(--font-display);
    transition: transform 0.15s, box-shadow 0.15s;
    border: none;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(102, 252, 241, 0.25);
}

.badge {
    background-color: #0b0c10;
    border: 1px solid #45a29e;
    color: #66fcf1;
}

textarea {
    resize: none;
    overflow: hidden;
}

/* Animação e estilo do novo Header */
.scan-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding-bottom: 22px; margin-bottom: 26px;
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
    width: 100%;
}

.scan-header::after {
    content: '';
    position: absolute; left: 0; right: 0; bottom: -1px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--teal), var(--violet), transparent);
    animation: scan 5s linear infinite;
}

@keyframes scan {
    0% { transform: translateX(-100%); opacity: 0; }
    10% { opacity: 1; }
    50% { transform: translateX(0%); }
    90% { opacity: 1; }
    100% { transform: translateX(100%); opacity: 0; }
}

.logo-block h1 {
    font-family: var(--font-display);
    font-weight: 700; font-size: 28px;
    display: flex; align-items: center; gap: 10px;
}

.logo-block h1 .glyph {
    background: linear-gradient(135deg, var(--teal), var(--violet));
    -webkit-background-clip: text; background-clip: text; color: transparent;
}

.cursor {
    display: inline-block; width: 9px; height: 20px;
    background: var(--teal); margin-left: 4px;
    animation: blink 1.1s step-end infinite;
    box-shadow: 0 0 8px var(--teal);
}

@keyframes blink { 50% { opacity: 0; } }

.logo-block p {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--teal-dim); margin-top: 6px;
}

/* =========================================
   ANIMAÇÕES E EFEITOS DA TELA DE LOGIN
========================================= */

/* Efeito de entrada suave (Fade Up) */
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up {
    animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }

/* Orbes Neon Flutuantes de Fundo */
.orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.15; z-index: 0; pointer-events: none; }
.orb1 { width: 500px; height: 500px; background: radial-gradient(circle, var(--teal), transparent 70%); top: -100px; left: -100px; animation: drift1 20s ease-in-out infinite; }
.orb2 { width: 600px; height: 600px; background: radial-gradient(circle, var(--violet), transparent 70%); bottom: -200px; right: -100px; animation: drift2 25s ease-in-out infinite alternate; }

@keyframes drift1 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(100px, 100px); } }
@keyframes drift2 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-150px, -100px); } }

/* Textos do Sistema Flutuantes (Drift Text) */
.drift-text {
    position: fixed; font-family: var(--font-mono); font-size: 12px;
    color: rgba(102, 252, 241, 0.15); white-space: nowrap; z-index: 0;
    animation: rise linear infinite;
    pointer-events: none;
}
@keyframes rise {
    0% { transform: translateY(100vh); opacity: 0; }
    10%, 90% { opacity: 1; }
    100% { transform: translateY(-20vh); opacity: 0; }
}

/* =========================================
   SISTEMA DE FLASHCARDS 3D #ISSUE #43
========================================= */
.flip-container {
    perspective: 1000px;
    width: 100%;
}

.flipper {
    transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
    transform-style: preserve-3d;
    position: relative;
    width: 100%;
    /* O Grid faz com que Frente e Verso ocupem exatamente o mesmo espaço, 
       ajustando a altura automaticamente para caber frases grandes */
    display: grid; 
}

.flip-container.flipped .flipper {
    transform: rotateX(180deg);
}

.front, .back {
    grid-area: 1 / 1; /* Coloca os dois na mesma "célula" */
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    width: 100%;
}

.back {
    transform: rotateX(180deg);
}

/* Linhas laterais de sotaque inspiradas no protótipo */
.accent-line-teal { border-left: 3px solid var(--teal-dim); }
.accent-line-violet { border-left: 3px solid var(--violet); }

/* Linha de sotaque lateral do card */
.accent-line-teal { border-left: 3px solid var(--teal-dim); }

/* Motor de animação suave (Accordion) */
/* Animações e Cards */
.flashcard-reveal {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease-out, opacity 0.3s ease-out;
    opacity: 0;
    pointer-events: none;
}
.flashcard-reveal > div { overflow: hidden; }

.registro-item.revealed .flashcard-reveal {
    grid-template-rows: 1fr;
    opacity: 1;
    pointer-events: auto;
}

.registro-item.revealed .hint-text {
    display: none; /* Esconde o "Clique para revelar" */
}

.chevron { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.registro-item.revealed .chevron { transform: rotate(180deg); }

/* Esconder Scrollbars */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* =========================================
   ANIMAÇÃO DE CARREGAMENTO SCI-FI
========================================= */
@keyframes loadingBar {
    0% {transform: translateX(-100%);}
    50% {transformo: translateX(0%);}
    100% {transform: translateX(100%);}
}

.sci-fi-loader {
    width: 200px; height: 2px;
    background-color: #1f2937;
    overflow: hidden;
    position: relative;
    border-radius: 2px;
}

.sci-fi-loader::after {
    content: ''; 
    position: absolute; top: 0; left: 0; bottom: 0; width: 100%;
    background: linear-gradient(90deg, transparent, #00e5ff, transparent);
    animation: loadingBar 1.5s infinite ease-in-out; 
}
```

## static/sw.js

```javascript
const CACHE_NAME = 'grimoire-shell-v3';

const SHELL_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim(); 
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((resposta) => {
          if (resposta && resposta.status === 200) {
            const clone = resposta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resposta;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
```

## sql/000_schema_inicial.sql

```sql
-- 000_schema_inicial.sql
-- Retrato do schema como ele já existia quando a pasta sql/ foi criada.
--
-- NÃO É PARA APLICAR em banco de produção: as tabelas já estão lá, criadas pelo
-- antigo InitDB. Este arquivo existe para que o repositório saiba qual é o schema,
-- e para recriar o banco do zero em outro ambiente.
--
-- Reconstruído em 19/09/2026 a partir do snapshot, não da memória. Note que
-- vocabularies.user_id é uuid e categories.user_id passou a ser uuid no sql/001.

CREATE TABLE IF NOT EXISTS public.categories (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    user_id    UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.vocabularies (
    id          SERIAL PRIMARY KEY,
    term        TEXT NOT NULL,
    translation TEXT NOT NULL,
    audio_url   TEXT,
    status      TEXT DEFAULT 'Pendente',
    user_id     UUID,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id      ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabularies_user_id    ON public.vocabularies(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabularies_category_id ON public.vocabularies(category_id);

-- RLS ligada junto da criação: tabela nova sem RLS fica aberta ao PostgREST, e
-- o aviso do Supabase no editor é exatamente sobre isso. As policies vêm no 002.
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
```

## sql/001_alinha_user_id.sql

```sql
-- 001_alinha_user_id.sql
-- Faz categories.user_id virar uuid, como já é em vocabularies.
--
-- O InitDB declara TEXT nas duas tabelas, mas o banco tem uuid em vocabularies:
-- alguém alterou à mão e o Go nunca soube, porque CREATE TABLE IF NOT EXISTS
-- não altera tabela existente (item 3 do PITFALLS.md).
--
-- Alinhar antes de escrever as policies evita fazê-las duas vezes: com uuid dos
-- dois lados, a comparação com auth.uid() é direta, sem cast.
--
-- ORDEM: pode rodar antes do deploy. O lib/pq manda o user_id como texto e o
-- Postgres converte para uuid sozinho no parâmetro.
--
-- ANTES: rodar a conferência de uuid inválido (ver sql/README.md).

BEGIN;

ALTER TABLE public.categories
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

COMMIT;

-- CONFERÊNCIA
-- Esperado: as duas linhas com uuid.
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND column_name = 'user_id';
```

## sql/002_rls_policies.sql

```sql
-- 002_rls_policies.sql
-- Policies de vocabularies e categories.
--
-- A RLS já está ligada nas duas tabelas e não existe policy nenhuma, o que hoje
-- bloqueia o PostgREST por completo. O isolamento real vive no WHERE user_id = $1
-- de cada handler Go, e a conexão via DATABASE_URL roda como postgres, que ignora
-- RLS — então um SELECT sem filtro devolveria o dado de todos os usuários.
--
-- Estas policies são a segunda camada: o banco passa a recusar o que o Go
-- esquecer. E liberam o caminho para ler dado direto do frontend um dia, sem
-- reabrir a discussão.
--
-- FOR ALL com USING e WITH CHECK: USING filtra o que é lido, atualizado e
-- apagado; WITH CHECK impede gravar linha com o user_id de outra pessoa.
--
-- O Go não muda de comportamento: postgres continua atravessando tudo.

ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocabularies_dono" ON public.vocabularies;
CREATE POLICY "vocabularies_dono"
    ON public.vocabularies
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_dono" ON public.categories;
CREATE POLICY "categories_dono"
    ON public.categories
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- O (SELECT auth.uid()) em vez de auth.uid() direto: assim o Postgres avalia a
-- função uma vez por consulta, e não uma vez por linha.

-- CONFERÊNCIA
-- Esperado: duas policies, cmd ALL, com o predicado visível.
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public';
--
-- TESTE REAL (fora do SQL Editor, que roda como postgres e ignora RLS):
-- curl -i "$SUPABASE_URL/rest/v1/vocabularies?select=*" \
--   -H "apikey: $SUPABASE_PUBLIC_KEY" -H "Authorization: Bearer $JWT_DE_OUTRA_CONTA"
-- Esperado: só as linhas daquela conta, nunca as suas.
```

## sql/README.md

```markdown
# 🗄️ sql/ — schema versionado do Grimoire

> Todo DDL do projeto vive aqui, num arquivo numerado por ordem de aplicação.
>
> **Até 19/09/2026 o schema era criado pelo `database.InitDB()` a cada boot.** Isso
> funcionava em banco vazio e falhava em silêncio em banco existente: o
> `CREATE TABLE IF NOT EXISTS` cria, mas nunca altera. Uma coluna nova nunca chegava
> ao banco, e o boot mesmo assim anunciava "schema verificado com sucesso".

---

## Como usar

1. Crie o arquivo com o próximo número livre e um nome que diga o que ele faz.
2. Aplique **à mão**, no SQL Editor do Supabase, lendo o que vai rodar.
3. Rode a conferência que está comentada no fim do arquivo.
4. Registre a data na tabela abaixo.
5. Regenere o `snapshot_schema.sql` (ver seção própria).

## Regras

- **Arquivo aplicado nunca é editado.** Correção é arquivo novo, com o motivo no
  cabeçalho. Editar um arquivo já aplicado faz o repositório mentir sobre o banco.
- **Todo arquivo se explica no cabeçalho:** o que muda, por quê, e o que acontece se
  for revertido.
- **Todo arquivo termina com a conferência**, comentada: a consulta que prova que ele
  fez o que prometeu. Contagem não basta — confira o predicado.
- **Destrutivo vem embrulhado.** `DELETE` e `DROP` de teste vão em `BEGIN; ... ROLLBACK;`
  para serem vistos sem serem aplicados.
- **Ordem em relação ao deploy importa.** Se o arquivo remove algo que o código ainda
  usa, ele roda **depois** do deploy. Se adiciona algo que o código novo exige, roda
  antes. O cabeçalho diz qual é o caso.

## Arquivos

| Arquivo | O que faz | Aplicado em |
|---|---|---|
| `001_alinha_user_id.sql` | `categories.user_id` vira `uuid`, como já era em `vocabularies` | 19/09/2026 |
| `002_rls_policies.sql` | Policies de dono em `vocabularies` e `categories` | 19/09/2026 |

## O snapshot

O `snapshot_schema.sql` é a **foto do banco agora**: tabelas, colunas, índices,
policies e funções. Ele não é aplicado nunca — serve para responder "como está hoje?"
sem abrir o Supabase, e para o próximo arquivo ser escrito contra o estado real.

Gerar com a consulta em `snapshot_query.sql`, colando o resultado por cima do arquivo
anterior. O commit do snapshot vai junto do arquivo que causou a mudança.
```

## sql/snapshot_query.sql

```sql
-- ============================================================
-- [1] TABELAS
-- ============================================================
-- categories
--     id                           integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass)
--     name                         text NOT NULL
--     user_id                      uuid NOT NULL
--     created_at                   timestamp without time zone DEFAULT CURRENT_TIMESTAMP

-- vocabularies
--     id                           integer NOT NULL DEFAULT nextval('vocabularies_id_seq'::regclass)
--     term                         text NOT NULL
--     translation                  text NOT NULL
--     audio_url                    text
--     status                       text DEFAULT 'Pendente'::text
--     created_at                   timestamp without time zone DEFAULT CURRENT_TIMESTAMP
--     user_id                      uuid
--     category_id                  integer

-- ============================================================
-- [2] RLS POR TABELA
-- ============================================================
-- categories               rls=true
-- vocabularies             rls=true

-- ============================================================
-- [3] POLICIES
-- ============================================================
-- categories · categories_dono (ALL)
--     USING: (( SELECT auth.uid() AS uid) = user_id)
--     WITH CHECK: (( SELECT auth.uid() AS uid) = user_id)
-- vocabularies · vocabularies_dono (ALL)
--     USING: (( SELECT auth.uid() AS uid) = user_id)
--     WITH CHECK: (( SELECT auth.uid() AS uid) = user_id)

-- ============================================================
-- [4] ÍNDICES
-- ============================================================
-- CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id)
-- CREATE INDEX idx_categories_user_id ON public.categories USING btree (user_id)
-- CREATE INDEX idx_vocabularies_category_id ON public.vocabularies USING btree (category_id)
-- CREATE INDEX idx_vocabularies_user_id ON public.vocabularies USING btree (user_id)
-- CREATE UNIQUE INDEX vocabularies_pkey ON public.vocabularies USING btree (id)

-- ============================================================
-- [5] FUNÇÕES
-- ============================================================
-- nenhuma função
```

## internal/database/db.go

```go
package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB abre a conexão e confere se o schema esperado existe.
//
// Ele NÃO cria nem altera tabela. O schema vive em sql/, versionado e aplicado à
// mão — ver sql/README.md. Até 19/09/2026 as tabelas eram criadas aqui com
// CREATE TABLE IF NOT EXISTS, e isso escondeu uma divergência por semanas:
// alguém alterou vocabularies.user_id para uuid no Supabase, o Go continuou
// declarando TEXT, e o boot seguiu anunciando "schema verificado com sucesso".
// IF NOT EXISTS cria, mas nunca altera.
func InitDB() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("variável de ambiente DATABASE_URL não foi definida")
	}

	var err error
	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao supabase: %w", err)
	}

	// sql.Open não conversa com o banco: ele só valida os argumentos. Sem o Ping,
	// a primeira falha de conexão apareceria como erro de consulta no meio de uma
	// requisição, com o servidor já no ar dizendo que subiu.
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("banco não respondeu: %w", err)
	}

	if err := conferirSchema(); err != nil {
		return err
	}

	fmt.Println("✅ Conexão e schema conferidos.")
	return nil
}

// conferirSchema recusa subir se faltar tabela que o código usa.
//
// É o mesmo raciocínio do fail-fast das variáveis de ambiente no main.go: banco
// sem a tabela produz erro tardio e confuso, no meio de uma requisição, quando a
// causa é que o arquivo sql/ nunca foi aplicado.
func conferirSchema() error {
	tabelas := []string{"vocabularies", "categories"}

	for _, tabela := range tabelas {
		var existe bool
		err := DB.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.tables
				WHERE table_schema = 'public' AND table_name = $1
			)`, tabela).Scan(&existe)
		if err != nil {
			return fmt.Errorf("falha ao conferir a tabela %s: %w", tabela, err)
		}
		if !existe {
			return fmt.Errorf(
				"tabela %q não existe: aplique os arquivos de sql/ no Supabase antes de subir",
				tabela,
			)
		}
	}

	return nil
}
```

## internal/handlers/audio.go

```go
package handlers

import (
	"encoding/json"
	"fmt"
	"grimoire/internal/models"
	"net/http"
	"net/url"
	"unicode/utf8" // NOVO: Pacote para contar os caracteres corretamente
)

func AudioHandler(w http.ResponseWriter, r *http.Request) {
	var req models.AudioRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.Term == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.AudioResponse{Error: "Termo em branco"})
		return
	}

	// 🛡️ SOLUÇÃO DO BUG: Verifica o tamanho do texto
	// Se tiver mais de 200 caracteres, devolve URL vazia para forçar o Plano B (voz nativa) no Frontend
	if utf8.RuneCountInString(req.Term) > 200 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.AudioResponse{AudioURL: ""})
		return
	}

	textoSeguro := url.QueryEscape(req.Term)
	urlAudio := fmt.Sprintf("https://translate.google.com/translate_tts?ie=UTF-8&q=%s&tl=en&client=tw-ob", textoSeguro)

	res := models.AudioResponse{AudioURL: urlAudio}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
```

## internal/handlers/categories.go

```go
package handlers

import (
	"encoding/json"
	"grimoire/internal/database"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func ListCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	linhas, err := database.DB.Query("SELECT id, name FROM categories WHERE user_id = $1 ORDER BY name ASC", userID)
	if err != nil {
		http.Error(w, "Erro na busca", http.StatusInternalServerError)
		return
	}
	defer linhas.Close()

	var categories []Category
	for linhas.Next() {
		var cat Category
		if err := linhas.Scan(&cat.ID, &cat.Name); err == nil {
			categories = append(categories, cat)
		}
	}

	if categories == nil {
		categories = []Category{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func CreateCategoryHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	var req Category
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "Nome inválido", http.StatusBadRequest)
		return
	}

	var id int
	err := database.DB.QueryRow("INSERT INTO categories (name, user_id) VALUES ($1, $2) RETURNING id", req.Name, userID).Scan(&id)
	if err != nil {
		http.Error(w, "Falha ao gravar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func UpdateCategoryHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	catID := chi.URLParam(r, "id")
	var req Category
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "Nome inválido", http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec("UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3", req.Name, catID, userID)
	if err != nil {
		http.Error(w, "Erro ao atualizar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func DeleteCategoryHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	catID := chi.URLParam(r, "id")
	_, err := database.DB.Exec("DELETE FROM categories WHERE id = $1 AND user_id = $2", catID, userID)
	if err != nil {
		http.Error(w, "Erro ao excluir", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
```

## internal/handlers/translate.go

```go
package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type TranslateRequest struct {
	Term string `json:"term"`
}

type TranslateResponse struct {
	Translation string `json:"translation"`
	SourceLang  string `json:"sourceLang"`
}

func TranslateHandler(w http.ResponseWriter, r *http.Request) {
	var req TranslateRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.Term == "" {
		http.Error(w, "Termo em branco", http.StatusBadRequest)
		return
	}

	textoSeguro := url.QueryEscape(req.Term)
	
	// TENTATIVA 1: Endpoint Principal
	apiURL := fmt.Sprintf("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=%s", textoSeguro)
	traduzido, idiomaDetectado, err := processarTraducao(apiURL)

	// TENTATIVA 2 (Fallback): Se o primeiro falhar, tenta o endpoint alternativo do Chrome
	if err != nil || traduzido == "" {
		fmt.Println("⚠️ Tradução primária falhou, acionando Fallback...")
		fallbackURL := fmt.Sprintf("https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=pt&q=%s", textoSeguro)
		traduzido, idiomaDetectado, _ = processarTraducaoFallback(fallbackURL)
	}

	// Se for Pt->En
	if strings.HasPrefix(strings.ToLower(idiomaDetectado), "pt") {
		apiURL = fmt.Sprintf("https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=%s", textoSeguro)
		traduzido, _, _ = processarTraducao(apiURL)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TranslateResponse{
		Translation: traduzido,
		SourceLang:  idiomaDetectado,
	})
}

// Lógica de leitura para o Endpoint 1
func processarTraducao(urlReq string) (string, string, error) {
	resp, err := http.Get(urlReq)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var traduzido, idiomaDetectado string
	var dados []interface{}
	
	if err := json.Unmarshal(body, &dados); err == nil && len(dados) > 0 {
		if blocos, ok := dados[0].([]interface{}); ok && len(blocos) > 0 {
			for _, bloco := range blocos {
				if pedaco, ok := bloco.([]interface{}); ok && len(pedaco) > 0 {
					traduzido += fmt.Sprintf("%v", pedaco[0])
				}
			}
		}
		if len(dados) > 2 {
			if lang, ok := dados[2].(string); ok {
				idiomaDetectado = lang
			}
		}
	}
	return traduzido, idiomaDetectado, nil
}

// Lógica de leitura mais simples para o Endpoint 2 (Fallback)
func processarTraducaoFallback(urlReq string) (string, string, error) {
	resp, err := http.Get(urlReq)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var dados map[string]interface{}
	
	if err := json.Unmarshal(body, &dados); err == nil {
		if sentences, ok := dados["sentences"].([]interface{}); ok && len(sentences) > 0 {
			if first, ok := sentences[0].(map[string]interface{}); ok {
				if trans, ok := first["trans"].(string); ok {
					return trans, "en", nil // Força 'en' por simplicidade no fallback
				}
			}
		}
	}
	return "", "en", fmt.Errorf("fallback falhou")
}
```

## internal/handlers/words.go

```go
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"grimoire/internal/database"
	"grimoire/internal/middleware"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type WordRequest struct {
	Term        string `json:"term"`
	Translation string `json:"translation"`
	AudioURL    string `json:"audioUrl"`
	CategoryID  *int   `json:"category_id"`
}

type WordResponse struct {
	ID          int    `json:"id"`
	Term        string `json:"term"`
	Translation string `json:"translation"`
	AudioURL    string `json:"audioUrl"`
	Status      string `json:"status"`
	CategoryID  *int   `json:"category_id"`
}

func getUserID(r *http.Request) (string, bool) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	return userID, ok
}

func SaveWordHandler(w http.ResponseWriter, r *http.Request) {
	var req WordRequest
	json.NewDecoder(r.Body).Decode(&req)

	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	comando := `INSERT INTO vocabularies (term, translation, audio_url, user_id, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`

	var id int64
	err := database.DB.QueryRow(comando, req.Term, req.Translation, req.AudioURL, userID, req.CategoryID).Scan(&id)

	if err != nil {
		fmt.Println("Erro ao inserir:", err)
		http.Error(w, "Falha ao gravar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int64{"id": id})
}

func ListWordsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	linhas, err := database.DB.Query(`SELECT id, term, translation, audio_url, status, category_id FROM vocabularies WHERE user_id = $1 ORDER BY id DESC`, userID)
	if err != nil {
		http.Error(w, "Falha na busca", http.StatusInternalServerError)
		return
	}
	defer linhas.Close()

	var words []WordResponse
	for linhas.Next() {
		var word WordResponse
		var audioURL, status sql.NullString
		var catID sql.NullInt32

		err := linhas.Scan(&word.ID, &word.Term, &word.Translation, &audioURL, &status, &catID)
		if err != nil {
			continue
		}

		if audioURL.Valid {
			word.AudioURL = audioURL.String
		}
		if status.Valid {
			word.Status = status.String
		}
		if catID.Valid {
			val := int(catID.Int32)
			word.CategoryID = &val
		}

		words = append(words, word)
	}

	if words == nil {
		words = []WordResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(words)
}

func DeleteWordHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	_, err := database.DB.Exec("DELETE FROM vocabularies WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		http.Error(w, "Erro ao apagar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func UpdateWordHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserID(r)
	if !ok || userID == "" {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	wordID := chi.URLParam(r, "id")

	var req WordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec(
		"UPDATE vocabularies SET term = $1, translation = $2, category_id = $3, audio_url = $4 WHERE id = $5 AND user_id = $6",
		req.Term, req.Translation, req.CategoryID, req.AudioURL, wordID, userID,
	)
	if err != nil {
		http.Error(w, "Erro ao atualizar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
```

## internal/middleware/auth.go

```go
package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
	"net/url"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

var jwks *keyfunc.JWKS

// authTransport injeta as credenciais em todas as chamadas feitas para o Supabase
type authTransport struct {
	http.RoundTripper
	apiKey string
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("apikey", t.apiKey)
	req.Header.Set("Authorization", "Bearer "+t.apiKey)
	
	if t.RoundTripper == nil {
		return http.DefaultTransport.RoundTrip(req)
	}
	return t.RoundTripper.RoundTrip(req)
}

// InitJWKS é chamado no main.go para baixar as chaves assimétricas do Supabase
func InitJWKS() error {
	rawURL := os.Getenv("SUPABASE_URL")
	if rawURL == "" {
		return fmt.Errorf("SUPABASE_URL não definida")
	}

	// Blindagem 3: O Go isola automaticamente apenas a raiz do servidor (Scheme + Host)
	// Isso conserta qualquer caminho extra que tenha sido colado sem querer no .env
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("falha ao ler URL do Supabase: %w", err)
	}
	baseURL := fmt.Sprintf("%s://%s", parsedURL.Scheme, parsedURL.Host)

	publicKey := os.Getenv("SUPABASE_PUBLIC_KEY")
	jwksURL := baseURL + "/auth/v1/.well-known/jwks.json"

	// Acopla o nosso Transportador HTTP
	client := &http.Client{
		Transport: &authTransport{
			RoundTripper: http.DefaultTransport,
			apiKey:       publicKey,
		},
	}

	options := keyfunc.Options{
		Client:          client,
		RefreshInterval: time.Hour,
		RefreshTimeout:  time.Second * 10,
	}

	// ATENÇÃO: Usando uma nova variável de erro para não sobrescrever a variável global 'jwks'
	var getErr error
	jwks, getErr = keyfunc.Get(jwksURL, options)
	if getErr != nil {
		return fmt.Errorf("falha ao baixar JWKS do Supabase: %w", getErr)
	}

	fmt.Println("✅ JWKS do Supabase carregado e armazenado em cache (Asymmetric Keys).")
	return nil
}

func AuthSupabase(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		if jwks == nil {
			fmt.Println("⛔ ERRO: JWKS não inicializado no servidor.")
			http.Error(w, "Erro interno", http.StatusInternalServerError)
			return
		}

		// A mágica acontece aqui: validação ultrarrápida na memória usando a chave pública (ES256/RS256)
		token, err := jwt.Parse(tokenString, jwks.Keyfunc)

		if err != nil || !token.Valid {
			fmt.Println("⛔ RECUSADO: Token JWT inválido ou expirado:", err)
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			fmt.Println("⛔ RECUSADO: Falha ao extrair claims do token.")
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			fmt.Println("⛔ RECUSADO: Falha ao ler ID (sub) do usuário.")
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

## internal/middleware/rate_limit.go

```go
package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// NOVO: Estrutura que guarda o limitador e a hora do último acesso do usuário
type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	// O mapa agora guarda a nossa estrutura 'client'
	clients = make(map[string]*client)
	mu      sync.Mutex
	once    sync.Once
)

// getLimiter busca o limitador de um IP específico ou cria um novo
func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	c, exists := clients[ip]
	if !exists {
		// Regra: 2 requisições por segundo, com capacidade para picos de até 20 simultâneas.
		c = &client{
			limiter: rate.NewLimiter(rate.Every(time.Second/2), 20),
		}
		clients[ip] = c
	}

	// Atualiza o "relógio" toda vez que o IP fizer uma requisição
	c.lastSeen = time.Now()
	return c.limiter
}

// cleanupClients remove IPs que não fazem requisições há algum tempo.
func cleanupClients() {
	for {
		// Aguarda 3 minutos antes de cada limpeza
		time.Sleep(3 * time.Minute)

		mu.Lock()
		for ip, c := range clients {
			// CORREÇÃO: Se passou mais de 3 minutos desde a última requisição, o IP é apagado
			if time.Since(c.lastSeen) > 3*time.Minute {
				delete(clients, ip)
			}
		}
		mu.Unlock()
	}
}

// RateLimitAPI é o escudo que vai na frente das nossas rotas sensíveis
func RateLimitAPI(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Garante que a rotina de limpeza seja iniciada apenas uma vez.
		once.Do(func() {
			go cleanupClients()
		})

		// Pega o IP original do usuário
		ip := r.RemoteAddr

		// Como vamos rodar no Render (que usa Proxy), precisamos pegar o IP real do header
		forwarded := r.Header.Get("X-Forwarded-For")
		if forwarded != "" {
			// O X-Forwarded-For pode conter uma lista de IPs, pegamos o primeiro
			ips := strings.Split(forwarded, ",")
			ip = strings.TrimSpace(ips[0])
		} else {
			// Limpa a porta do RemoteAddr caso seja localhost (ex: 127.0.0.1:54321 -> 127.0.0.1)
			ip = strings.Split(ip, ":")[0]
		}

		limiter := getLimiter(ip)

		// Se o usuário estourar o limite, ele toma um bloqueio instantâneo
		if !limiter.Allow() {
			http.Error(w, `{"error": "Muitas requisições. Tente novamente em alguns instantes."}`, http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

## internal/models/vocab.go

```go
package models

type TranslateRequest struct {
	Term string `json:"term"`
}

type TranslateResponse struct {
	Translation string `json:"translation"`
	Error       string `json:"error,omitempty"`
}

// Define um contrato restrito 

type AudioRequest struct {
	Term string `json:"term"`
}

type AudioResponse struct {
	AudioURL string `json:"audioUrl"`
	Error    string `json:"error,omitempty"`
}

```

## docs/Agents.md

````markdown
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
````

## docs/Arquitetura.md

````markdown
# 🏗️ ARQUITETURA.md — como o Grimoire funciona

> O mapa do sistema: o que existe, por onde passa uma requisição e o que cada peça
> faz. Escrito em 19/09/2026 a partir do código, não de memória.

---

## Visão geral

```
navegador                      servidor Go (Render)           serviços externos
─────────                      ────────────────────           ─────────────────
index.html                     chi router
app.js          ── JWT ──►     middleware.AuthSupabase  ──►   Supabase (JWKS)
supabase-js     ── login ─────────────────────────────►       Supabase Auth
                               handlers/words           ──►   Postgres (lib/pq)
                               handlers/categories      ──►   Postgres
                               handlers/translate       ──►   Google Translate
                               handlers/audio           ──►   Google TTS (via URL)
```

**O servidor Go faz duas coisas:** serve os arquivos estáticos e expõe a API. Não há
template nem renderização no servidor — o `static/` é entregue como está.

---

## Autenticação

1. O navegador chama `GET /api/config` e recebe a URL e a chave anon do Supabase.
2. O `supabase-js` faz o login com Google e guarda o token.
3. Toda chamada à API vai com `Authorization: Bearer <jwt>`.
4. O `AuthSupabase` valida o token **localmente**, contra o JWKS baixado no boot, e
   põe o `sub` no contexto como `UserIDKey`.
5. Cada handler lê esse `userID` e filtra as consultas por ele.

**O ponto que precisa ficar claro:** o isolamento entre usuários acontece no `WHERE
user_id = $1` de cada handler. A conexão com o banco usa a `DATABASE_URL` como
`postgres`, que ignora RLS. Ver item 1 do `PITFALLS.md`.

---

## Banco

Duas tabelas, criadas hoje pelo `database.InitDB()` a cada boot:

| Tabela | Colunas |
|---|---|
| `categories` | `id`, `name`, `user_id`, `created_at` |
| `vocabularies` | `id`, `term`, `translation`, `audio_url`, `status`, `user_id`, `category_id`, `created_at` |

`vocabularies.category_id` referencia `categories(id)` com `ON DELETE SET NULL`:
apagar uma categoria não apaga as palavras dela.

Índices em `categories(user_id)`, `vocabularies(user_id)` e `vocabularies(category_id)`.

RLS ligada nas duas, sem policy — ver `DECISIONS.md` de 19/09/2026.

**`status` existe com default `'Pendente'` e não é usado por nenhuma tela.** É resíduo
de uma etiqueta removida na Fase 2, e candidato a remoção.

---

## Rotas

| Método | Rota | Proteção |
|---|---|---|
| GET | `/api/config` | nenhuma — devolve só o que é público |
| POST | `/api/translate` | auth + rate limit |
| POST | `/api/audio` | auth + rate limit |
| GET POST | `/api/words` | auth |
| PUT DELETE | `/api/words/{id}` | auth |
| GET POST | `/api/categories` | auth |
| PUT DELETE | `/api/categories/{id}` | auth |

O rate limit só cobre as duas rotas que falam com serviços externos. Ver item 6 do
`PITFALLS.md`.

---

## Tradução

`POST /api/translate` recebe um termo e devolve a tradução com o idioma detectado.

1. Tenta o endpoint principal do Google, com `sl=auto&tl=pt`.
2. Se falhar ou vier vazio, tenta o endpoint alternativo.
3. Se o idioma detectado for português, refaz a chamada com `sl=pt&tl=en`.

O passo 3 é o que garante a regra de produto: **o inglês é sempre o termo principal**,
qualquer que seja o idioma digitado.

---

## Áudio

`POST /api/audio` **não gera áudio**: monta a URL do TTS do Google e devolve. Quem
baixa o som é o navegador.

Acima de 200 caracteres a resposta vem com URL vazia, de propósito, e o frontend usa o
`SpeechSynthesis`. Resposta vazia aqui não é erro.

---

## Frontend

Três arquivos em `static/`, sem build:

- `index.html` — a tela inteira, incluindo os modais
- `app.js` — estado, chamadas à API e renderização por `innerHTML`
- `style.css` — o tema sci-fi, complementando o Tailwind do CDN

Mais o `manifest.json` e o `sw.js`, que fazem o app instalável.

O `app.js` mantém estado em variáveis globais no topo do arquivo — lista de palavras,
categorias, filtro ativo, item em edição. Ver item 8 do `PITFALLS.md`.

---

## Deploy

Servidor Go no Render, com as variáveis `DATABASE_URL`, `SUPABASE_URL` e
`SUPABASE_PUBLIC_KEY`. O `PORT` vem do próprio Render.

O `README.md` ainda cita `SUPABASE_JWT_SECRET`, que deixou de ser necessário quando a
validação passou a ser por JWKS. **Está errado e precisa de correção.**

No free tier o serviço hiberna sem tráfego: a primeira requisição depois de um tempo
parado demora, e o mapa do rate limit começa vazio.
````

## docs/Decisions.md

```markdown
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
```

## docs/Pitfalls.md

````markdown
# ⚠️ PITFALLS.md — armadilhas do Grimoire

> Cada item nasceu de algo observado neste repositório. Armadilha corrigida não é
> apagada: recebe a marcação de resolvida, com a data, para o raciocínio continuar
> disponível.
>
> Aberto em 19/09/2026, a partir da leitura completa do código.

---

## 1. RLS ligada não é o mesmo que dado protegido

As tabelas `vocabularies` e `categories` têm `rowsecurity = true` e **nenhuma policy**.
Isso bloqueia o acesso pelo PostgREST — e é por isso que a chave anon exposta em
`/api/config` não é um vazamento hoje.

Mas a proteção real está no `WHERE user_id = $1` de cada handler Go, porque a conexão
usa a `DATABASE_URL` como `postgres`, que **ignora RLS**.

Consequência: um `SELECT` sem filtro devolve o dado de todos os usuários, e nada no
banco impede isso.

Conferência:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('vocabularies', 'categories');

SELECT tablename, policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'public';
```

## 2. `user_id` é `TEXT`, e `auth.uid()` é `uuid`

O schema declara `user_id TEXT`. Qualquer policy que compare com `auth.uid()` precisa
de cast explícito — sem ele o Postgres recusa a comparação e a policy nunca bate.

Consequências que continuam de pé enquanto a coluna for `TEXT`:

- não há FK para `auth.users`, então excluir uma conta deixa vocabulário órfão;
- não há `ON DELETE CASCADE`, e a limpeza teria que ser feita à mão;
- nada impede gravar um `user_id` que não existe.

## 3. `CREATE TABLE IF NOT EXISTS` não altera tabela existente

O schema é criado no `database.InitDB()`, a cada boot. Em banco vazio funciona; em
banco que já tem as tabelas, **toda mudança de coluna é silenciosamente ignorada**.

O sintoma é o pior possível: o código espera uma coluna nova, o boot diz
"Schema e Índices verificados com sucesso", e o erro só aparece no primeiro `INSERT`.

Regra: schema vive em `sql/` versionado, e `InitDB` só conecta.

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

## 6. O rate limit é por IP, e o Render fica atrás de proxy

O `RateLimitAPI` lê o `X-Forwarded-For` e cai no `RemoteAddr` quando ele não existe.
Funciona, com duas ressalvas:

- o mapa de IPs vive em memória e some a cada restart — no free tier, isso acontece a
  cada hibernação;
- vários usuários atrás do mesmo IP dividem a mesma cota.

Limitar por `user_id` em vez de IP seria mais justo, já que as duas rotas são
autenticadas.

## 7. Erro de terceiro devolvido como 500

Os handlers respondem `500` para falha de banco e para falha de API externa. Quando o
Google recusar a tradução, o log dirá "erro interno" e o diagnóstico vai para o lado
errado — foi exatamente esse o custo no AniDeck quando a AniList caiu.

Falha de terceiro é `503`, com o motivo no corpo.

## 8. Estado global no `app.js`

Quatorze variáveis `let` no topo do arquivo guardam desde a lista de palavras até qual
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
painel de logs do Render, com semanas de histórico, não há como filtrar por nível nem
por área.
````

## docs/ROADMAP.md

```markdown
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
```

## cmd/web/main.go

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"grimoire/internal/database"
	"grimoire/internal/handlers"
	"grimoire/internal/middleware"

	"github.com/go-chi/chi/v5"

	"github.com/joho/godotenv"
)

func main() {
	// Carrega as variáveis do arquivo .env localmente (no Render ele vai ignorar e usar as da nuvem)
	godotenv.Load()

	// AÇÃO 1: Voltamos para apenas 3 variáveis. O segredo JWT não é mais necessário.
	varsCriticas := []string{"DATABASE_URL", "SUPABASE_URL", "SUPABASE_PUBLIC_KEY"}
	for _, v := range varsCriticas {
		if os.Getenv(v) == "" {
			fmt.Printf("⛔ ERRO CRÍTICO: Variável de ambiente %s não definida. Servidor abortado.\n", v)
			os.Exit(1)
		}
	}

	fmt.Println("Iniciando Grimoire...")

	err := database.InitDB()
	if err != nil {
		fmt.Printf("Erro crítico na base de dados: %v\n", err)
		return
	}

	// AÇÃO 2: Baixa a chave pública do Supabase antes de liberar o servidor
	if err := middleware.InitJWKS(); err != nil {
		fmt.Printf("Erro crítico ao inicializar JWKS: %v\n", err)
		os.Exit(1)
	}

	r := chi.NewRouter()

	fs := http.FileServer(http.Dir("static"))
	r.Handle("/*", fs)

	r.Get("/api/config", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"supabaseUrl": os.Getenv("SUPABASE_URL"),
			"supabaseKey": os.Getenv("SUPABASE_PUBLIC_KEY"),
		})
	})

	// 🛡️ ROTAS COM BLINDAGEM DUPLA (Autenticação + Rate Limiting)
	// Protege contra flood nas APIs externas (IA e Geração de Áudio)
	r.With(middleware.AuthSupabase, middleware.RateLimitAPI).Post("/api/translate", handlers.TranslateHandler)
	r.With(middleware.AuthSupabase, middleware.RateLimitAPI).Post("/api/audio", handlers.AudioHandler)

	// 🔒 ROTAS COM BLINDAGEM SIMPLES (Apenas Autenticação)
	// Tráfego normal de banco de dados (CRUD)
	r.With(middleware.AuthSupabase).Post("/api/words", handlers.SaveWordHandler)
	r.With(middleware.AuthSupabase).Get("/api/words", handlers.ListWordsHandler)
	r.With(middleware.AuthSupabase).Delete("/api/words/{id}", handlers.DeleteWordHandler)
	r.With(middleware.AuthSupabase).Put("/api/words/{id}", handlers.UpdateWordHandler)

	r.With(middleware.AuthSupabase).Get("/api/categories", handlers.ListCategoriesHandler)
	r.With(middleware.AuthSupabase).Post("/api/categories", handlers.CreateCategoryHandler)

	r.With(middleware.AuthSupabase).Put("/api/categories/{id}", handlers.UpdateCategoryHandler)
	r.With(middleware.AuthSupabase).Delete("/api/categories/{id}", handlers.DeleteCategoryHandler)

	porta := os.Getenv("PORT")
	if porta == "" {
		porta = "8080"
	}

	fmt.Println("Servidor rodando na porta", porta, "...")

	err = http.ListenAndServe(":"+porta, r)
	if err != nil {
		fmt.Println("Erro FATAL NO SERVIDOR:", err)
	}
}
```

