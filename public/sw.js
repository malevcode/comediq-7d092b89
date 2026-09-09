/*
 * Comediq service worker.
 *
 * Its whole job is: you get on the subway, you lose signal, you open Comediq,
 * and the open mic list is still there.
 *
 * Three caches, three jobs:
 *   shell   - index.html, so the app can boot with no network at all
 *   data    - /mics.json, the actual list of mics
 *   assets  - the hashed JS/CSS/images Vite emits, cached the first time you load them
 *
 * Bump VERSION to throw all three away and start clean on the next visit.
 */

const VERSION = 'comediq-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const DATA_CACHE = `${VERSION}-data`;
const ASSET_CACHE = `${VERSION}-assets`;
const CURRENT_CACHES = [SHELL_CACHE, DATA_CACHE, ASSET_CACHE];

const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/comediq_white.png'];
const MIC_DATA_URL = '/mics.json';

// Anything that is a live read or write must never be served from cache.
const NEVER_CACHE = ['/rest/v1/', '/auth/v1/', '/functions/v1/', '/realtime/'];

const isAsset = (pathname) =>
  pathname.startsWith('/assets/') ||
  /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|ico)$/i.test(pathname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      // One bad URL should not fail the whole install, so cache them individually.
      await Promise.all(SHELL_URLS.map((url) => shell.add(url).catch(() => {})));

      const data = await caches.open(DATA_CACHE);
      await data.add(MIC_DATA_URL).catch(() => {});

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !CURRENT_CACHES.includes(n)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/** Serve the cached copy right away, refresh it in the background. */
async function staleWhileRevalidate(request, cacheName, cacheKey) {
  const cache = await caches.open(cacheName);
  const key = cacheKey || request;
  const cached = await cache.match(key);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(key, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await network;
  if (fresh) return fresh;
  throw new Error('offline and nothing cached');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

/** Navigations: try the network, fall back to the cached app shell. */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put('/index.html', response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((fragment) => url.pathname.includes(fragment))) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (url.pathname === MIC_DATA_URL) {
    // Match on the plain URL: the app requests this with cache "no-cache",
    // and we still want to hand back whatever copy we already have.
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE, MIC_DATA_URL));
    return;
  }

  if (isAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE).catch(() => caches.match(request)));
  }
});
