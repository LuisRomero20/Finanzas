// FINPER Progressive Web App Service Worker — v2.0.3
// Versionado dinámico para forzar actualización inmediata en smartphones y Vercel
const CACHE_NAME = 'finper-cache-v203-' + Date.now();

self.addEventListener('install', () => {
  // Activar inmediatamente sin esperar a que se cierren pestañas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        // Eliminar absolutamente todas las cachés anteriores para erradicar bundles obsoletos
        keys.map((k) => caches.delete(k))
      );
    })
  );
  // Reclamar control de todos los clientes (pestañas y PWA en iPhone / PC) inmediatamente
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// Estrategia Network-First agresiva: siempre consultar primero a la red
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Bloqueo explícito de peticiones al dominio obsoleto (elsjuyjjkrkyhlylmaip)
  if (url.includes('elsjuyjjkrkyhlylmaip')) {
    event.respondWith(
      new Response(JSON.stringify({ error: 'Proyecto Supabase obsoleto bloqueado. Proyecto activo: njgzhjwfcxdxiibkuuqg' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    return;
  }

  // NUNCA INTERVENIR en:
  // 1. Peticiones que no sean GET
  // 2. Cualquier llamada a Supabase (*.supabase.co, /auth/, /rest/, /storage/)
  // 3. Cualquier endpoint de API local (/api/)
  // 4. WebSocket o esquemas no http/https
  if (
    event.request.method !== 'GET' ||
    url.includes('supabase.co') ||
    url.includes('/rest/v1/') ||
    url.includes('/auth/v1/') ||
    url.includes('/storage/v1/') ||
    url.includes('/api/') ||
    !url.startsWith('http')
  ) {
    return;
  }

  // version.json y index.html NUNCA deben servirse de caché si la red está disponible
  const isHtmlOrVersion =
    event.request.mode === 'navigate' ||
    url.includes('version.json') ||
    url.endsWith('/') ||
    url.includes('index.html');

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
