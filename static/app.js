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
    try {
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
    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }
}

iniciarApp();

async function getHeaders() {
    const { data } = await clienteSupabase.auth.getSession();
    const token = data.session?.access_token || '';
    return { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };
}

window.entrarComGoogle = async function() {
    const { error } = await clienteSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/' } 
    });
    if (error) alert("Erro Google:" + error.message); 
}

window.sair = async function() {
    const { error } = await clienteSupabase.auth.signOut();
    if (!error) document.getElementById('lista-palavras').innerHTML = ''; 
}

// TRADUÇÃO INTELIGENTE
function configurarTraducao(idOrigem, idDestino) {
    const campoOrigem = document.getElementById(idOrigem);
    const campoDestino = document.getElementById(idDestino);

    campoOrigem.addEventListener('input', function() {
        clearTimeout(timerDigitacao);
        const termo = this.value.trim();
        ultimoCampoEditado = idOrigem; 
        
        if (!termo) {
            campoDestino.value = '';
            campoDestino.style.height = 'auto';
            return;
        }

        timerDigitacao = setTimeout(async () => {
            if (ultimoCampoEditado !== idOrigem) return;

            try {
                const res = await fetch('/api/translate', { 
                    method: 'POST', 
                    headers: await getHeaders(), 
                    body: JSON.stringify({ term: termo }) 
                });
                const dados = await res.json();
                
                campoDestino.value = dados.translation || "Erro na decodificação";
                idiomaOrigemAtual = dados.sourceLang || 'en'; 
                
                campoDestino.style.height = 'auto'; 
                campoDestino.style.height = campoDestino.scrollHeight + 'px';
            } catch (error) {}
        }, 600); 
    });
}

configurarTraducao('novo-termo', 'traducao-automatica');
configurarTraducao('traducao-automatica', 'novo-termo');
configurarTraducao('edit-termo', 'edit-traducao');
configurarTraducao('edit-traducao', 'edit-termo');

document.getElementById('novo-termo').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salvarPalavra(); }
});
document.getElementById('traducao-automatica').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salvarPalavra(); }
});

// CATEGORIAS E DROPDOWNS
async function carregarCategorias(idParaSelecionar = null) {
    const res = await fetch('/api/categories', { method: 'GET', headers: await getHeaders()});
    categoriasAtuais = await res.json(); 

    if (categoriasAtuais.length === 0) {
        await fetch('/api/categories', {
            method: 'POST', 
            headers: await getHeaders(), 
            body: JSON.stringify({ name: 'Geral'})
        });
        return carregarCategorias(); 
    }

    renderizarCustomSelect('categoria', 'categoria-text', 'categoria-dropdown', categoriasAtuais, idParaSelecionar);
    renderizarCustomSelect('edit-categoria', 'edit-categoria-text', 'edit-categoria-dropdown', categoriasAtuais, idParaSelecionar);
}

function renderizarCustomSelect(idInput, idText, idDropdown, categorias, idParaSelecionar) {
    const dropdown = document.getElementById(idDropdown);
    const hiddenInput = document.getElementById(idInput);
    const textDisplay = document.getElementById(idText);

    dropdown.innerHTML = '';

    categorias.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'px-4 py-3 text-sm text-gray-300 hover:bg-[#45a29e] hover:text-[#0b0c10] cursor-pointer transition-colors border-b border-gray-800 last:border-0';
        div.textContent = cat.name;
        div.onclick = () => {
            hiddenInput.value = cat.id;
            textDisplay.textContent = cat.name;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(div);
    });

    let selected = null;
    if (idParaSelecionar) {
        selected = categorias.find(c => c.id == idParaSelecionar);
    } else if (hiddenInput.value) { 
        selected = categorias.find(c => c.id == hiddenInput.value);
    }
    
    if (!selected && categorias.length > 0) selected = categorias[0];

    if (selected) {
        hiddenInput.value = selected.id;
        textDisplay.textContent = selected.name;
    }
}

window.toggleDropdown = function(id) {
    document.querySelectorAll('.custom-select-container .absolute').forEach(d => {
        if (d.id !== id) d.classList.add('hidden');
    });
    document.getElementById(id).classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-container')) {
        document.querySelectorAll('.custom-select-container .absolute').forEach(d => d.classList.add('hidden'));
    }
});

window.abrirModalCategoria = function() {
    document.getElementById('nova-categoria-nome').value = '';
    document.getElementById('modal-categoria').classList.remove('hidden');
    setTimeout(() => document.getElementById('nova-categoria-nome').focus(), 100);
}

window.fecharModalCategoria = function() {
    document.getElementById('modal-categoria').classList.add('hidden');
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

// PALAVRAS
window.salvarPalavra = async function() {
    const termo = document.getElementById('novo-termo').value.trim();
    const traducao = document.getElementById('traducao-automatica').value.trim();
    const categoriaSelecionadaId = parseInt(document.getElementById('categoria').value);
    
    if (!termo || !traducao) return;

    let termoFinal = termo; 
    let traducaoFinal = traducao; 

    const origemPt = idiomaOrigemAtual.toLowerCase().startsWith('pt');
    if ((ultimoCampoEditado === 'novo-termo' && origemPt) || (ultimoCampoEditado === 'traducao-automatica' && !origemPt)) {
        termoFinal = traducao; 
        traducaoFinal = termo;  
    }

    const resAud = await fetch('/api/audio', { method: 'POST', headers: await getHeaders(), body: JSON.stringify({ term: termoFinal }) });
    const dadosAud = await resAud.json();
    const audioCorreto = dadosAud.audioUrl || "";

    await fetch('/api/words', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ 
            term: termoFinal, 
            translation: traducaoFinal, 
            audioUrl: audioCorreto,
            category_id: categoriaSelecionadaId
        })
    });

    document.getElementById('novo-termo').value = '';
    document.getElementById('novo-termo').style.height = 'auto';
    document.getElementById('traducao-automatica').value = '';
    document.getElementById('traducao-automatica').style.height = 'auto';
    ultimoCampoEditado = null; 
    
    carregarLista();
}

window.prepararEdicao = function(index) {
    const palavra = ultimaListaPalavras[index];
    palavraEmEdicaoId = palavra.id;
    
    const modal = document.getElementById('modal-edicao');
    const inputTermo = document.getElementById('edit-termo');
    const inputTraducao = document.getElementById('edit-traducao');

    inputTermo.value = palavra.term || "";
    inputTraducao.value = palavra.translation || "";
    ultimoCampoEditado = null; 
    
    const inputCategoria = document.getElementById('edit-categoria');
    const textCategoria = document.getElementById('edit-categoria-text');
    
    if (palavra.category_id) {
        const cat = categoriasAtuais.find(c => c.id == palavra.category_id);
        if (cat) {
            inputCategoria.value = cat.id;
            textCategoria.textContent = cat.name;
        }
    } else if (categoriasAtuais.length > 0) {
        inputCategoria.value = categoriasAtuais[0].id;
        textCategoria.textContent = categoriasAtuais[0].name;
    }

    modal.classList.remove('hidden');
    
    setTimeout(() => {
        inputTermo.style.height = 'auto';
        inputTermo.style.height = inputTermo.scrollHeight + 'px';
        inputTraducao.style.height = 'auto';
        inputTraducao.style.height = inputTraducao.scrollHeight + 'px';
    }, 10);
}

window.fecharModal = function() {
    palavraEmEdicaoId = null;
    document.getElementById('modal-edicao').classList.add('hidden');
}

window.salvarEdicao = async function() {
    if (!palavraEmEdicaoId) return;

    const termo = document.getElementById('edit-termo').value.trim();
    const traducao = document.getElementById('edit-traducao').value.trim();
    const categoriaId = parseInt(document.getElementById('edit-categoria').value);

    if (!termo || !traducao) return;

    await fetch('/api/words/' + palavraEmEdicaoId, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ 
            term: termo, 
            translation: traducao, 
            category_id: categoriaId
        })
    });

    fecharModal();
    carregarLista();
}

// Função para gerar cores consistentes baseadas no ID da categoria
function obterEstiloCategoria(id) {
    const estilos = [
        { text: 'text-[#66fcf1]', bg: 'bg-[#45a29e]/10', border: 'border-[#45a29e]/30', line: 'border-l-[#45a29e]' }, // Teal
        { text: 'text-[#9d8bff]', bg: 'bg-[#9d8bff]/10', border: 'border-[#9d8bff]/30', line: 'border-l-[#9d8bff]' }, // Violet
        { text: 'text-[#f472b6]', bg: 'bg-[#f472b6]/10', border: 'border-[#f472b6]/30', line: 'border-l-[#f472b6]' }, // Pink
        { text: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/10', border: 'border-[#fbbf24]/30', line: 'border-l-[#fbbf24]' }, // Amber
        { text: 'text-[#34d399]', bg: 'bg-[#34d399]/10', border: 'border-[#34d399]/30', line: 'border-l-[#34d399]' }  // Emerald
    ];
    return estilos[(id || 0) % estilos.length];
}

function renderizarFiltros() {
    const wrap = document.getElementById('filter-chips');
    // Adiciona a opção "Todos" + o nome de cada categoria que existe no banco
    const nomesCategorias = ['Todos', ...categoriasAtuais.map(c => c.name)];
    
    wrap.innerHTML = nomesCategorias.map(nome => {
        const cat = categoriasAtuais.find(c => c.name === nome);
        const estilo = nome === 'Todos' ? { corHex: '#9ca3af', bgTransparente: 'bg-gray-800/40', texto: 'text-gray-400' } : obterEstiloCategoria(cat.id);
        const ativo = filtroAtivo === nome;
        
        const styleAtivo = ativo ? `background-color: ${estilo.corHex}; color: #000; border-color: transparent;` : `color: ${estilo.corHex}; border-color: rgba(255,255,255,0.1);`;
        
        return `<button onclick="selecionarFiltro('${nome}')" 
                    class="whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${ativo ? 'shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5'}"
                    style="${styleAtivo}">
                    ${nome !== 'Todos' ? `<span class="w-1.5 h-1.5 rounded-full" style="background-color: ${ativo ? '#000' : estilo.corHex};"></span>` : ''}
                    ${nome}
                </button>`;
    }).join('');
}

window.selecionarFiltro = function(nome) {
    filtroAtivo = nome;
    renderizarFiltros();
    aplicarFiltrosEBuscar();
}

window.filtrarLista = function(termo) {
    termoBuscaAtual = termo.toLowerCase();
    aplicarFiltrosEBuscar();
}

function aplicarFiltrosEBuscar() {
    const lista = document.getElementById('lista-palavras');
    const emptyState = document.getElementById('empty-state');
    lista.innerHTML = '';

    // Cruza a busca em texto com a categoria clicada
    const palavrasFiltradas = ultimaListaPalavras.filter(palavra => {
        let nomeCat = "SEM CATEGORIA";
        if (palavra.category_id) {
            const catEncontrada = categoriasAtuais.find(c => c.id === palavra.category_id);
            if (catEncontrada) nomeCat = catEncontrada.name;
        }

        const passaFiltroCat = filtroAtivo === 'Todos' || nomeCat === filtroAtivo;
        const textoPalavra = (palavra.term + " " + palavra.translation).toLowerCase();
        const passaBusca = !termoBuscaAtual || textoPalavra.includes(termoBuscaAtual);

        return passaFiltroCat && passaBusca;
    });

    // Atualiza o Dashboard Numérico
    document.getElementById('stat-line').textContent = `${palavrasFiltradas.length} REGISTRO${palavrasFiltradas.length !== 1 ? 'S' : ''}`;

    if (palavrasFiltradas.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    }

    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');

    // Desenha as cartas aprovadas nos filtros
    palavrasFiltradas.forEach((palavra, index) => {
        const id = palavra.id;
        let nomeCategoria = "SEM CATEGORIA";
        if (palavra.category_id) {
            const cat = categoriasAtuais.find(c => c.id === palavra.category_id);
            if (cat) nomeCategoria = cat.name;
        }

        const estilo = obterEstiloCategoria(palavra.category_id);

        lista.innerHTML += `
            <div class="registro-item panel p-5 pl-6 sm:p-6 sm:pl-7 rounded-2xl flex flex-col relative overflow-hidden bg-[#0d131f]/80 hover:bg-[#141b2d] transition-all cursor-pointer group shadow-sm hover:shadow-md border border-[#1f2937]/50" onclick="this.classList.toggle('revealed')">
                
                <div class="absolute left-0 top-0 bottom-0 w-1 opacity-80" style="background-color: ${estilo.corHex};"></div>

                <div class="flex justify-between items-start mb-3">
                    <span class="text-[9px] font-bold ${estilo.texto} uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 ${estilo.bgTransparente}">
                        <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${estilo.corHex};"></span>
                        ${nomeCategoria}
                    </span>
                    
                    <div class="flex items-center gap-3 text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                        <button onclick="tocarAudio(this, ${index})" class="hover:text-[#66fcf1] transition-colors p-1" title="Ouvir"><i class="ph-fill ph-speaker-high text-lg"></i></button>
                        <button onclick="prepararEdicao(${index})" class="hover:text-white transition-colors p-1" title="Editar"><i class="ph-fill ph-pencil-simple text-lg"></i></button>
                        <button onclick="excluirPalavra(${id})" class="hover:text-red-400 transition-colors p-1" title="Excluir"><i class="ph-fill ph-trash text-lg"></i></button>
                        <i class="ph ph-caret-down chevron text-sm ml-1 text-gray-400"></i>
                    </div>
                </div>
                
                <h3 class="text-[17px] sm:text-lg font-semibold text-white leading-relaxed pr-2">${palavra.term || ""}</h3>
                
                <div class="flashcard-reveal">
                    <div>
                        <div class="h-px w-full bg-[#1f2937] my-4 relative">
                            <div class="absolute left-0 top-0 h-full w-12" style="background: linear-gradient(90deg, ${estilo.corHex}, transparent);"></div>
                        </div>
                        <p class="text-sm sm:text-[15px] text-gray-400 leading-relaxed pb-1">${palavra.translation || ""}</p>
                    </div>
                </div>
            </div>`;
    });
}

async function carregarLista() {
    fetch('/api/words', { method: 'GET', headers: await getHeaders() })
    .then(res => res.json())
    .then(dados => {
        ultimaListaPalavras = dados;
        renderizarFiltros(); // Monta a barra de chips baseada nas categorias atuais
        aplicarFiltrosEBuscar(); // Processa a tela inicial
    });
}


window.filtrarLista = function(termoBusca) {
    const itens = document.querySelectorAll('.registro-item');
    const busca = termoBusca.toLowerCase();
    
    itens.forEach(item => {
        const texto = item.innerText.toLowerCase();
        item.style.display = texto.includes(busca) ? 'flex' : 'none';
    });
}

function resetarBotaoAudio() {
    if (botaoAudioAtual) {
        botaoAudioAtual.classList.remove('bg-[#66fcf1]', 'text-[#0b0c10]');
        botaoAudioAtual.classList.add('bg-[#0b0c10]', 'text-[#66fcf1]');
        botaoAudioAtual = null;
    }
}

window.tocarAudio = function(botao, index) {
    const palavra = ultimaListaPalavras[index];
    const url = palavra.audioUrl || "";
    const texto = palavra.term || "";
    
    if (botaoAudioAtual === botao) {
        if (audioAtual) audioAtual.pause();
        window.speechSynthesis.cancel(); 
        resetarBotaoAudio(); 
        return; 
    }

    if (audioAtual) {
        audioAtual.pause(); 
        audioAtual.currentTime = 0; 
    }

    window.speechSynthesis.cancel(); 
    resetarBotaoAudio(); 

    botaoAudioAtual = botao;
    botaoAudioAtual.classList.remove('bg-[#0b0c10]', 'text-[#66fcf1]');
    botaoAudioAtual.classList.add('bg-[#66fcf1]', 'text-[#0b0c10]');

    if (texto && texto.length > 150) {
        const sintese = new SpeechSynthesisUtterance(texto);
        sintese.lang = 'en-US'; 
        sintese.onend = resetarBotaoAudio; 
        window.speechSynthesis.speak(sintese);
        return; 
    }

    if (url && url.startsWith('http')) {
        audioAtual = new Audio(url);
        audioAtual.onended = resetarBotaoAudio;
        audioAtual.play().catch(() => {
            alert("Áudio bloqueado pelo navegador"); 
            resetarBotaoAudio();
        }); 
    }
}

window.excluirPalavra = async function(id) {
    fetch('/api/words/' + id, { method: 'DELETE', headers: await getHeaders() }).then(() => carregarLista());
}