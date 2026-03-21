// AHA Finance — Service Worker
// Provides offline support & caches app assets

const CACHE_NAME = 'aha-finance-v1';
const STATIC_CACHE = 'aha-static-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap'
];

// ─── Install ───────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Pre-caching app shell');
      // Cache what we can; don't fail install if fonts are unavailable offline
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => cache.add(url).catch(() => null))
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch Strategy ────────────────────────────
// App shell (HTML) → Cache-first then network fallback
// Google Fonts    → Stale-while-revalidate
// Everything else → Network-first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and Chrome extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // App HTML shell — always serve from cache (offline-first)
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Google Fonts — stale-while-revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Icons / manifest — cache first
  if (url.pathname.includes('/icons/') || url.pathname.endsWith('manifest.json')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default — network first, cache fallback
  event.respondWith(networkFirst(request));
});

// ─── Strategies ────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — please connect to internet', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise;
}

// ─── Background sync placeholder ───────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-finance-data') {
    console.log('[SW] Background sync triggered');
  }
});
