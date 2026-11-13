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

// 🔔 2026-11-13t · NOTIFICACIONES: cuando el servidor del agendador avisa (reserva nueva, cancelación…), se muestra aunque la app esté cerrada.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'Tu Agenda', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Tu Agenda', {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag || undefined, data: { url: d.url || '/admin.html' }
  }));
});
// al tocar la notificación: abre el panel (o lo trae al frente si ya estaba abierto)
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data || {}).url || '/admin.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((L) => {
    for (const c of L) if (c.url.indexOf('/admin.html') >= 0 && 'focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
