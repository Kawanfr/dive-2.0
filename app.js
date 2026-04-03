import { initializeDB, subscribeToEstablishments, globalEstablishments } from './database.js';
import { initMap, renderMarkers, setCurrentFilter, setCurrentSearch, setCurrentRadius, map, focusOnPlace, currentFilter } from './map.js';
import { initGPS, centerOnUser, currentUserPosition } from './gps.js';
import { showToast, triggerPushNotification, checkNotificationPermission } from './notifications.js';

console.log("DIVE 2.0: Main Bootloader Iniciado (Modulo Escalonado).");

// 1. Inicializa dependências simples (Mapa estático e Verificador de Permissões)
initMap('map');
checkNotificationPermission();

// Export fallback window feature in case any HTML tries to use old logic
window.showPromo = (id) => {
    const place = globalEstablishments.find(p => p.id == id);
    if (!place) return;
    showToast(`📢 <strong>${place.name}</strong><br>${place.msg || "Nenhuma promoção."}`);
};

// 2. Tenta iniciar / semear a NUVEM
initializeDB(() => {
    
    // 3. Em seguida, começa a ouvir as transações do WebSocket do Firebase
    subscribeToEstablishments(
        // Callback para pintar interface
        (payload) => {
            renderMarkers(payload, currentUserPosition);
        },
        // Callback de Push Nativo (Quando alguem do outro lado editar e chegar para a gente via WS)
        (place) => {
            triggerPushNotification(`Nova Oferta em ${place.name}!`, place.msg || "Confira o status!");
        }
    );
});

// 4. Inicia Monitorador Logístico GPS (Escuta constante ligada junto com Renderizacao)
initGPS(map, 
    // Quando a lat/lng alterar
    () => { renderMarkers(globalEstablishments, currentUserPosition); },
    // Quando um mercado bater com a distância e ainda nao foi notificado
    (userPos, notifiedSet) => {
        globalEstablishments.forEach(place => {
            const dist = map.distance(userPos, place.coords);
            if (dist <= 1500 && !notifiedSet.has(place.id)) {
                
                const title = `📍 Você está perto: ${place.name}`;
                showToast(title, () => focusOnPlace(place.coords));
                
                triggerPushNotification(title, `Apenas ${Math.round(dist)}m. ${place.msg || ""}`);
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
        renderMarkers(globalEstablishments, currentUserPosition);
    });
});

// Busca (Debounced)
let searchTimeout;
document.getElementById('search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        setCurrentSearch(e.target.value);
        renderMarkers(globalEstablishments, currentUserPosition);
    }, 300);
});

// Distância
document.getElementById('radius-filter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    setCurrentRadius(val === 'all' ? Infinity : parseInt(val));
    renderMarkers(globalEstablishments, currentUserPosition);
});

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
