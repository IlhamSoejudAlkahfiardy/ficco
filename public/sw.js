// Ficco PWA Service Worker — Offline Shell & Asset Caching
// Version: 1.0.1

const CACHE_VERSION = 'v1.0.2';
const STATIC_CACHE = `ficco-static-${CACHE_VERSION}`;
const PAGES_CACHE = `ficco-pages-${CACHE_VERSION}`;

// Pre-cache core offline fallback & branding assets
const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// 1. Install Event: Cache essential fallback assets and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          const res = await fetch(asset, { cache: 'no-cache' });
          if (res.ok) {
            await cache.put(asset, res);
          }
        } catch {
          // Ignore individual fetch errors during compilation
        }
      }
    })
  );
});

// 2. Activate Event: Clean old cache versions and claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== PAGES_CACHE) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Routing & Caching Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http/https schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Never cache API routes or dynamic server probes
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Non-GET requests pass directly through
  if (request.method !== 'GET') {
    return;
  }

  // A. Navigation / Document Requests (HTML Pages)
  // Strategy: Network-First with Cache Fallback -> Offline Fallback Page
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // 1. Match exact request in cache
          const cachedExact = await caches.match(request, { ignoreSearch: true });
          if (cachedExact) {
            return cachedExact;
          }

          // 2. Match pathname in cache
          const cachedByPath = await caches.match(url.pathname, { ignoreSearch: true });
          if (cachedByPath) {
            return cachedByPath;
          }

          // 3. Match offline fallback page
          const offlineFallback = await caches.match('/offline');
          if (offlineFallback) {
            return offlineFallback;
          }

          // 4. Ultimate offline HTML response
          return new Response(
            `<!DOCTYPE html>
            <html lang="id">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Ficco — Mode Offline</title>
                <style>
                  body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: #f4f4f5; text-align: center; padding: 20px; }
                  .card { background: #18181b; padding: 32px; border-radius: 16px; border: 1px solid #27272a; max-width: 480px; }
                  h1 { font-size: 20px; color: #3b82f6; margin-bottom: 8px; }
                  p { color: #a1a1aa; font-size: 14px; line-height: 1.5; }
                  a { display: inline-block; margin-top: 20px; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>Ficco — Mode Offline</h1>
                  <p>Anda sedang tidak terhubung ke jaringan internet. Seluruh data transaksi bisnis Anda tetap aman tersimpan di perangkat lokal.</p>
                  <a href="/dashboard">Kembali ke Dashboard</a>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // B. Static Assets (CSS, JS bundles, icons, fonts, images)
  // Strategy: Stale-While-Revalidate with Cache-First Fallback
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico');

  // In local development on localhost/127.0.0.1, bypass caching of Next.js chunks to avoid stale HMR bundles
  const isLocalDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (isLocalDev && url.pathname.startsWith('/_next/')) {
    return;
  }

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(STATIC_CACHE);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// 4. Message Event: Skip waiting on demand
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
