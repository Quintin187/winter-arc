// Offline-Cache: online immer die neueste Version vom Server holen, offline aus dem Cache starten.
// Version hochzählen, wenn sich diese Datei ändert – dann lädt die App sich selbst neu.
const CACHE = 'winterarc-v4';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, {cache: 'reload'})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // "no-cache" fragt immer beim Server nach, statt eine bis zu 10 Minuten alte Kopie zu nehmen
  const req = e.request.mode === 'navigate'
    ? new Request(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})
    : new Request(e.request, {cache: 'no-cache'});
  e.respondWith(
    fetch(req)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
