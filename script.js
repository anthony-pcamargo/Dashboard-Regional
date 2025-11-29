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
async function carregarDadosDashboard() {
    const token = checarSessao();
    if (!token) return;

    console.log("Solicitando dados ao n8n...");

    try {
        const response = await fetch(N8N_DATA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'token': token, 
                'periodo': '30'
            })
        });

        if (response.status === 401 || response.status === 403) {
            alert("Sessão expirada. Faça login novamente.");
            throw new Error("Token inválido");
        }

        if (!response.ok) {
            throw new Error("Erro na comunicação com o servidor");
        }

        const data = await response.json();
        console.log("📦 DADOS RECEBIDOS:", data);

        // --- CORREÇÃO AQUI (O SEGREDO DO PRINT) ---
        // O n8n está enviando dentro de um objeto { Rsposta: { ... } }
        // Verificamos se existe data.Rsposta, senão tentamos pegar direto.
        
        let dadosReais = null;

        if (data.Rsposta) {
            // Caso venha { Rsposta: { ... } }
            dadosReais = data.Rsposta;
        } else if (Array.isArray(data) && data[0] && data[0].Rsposta) {
            // Caso venha [ { Rsposta: { ... } } ]
            dadosReais = data[0].Rsposta;
        } else if (Array.isArray(data)) {
            // Caso venha [ { ... } ] direto
            dadosReais = data[0];
        } else {
            // Caso venha { ... } direto
            dadosReais = data;
        }
        // ------------------------------------------
        
        console.log("✅ DADOS PROCESSADOS:", dadosReais); // Para confirmar no console
        renderizarTela(dadosReais);

    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

function renderizarTela(dados) {
    if (!dados) return;

    // 1. CONTRATOS QUITADOS
    const quitados = dados.Contratos_Quitados || {};
    preencherLista('lista-quitados', quitados.Clientes, 'Valor_Bruto');
    
    setText('val-quitados-bruto', quitados.Total_Bruto_Setup);
    setText('val-quitados-repasse', quitados.Total_Repasse_Setup);

    // 2. CLIENTES ATIVOS
    const ativos = dados.Clientes_Ativos || {};
    preencherLista('lista-ativos', ativos.Clientes, 'valor_bruto');

    setText('val-ativos-repasse', ativos.Total_Repasse_Ativos);
    setText('val-ativos-percentual', ativos.Repasse_Percentual || "0%");

    // 3. RESUMO FINANCEIRO
    const comissao = dados.Comissao_Seller || {};

    setText('fin-bruto-setup', quitados.Total_Bruto_Setup);
    setText('fin-repasse-setup', quitados.Total_Repasse_Setup);
    setText('fin-repasse-ativos', ativos.Total_Repasse_Ativos);
    setText('fin-comissao-total', comissao.Total_Comissao_Seller);
}

// Função auxiliar para preencher texto sem quebrar se o ID não existir
function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = formatarValorVindoDoJson(valor);
}

function preencherLista(elementId, arrayDados, chaveValor) {
    const listaEl = document.getElementById(elementId);
    if (!listaEl) return;
    
    listaEl.innerHTML = ''; 

    if (!arrayDados || arrayDados.length === 0) {
        listaEl.innerHTML = '<li style="justify-content:center; color:#999;">Nenhum registro.</li>';
        return;
    }

    arrayDados.forEach(item => {
        const li = document.createElement('li');
        const valorExibir = item[chaveValor] || "R$ 0,00";

        li.innerHTML = `
            <div class="client-info">
                <span class="client-name">${item.Cliente}</span>
            </div>
            <span class="client-val">${valorExibir}</span>
        `;
        listaEl.appendChild(li);
    });
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-quitados')) {
        carregarDadosDashboard();
    }
});
