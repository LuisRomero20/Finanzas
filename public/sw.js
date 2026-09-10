// FINPER Progressive Web App Service Worker
// Versionado dinámico para forzar actualización inmediata en smartphones y Vercel
const CACHE_NAME = 'finper-cache-v5-' + Date.now();

self.addEventListener('install', (event) => {
  // Activar inmediatamente sin esperar a que se cierren pestañas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        // Eliminar todas las cachés anteriores para asegurar código fresco
        keys.map((k) => caches.delete(k))
      );
    })
  );
  // Reclamar control de todos los clientes (pestañas y PWA en smartphone) inmediatamente
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estrategia Network-First agresiva: siempre consultar primero a la red
self.addEventListener('fetch', (event) => {
  // No intervenir en peticiones que no sean GET ni llamadas a Supabase
  if (event.request.method !== 'GET' || event.request.url.includes('/rest/v1/')) {
    return;
  }

  // version.json y index.html NUNCA deben servirse de caché si la red está disponible
  const isHtmlOrVersion =
    event.request.mode === 'navigate' ||
    event.request.url.includes('version.json') ||
    event.request.url.endsWith('/') ||
    event.request.url.includes('index.html');

  if (isHtmlOrVersion) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          // Si no hay red (modo avión), fallback a caché offline
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Para assets con hash (JS/CSS/SVG), intentar red y cachear
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
