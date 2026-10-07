import { getSafeHttpUrl } from './database.js';

export let map;
export let markersLayer;
export let currentFilter = 'all';
export let currentSearch = '';
export let currentRadius = Infinity;

let selectedPlaceId = null;
let currentPlaces = [];
let currentUserPosition = null;

export function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function initMap(elementId = 'map') {
    const initialLat = -23.646184;
    const initialLng = -46.732581;
    const initialZoom = 15;
    
    map = L.map(elementId, { 
        zoomControl: false,
        maxZoom: 19 
    }).setView([initialLat, initialLng], initialZoom);
    
    applyTheme(); // Aplica layers TILE (fundo) primeiro
    markersLayer = L.markerClusterGroup().addTo(map); // Depois adiciona agrupador

    document.getElementById('place-panel-close')?.addEventListener('click', closePlacePanel);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePlacePanel();
    });
}

export function setCurrentFilter(f) { currentFilter = f; }
export function setCurrentSearch(s) { currentSearch = s; }
export function setCurrentRadius(r) { currentRadius = r; }

// --- THEME ---
let isNight = false;
let tileLayer = null;

export function applyTheme() {
    const currentHour = new Date().getHours();
    const mediaQueryDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    isNight = (mediaQueryDark && mediaQueryDark.matches) || (currentHour >= 18 || currentHour < 6);
    
    const themeMeta = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
    themeMeta.name = "theme-color";
    
    let tileClassName = '';
    if (isNight) {
        document.body.classList.add('dark-mode');
        themeMeta.setAttribute('content', '#121212');
        tileClassName = 'dark-mode-tiles';
    } else {
        document.body.classList.remove('dark-mode');
        themeMeta.setAttribute('content', '#ffffff');
        tileClassName = '';
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
        document.head.appendChild(themeMeta);
    }

    if(tileLayer) map.removeLayer(tileLayer);
    
    tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        className: tileClassName
    }).addTo(map);
}

if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

function createIcon(color, status, iconUrl, offerCount) {
    const safeColor = /^#[\da-f]{3,8}$/i.test(color) || ['red', 'blue', 'orange'].includes(color)
        ? color
        : '#3498db';
    let animationClass = '';
    let rippleHtml = '';
    if (['fire', 'live'].includes(status)) {
        animationClass = 'anim-pulse'; 
        rippleHtml = `<div class="ripple" style="background-color: ${safeColor}"></div>`;
    } else {
        animationClass = 'anim-float'; 
    }
    const safeIconUrl = getSafeHttpUrl(iconUrl);
    const offerBadge = offerCount > 0
        ? `<span class="marker-offer-count" aria-label="${offerCount} promoções">${offerCount > 99 ? '99+' : offerCount}</span>`
        : '';
    if (safeIconUrl) {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `${rippleHtml}<div class="marker-icon-wrap"><div class="${animationClass} marker-pin" style="background-color: ${safeColor};"><img src="${escapeHTML(safeIconUrl)}" alt="" /></div>${offerBadge}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 42]
        });
    }
    return L.divIcon({
        className: 'custom-div-icon',
        html: `${rippleHtml}<div class="marker-icon-wrap marker-triangle-wrap"><div class="${animationClass}" style='width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 24px solid ${safeColor}; filter: drop-shadow(0 0 4px ${safeColor});'></div>${offerBadge}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 36]
    });
}

function getTodaySchedule(schedule = {}) {
    const day = new Date().getDay();
    const values = schedule.all ||
        (day === 0 ? (schedule.sunday || schedule.sun) :
            day === 6 ? (schedule.saturday || schedule.sat) :
                (schedule.weekdays || schedule.week));
    if (!Array.isArray(values) || values.length < 2) return null;
    const [opens, closes] = values;
    if (!Number.isFinite(opens) || !Number.isFinite(closes) || (opens === 0 && closes === 0)) return null;
    return [opens, closes];
}

function renderPlacePanel(place) {
    const panel = document.getElementById('place-panel');
    const content = document.getElementById('place-panel-content');
    if (!panel || !content || !place) return;

    const name = escapeHTML(place.name);
    const offers = (place.offers || []).filter(offer => offer.expiresAt > Date.now());
    const schedule = getTodaySchedule(place.schedule);
    let openStatus = 'Horário não informado';
    let openClass = 'unknown';
    if (schedule) {
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        const isOpen = minutesNow >= schedule[0] * 60 && minutesNow < schedule[1] * 60;
        openStatus = isOpen ? 'Aberta agora' : 'Fechada agora';
        openClass = isOpen ? 'open' : 'closed';
    }

    const hours = place.hours
        ? `<p class="place-panel-hours">${escapeHTML(String(place.hours).replace(/^🕒\s*/, ''))}</p>`
        : '';
    const websiteUrl = getSafeHttpUrl(place.website);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.coords[0]},${place.coords[1]}`;
    const distance = currentUserPosition && place.coords
        ? `<span class="place-panel-distance">📍 ${Math.round(map.distance(currentUserPosition, place.coords))} m de você</span>`
        : '<span class="place-panel-distance">📍 Ative a localização para ver a distância</span>';

    const offersContent = offers.length
        ? `<div class="place-offers-list">${offers.map(offer => {
            const imageUrl = getSafeHttpUrl(offer.image || offer.photo);
            const image = imageUrl
                ? `<img class="place-offer-image" src="${escapeHTML(imageUrl)}" alt="" loading="lazy">`
                : '';
            return `<article class="place-offer">${image}<div class="place-offer-copy"><strong>${escapeHTML(offer.product)}</strong><span>${escapeHTML(offer.price)}</span></div></article>`;
        }).join('')}</div>`
        : '<p class="place-no-offers">Nenhuma promoção ativa no momento.</p>';

    content.innerHTML = `
        <div class="place-panel-heading">
            <div>
                <h2>${name}</h2>
                <span class="place-open-status ${openClass}">${openStatus}</span>
            </div>
            ${distance}
        </div>
        ${hours}
        <div class="place-offers-heading"><h3>Promoções ativas</h3><span>${offers.length}</span></div>
        ${offersContent}
        <div class="place-panel-actions">
            <a class="place-panel-more" href="promocao.html?id=${encodeURIComponent(String(place.id))}">Ver detalhes e contribuir</a>
            <a class="place-panel-route" href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">Como chegar</a>
            ${websiteUrl ? `<a class="place-panel-route" href="${escapeHTML(websiteUrl)}" target="_blank" rel="noopener noreferrer">Site da loja</a>` : ''}
        </div>
    `;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
}

export function closePlacePanel() {
    selectedPlaceId = null;
    const panel = document.getElementById('place-panel');
    panel?.classList.remove('is-open');
    panel?.setAttribute('aria-hidden', 'true');
}

function openPlacePanel(place) {
    selectedPlaceId = String(place.id);
    renderPlacePanel(place);
}

export function focusOnPlace(placeCoords) {
    markersLayer.eachLayer((layer) => {
        const latLng = layer.getLatLng();
        if (latLng.lat === placeCoords[0] && latLng.lng === placeCoords[1]) {
            markersLayer.zoomToShowLayer(layer, () => {
                const place = currentPlaces.find(item => item.coords?.[0] === latLng.lat && item.coords?.[1] === latLng.lng);
                if (place) openPlacePanel(place);
            });
        }
    });
}

export function renderMarkers(places, userPos) {
    if(!markersLayer) return;
    currentPlaces = places;
    currentUserPosition = userPos;
    markersLayer.clearLayers();
    
    const filteredPlaces = places.filter(place => {
        if (currentFilter === 'promocoes' && !(place.offers || []).some(offer => offer.expiresAt > Date.now())) return false;
        let matchStatus = currentFilter === 'all' || 
            currentFilter === 'promocoes' ||
            (currentFilter === 'agitado' && ['fire', 'live'].includes(place.status)) ||
            (currentFilter === 'tranquilo' && place.status === 'chill') ||
            (place.status === currentFilter);
            
        const matchSearch = (place.name || "").toLowerCase().includes(currentSearch.toLowerCase());
        let matchDistance = true;
        if (currentRadius !== Infinity && userPos && place.coords) {
            const dist = map.distance(userPos, place.coords);
            matchDistance = dist <= currentRadius;
        }
        return matchStatus && matchSearch && matchDistance;
    });

    filteredPlaces.forEach(place => {
        if(!place.coords) return;
        
        // --- BLINDAGEM CROSS-SITE SCRIPTING (XSS) ---
        const marker = L.marker(place.coords, {
            icon: createIcon(place.color, place.status, place.icon, (place.offers || []).filter(offer => offer.expiresAt > Date.now()).length),
            title: place.name
        }).addTo(markersLayer);
        marker.on('click', () => openPlacePanel(place));
    });

    const selectedPlace = places.find(place => String(place.id) === selectedPlaceId);
    if (selectedPlace && filteredPlaces.some(place => String(place.id) === selectedPlaceId)) {
        renderPlacePanel(selectedPlace);
    } else if (selectedPlaceId) {
        closePlacePanel();
    }
}
