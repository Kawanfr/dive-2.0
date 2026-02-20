//Configuração Inicial do mapa
//Coodernadas iniciais (ex: Av. Paulista, SP) - Depois mudaremos para o GPS do usuário
const initialLat = -23.561684;
const initialLng = -46.655981;
const initialZoom = 15;

const map = L.map('map', {
    zoomControl: false // Vamos reposicionar ou customizar controles depois para mobile
}).setView([initialLat, initialLng], initialZoom);

// --- CONFIGURAÇÃO DE TEMA (DARK/LIGHT) ---
const currentHour = new Date().getHours();
const isNight = currentHour >= 18 || currentHour < 6; // Noite entre 18h e 06h

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
        name: "Bar do Code",
        coords: [-23.561684, -46.655981],
        status: "fire", // fire = cheio/agitado
        msg: "🔥 Lotação Alta! Promoção de Gin rolando.",
        color: "red"
    },
    {
        id: 2,
        name: "Café Debug",
        coords: [-23.563500, -46.654000],
        status: "chill", // chill = tranquilo
        msg: "🧊 Ambiente tranquilo. Ótimo para conversar.",
        color: "#3498db" // Azul
    },
    {
        id: 3,
        name: "Pub do Commit",
        coords: [-23.560000, -46.658000],
        status: "live", // live = música ao vivo
        msg: "🎸 Banda de Rock tocando agora!",
        color: "#f1c40f" // Amarelo
    },
    {
        id: 4,
        name: "Livraria do Front-end",
        coords: [-23.559500, -46.660000], // Perto da Consolação
        status: "chill",
        msg: "📚 Leitura e café. Wi-Fi ultra rápido.",
        color: "#3498db"
    },
    {
        id: 5,
        name: "Balada Fullstack",
        coords: [-23.567000, -46.649000], // Perto do Shopping Cidade SP
        status: "fire",
        msg: "🔥 DJ Python tocando as melhores!",
        color: "red"
    },
    {
        id: 6,
        name: "Jazz & Java",
        coords: [-23.562000, -46.653000], // Perto do MASP
        status: "live",
        msg: "🎷 Saxofone ao vivo e café gourmet.",
        color: "#f1c40f"
    },
    {
        id: 7,
        name: "Terraço da Nuvem",
        coords: [-23.558000, -46.656000], // Rua Augusta
        status: "fire",
        msg: "🍸 Rooftop com vista incrível e drinks.",
        color: "red"
    },
    {
        id: 8,
        name: "Bar do Largo",
        coords: [-23.566300, -46.693800], // Largo da Batata
        status: "fire",
        msg: "🔥 Happy Hour bombando no Largo!",
        color: "red"
    },
    {
        id: 9,
        name: "Beco das Artes",
        coords: [-23.556800, -46.686500], // Beco do Batman
        status: "live",
        msg: "🎨 Arte de rua e música acústica.",
        color: "#f1c40f"
    },
    {
        id: 10,
        name: "Cantina Pinheiros",
        coords: [-23.568000, -46.685000], // Rua dos Pinheiros
        status: "chill",
        msg: "🍝 Massas artesanais e vinho.",
        color: "#3498db"
    },
    {
        id: 11,
        name: "Mercadão Gourmet",
        coords: [-23.565500, -46.694500], // Mercado de Pinheiros
        status: "chill",
        msg: "🧊 Produtos frescos e ceviche.",
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

        // Retorna verdadeiro apenas se passar nos DOIS filtros
        return matchStatus && matchSearch;
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

        L.marker(place.coords, { icon: createIcon(place.color, place.status) })
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

// Event Listener para o campo de busca
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value; // Atualiza o termo de busca
        renderMarkers(currentFilter); // Re-renderiza mantendo o filtro de categoria atual
    });
}

// --- GEOLOCALIZAÇÃO ATIVA ---
let userMarker = null;
let isFirstLocation = true;

if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            currentUserPosition = [latitude, longitude]; // Salva para cálculos

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
            // O mapa permanece na posição inicial (fallback) se der erro ou permissão negada
        },
        {
            enableHighAccuracy: true, // Tenta usar GPS para maior precisão
            maximumAge: 0,
            timeout: 10000
        }
    );
}

// --- CONTROLES DE UI ---
const centerBtn = document.getElementById('center-btn');

centerBtn.addEventListener('click', () => {
    if (userMarker) {
        map.setView(userMarker.getLatLng(), 16);
    } else {
        alert('Aguardando localização GPS...');
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
