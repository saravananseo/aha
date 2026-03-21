// AHA Finance — Service Worker v2
const CACHE = 'aha-v3';
const SHELL = ['/index.html', '/manifest.json', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.allSettled(SHELL.map(u => c.add(u).catch(() => null)))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request: req } = e;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Firebase / Google APIs — network only (real-time data must be fresh)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com')) {
    e.respondWith(fetch(req).catch(() => new Response('', { status: 503 })));
    return;
  }

  // App shell — cache first
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(cacheFirst(req)); return;
  }
  // Icons / manifest
  if (url.pathname.includes('/icons/') || url.pathname.endsWith('manifest.json')) {
    e.respondWith(cacheFirst(req)); return;
  }
  // Fonts — stale while revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(staleWhileRevalidate(req)); return;
  }
  // Default — network first
  e.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch { return new Response('Offline', { status: 503 }); }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const fresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  return cached || await fresh;
}
