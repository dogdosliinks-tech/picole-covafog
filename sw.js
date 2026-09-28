// Picolé COVAFOG — service worker (funciona offline depois do primeiro acesso)
const VERSAO = "picole-v1";
const APP = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./maskable-512.png", "./apple-touch-icon.png"];
const EXTERNOS = ["fonts.googleapis.com", "fonts.gstatic.com"]; // fontes

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // página: tenta a rede (para pegar atualizações), senão usa a cópia guardada
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(k => k.put("./index.html", c)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // arquivos do app e fontes: usa a cópia guardada, senão baixa e guarda
  if (url.origin === location.origin || EXTERNOS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(VERSAO).then(k => k.put(req, c)); }
      return r;
    })));
  }
});
