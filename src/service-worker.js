// The Vite build supplies a content fingerprint and every emitted public file.
const CONFIG = __OFFLINE_CONFIG__;
const urls = CONFIG.files.map(path => new URL(path, self.registration.scope).href);
const known = new Set(urls);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CONFIG.cacheName).then(cache =>
    cache.addAll(urls.map(url => new Request(url, { cache: 'reload' }))),
  ));
  // Wait for game tabs to close before activating an update mid-expedition.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    key !== CONFIG.cacheName && (key.startsWith(CONFIG.cachePrefix) || CONFIG.legacyCaches.includes(key)),
  ).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (!known.has(url.href)) return;
  event.respondWith(caches.open(CONFIG.cacheName)
    .then(cache => cache.match(event.request, { ignoreSearch: true }))
    .then(cached => cached || fetch(event.request)));
});
