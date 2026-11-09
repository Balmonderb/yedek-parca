/* Yedek Parça Paneli — service worker
   Her zaman önce internetten en güncelini dener; bağlantı yoksa son kopyayı açar. */
const CACHE = "ypp-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // GitHub API vb. dokunma
  const key = url.pathname.endsWith("/veri.json") || url.pathname.endsWith("/meta.json") ? url.origin + url.pathname : req;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
      return res;
    }).catch(() =>
      caches.match(key, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
        .then((r) => r || new Response("Çevrimdışı", { status: 503, statusText: "offline" }))
    )
  );
});
