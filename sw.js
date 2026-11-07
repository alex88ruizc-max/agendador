// Tu Agenda: permite instalar la página como app (PC, Android, iPhone).
// No guarda la página en el teléfono: siempre carga la versión más nueva desde internet (igual que Epic).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.map((c) => caches.delete(c)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;   // solo la página: Firebase, imágenes y el servidor van directo
  const ruta = new URL(e.request.url).pathname;
  if (/\.[a-z0-9]+$/i.test(ruta) && !/\.html?$/i.test(ruta)) return;
  e.respondWith(fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
    .then((r) => (r.redirected ? Response.redirect(r.url, 302) : r))
    .catch(() => fetch(e.request))
    .catch(() => new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<body style="margin:0;background:#121216;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center">' +
      '<div><h2 style="margin:0 0 8px">Sin conexión</h2><p style="opacity:.75">Revisa tu internet y vuelve a abrir Tu Agenda.</p></div></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
