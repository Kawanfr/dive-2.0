const CACHE_NAME = 'dive-v50';
const APP_SHELL = [
    './',
    './index.html',
    './cadastro.html',
    './promocao.html',
    './style.css',
    './app.js',
    './map.js',
    './gps.js',
    './database.js',
    './notifications.js',
    './firebase-config.js',
    './admin.js',
    './manifest.json'
];

const EXTERNAL_LIBS = [
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(APP_SHELL);
            try {
                await cache.addAll(EXTERNAL_LIBS);
            } catch (error) {
                console.warn('Algumas libs externas não puderam ser cacheadas.', error);
            }
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Estratégia específica para os Map Tiles (Cache First)
    // Mantém as áreas do mapa visualizadas cacheadas agressivamente para offline.
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                
                return fetch(event.request).then((networkResponse) => {
                    return caches.open('map-tiles-cache').then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // 2. Ignora requisições de WebSocket e Firestore
    // Evita loop no SWR bloqueando dados vitais
    if (url.hostname.includes('firebase') || url.hostname.includes('firestore') || url.protocol === 'ws:' || url.protocol === 'wss:') {
        return; 
    }

    // 3. Estratégia Padrão (Stale-While-Revalidate)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                });
                return networkResponse;
            }).catch(() => cachedResponse); 
            
            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); 
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME && name !== 'map-tiles-cache').map((name) => caches.delete(name))
            );
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const baseUrl = new URL('./', self.location.origin).href;
            const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : baseUrl;

            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});

// Listener Preparatório para Push Nativo (Para rodar requer VAPID Keys FCM)
self.addEventListener('push', (event) => {
    let payload = { title: "DIVE Promo", body: "Novidades perto de você!" };
    if (event.data) {
        try {
            payload = event.data.json();
        } catch(e) {
            payload.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
            data: { url: payload.url || '/' }
        })
    );
});