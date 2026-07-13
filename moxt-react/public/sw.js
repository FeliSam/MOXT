const CACHE_NAME = '__MOXT_CACHE_NAME__';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
];

function canCacheRequest(request) {
  const url = new URL(request.url);
  // Ignore extensions Chrome, data:, blob:, etc.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return url.origin === self.location.origin;
}

function cacheResponse(request, response) {
  if (!canCacheRequest(request)) return;
  if (!response || response.status !== 200 || response.type === 'opaque') return;
  const clone = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

function isNavigation(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isHashedAsset(url) {
  return /\/assets\/[^/]+-[A-Za-z0-9_-]{4,}\.(js|css)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!canCacheRequest(request) && !url.hostname.includes('supabase')) return;

  // Supabase : réseau seulement (pas de cache — évite les erreurs cross-origin)
  if (url.hostname.includes('supabase')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Fichiers de version / shell : toujours réseau (mises à jour silencieuses)
  if (
    url.pathname === '/version.json' ||
    url.pathname === '/deploy-manifest.json' ||
    url.pathname === '/sw.js' ||
    url.pathname === '/theme-init.js'
  ) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // HTML : réseau en premier → toujours la dernière version du site
  if (isNavigation(request) || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          cacheResponse(request, response);
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets Vite hashés : cache OK (immuables)
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          cacheResponse(request, response);
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        cacheResponse(request, response);
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'MOXT', body: '', data: {} }
  try {
    data = event.data ? event.data.json() : data
  } catch {
    data.body = event.data?.text?.() || ''
  }

  const payload = data.data || {}
  const targetPath = payload.url || payload.path || '/notifications'

  event.waitUntil(
    self.registration.showNotification(data.title || 'MOXT', {
      body: data.body || '',
      icon: '/icon-192.png?v=20260714',
      badge: '/icon-192.png?v=20260714',
      data: {
        ...payload,
        url: targetPath,
        path: targetPath,
      },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawPath = event.notification.data?.url || event.notification.data?.path || '/notifications';
  const targetUrl = new URL(rawPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'MOXT_NOTIFICATION_NAVIGATE', path: rawPath });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
