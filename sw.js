const CACHE_NAME = 'dive-v49';
const APP_SHELL = [
    './',
    './index.html',
    './cadastro.html',
    './promocao.html',
    './style.css',
    './app.js',
    './admin.js',
    './data.js',
    './manifest.json'
];

const EXTERNAL_LIBS = [
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
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('Cache aberto: ' + CACHE_NAME);
            
            // 1. Arquivos locais (Críticos) - Se falhar aqui, cancela a instalação (correto)
            await cache.addAll(APP_SHELL);
            
            // 2. Bibliotecas externas - Tenta cachear, mas NÃO quebra o app se falhar (ex: unpkg fora do ar)
            try {
                await cache.addAll(EXTERNAL_LIBS);
            } catch (error) {
                console.warn('Aviso: Algumas libs externas não puderam ser cacheadas na instalação.', error);
            }
        })
    );
});

// Interceptação de requisições (Offline First)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Estratégia: Stale-While-Revalidate
            // Faz a requisição na rede em segundo plano para atualizar o cache
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    // Só faz cache de requisições bem-sucedidas com esquema http/https
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                });
                return networkResponse;
            }).catch(() => cachedResponse); // Se a rede falhar, cai silenciosamente
            
            // Retorna imediatamente o cache (se existir), ou aguarda a rede
            return cachedResponse || fetchPromise;
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