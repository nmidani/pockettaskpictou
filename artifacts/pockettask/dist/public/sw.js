const CACHE_NAME = 'pockettask-v3';

// Only pre-cache genuinely static files (no JS/CSS — they have hashed names and don't need pre-caching)
const STATIC_ASSETS = [
  '/favicon.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete ALL old caches so stale index.html / stale assets are never served
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response('{"error":"Offline"}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Network-first for HTML navigation — ensures fresh index.html on every deploy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/') || fetch(request))
    );
    return;
  }

  // Cache-first for hashed JS/CSS/image assets (safe because filenames change on each build)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
