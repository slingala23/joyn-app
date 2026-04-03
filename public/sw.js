// JOYN Service Worker — joyn-v1
// Cache strategy:
//   - App shell (static assets): cache-first
//   - Navigation/pages: network-first, fallback to cache

const CACHE_VERSION = 'joyn-v1'

// App shell resources cached on install
const APP_SHELL = [
  '/',
  '/discover',
  '/login',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── Install: pre-cache the app shell ──────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      // Skip waiting so the new SW activates immediately
      .then(() => self.skipWaiting())
  )
})

// ── Activate: purge stale caches from previous versions ───────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
        )
      )
      // Take control of all open clients without a reload
      .then(() => self.clients.claim())
  )
})

// ── Fetch: routing logic ───────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Ignore non-http(s) requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return

  // Ignore Supabase / Stripe API calls — always network-only
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('stripe.com')
  ) {
    return
  }

  if (request.mode === 'navigate') {
    // ── Navigation requests: network-first ──────────────────────────────
    event.respondWith(networkFirstThenCache(request))
  } else if (isStaticAsset(url)) {
    // ── Static assets (JS/CSS/fonts/images): cache-first ────────────────
    event.respondWith(cacheFirstThenNetwork(request))
  } else {
    // ── Everything else: network-first ──────────────────────────────────
    event.respondWith(networkFirstThenCache(request))
  }
})

// ── Strategy helpers ──────────────────────────────────────────────────────

/**
 * Network-first: try the network, fall back to cache.
 * For navigation, if both fail serve a simple offline page.
 */
async function networkFirstThenCache(request) {
  const cache = await caches.open(CACHE_VERSION)
  try {
    const networkResponse = await fetch(request)
    // Cache successful page responses for offline use
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached

    // Last resort offline fallback for navigation
    if (request.mode === 'navigate') {
      return offlineFallback()
    }
    // For non-navigation requests just let it fail naturally
    return new Response('Network error', { status: 503 })
  }
}

/**
 * Cache-first: serve from cache if available, otherwise fetch and cache.
 */
async function cacheFirstThenNetwork(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    return new Response('Network error', { status: 503 })
  }
}

/** Returns true for requests that are clearly static assets. */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  )
}

/** Minimal inline offline page shown when a navigation fails with no cache. */
function offlineFallback() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>JOYN — Offline</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Nunito, system-ui, sans-serif;
      background: #faf9f7;
      color: #1a1a1a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 24px;
      text-align: center;
    }
    .logo { font-size: 2rem; font-weight: 900; color: #F26741; letter-spacing: -1px; margin-bottom: 24px; }
    h1 { font-size: 1.25rem; font-weight: 800; margin-bottom: 8px; }
    p  { font-size: 0.9rem; font-weight: 600; color: #1a1a1a99; line-height: 1.6; max-width: 280px; }
  </style>
</head>
<body>
  <div class="logo">JOYN</div>
  <h1>You're offline</h1>
  <p>Check your connection and try again. Less scrolling, more showing up — see you out there.</p>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
