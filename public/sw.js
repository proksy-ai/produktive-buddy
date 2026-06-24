/* Kairo service worker - lightweight offline shell + update flow + push.
   No build step: written in plain JS so it works with Turbopack. */

const VERSION = "v1";
const STATIC_CACHE = `kairo-static-${VERSION}`;
const RUNTIME_CACHE = `kairo-runtime-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations may contain personalized schedule data; never cache them.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // API responses are user-specific or security-sensitive.
  if (url.pathname.startsWith("/api/")) return;

  // Hashed static assets: cache-first (immutable).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches
              .open(STATIC_CACHE)
              .then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Other same-origin GETs (icons, etc.): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

// Web Push (used later for class change / reminder notifications).
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Kairo", body: event.data.text() };
  }
  const title = payload.title || "Kairo";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: payload.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: payload.data || { url: "/today" },
      tag: payload.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
