const CACHE_NAME = "bolao-2026-v5";
const ASSETS = [
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "public/avatar.jpg",
  "public/avatar1.jpg",
  "public/avatar2.jpg"
];

self.addEventListener("install", (e) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Force immediate control of open clients
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
