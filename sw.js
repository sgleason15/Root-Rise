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

// A captive portal answers 200 with its own login page for EVERY url —
// including support.js. Caching that would brick the home-screen app, so
// nothing is stored unless its provenance and shape both check out.
const OK_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

const safeToCache = (req, res) => {
  if (!res || !res.ok || res.redirected || res.type === 'opaque') return false;
  let origin, host;
  try { const u = new URL(res.url); origin = u.origin; host = u.hostname; } catch (e) { return false; }
  if (origin !== location.origin && OK_HOSTS.indexOf(host) < 0) return false;
  const ct = res.headers.get('content-type') || '';
  // Code and data must never be HTML — this is the clause that catches portals.
  if (/\.(js|jsx|css|json|webmanifest)$/.test(new URL(req.url).pathname) && /text\/html/i.test(ct)) return false;
  return true;
};

const looksLikeOurApp = (res) => {
  if (!res || !res.ok || res.redirected || res.type === 'opaque') return false;
  try { if (new URL(res.url).origin !== location.origin) return false; } catch (e) { return false; }
  return /text\/html/i.test(res.headers.get('content-type') || '');
};

// Slow is as bad as broken on a phone: if the network hasn't answered in
// 2.5s, serve the cached app and let the fetch finish in the background.
const DOC_TIMEOUT = 2500;

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

  // The app itself: try the network briefly, fall back to the cache for
  // anything slower, offline, or not actually our HTML.
  if (sameOrigin && isDoc(req, url)) {
    ev.respondWith((async () => {
      const cached = caches.match(req);
      const net = fetch(req).then(res => {
        if (looksLikeOurApp(res)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        }
        return null;
      }).catch(() => null);

      const timed = await Promise.race([
        net,
        new Promise(r => setTimeout(() => r('timeout'), DOC_TIMEOUT)),
      ]);

      if (timed && timed !== 'timeout') return timed;
      // Slow or unusable: cache wins. The fetch above still updates the cache
      // if it eventually succeeds, so the next launch is current.
      const hit = await cached;
      if (hit) return hit;
      const net2 = await net;
      if (net2) return net2;
      return (await caches.match('index.html')) || Response.error();
    })());
    return;
  }

  // Everything else: serve the cached copy at once, refresh it behind the
  // scenes — but only store a response that passes the provenance test.
  ev.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (safeToCache(req, res)) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
            return res;
          }
          // Junk from a portal: prefer whatever we already trust.
          return hit || res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
