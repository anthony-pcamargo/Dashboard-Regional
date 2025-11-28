// --- CONFIGURAÇÃO ---
// COLOQUE AQUI A URL DO SEU WEBHOOK DO N8N (Method: POST)
const N8N_WEBHOOK_URL = "https://primary-production-f8d8.up.railway.app/webhook-test/login"; 

// --- BANCO DE DADOS SIMULADO (DADOS DO DASHBOARD) ---
const dadosDashboard = {
    contratosQuitados: [
        { nome: "Academia Fitness Plus", valor: 5000, data: "2023-10-01" },
        { nome: "Padaria do João", valor: 3200, data: "2023-10-05" },
        { nome: "Clínica Sorriso", valor: 7500, data: "2023-10-12" },
        { nome: "Burger King Diadema", valor: 12000, data: "2023-11-01" },
        { nome: "Farmácia Vida", valor: 3500, data: "2023-11-03" },
        { nome: "Oficina do Pedro", valor: 2800, data: "2023-11-10" },
        { nome: "Supermercado Extra", valor: 15000, data: "2023-11-25" }
    ],
    clientesAtivos: [
        { nome: "Lava Rápido Jet", valor: 1500, data: "2023-09-10" },
        { nome: "Mercado Central", valor: 8900, data: "2023-09-15" },
        { nome: "Restaurante Sabor", valor: 5200, data: "2023-10-18" },
        { nome: "Doceria da Ana", valor: 2300, data: "2023-11-01" },
        { nome: "Loja de Roupas Style", valor: 4100, data: "2023-11-05" },
        { nome: "Auto Peças Brasil", valor: 6700, data: "2023-11-12" }
    ],
    despesas: [
        { descricao: "Aluguel", valor: 2000, data: "2023-10-05" },
        { descricao: "Energia", valor: 500, data: "2023-10-10" },
        { descricao: "Marketing", valor: 1500, data: "2023-10-15" },
        { descricao: "Aluguel", valor: 2000, data: "2023-11-05" },
        { descricao: "Energia", valor: 600, data: "2023-11-10" }, 
        { descricao: "Sistema", valor: 300, data: "2023-11-12" }, 
        { descricao: "Comissão Vendas", valor: 5000, data: "2023-11-20" }
    ]
};

// --- FUNÇÕES UTILITÁRIAS ---
const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarDataExibicao = (dataISO) => {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function itemNoPeriodo(dataItemStr) {
    const inicioInput = document.getElementById('global-inicio').value;
    const fimInput = document.getElementById('global-fim').value;

    if (!inicioInput && !fimInput) return true;

    const dataItem = new Date(dataItemStr);
    const dataInicio = inicioInput ? new Date(inicioInput) : new Date('2000-01-01');
    const dataFim = fimInput ? new Date(fimInput) : new Date('2099-12-31');
    
    dataItem.setHours(0,0,0,0);
    dataInicio.setHours(0,0,0,0);
    dataFim.setHours(0,0,0,0);

    return dataItem >= dataInicio && dataItem <= dataFim;
}

// --- MENU PROFILE ---
function toggleMenu() {
    const dropdown = document.getElementById("userDropdown");
    const badge = document.querySelector(".regional-badge");
    dropdown.classList.toggle("show");
    badge.classList.toggle("active");
}

function logout() {
    // Remove o token e redireciona
    localStorage.removeItem("jwt_token");
    window.location.href = "login.html";
}

// Fecha o menu se clicar fora
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


// --- RENDERIZAÇÃO DO DASHBOARD ---
function renderizarDashboard() {
    renderizarQuitados();
    renderizarAtivos();
    renderizarFechamento();
}

function renderizarQuitados() {
    const listaEl = document.getElementById('lista-quitados');
    if(!listaEl) return; 

    listaEl.innerHTML = ''; 
    const filtrados = dadosDashboard.contratosQuitados.filter(item => itemNoPeriodo(item.data));
    let total = 0;

    if(filtrados.length === 0) {
        listaEl.innerHTML = '<li style="justify-content:center; color:#999;">Nenhum registro.</li>';
    } else {
        filtrados.forEach(cliente => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="client-info">
                    <span class="client-name">${cliente.nome}</span>
                    <span class="client-date">${formatarDataExibicao(cliente.data)}</span>
                </div>
                <span class="client-val">${formatarMoeda(cliente.valor)}</span>
            `;
            listaEl.appendChild(li);
            total += cliente.valor;
        });
    }

    const totalEl = document.getElementById('total-quitados');
    const setupEl = document.getElementById('setup-quitados');
    if(totalEl) totalEl.innerText = formatarMoeda(total);
    if(setupEl) setupEl.innerText = formatarMoeda(total * 0.40);
}

function renderizarAtivos() {
    const listaEl = document.getElementById('lista-ativos');
    if(!listaEl) return;

    listaEl.innerHTML = '';
    const filtrados = dadosDashboard.clientesAtivos.filter(item => itemNoPeriodo(item.data));
    let total = 0;

    if(filtrados.length === 0) {
        listaEl.innerHTML = '<li style="justify-content:center; color:#999;">Nenhum registro.</li>';
    } else {
        filtrados.forEach(cliente => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="client-info">
                    <span class="client-name">${cliente.nome}</span>
                    <span class="client-date">${formatarDataExibicao(cliente.data)}</span>
                </div>
                <span class="client-val">${formatarMoeda(cliente.valor)}</span>
            `;
            listaEl.appendChild(li);
            total += cliente.valor;
        });
    }

    const totalEl = document.getElementById('total-ativos');
    const setupEl = document.getElementById('setup-ativos');
    if(totalEl) totalEl.innerText = formatarMoeda(total);
    if(setupEl) setupEl.innerText = formatarMoeda(total * 0.30);
}

function renderizarFechamento() {
    if(!document.getElementById('fin-quitados')) return;

    const totalQuitados = dadosDashboard.contratosQuitados.filter(i => itemNoPeriodo(i.data)).reduce((acc, curr) => acc + curr.valor, 0);
    const totalCarteira = dadosDashboard.clientesAtivos.filter(i => itemNoPeriodo(i.data)).reduce((acc, curr) => acc + curr.valor, 0);
    const totalDespesas = dadosDashboard.despesas.filter(i => itemNoPeriodo(i.data)).reduce((acc, curr) => acc + curr.valor, 0);
    
    // Regras de Negócio
    const totalEntradas = totalQuitados + totalCarteira;
    const totalBruto = totalEntradas;
    const pontoEquilibrio = 30000;

    document.getElementById('fin-quitados').innerText = formatarMoeda(totalQuitados);
    document.getElementById('fin-entradas').innerText = formatarMoeda(totalEntradas); 
    document.getElementById('fin-carteira').innerText = formatarMoeda(totalCarteira);
    document.getElementById('fin-bruto').innerText = formatarMoeda(totalBruto);
    document.getElementById('fin-ponto').innerText = formatarMoeda(pontoEquilibrio);
    document.getElementById('fin-pagar').innerText = formatarMoeda(totalDespesas); 
}

function limparFiltros() {
    document.getElementById('global-inicio').value = '';
    document.getElementById('global-fim').value = '';
    renderizarDashboard();
}

// --- FUNÇÃO DE LOGIN COM WEBHOOK N8N ---
async function realizarLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btn = document.querySelector('.btn-login');
    const errorMsg = document.getElementById('login-error');

    // Reseta estado visual
    errorMsg.style.display = 'none';

    if(!email || !senha) {
        errorMsg.innerText = "Por favor, preencha todos os campos.";
        errorMsg.style.display = 'block';
        return;
    }

    // UI de Carregamento
    const textoOriginal = btn.innerText;
    btn.innerText = 'Autenticando...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: senha
            })
        });

        // Tenta fazer o parse do JSON
        const data = await response.json();

        // LÓGICA: O n8n deve retornar um JSON com a propriedade "token" em caso de sucesso
        if (response.ok && data.token) {
            // Sucesso: Salva Token e Redireciona
            localStorage.setItem('jwt_token', data.token);
            window.location.href = "index.html"; 
        } else {
            // Erro de credenciais (ou erro retornado pelo n8n)
            throw new Error(data.message || "Usuário ou senha inválidos.");
        }

    } catch (error) {
        console.error("Erro no login:", error);
        errorMsg.innerText = "Usuário ou senha inválidos. Tente novamente.";
        errorMsg.style.display = 'block';
        
        // Restaura botão
        btn.innerText = textoOriginal;
        btn.style.opacity = '1';
        btn.disabled = false;
    }
}

// --- INICIALIZAÇÃO E SEGURANÇA ---
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se estamos na página de dashboard
    const isDashboard = document.getElementById('lista-quitados');

    if (isDashboard) {
        // SEGURANÇA: Se não tiver token, manda pro login
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            window.location.href = "login.html";
            return; // Para execução
        }

        renderizarDashboard();
        // Event Listeners do Dashboard
        document.getElementById('global-inicio').addEventListener('change', renderizarDashboard);
        document.getElementById('global-fim').addEventListener('change', renderizarDashboard);
    } else {
        // Estamos na tela de login, verificar se já tem token (opcional: auto-login)
        // const token = localStorage.getItem('jwt_token');
        // if(token) window.location.href = "index.html";
    }
});
