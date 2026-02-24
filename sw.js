const CACHE_NAME = 'dive-v19';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './cadastro.html',
    './style.css',
    './app.js',
    './admin.js',
    './manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js'
];

// Instalação do Service Worker e Cache dos arquivos estáticos
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força o SW a ativar imediatamente, sem esperar
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Interceptação de requisições (Offline First)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retorna do cache se encontrar, senão busca na rede
                return response || fetch(event.request);
            })
    );
});

// Atualização do Service Worker (Limpeza de caches antigos)
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); // Assume o controle de todas as abas abertas imediatamente
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
});

// Evento de clique na notificação (Barra de Status)
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Fecha a notificação ao clicar

    // Tenta focar na janela do app se ela já estiver aberta, ou abre uma nova
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('index.html') || client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});