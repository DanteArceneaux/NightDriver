// Night Driver / Neon Cockpit Service Worker
// Notes:
// - This app is primarily real-time; we keep SW caching intentionally lightweight.
// - Avoid runtime-caching arbitrary requests (especially during dev) to prevent CacheStorage quota issues.

const CACHE_PREFIX = 'neon-cockpit-';
const CACHE_VERSION = 'v4.2.2';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// If a SW from a previous version is still registered on localhost (dev),
// force-disable it to avoid caching Vite module URLs and hitting CacheStorage quota.
const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '[::1]';

// Minimal shell assets. (Offline support is best-effort; the app prefers live data.)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

function isQuotaError(err) {
  return (
    !!err &&
    (err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014)
  );
}

async function safeCacheAddAll(cache, urls) {
  try {
    await cache.addAll(urls);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ SW: Cache quota exceeded during install; skipping precache');
      return;
    }
    throw err;
  }
}

async function safeCachePut(cache, request, response) {
  try {
    await cache.put(request, response);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn('⚠️ SW: Cache quota exceeded during runtime cache put; skipping');
      return;
    }
    throw err;
  }
}

// Install: precache minimal shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await safeCacheAddAll(cache, CORE_ASSETS);
      } catch (e) {
        console.warn('⚠️ SW install failed (non-fatal):', e);
      } finally {
        await self.skipWaiting();
      }
    })()
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const stale = cacheNames.filter(
          (name) =>
            (name.startsWith(CACHE_PREFIX) || name.startsWith('night-driver-')) &&
            name !== CACHE_NAME
        );
        await Promise.all(stale.map((name) => caches.delete(name)));
      } catch (e) {
        console.warn('⚠️ SW activate cleanup failed (non-fatal):', e);
      } finally {
        await self.clients.claim();

        // DEV safety: unregister on localhost so the dev server is never controlled by SW.
        if (IS_LOCALHOST) {
          try {
            const all = await caches.keys();
            await Promise.all(all.map((name) => caches.delete(name)));
          } catch (e) {
            // ignore
          }

          try {
            await self.registration.unregister();
          } catch (e) {
            // ignore
          }

          // Hard-refresh clients to detach from SW control
          try {
            const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            await Promise.all(
              clientList.map((client) => {
                try {
                  return client.navigate(client.url);
                } catch {
                  return null;
                }
              })
            );
          } catch (e) {
            // ignore
          }
        }
      }
    })()
  );
});

// Fetch:
// - Core assets: cache-first, with quota-safe caching on first fetch
// - Navigations: network-first, fallback to cached index.html
// - Everything else: do not intercept (no runtime cache)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Skip API calls - always fetch fresh
  if (url.pathname.startsWith('/api/')) return;

  const isNavigation = req.mode === 'navigate';
  const isCoreAsset = CORE_ASSETS.includes(url.pathname);

  if (!isNavigation && !isCoreAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache-first for core assets
      if (isCoreAsset) {
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const res = await fetch(req);
          if (res && res.ok) {
            await safeCachePut(cache, req, res.clone());
          }
          return res;
        } catch (e) {
          const fallback = await cache.match('/index.html');
          return fallback || Response.error();
        }
      }

      // Network-first for navigations
      try {
        return await fetch(req);
      } catch (e) {
        const fallback = await cache.match('/index.html');
        return fallback || Response.error();
      }
    })()
  );
});

// Push notifications (best-effort)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Night Driver';
  const options = {
    body: data.body || 'New notification',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
