// Mise en cache pour l'usage hors ligne. La version change à chaque construction du site.
const CACHE = "hgn-/*VERSION*/";
const AUDIO = "hgn-audio"; // conservé d'une version à l'autre
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AUDIO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (same && url.pathname.includes("/audio/") && url.pathname.endsWith(".mp3")) {
    // Audio : cache d'abord, puis réseau en gardant une copie. Réponse complète même si le lecteur demande un extrait.
    e.respondWith(caches.open(AUDIO).then(c => c.match(url.pathname).then(r => r || fetch(url.pathname).then(resp => { if (resp.ok) c.put(url.pathname, resp.clone()); return resp; }))));
  } else if (same) {
    // Réseau d'abord (pour récupérer les nouveaux cours), cache si pas de réseau.
    e.respondWith(
      fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
    );
  } else {
    // Polices : cache d'abord.
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return resp; }).catch(() => new Response("", { status: 504 })))
    );
  }
});
