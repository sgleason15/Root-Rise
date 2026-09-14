// Root & Rise — offline shell.
//
// The app HTML is fetched network-first: a deploy is then visible on the next
// launch with signal, instead of a launch or two later. Everything else is
// cache-first for speed, refreshed quietly in the background. Bumping CACHE
// throws away the old copies outright.
//
// Nothing here touches localStorage — the school records live there and are
// never the service worker's business.

const CACHE = 'root-rise-v3';
const SHELL = [
  './',
  'index.html',
  'Root & Rise App.dc.html',
  'support.js',
  'ds.css',
  'manifest.webmanifest',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (ev) => {
  if (ev.data === 'skip-waiting') self.skipWaiting();
});

const isDoc = (req, url) =>
  req.mode === 'navigate' || /\.(html|dc\.html)$/.test(url.pathname) || url.pathname.endsWith('/');

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  // The Supabase library is cached so cloud backup still initialises on a
  // cold, offline launch; its API calls are never cached.
  const isLib = url.hostname === 'cdn.jsdelivr.net';
  if (/\.supabase\.co$/.test(url.hostname)) return;
  if (!sameOrigin && !isFont && !isLib) return;

  // The app itself: try the network, fall back to the cache when offline.
  if (sameOrigin && isDoc(req, url)) {
    ev.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
    );
    return;
  }

  // Everything else: serve the cached copy at once, refresh it behind the scenes.
  ev.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
