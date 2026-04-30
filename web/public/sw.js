// Minimal hand-written service worker for Colason PWA.
// Strategy:
//   - precache the app shell so the standalone window opens offline
//   - network-first for navigation requests, fall back to cached shell
//   - cache-first for /assets/* (Vite emits hashed filenames)
//
// IndexedDB persistence is handled in the app layer; this SW only caches static assets.

const CACHE_VERSION = "colason-v1"
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-32.png",
  "/icons/icon-48.png",
  "/icons/icon-128.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  const url = new URL(req.url)

  // Don't intercept cross-origin requests.
  if (url.origin !== self.location.origin) return

  // Navigation: network-first, fallback to cached index.html.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE_VERSION)
          cache.put("/index.html", fresh.clone()).catch(() => undefined)
          return fresh
        } catch {
          const cache = await caches.open(CACHE_VERSION)
          const cached = await cache.match("/index.html")
          if (cached) return cached
          return new Response("offline", { status: 503, statusText: "offline" })
        }
      })()
    )
    return
  }

  // Static assets: cache-first, then network and cache.
  if (url.pathname.startsWith("/assets/") || APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_VERSION)
        const cached = await cache.match(req)
        if (cached) return cached
        try {
          const fresh = await fetch(req)
          if (fresh.ok) cache.put(req, fresh.clone()).catch(() => undefined)
          return fresh
        } catch {
          return cached || new Response("offline", { status: 503 })
        }
      })()
    )
  }
})
