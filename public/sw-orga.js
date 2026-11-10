// Service worker de l'appli organisateur.
// Il ne garde AUCUNE donnée en cache : tout vient toujours du serveur (les informations de la
// soirée doivent être à jour, et rien de secret ne doit rester sur le téléphone).
// Son seul rôle : rendre l'appli installable et afficher une page claire quand le réseau manque.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const OFFLINE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pas de réseau</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#4a0e1e;color:#f7efe2;font-family:system-ui,sans-serif;text-align:center;padding:24px}
h1{font-family:Georgia,serif;font-weight:600}button{background:#c9a24d;color:#4a0e1e;border:0;border-radius:12px;padding:14px 22px;font-size:1rem;font-weight:700}</style></head>
<body><div><h1>Pas de réseau</h1><p>L’appli organisateur a besoin d’Internet pour piloter la soirée.<br>Vérifiez le Wi-Fi ou la 4G, puis réessayez.</p>
<button onclick="location.reload()">Réessayer</button></div></body></html>`;

self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return; // le reste passe normalement
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
