// Mode hors ligne : met en cache l'application et les bibliothèques (réseau d'abord, cache en secours)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || !(u.origin === location.origin || /gstatic\.com|fonts\.g/.test(u.host))) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open("sep-v1").then(k => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
