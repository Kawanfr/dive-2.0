//Configuração Inicial do mapa
//Coodernadas iniciais (Rua Saturnino de Oliveira - ZS)
const initialLat = -23.646184;
const initialLng = -46.732581;
const initialZoom = 15;

const map = L.map('map', {
    zoomControl: false // Vamos reposicionar ou customizar controles depois para mobile
}).setView([initialLat, initialLng], initialZoom);

// --- CONFIGURAÇÃO DE TEMA (DARK/LIGHT) ---
const currentHour = new Date().getHours();
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const isNight = prefersDark || (currentHour >= 18 || currentHour < 6); // Preferência do sistema OU horário

let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let attribution = '&copy; OpenStreetMap contributors';
let tileClassName = '';

if (isNight) {
    // Ativa classe no corpo para mudar a UI (botões, popups)
    document.body.classList.add('dark-mode');
    
    // Muda a cor da barra de status do navegador (mobile)
    document.querySelector('meta[name="theme-color"]').setAttribute('content', '#121212');

    // Aplica filtro CSS para inverter cores (Texto preto vira branco)
    tileClassName = 'dark-mode-tiles';
}

// Adiciona a camada de tiles correta
L.tileLayer(tileUrl, {
    maxZoom: 19,
    attribution: attribution,
    className: tileClassName
}).addTo(map);

// --- DADOS SIMULADOS (MOCK DATA) ---
const mockEstablishments = [
    {
        id: 1,
        name: "Assai Atacadista (João Dias)",
        coords: [-23.646234, -46.729094],
        status: "fire",
        msg: "🛒 Supermercado completo. Perfeito para atacado e varejo",
        color: "red"
    },
    {
        id: 2,
        name: "Carrefour Hipermercado (João Dias)",
        coords: [-23.642270, -46.734588],
        status: "chill",
        msg: "🧊 Mercado rápido para compras do dia a dia.",
        color: "#3498db"
    },
    {
        id: 3,
        name: "Akki Atacadista João Dias",
        coords: [-23.642038, -46.738812],
        status: "live",
        msg: "Perfeito para quem busca variedade e bons preços. Sempre movimentado!",
        color: "#f1c40f"
    },
    {
        id: 4,
        name: "Ayumi Supermercado",
        coords: [-23.649516, -46.733178],
        status: "fire",
        msg: "🔥 Variedade e preços competitivos.",
        color: "red"
    },
    {
        id: 5,
        name: "Atacadão",
        coords: [-23.668816, -46.736381],
        status: "fire",
        msg: "Atacado e varejo com ótimos preços. Sempre cheio!",
        color: "#3498db"
    }
];

// --- INTEGRAÇÃO COM LOCALSTORAGE (ADMIN) ---
// Função que sincroniza os dados a cada X segundos
let isFirstSync = true; // Impede notificações massivas ao abrir o app

function syncData() {
    // Lê o "banco de dados" completo
    const db = JSON.parse(localStorage.getItem('dive-storage') || '{}');
    let hasChanges = false;

    mockEstablishments.forEach(place => {
        // Se existir dados salvos para este ID
        if (db[place.id]) {
            const saved = db[place.id];
            // Verifica se algo mudou antes de atualizar (para não piscar o mapa à toa)
            if (place.status !== saved.status || place.msg !== saved.msg) {
                place.status = saved.status;
                place.msg = saved.msg;
                place.color = saved.color;
                hasChanges = true;
                console.log(`🔄 Sincronizando: ${place.name}`);

                // DISPARA NOTIFICAÇÃO NA BARRA DE TAREFAS
                // Só notifica se NÃO for a primeira carga (abertura do app) e se tiver permissão
                if (!isFirstSync) {
                    if (Notification.permission === 'granted') {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification(`Nova Promoção em ${place.name}!`, {
                                body: saved.msg || "Confira o status atualizado agora.",
                                icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png', // Ícone genérico de mapa
                                vibrate: [200, 100, 200],
                                tag: `promo-${place.id}`, // Substitui notificação anterior do mesmo local
                                data: { url: window.location.href } // Dados para abrir o app ao clicar
                            });
                        });
                    } else {
                        console.warn(`⚠️ Notificação ignorada para ${place.name}. Motivo: Permissão negada ou padrão.`);
                    }
                }
            }
        }
    });

    // Se houve mudança, redesenha o mapa
    if (hasChanges && typeof renderMarkers === 'function') {
        renderMarkers(currentFilter);
        console.log("🗺️ Mapa atualizado com novos dados!");
    }

    // Após a primeira execução, libera as notificações para futuras mudanças
    isFirstSync = false;
}

// Função para gerar ícones dinâmicos
const createIcon = (color, status) => {
    // Define a animação baseada no status
    let animationClass = '';
    let rippleHtml = '';

    if (['fire', 'live'].includes(status)) {
        animationClass = 'anim-pulse'; // Agitado = Pulsa
        // Adiciona a onda apenas para locais agitados
        rippleHtml = `<div class="ripple" style="background-color: ${color}"></div>`;
    } else {
        animationClass = 'anim-float'; // Tranquilo = Flutua
    }

    return L.divIcon({
        className: 'custom-div-icon',
        // Concatena a onda (se houver) com o triângulo do marcador
        html: `${rippleHtml}<div class="${animationClass}" style='width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 24px solid ${color}; filter: drop-shadow(0 0 4px ${color});'></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24] // O ponto de ancoragem é a ponta de baixo do triângulo
    });
};

// --- FUNÇÃO DE PROMOÇÃO (CLIQUE) ---
// Torna a função global para ser acessada pelo HTML do popup
window.showPromo = (id) => {
    console.log(`📢 Solicitando promoção para o ID: ${id}`);
    
    // 1. Busca diretamente do LocalStorage para garantir o dado mais recente
    const db = JSON.parse(localStorage.getItem('dive-storage') || '{}');
    // Usa '==' para garantir que encontre mesmo se id for string "1" e mock for numero 1
    const place = mockEstablishments.find(p => p.id == id);

    // Tenta pedir permissão de notificação aqui também, caso o usuário não tenha dado antes
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    if (!place) return; // Segurança caso o ID não exista

    // 2. Prioridade: Mensagem do Admin > Mensagem do Mock
    let currentMsg = (db[id] && db[id].msg) ? db[id].msg : place.msg;

    // 3. Fallback: Se a mensagem estiver vazia, mostra um texto padrão
    if (!currentMsg || currentMsg.trim() === "") {
        currentMsg = "Nenhuma promoção ativa no momento.";
    }

    // 4. Exibe a notificação
    showToast(`📢 <strong>${place.name}</strong><br>${currentMsg}`);
};

// --- LÓGICA DE RENDERIZAÇÃO E FILTROS ---

// Camada de grupo para gerenciar os marcadores (permite limpar e adicionar facilmente)
const markersLayer = L.markerClusterGroup().addTo(map);

// Variáveis de estado global
let currentFilter = 'all';
let currentSearch = ''; // Armazena o texto da busca
let currentRadius = Infinity; // Raio padrão: Infinito (mostra tudo)
let currentUserPosition = null;

function renderMarkers(filterType) {
    currentFilter = filterType; // Atualiza o filtro atual
    // 1. Limpa os marcadores atuais
    markersLayer.clearLayers();

    // 2. Filtra os dados
    const filteredPlaces = mockEstablishments.filter(place => {
        // Filtro de Categoria (Status)
        let matchStatus = false;
        if (filterType === 'all') matchStatus = true;
        else if (filterType === 'agitado') matchStatus = ['fire', 'live'].includes(place.status);
        else if (filterType === 'tranquilo') matchStatus = place.status === 'chill';
        else matchStatus = place.status === filterType;

        // Filtro de Texto (Nome)
        const matchSearch = place.name.toLowerCase().includes(currentSearch.toLowerCase());

        // Filtro de Distância (Raio)
        let matchDistance = true;
        if (currentRadius !== Infinity && currentUserPosition) {
            const dist = map.distance(currentUserPosition, place.coords);
            matchDistance = dist <= currentRadius;
        }

        // Retorna verdadeiro apenas se passar nos TRÊS filtros
        return matchStatus && matchSearch && matchDistance;
    });

    // 3. Adiciona os novos marcadores
    filteredPlaces.forEach(place => {
        // Cálculo de distância (se tivermos a localização do usuário)
        let distanceHtml = '';
        if (currentUserPosition) {
            const dist = map.distance(currentUserPosition, place.coords);
            distanceHtml = `<div class="popup-distance">📏 ${Math.round(dist)}m de você</div>`;
        }

        // Link para o Google Maps
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.coords[0]},${place.coords[1]}`;

        L.marker(place.coords, {
            icon: createIcon(place.color, place.status),
            title: place.name, // Tooltip nativo ao passar o mouse
            alt: `Marcador no mapa: ${place.name}` // Acessibilidade para leitores de tela
        })
            .addTo(markersLayer) // Adiciona ao grupo, não direto ao mapa
            .bindPopup(`
                <div class="popup-card">
                    <div class="popup-header">${place.name}</div>
                    <div class="popup-body" style="padding-top:0;">
                        ${distanceHtml}
                        <button onclick="window.showPromo(${place.id})" class="popup-btn promo-btn">🎉 Ver Promoções</button>
                        <a href="${googleMapsUrl}" target="_blank" class="popup-btn">🚗 Como Chegar</a>
                    </div>
                </div>
            `);
    });
}

// Renderização inicial
renderMarkers('all');
console.log("DIVE 2.0: Correção de Erros DOM (v11).");

// 1. Executa imediatamente a sincronização (agora que o mapa e markersLayer existem)
syncData();

// 2. Executa a cada 2 segundos (Polling) - Garante que funcione sempre!
setInterval(syncData, 2000);

// Event Listeners para os botões de filtro
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Atualiza visual dos botões
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Aplica o filtro
        renderMarkers(e.target.dataset.filter);
    });
});

// Função utilitária de Debounce para performance
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Event Listener para o campo de busca
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
        currentSearch = e.target.value; // Atualiza o termo de busca
        renderMarkers(currentFilter); // Re-renderiza mantendo o filtro de categoria atual
    }, 300)); // Aguarda 300ms após a última digitação para executar
}

// Event Listener para o filtro de Raio
const radiusFilter = document.getElementById('radius-filter');
if (radiusFilter) {
    radiusFilter.addEventListener('change', (e) => {
        const value = e.target.value;
        currentRadius = value === 'all' ? Infinity : parseInt(value);
        renderMarkers(currentFilter); // Re-renderiza com o novo raio
    });
}

// --- SISTEMA DE NOTIFICAÇÕES ---
const notifiedIds = new Set(); // Armazena IDs já notificados para não repetir

// Lógica do Botão de Notificação
const notifBtn = document.getElementById('notif-btn');

function checkNotificationPermission() {
    if (!('Notification' in window)) {
        console.log("Este navegador não suporta notificações.");
        return;
    }

    // Se a permissão for 'default' (ainda não perguntou) ou 'denied', mostra o botão
    if (Notification.permission === 'default' || Notification.permission === 'denied') {
        notifBtn.classList.remove('hidden');
    } else {
        notifBtn.classList.add('hidden'); // Já tem permissão, esconde o botão
    }
}

// Evento de clique no botão de sino
notifBtn.addEventListener('click', () => {
    // Se já estiver explicitamente bloqueado, o navegador não deixa pedir de novo.
    // Precisamos avisar o usuário para mudar manualmente.
    if (Notification.permission === 'denied') {
        alert("⚠️ As notificações estão BLOQUEADAS pelo navegador.\n\nPara corrigir:\n1. Clique no ícone de cadeado 🔒 ou configurações ao lado da URL.\n2. Vá em 'Permissões' ou 'Configurações do Site'.\n3. Em 'Notificações', mude para 'Permitir' ou 'Redefinir'.\n4. Recarregue a página.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            showToast("✅ Notificações ativadas com sucesso!");
            notifBtn.classList.add('hidden'); // Esconde o botão após aceitar
            
            // TESTE IMEDIATO: Envia uma notificação para provar que funciona
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('Teste do DIVE 2.0', {
                        body: 'Se você está vendo isso, as promoções vão chegar! 🚀',
                        icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
                        vibrate: [200, 100, 200]
                    });
                });
            }
        } else {
            alert("Você bloqueou as notificações. Para ativar, acesse as configurações do navegador (ícone de cadeado na URL).");
        }
    });
});

// Verifica ao carregar a página
checkNotificationPermission();

// Função para focar no local e abrir o popup
function focusOnPlace(place) {
    // Itera sobre os marcadores para encontrar o correto
    markersLayer.eachLayer((layer) => {
        const latLng = layer.getLatLng();
        // Compara as coordenadas para achar o marcador certo
        if (latLng.lat === place.coords[0] && latLng.lng === place.coords[1]) {
            // Usa o método do cluster para dar zoom e abrir, mesmo se estiver agrupado
            markersLayer.zoomToShowLayer(layer, () => {
                layer.openPopup();
            });
        }
    });
}

// Função para mostrar notificação visual (Toast)
function showToast(message, onClick) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error("Erro: Elemento 'toast-container' não encontrado no HTML.");
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Adiciona interatividade se houver ação de clique
    if (onClick) {
        toast.style.cursor = 'pointer';
        toast.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') { // Ignora clique no botão X
                onClick();
                toast.remove();
            }
        };
    }

    toast.innerHTML = `<span>${message}</span> <button onclick="event.stopPropagation(); this.parentElement.remove()" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;">&times;</button>`;
    
    container.appendChild(toast);

    // Remove automaticamente após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 5000);
}

function checkProximity(userPos) {
    mockEstablishments.forEach(place => {
        const dist = map.distance(userPos, place.coords);
        
        // LOG DE DEBUG: Mostra a distância de TODOS os locais no console
        console.log(`Distância para ${place.name}: ${Math.round(dist)}m`);

        // RAIO DE ALERTA: 1500m (1.5km)
        // Definido alto para garantir que seu teste de 1km funcione agora
        if (dist <= 1500 && !notifiedIds.has(place.id)) {
            
            const title = `📍 Você está perto: ${place.name}`;
            const body = `Apenas ${Math.round(dist)}m de distância! ${place.msg}`;

            // Ação ao clicar na notificação
            const handleClick = () => focusOnPlace(place);

            // 1. Tenta Notificação Visual (Sempre funciona)
            showToast(title, handleClick);

            // Se tiver permissão, envia notificação nativa
            if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        body: body,
                        icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
                        vibrate: [200, 100, 200], // Padrão de vibração: Toca, Pausa, Toca
                        tag: 'dive-proximity' // Evita que acumule muitas notificações iguais
                    });
                });
            } else {
                // Fallback: Alerta visual simples se notificação for bloqueada
                console.log("Notificação de proximidade:", title);
            }
            
            notifiedIds.add(place.id); // Marca como notificado
        }
    });
}

// --- GEOLOCALIZAÇÃO ATIVA ---
let userMarker = null;
let isFirstLocation = true;

// Verifica se o ambiente é seguro (HTTPS ou Localhost)
if (!window.isSecureContext) {
    alert("⚠️ Atenção: O GPS só funciona em sites HTTPS ou Localhost.");
}

if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            currentUserPosition = [latitude, longitude]; // Salva para cálculos

            // Verifica se tem algo perto a cada atualização de GPS
            checkProximity(currentUserPosition);

            // Atualiza ou cria o marcador do usuário
            if (!userMarker) {
                // Ícone diferente para o usuário (Bolinha azul estilo Google Maps)
                const userIcon = L.divIcon({
                    className: 'user-icon',
                    html: `<div style="background-color:#4285F4; width:18px; height:18px; border-radius:50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                userMarker = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
                userMarker.bindPopup(`<b>Você está aqui</b><br>Precisão: ${Math.round(accuracy)}m`);
            } else {
                userMarker.setLatLng([latitude, longitude]);
                userMarker.setPopupContent(`<b>Você está aqui</b><br>Precisão: ${Math.round(accuracy)}m`);
            }

            // Centraliza o mapa no usuário apenas na primeira captura
            if (isFirstLocation) {
                map.setView([latitude, longitude], 16);
                isFirstLocation = false;
                // Re-renderiza os marcadores para mostrar as distâncias agora que temos GPS
                renderMarkers(currentFilter);
            }
            // Verifica se precisa esconder o botão sempre que a posição muda
            updateCenterButton();
        },
        (error) => {
            console.error('Erro de Geolocalização:', error);
            if (error.code === 1) {
                alert("Permissão de GPS negada. Por favor, permita o acesso nas configurações do navegador.");
            } else {
                // Não spamar alerta em erros de timeout, apenas logar
                console.warn('Tentando reconectar GPS...');
            }
        },
        {
            enableHighAccuracy: true, // VOLTANDO: True é necessário para muitos Androids
            maximumAge: 0, // Não aceita cache velho, queremos a posição real agora
            timeout: 20000 // 20 segundos para tentar achar
        }
    );
}

// --- CONTROLES DE UI ---
const centerBtn = document.getElementById('center-btn');

centerBtn.addEventListener('click', () => {
    if (userMarker) {
        map.setView(userMarker.getLatLng(), 16);
    } else {
        // Se não tiver localização, o botão força uma nova tentativa manual
        alert('Tentando forçar o GPS...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // Sucesso manual
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 16);
                alert("Localização encontrada manualmente!");
            },
            (err) => {
                alert("Erro ao forçar GPS: " + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
});

// Função para esconder o botão se o mapa já estiver centralizado no usuário
function updateCenterButton() {
    if (!currentUserPosition) return;

    const mapCenter = map.getCenter();
    const dist = map.distance(mapCenter, currentUserPosition);

    // Se a distância for menor que 50 metros, esconde o botão
    if (dist < 50) centerBtn.classList.add('hidden');
    else centerBtn.classList.remove('hidden');
}

// Ouve o movimento do mapa para mostrar/esconder o botão
map.on('move moveend zoomend', updateCenterButton);

// Registro do service worker (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.error('Erro ao registrar o Service Worker:', error);
            });
    });
}
