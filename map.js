export let map;
export let markersLayer;
export let currentFilter = 'all';
export let currentSearch = '';
export let currentRadius = Infinity;

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

function createIcon(color, status, iconUrl) {
    let animationClass = '';
    let rippleHtml = '';
    if (['fire', 'live'].includes(status)) {
        animationClass = 'anim-pulse'; 
        rippleHtml = `<div class="ripple" style="background-color: ${color}"></div>`;
    } else {
        animationClass = 'anim-float'; 
    }
    if (iconUrl) {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `${rippleHtml}<div class="${animationClass} marker-pin" style="background-color: ${color};"><img src="${iconUrl}" alt="Logo" /></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 42]
        });
    }
    return L.divIcon({
        className: 'custom-div-icon',
        html: `${rippleHtml}<div class="${animationClass}" style='width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 24px solid ${color}; filter: drop-shadow(0 0 4px ${color});'></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });
}

export function focusOnPlace(placeCoords) {
    markersLayer.eachLayer((layer) => {
        const latLng = layer.getLatLng();
        if (latLng.lat === placeCoords[0] && latLng.lng === placeCoords[1]) {
            markersLayer.zoomToShowLayer(layer, () => layer.openPopup());
        }
    });
}

export function renderMarkers(places, userPos) {
    if(!markersLayer) return;
    markersLayer.clearLayers();
    
    const filteredPlaces = places.filter(place => {
        let matchStatus = currentFilter === 'all' || 
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
        let distanceHtml = '';
        if (userPos) {
            const dist = map.distance(userPos, place.coords);
            distanceHtml = `<div class="popup-distance distance-display" data-lat="${place.coords[0]}" data-lng="${place.coords[1]}">📏 ${Math.round(dist)}m de você</div>`;
        }
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.coords[0]},${place.coords[1]}`;

        L.marker(place.coords, {
            icon: createIcon(place.color, place.status, place.icon),
            title: place.name
        }).addTo(markersLayer).bindPopup(`
            <div class="popup-card">
                <div class="popup-header">
                    <div style="padding-right: 60px;">${place.name}</div>
                    ${place.website ? `<a href="${place.website}" target="_blank" class="popup-website-link" style="font-size: 12px; color: #a2d9ff;">🌐 ${place.name.split(' ')[0]}</a>` : ''}
                </div>
                <div class="popup-body" style="padding-top:0;">
                    ${distanceHtml}
                    <a href="promocao.html?id=${place.id}" class="popup-btn promo-btn">🎉 Ver Ofertas</a>
                    <a href="${googleMapsUrl}" target="_blank" class="popup-btn">🚗 Como Chegar</a>
                </div>
            </div>
        `);
    });
}
