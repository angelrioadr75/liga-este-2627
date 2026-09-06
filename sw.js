const VERSION = 'v8';
const CACHE = `liga-este-2627-${VERSION}`;
const CORE = [
  './',
  './index.html',
  './styles.css?v=8',
  './app.js?v=8',
  './checklist.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // HTML and JS/CSS are always fetched from the network first so that
  // GitHub Pages updates become visible without deleting localStorage.
  const pathname = url.pathname;
  const isAppShell = pathname.endsWith('/') || pathname.endsWith('/index.html');
  const isCode = /\.(js|css)$/.test(pathname);

  if (isAppShell || isCode) {
    event.respondWith(
      fetch(event.request, {cache: 'no-store'})
        .then(response => {
          if (response.ok && !isAppShell && !isCode) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request, {cache: 'no-store'})
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
