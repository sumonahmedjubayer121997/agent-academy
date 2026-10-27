/* Agent Academy service worker — offline-first for the app shell and all
 * visited content. Content-as-data means the hashed JS bundle IS the
 * curriculum: caching assets gives offline lessons for free.
 *
 * Policy:
 *  - Precache: app shell (index.html), offline fallback, manifest, icons.
 *  - Hashed build assets (/assets/*.js|css): cache-first — immutable by name.
 *  - Navigations (HTML): network-first, cache fallback, then /offline.html.
 *  - Same-origin images/fonts/other static: stale-while-revalidate.
 *  - Never cached: /api/* (server features), cross-origin requests.
 * Progress lives in localStorage — not touched here, works offline natively.
 */
const VERSION = 'aa-v1'
const SHELL_CACHE = `${VERSION}-shell`
const RUNTIME_CACHE = `${VERSION}-runtime`

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isHashedAsset = (url) => url.pathname.startsWith('/assets/') && /\.[0-9a-f]{8}\.(js|css|woff2?)$/.test(url.pathname)

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // never touch cross-origin
  if (url.pathname.startsWith('/api/')) return // server features stay online

  // Hashed build assets: cache-first (immutable content in the filename)
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  // Navigations: network-first, fall back to cache, then the offline page
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(() =>
          caches.match(request).then(
            (hit) => hit || caches.match('/index.html').then((shell) => hit || shell || caches.match('/offline.html')),
          ),
        ),
    )
    return
  }

  // Other same-origin static (images, fonts, og): stale-while-revalidate
  if (['image', 'font', 'style', 'script'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const refresh = fetch(request)
          .then((res) => {
            const copy = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
            return res
          })
          .catch(() => hit)
        return hit || refresh
      }),
    )
  }
})
