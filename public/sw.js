const CACHE_NAME = 'finper-cache-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => caches.delete(k)) // Limpiar cachés anteriores para recibir la última versión
      );
    })
  );
  self.clients.claim();
});

// Network-First para asegurar que siempre se cargue la versión más reciente de GitHub/Netlify
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o que vayan a Supabase
  if (event.request.method !== 'GET' || event.request.url.includes('/rest/v1/')) {
    return;
  }

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
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/') || caches.match('/index.html');
          }
        });
      })
  );
});
