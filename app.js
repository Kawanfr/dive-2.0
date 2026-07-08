import { initializeDB, subscribeToEstablishments, globalEstablishments } from './database.js';
import { initMap, renderMarkers, setCurrentFilter, setCurrentSearch, setCurrentRadius, map, focusOnPlace, currentFilter, markersLayer } from './map.js';
import { initGPS, centerOnUser, currentUserPosition } from './gps.js';
import { showToast, triggerPushNotification, checkNotificationPermission } from './notifications.js';
import { initPwaInstaller } from './pwa-installer.js';

console.log("DIVE 2.0: Main Bootloader Iniciado (Modulo Escalonado).");

// --- CONSTANTES DE CONFIGURAÇÃO ---
const PROXIMITY_ALERT_DISTANCE_METERS = 1500; // Distância para notificar que o usuário está perto
const FIRE_STATUS_OFFER_THRESHOLD = 5;       // Nº de ofertas para um local ser "🔥 Agitado"
const SEARCH_DEBOUNCE_MS = 300;              // Tempo de espera para executar a busca após digitação
const SANITIZER_INTERVAL_MS = 60000;         // Intervalo para limpar ofertas expiradas da UI

// 1. Inicializa dependências simples (Mapa estático e Verificador de Permissões)
initMap('map');
checkNotificationPermission();
initPwaInstaller();

// Export fallback window feature in case any HTML tries to use old logic
window.showPromo = (id) => {
    const place = globalEstablishments.find(p => p.id == id);
    if (!place) return;
    showToast(`📢 <strong>${place.name}</strong><br>Abra o pino para conferir os achados da comunidade.`);
};

// HELPER: Processa os estabelecimentos, calculando status e filtrando ofertas expiradas.
function processEstablishments() {
    return globalEstablishments.map(p => {
        // Se a loja antiga não tiver o vetor, inicializamos
        let validOffers = [];
        if (p.offers) {
            validOffers = p.offers.filter(o => o.expiresAt > Date.now());
        }
        
        let newStatus = 'chill';
        let newColor = '#3498db';
        
        if (validOffers.length >= FIRE_STATUS_OFFER_THRESHOLD) { 
            newStatus = 'fire'; 
            newColor = 'red'; 
        } else if (validOffers.length > 0) { 
            newStatus = 'live'; 
            newColor = '#f39c12';
        }

        // Assina a nova estrutura visual
        return { ...p, status: newStatus, color: newColor, offers: validOffers };
    });
}

// HELPER: Função centralizada para redesenhar os marcadores no mapa.
function refreshMapMarkers() {
    const processedEstablishments = processEstablishments();
    renderMarkers(processedEstablishments, currentUserPosition);
    return processedEstablishments; // Retorna os dados processados para quem precisar
}

// 2. Tenta iniciar / semear a NUVEM
initializeDB(() => {
    
    // 3. Em seguida, começa a ouvir as transações em tempo real do DB Local
    subscribeToEstablishments(
        // Callback para pintar interface (onUpdated)
        () => refreshMapMarkers(),

        // Callback de Push Nativo (Quando alguem do outro lado enviar alerta Waze e chegar para a gente via WS)
        (place) => {
            const valid = (place.offers || []).filter(o => o.expiresAt > Date.now());
            if (valid.length >= FIRE_STATUS_OFFER_THRESHOLD) {
                // Notifica pesadamente se bombou muito
                triggerPushNotification(`🔥 BOMBARDIER Waze: ${place.name}!`, `A comunidade acabou de encontrar muitas ofertas lá, corra!`);
            }
        }
    );
});

// 4. Inicia Monitorador Logístico GPS (Escuta constante ligada junto com Renderizacao)
initGPS(map, 
    // Quando a lat/lng alterar
    () => refreshMapMarkers(),
    // Quando um mercado bater com a distância e ainda nao foi notificado
    (userPos, notifiedSet) => {
        processEstablishments().forEach(place => {
            if (place.status === 'chill') return; // Nao alerta proximidade de lojas frias de promoçao
            const dist = map.distance(userPos, place.coords);
            if (dist <= PROXIMITY_ALERT_DISTANCE_METERS && !notifiedSet.has(place.id)) {
                
                const title = `📍 Você está perto: ${place.name}`;
                showToast(title, () => focusOnPlace(place.coords));
                
                triggerPushNotification(title, `Apenas ${Math.round(dist)}m. Abra para ver as ofertas!`);
                notifiedSet.add(place.id);
            }
        });
    }
);

// --- CONECTA O HTML (BOTÕES) COM OS MÓDULOS ---

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        setCurrentFilter(e.target.dataset.filter);
        refreshMapMarkers();
    });
});

// Busca (Debounced)
let searchTimeout;
document.getElementById('search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const val = e.target.value;
        setCurrentSearch(val);
        refreshMapMarkers();
        
        // Auto-foco inteligente: Se o usuário buscar o nome de uma loja, voa até ela
        if (val.trim().length >= 2 && markersLayer) {
            const bounds = markersLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            }
        }
    }, SEARCH_DEBOUNCE_MS);
});

// Distância
document.getElementById('radius-filter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    setCurrentRadius(val === 'all' ? Infinity : parseInt(val));
    refreshMapMarkers();
});

// Relógio Saneador (Limpa promoções visuais em tempo real na tela mesmo se o usuário não mexer)
let lastProcessedDataString = '';
setInterval(() => {
    const processedData = processEstablishments();
    const currentDataString = JSON.stringify(processedData.map(p => ({ id: p.id, offers: p.offers.length })));

    // Só redesenha o mapa se o número de ofertas válidas mudou (expirou alguma)
    if (currentDataString !== lastProcessedDataString) {
        console.log("Sanitizer: Ofertas expiradas detectadas. Atualizando a interface.");
        renderMarkers(processedData, currentUserPosition);
        lastProcessedDataString = currentDataString;
    }
}, SANITIZER_INTERVAL_MS);

// Centralizar GPS
const centerBtn = document.getElementById('center-btn');
centerBtn?.addEventListener('click', () => centerOnUser(map));

map.on('move moveend zoomend', () => {
    if (!currentUserPosition) return;
    const dist = map.distance(map.getCenter(), currentUserPosition);
    if (dist < 50) centerBtn?.classList.add('hidden');
    else centerBtn?.classList.remove('hidden');
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
            console.log('SW Carregado no escopo:', reg.scope);
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }).catch(e => console.error("SW Erro:", e));
    });
}
