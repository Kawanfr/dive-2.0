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
        name: "Assai Atacadista (João Dias",
        coords: [-23.646234, -46.729094],
        status: "fire",
        msg: "🛒 Supermercado completo. Perfeito para atacado e varejo",
        color: "red"
    },
    {
        id: 2,
        name: "Carrefour Hipermercado (João Dias",
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
        name: "Atacadão ",
        coords: [-23.668816, -46.736381],
        status: "fire",
        msg: "Atacado e varejo com ótimos preços. Sempre cheio!",
        color: "#3498db"
    }
];

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
                    <div class="popup-body">${place.msg}</div>
                    <div class="popup-body" style="padding-top:0;">
                        ${distanceHtml}
                        <a href="${googleMapsUrl}" target="_blank" class="popup-btn">🚗 Como Chegar</a>
                    </div>
                </div>
            `);
    });
}

// Renderização inicial
renderMarkers('all');
console.log("DIVE 2.0: Correção de Erros DOM (v11).");

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

// Solicita permissão no primeiro clique do usuário na página
document.body.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}, { once: true });

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
            if (Notification.permission === 'granted') {
                const notif = new Notification(title, { body: body, icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png' });
                
                // Torna a notificação nativa clicável
                notif.onclick = () => {
                    window.focus(); // Traz a janela do navegador para frente
                    handleClick();
                    notif.close();
                };
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
            alert('Erro ao obter localização: ' + error.message); // Alerta visual para debug
            // O mapa permanece na posição inicial (fallback) se der erro ou permissão negada
        },
        {
            enableHighAccuracy: false, // MUDANÇA: False usa WiFi/Torres (muito mais rápido e compatível)
            maximumAge: 30000, // Aceita posição cacheada de 30s
            timeout: 30000 // Aumenta o tempo de espera para 30s (antes era 10s)
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
            { enableHighAccuracy: false, timeout: 10000 }
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
