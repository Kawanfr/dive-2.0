export let currentUserPosition = null;
let userMarker = null;
let isFirstLocation = true;
const notifiedIds = new Set();
let mapRef = null;
let lastProcessedCoords = null; // Variável para o Debounce de distância

export function initGPS(mapInstance, onLocationUpdate, onProximityAlert) {
    if (!window.isSecureContext) console.warn("GPS requer HTTPS/Localhost.");
    mapRef = mapInstance;
    
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const newCoords = [latitude, longitude];
                
                // Trava de Otimização: Ignora recálculos se andou menos de 20 metros
                if (lastProcessedCoords && !isFirstLocation) {
                    const moveDistance = mapInstance.distance(lastProcessedCoords, newCoords);
                    if (moveDistance < 20) {
                        return; // O usuário quase não se moveu. Poupa a bateria.
                    }
                }
                lastProcessedCoords = newCoords;
                
                currentUserPosition = newCoords;
                
                if (onProximityAlert) onProximityAlert(currentUserPosition, notifiedIds);
                
                if (!userMarker) {
                    const userIcon = L.divIcon({
                        className: 'user-icon',
                        html: `<div style="background-color:#4285F4; width:18px; height:18px; border-radius:50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });
                    userMarker = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance);
                } else {
                    userMarker.setLatLng([latitude, longitude]);
                }
                userMarker.bindPopup(`<b>Você está aqui</b><br>Precisão: ${Math.round(accuracy)}m`);
                
                if (isFirstLocation) {
                    mapInstance.setView([latitude, longitude], 16);
                    isFirstLocation = false;
                }
                
                if(onLocationUpdate) onLocationUpdate();
            },
            (err) => {
                 if (err.code === 1) alert("Permissão de GPS negada.");
                 else if (err.code !== 3) console.warn("GPS Error:", err);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
    }
}

export function centerOnUser(mapInstance) {
    if (userMarker) {
        mapInstance.setView(userMarker.getLatLng(), 16);
    } else {
        alert("Forçando localização...");
        navigator.geolocation.getCurrentPosition(
            (pos) => mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 16),
            (err) => alert("Erro ao forçar GPS: " + err.message),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
}
