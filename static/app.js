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

async function iniciarApp() {
    const res = await fetch('/api/config');
    const config = await res.json();
    clienteSupabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

    clienteSupabase.auth.onAuthStateChange(async (event, session) => {
        if(session) {
            document.getElementById('tela-login').style.display = 'none'; 
            document.getElementById('tela-app').style.display = 'block';
            await carregarCategorias();
            carregarLista();  
        } else {
            document.getElementById('tela-login').style.display = 'flex'; 
            document.getElementById('tela-app').style.display = 'none';
        }
    });
}
iniciarApp();

async function getHeaders() {
    const { data } = await clienteSupabase.auth.getSession();
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (data.session?.access_token || '') };
}

window.entrarComGoogle = async function() {
    await clienteSupabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } });
}
window.sair = async function() {
    await clienteSupabase.auth.signOut();
    document.getElementById('lista-palavras').innerHTML = ''; 
}

// TRADUÇÃO
function configurarTraducao(idOrigem, idDestino) {
    const campoOrigem = document.getElementById(idOrigem);
    const campoDestino = document.getElementById(idDestino);
    campoOrigem.addEventListener('input', function() {
        clearTimeout(timerDigitacao);
        const termo = this.value.trim();
        ultimoCampoEditado = idOrigem; 
        if (!termo) { campoDestino.value = ''; return; }
        timerDigitacao = setTimeout(async () => {
            if (ultimoCampoEditado !== idOrigem) return;
            try {
                const res = await fetch('/api/translate', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termo }) });
                const dados = await res.json();
                campoDestino.value = dados.translation || "Erro";
                idiomaOrigemAtual = dados.sourceLang || 'en'; 
            } catch (error) {}
        }, 600); 
    });
}
configurarTraducao('novo-termo', 'traducao-automatica');
configurarTraducao('traducao-automatica', 'novo-termo');
configurarTraducao('novo-termo-mobile', 'traducao-mobile');
configurarTraducao('traducao-mobile', 'novo-termo-mobile');
configurarTraducao('edit-termo', 'edit-traducao');
configurarTraducao('edit-traducao', 'edit-termo');

// CATEGORIAS E FILTROS
function obterEstiloCategoria(id) {
    const estilos = [
        { corHex: '#66fcf1', bgTransparente: 'bg-[#66fcf1]/10', texto: 'text-[#66fcf1]' },
        { corHex: '#9d8bff', bgTransparente: 'bg-[#9d8bff]/10', texto: 'text-[#9d8bff]' },
        { corHex: '#f472b6', bgTransparente: 'bg-[#f472b6]/10', texto: 'text-[#f472b6]' },
        { corHex: '#fbbf24', bgTransparente: 'bg-[#fbbf24]/10', texto: 'text-[#fbbf24]' },
        { corHex: '#34d399', bgTransparente: 'bg-[#34d399]/10', texto: 'text-[#34d399]' }
    ];
    return estilos[(id || 0) % estilos.length];
}

async function carregarCategorias(idParaSelecionar = null) {
    const res = await fetch('/api/categories', { method: 'GET', headers: await getHeaders()});
    categoriasAtuais = await res.json(); 
    if (categoriasAtuais.length === 0) {
        await fetch('/api/categories', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ name: 'Geral'}) });
        return carregarCategorias(); 
    }
    renderizarCustomSelect('categoria', 'categoria-text', 'categoria-dropdown', categoriasAtuais, idParaSelecionar);
    renderizarCustomSelect('categoria-mobile', 'categoria-text-mobile', 'categoria-dropdown-mobile', categoriasAtuais, idParaSelecionar);
    renderizarCustomSelect('edit-categoria', 'edit-categoria-text', 'edit-categoria-dropdown', categoriasAtuais, idParaSelecionar);
}

function renderizarCustomSelect(idInput, idText, idDropdown, categorias, idParaSelecionar) {
    const dropdown = document.getElementById(idDropdown);
    const hiddenInput = document.getElementById(idInput);
    const textDisplay = document.getElementById(idText);
    dropdown.innerHTML = '';
    categorias.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'px-4 py-3 text-sm text-gray-300 hover:bg-[#45a29e] hover:text-[#0b0c10] cursor-pointer border-b border-gray-800 last:border-0';
        div.textContent = cat.name;
        div.onclick = () => { hiddenInput.value = cat.id; textDisplay.textContent = cat.name; dropdown.classList.add('hidden'); };
        dropdown.appendChild(div);
    });
    let selected = idParaSelecionar ? categorias.find(c => c.id == idParaSelecionar) : categorias.find(c => c.id == hiddenInput.value) || categorias[0];
    if (selected) { hiddenInput.value = selected.id; textDisplay.textContent = selected.name; }
}

window.toggleDropdown = function(id) {
    document.querySelectorAll('.custom-select-container .absolute').forEach(d => { if (d.id !== id) d.classList.add('hidden'); });
    document.getElementById(id).classList.toggle('hidden');
}

// FUNÇÕES DE CRIAR CATEGORIA (RESTAURADAS)
window.abrirModalCategoria = function() {
    document.getElementById('nova-categoria-nome').value = '';
    document.getElementById('modal-categoria').classList.remove('hidden');
    document.getElementById('modal-categoria').classList.add('flex');
    setTimeout(() => document.getElementById('nova-categoria-nome').focus(), 100);
}

window.fecharModalCategoria = function() {
    document.getElementById('modal-categoria').classList.add('hidden');
    document.getElementById('modal-categoria').classList.remove('flex');
}

window.salvarNovaCategoria = async function() {
    const nome = document.getElementById('nova-categoria-nome').value.trim();
    if (!nome) return;

    const res = await fetch('/api/categories', {
        method: 'POST', 
        headers: await getHeaders(), 
        body: JSON.stringify({ name: nome })
    });
    
    const dados = await res.json();
    await carregarCategorias(dados.id); 
    fecharModalCategoria();
}

function renderizarFiltros() {
    const wrap = document.getElementById('filter-chips');
    const nomesCategorias = ['Todos', ...categoriasAtuais.map(c => c.name)];
    wrap.innerHTML = nomesCategorias.map(nome => {
        const cat = categoriasAtuais.find(c => c.name === nome);
        const estilo = nome === 'Todos' ? { corHex: '#9ca3af', bgTransparente: 'bg-gray-800/40', texto: 'text-gray-400' } : obterEstiloCategoria(cat.id);
        const ativo = filtroAtivo === nome;
        const styleAtivo = ativo ? `background-color: ${estilo.corHex}; color: #000; border-color: transparent;` : `color: ${estilo.corHex}; border-color: rgba(255,255,255,0.1);`;
        return `<button onclick="selecionarFiltro('${nome}')" class="whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${ativo ? 'shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5'}" style="${styleAtivo}">${nome !== 'Todos' ? `<span class="w-1.5 h-1.5 rounded-full" style="background-color: ${ativo ? '#000' : estilo.corHex};"></span>` : ''}${nome}</button>`;
    }).join('');
}

window.selecionarFiltro = function(nome) { filtroAtivo = nome; renderizarFiltros(); aplicarFiltrosEBuscar(); }
window.filtrarLista = function(termo) { termoBuscaAtual = termo.toLowerCase(); aplicarFiltrosEBuscar(); }

// PALAVRAS (Salvar, Listar, Editar)
window.salvarPalavra = async function(origem = 'desktop') {
    const sufixo = origem === 'mobile' ? '-mobile' : '';
    const termo = document.getElementById('novo-termo' + sufixo).value.trim();
    const traducao = document.getElementById('traducao' + (origem === 'mobile' ? '-mobile' : '-automatica')).value.trim();
    const categoriaSelecionadaId = parseInt(document.getElementById('categoria' + sufixo).value);
    
    if (!termo || !traducao) return;

    let termoFinal = termo; let traducaoFinal = traducao; 
    const origemPt = idiomaOrigemAtual.toLowerCase().startsWith('pt');
    if ((ultimoCampoEditado && ultimoCampoEditado.includes('termo') && origemPt) || (ultimoCampoEditado && ultimoCampoEditado.includes('traducao') && !origemPt)) {
        termoFinal = traducao; traducaoFinal = termo;  
    }

    const resAud = await fetch('/api/audio', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termoFinal }) });
    const dadosAud = await resAud.json();

    await fetch('/api/words', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termoFinal, translation: traducaoFinal, audioUrl: dadosAud.audioUrl || "", category_id: categoriaSelecionadaId }) });

    document.getElementById('novo-termo' + sufixo).value = ''; document.getElementById('traducao' + (origem === 'mobile' ? '-mobile' : '-automatica')).value = '';
    if(origem === 'mobile') fecharModalMobile();
    carregarLista();
}

function aplicarFiltrosEBuscar() {
    const lista = document.getElementById('lista-palavras');
    const emptyState = document.getElementById('empty-state');
    lista.innerHTML = '';

    const palavrasFiltradas = ultimaListaPalavras.filter(palavra => {
        let nomeCat = "SEM CATEGORIA";
        if (palavra.category_id) { const cat = categoriasAtuais.find(c => c.id === palavra.category_id); if (cat) nomeCat = cat.name; }
        const passaFiltro = filtroAtivo === 'Todos' || nomeCat === filtroAtivo;
        const passaBusca = !termoBuscaAtual || (palavra.term + " " + palavra.translation).toLowerCase().includes(termoBuscaAtual);
        return passaFiltro && passaBusca;
    });

    document.getElementById('stat-line').textContent = `${palavrasFiltradas.length} REGISTRO${palavrasFiltradas.length !== 1 ? 'S' : ''}`;

    if (palavrasFiltradas.length === 0) { emptyState.classList.remove('hidden'); emptyState.classList.add('flex'); return; }
    emptyState.classList.add('hidden'); emptyState.classList.remove('flex');

    palavrasFiltradas.forEach((palavra, index) => {
        let nomeCategoria = "SEM CATEGORIA";
        if (palavra.category_id) { const cat = categoriasAtuais.find(c => c.id === palavra.category_id); if (cat) nomeCategoria = cat.name; }
        const estilo = obterEstiloCategoria(palavra.category_id);

        lista.innerHTML += `
            <div class="registro-item panel p-5 pl-6 sm:p-6 sm:pl-7 rounded-2xl flex flex-col relative overflow-hidden bg-[#0d131f]/80 hover:bg-[#141b2d] transition-all cursor-pointer group border border-[#1f2937]/50" onclick="this.classList.toggle('revealed')">
                <div class="absolute left-0 top-0 bottom-0 w-1 opacity-80" style="background-color: ${estilo.corHex};"></div>
                <div class="flex justify-between items-start mb-3">
                    <span class="text-[9px] font-bold ${estilo.texto} uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 ${estilo.bgTransparente}">
                        <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${estilo.corHex};"></span>${nomeCategoria}
                    </span>
                    <div class="flex items-center gap-3 text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                        <button onclick="tocarAudio(this, ${index})" class="hover:text-[#66fcf1] p-1"><i class="ph-fill ph-speaker-high text-lg"></i></button>
                        <button onclick="prepararEdicao(${index})" class="hover:text-white p-1"><i class="ph-fill ph-pencil-simple text-lg"></i></button>
                        <button onclick="excluirPalavra(${palavra.id})" class="hover:text-red-400 p-1"><i class="ph-fill ph-trash text-lg"></i></button>
                        <i class="ph ph-caret-down chevron text-sm ml-1 text-gray-400"></i>
                    </div>
                </div>
                <h3 class="text-[17px] sm:text-lg font-semibold text-white leading-relaxed pr-2">${palavra.term || ""}</h3>
                <div class="flashcard-reveal">
                    <div>
                        <div class="h-px w-full bg-[#1f2937] my-4 relative"><div class="absolute left-0 top-0 h-full w-12" style="background: linear-gradient(90deg, ${estilo.corHex}, transparent);"></div></div>
                        <p class="text-sm sm:text-[15px] text-gray-400 leading-relaxed pb-1">${palavra.translation || ""}</p>
                    </div>
                </div>
            </div>`;
    });
}

async function carregarLista() {
    fetch('/api/words', { method: 'GET', headers: await getHeaders() }).then(res => res.json()).then(dados => {
        ultimaListaPalavras = dados; renderizarFiltros(); aplicarFiltrosEBuscar();
    });
}

// RESTANTE DAS FUNÇÕES AUXILIARES E ÁUDIO
window.prepararEdicao = function(index) {
    const palavra = ultimaListaPalavras[index]; palavraEmEdicaoId = palavra.id;
    document.getElementById('edit-termo').value = palavra.term || ""; document.getElementById('edit-traducao').value = palavra.translation || "";
    if (palavra.category_id) {
        const cat = categoriasAtuais.find(c => c.id == palavra.category_id);
        if (cat) { document.getElementById('edit-categoria').value = cat.id; document.getElementById('edit-categoria-text').textContent = cat.name; }
    }
    document.getElementById('modal-edicao').classList.remove('hidden');
}

window.fecharModal = function() { palavraEmEdicaoId = null; document.getElementById('modal-edicao').classList.add('hidden'); }

window.salvarEdicao = async function() {
    if (!palavraEmEdicaoId) return;
    await fetch('/api/words/' + palavraEmEdicaoId, { method: 'PUT', headers: await getHeaders(), body: JSON.stringify({ term: document.getElementById('edit-termo').value, translation: document.getElementById('edit-traducao').value, category_id: parseInt(document.getElementById('edit-categoria').value) }) });
    fecharModal(); carregarLista();
}

window.excluirPalavra = async function(id) { fetch('/api/words/' + id, { method: 'DELETE', headers: await getHeaders() }).then(() => carregarLista()); }

function resetarBotaoAudio() { if (botaoAudioAtual) { botaoAudioAtual.classList.remove('text-[#05070a]'); botaoAudioAtual.classList.add('text-[#66fcf1]'); botaoAudioAtual = null; } }
window.tocarAudio = function(botao, index) {
    const url = ultimaListaPalavras[index].audioUrl || ""; const texto = ultimaListaPalavras[index].term || "";
    if (botaoAudioAtual === botao) { if (audioAtual) audioAtual.pause(); window.speechSynthesis.cancel(); resetarBotaoAudio(); return; }
    if (audioAtual) { audioAtual.pause(); audioAtual.currentTime = 0; } window.speechSynthesis.cancel(); resetarBotaoAudio();
    botaoAudioAtual = botao; botaoAudioAtual.classList.remove('text-[#66fcf1]'); botaoAudioAtual.classList.add('text-[#05070a]');
    if (url && url.startsWith('http')) { audioAtual = new Audio(url); audioAtual.onended = resetarBotaoAudio; audioAtual.play().catch(() => resetarBotaoAudio()); } 
    else { const sintese = new SpeechSynthesisUtterance(texto); sintese.lang = 'en-US'; sintese.onend = resetarBotaoAudio; window.speechSynthesis.speak(sintese); }
}