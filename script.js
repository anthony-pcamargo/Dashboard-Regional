// --- CONFIGURAÇÃO DAS APIs (N8N) ---
const N8N_AUTH_URL = "https://primary-production-f8d8.up.railway.app/webhook/login"; 
const N8N_DATA_URL = "https://primary-production-f8d8.up.railway.app/webhook/rel-financeiro-reg"; 

// --- FUNÇÕES UTILITÁRIAS ---
const formatarValorVindoDoJson = (valor) => {
    if (!valor) return "R$ 0,00";
    return valor;
};

// --- GERENCIAMENTO DE SESSÃO ---
function logout() {
    console.warn("Sessão encerrada.");
    localStorage.removeItem("jwt_token");
    window.location.href = "login.html";
}

function checarSessao() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        logout();
        return null;
    }
    return token;
}

// --- MENU PROFILE (UI) ---
function toggleMenu() {
    const dropdown = document.getElementById("userDropdown");
    const badge = document.querySelector(".regional-badge");
    dropdown.classList.toggle("show");
    badge.classList.toggle("active");
}

window.onclick = function(event) {
    if (!event.target.closest('.user-menu-container')) {
        const dropdown = document.getElementById("userDropdown");
        const badge = document.querySelector(".regional-badge");
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            badge.classList.remove('active');
        }
    }
}

// --- LÓGICA DO DASHBOARD (CARREGAMENTO) ---
async function carregarDadosDashboard(periodo = 30) {
    const token = checarSessao();
    if (!token) return;

    console.log(`Solicitando dados (${periodo} dias)...`);

    try {
        const response = await fetch(N8N_DATA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'token': token, 
                'periodo': periodo
            })
        });

        if (response.status === 401 || response.status === 403) {
            alert("Sessão expirada. Faça login novamente.");
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro na comunicação com o servidor");
        }

        const data = await response.json();
        console.log("📦 DADOS RECEBIDOS:", data);

        // Se vier como array, pega primeiro elemento
        let dadosReais = Array.isArray(data) ? data[0] : data;
        
        console.log("✅ DADOS PROCESSADOS:", dadosReais);
        renderizarTela(dadosReais);

    } catch (error) {
        console.error("Erro ao carregar:", error);
        alert("Erro ao carregar dados. Tente novamente.");
    }
}

function renderizarTela(dados) {
    if (!dados) return;

    // 0. MOSTRAR REGIONAL
    const nomeRegional = dados.Regional || "Minha Regional";
    const badgeEl = document.querySelector(".regional-badge span");
    if (badgeEl) badgeEl.innerText = nomeRegional;

    // 1. CONTRATOS QUITADOS (com comissão)
    preencherListaQuitados('lista-quitados', dados.Contratos_Quitados);
    
    const totaisQuitados = dados.Totais_Contratos_Quitados || {};
    setText('val-quitados-bruto', totaisQuitados.Total_Bruto_Setup);
    setText('val-quitados-repasse', totaisQuitados.Total_Repasse_Setup);
    setText('val-quitados-comissao', dados.Comissao_Seller_Total);

    // 2. CLIENTES ATIVOS (✅ agora detalhados, sem comissão)
    preencherListaAtivos('lista-ativos', dados.Clientes_Ativos);
    
    const totaisAtivos = dados.Totais_Clientes_Ativos || {};
    setText('val-ativos-bruto', totaisAtivos.Total_Bruto_Ativos); // ✅ NOVO
    setText('val-ativos-repasse', totaisAtivos.Total_Repasse_Ativos);
    setText('val-ativos-percentual', totaisAtivos.Percentual_Medio);
}

// Função auxiliar para preencher texto
function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = formatarValorVindoDoJson(valor);
}

// ✅ FUNÇÃO - Lista de Quitados COM comissão
function preencherListaQuitados(elementId, arrayDados) {
    const listaEl = document.getElementById(elementId);
    if (!listaEl) return;
    
    listaEl.innerHTML = ''; 

    if (!arrayDados || arrayDados.length === 0) {
        listaEl.innerHTML = '<li style="justify-content:center; color:#999;">Nenhum registro.</li>';
        return;
    }

    arrayDados.forEach(item => {
        const li = document.createElement('li');
        
        li.innerHTML = `
            <div class="client-info">
                <span class="client-name">${item.Cliente}</span>
                <div class="client-details">
                    <span class="detail-item">
                        <i class="fas fa-dollar-sign"></i> Bruto: ${item.Valor_Bruto}
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-hand-holding-usd"></i> Repasse: ${item.Valor_Repasse}
                    </span>
                    <span class="detail-item comissao">
                        <i class="fas fa-coins"></i> Comissão Seller: ${item.Comissao_Seller}
                    </span>
                </div>
            </div>
        `;
        listaEl.appendChild(li);
    });
}

// ✅ NOVA FUNÇÃO - Lista de Ativos DETALHADA (sem comissão)
function preencherListaAtivos(elementId, arrayDados) {
    const listaEl = document.getElementById(elementId);
    if (!listaEl) return;
    
    listaEl.innerHTML = ''; 

    if (!arrayDados || arrayDados.length === 0) {
        listaEl.innerHTML = '<li style="justify-content:center; color:#999;">Nenhum registro.</li>';
        return;
    }

    arrayDados.forEach(item => {
        const li = document.createElement('li');
        
        li.innerHTML = `
            <div class="client-info">
                <div class="client-header">
                    <span class="client-name">${item.Cliente}</span>
                    <span class="client-type-badge">${item.Cliente_tipo}</span>
                </div>
                <div class="client-details">
                    <span class="detail-item">
                        <i class="fas fa-dollar-sign"></i> Bruto: ${item.Valor_Bruto}
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-hand-holding-usd"></i> Repasse: ${item.Valor_Repasse}
                    </span>
                    <span class="detail-item percentual">
                        <i class="fas fa-percentage"></i> ${item.Percentual_Individual}
                    </span>
                </div>
            </div>
        `;
        listaEl.appendChild(li);
    });
}

// --- FILTRO DE PERÍODO
function aplicarFiltroPeriodo(dias) {
    // Atualizar UI do botão ativo
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Recarregar dados
    carregarDadosDashboard(dias);
}

// --- LÓGICA DE LOGIN ---
async function realizarLogin(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    const btn = document.querySelector('.btn-login');
    const errorMsg = document.getElementById('login-error');

    errorMsg.style.display = 'none';

    if (!usuario || !senha) {
        errorMsg.innerText = "Informe usuário e senha.";
        errorMsg.style.display = 'block';
        return;
    }

    const textoOriginal = btn.innerText;
    btn.innerText = 'Validando...';
    btn.disabled = true;

    try {
        const response = await fetch(N8N_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem('jwt_token', data.token);
            window.location.href = "index.html"; 
        } else {
            throw new Error(data.message || "Dados incorretos");
        }
    } catch (error) {
        errorMsg.innerText = "Usuário ou senha inválidos.";
        errorMsg.style.display = 'block';
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

// ✅ PROTEÇÃO DE ROTA
document.addEventListener('DOMContentLoaded', () => {
    const paginaAtual = window.location.pathname;
    const token = localStorage.getItem('jwt_token');
    
    // Se está no dashboard sem token
    if (paginaAtual.includes('index.html') && !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Se está no login com token
    if (paginaAtual.includes('login.html') && token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Carregar dashboard se estiver na página certa
    if (document.getElementById('lista-quitados')) {
        carregarDadosDashboard();
    }
});