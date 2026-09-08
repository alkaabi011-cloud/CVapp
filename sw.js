/* ═══════════════════════════════════════════════════════════════
   SERVICE WORKER — the tun state.

   A tardigrade entering anhydrobiosis replaces the water it
   depends on with a stable sugar/protein glass, so nothing is
   lost while the environment is hostile (Boothby et al.,
   Molecular Cell 65:975, 2017).

   Same contract here: at install we vitrify the entire app shell
   into the cache, so losing the network changes nothing about
   what the app can do. App shell = cache-first (instant, offline).
   Fonts = stale-while-revalidate (usable copy first, refresh
   quietly). Nothing else touches the network at all.
   ═══════════════════════════════════════════════════════════════ */

// Bump this on every release — it is what retires the old caches.
const VERSION    = 'v1.0.6';
const SHELL      = `cvb-shell-${VERSION}`;
const FONTS      = `cvb-fonts-${VERSION}`;

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/i18n.js',
  './js/templates.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ── install: vitrify the shell ─────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // addAll is atomic-ish but brittle: one 404 kills the whole install.
    // Add individually so a single missing asset can't leave us with no shell.
    await Promise.all(SHELL_URLS.map(url =>
      cache.add(new Request(url, { cache: 'reload' })).catch(err =>
        console.warn('[sw] skipped', url, err.message))
    ));
    await self.skipWaiting();
  })());
});

/* ── activate: shed the old cuticle ─────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('cvb-') && k !== SHELL && k !== FONTS)
      .map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.disable();
    }
    await self.clients.claim();
  })());
});

/* ── fetch ──────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Navigations: prefer the exact page if we have it, then the network,
  // and only fall back to the app shell. Blindly returning index.html for
  // every navigation would shadow every other page under our scope.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const exact = await caches.match(req, { ignoreSearch: true });
      if (exact) return exact;
      try {
        const res = await fetch(req);
        if (res && res.ok) return res;
      } catch { /* offline — fall through */ }
      return (await caches.match('./index.html', { ignoreSearch: true })) || offlinePage();
    })());
    return;
  }

  // Google Fonts: stale-while-revalidate.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const cached = await cache.match(req);
      const network = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await network) || new Response('', { status: 504 });
    })());
    return;
  }

  // Same-origin assets: cache-first, then fill the cache on a miss.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === 'basic') {
          const cache = await caches.open(SHELL);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        return new Response('', { status: 504, statusText: 'offline' });
      }
    })());
  }
  // Anything else: untouched. The app makes no other network calls.
});

/* ── last-resort page if even the shell is gone ─────────── */
function offlinePage() {
  return new Response(
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1"><title>غير متصل</title>
     <style>body{margin:0;min-height:100dvh;display:grid;place-content:center;gap:12px;
     text-align:center;font-family:system-ui,sans-serif;background:#0b0c16;color:#eceefb;padding:24px}
     b{font-size:19px}p{color:#a2a7c8;font-size:14px;margin:0;line-height:1.8}
     button{margin-top:8px;padding:11px 22px;border:0;border-radius:12px;font:inherit;font-weight:700;
     background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;cursor:pointer}</style></head>
     <body><b>التطبيق غير متاح مؤقتاً</b>
     <p>افتح التطبيق مرة واحدة وأنت متصل بالإنترنت،<br>ثم سيعمل بعدها دون اتصال.</p>
     <p style="opacity:.6">Open once while online — it works offline after that.</p>
     <button onclick="location.reload()">إعادة المحاولة</button></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
  );
}

/* ── allow the page to force an update ──────────────────── */
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
