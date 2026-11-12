// 🧪 BANCO DE ESCENARIOS DE MARY (agendador). Copia de la IDEA del banco de Epic, hecha aparte: no usa nada de Epic.
//    Mary completa (principal.js) con WhatsApp (WAHA y Evolution) y el servidor de Google SIMULADOS en memoria.
//    Cada caso manda el aviso de WhatsApp real que llegaría al VPS y revisa qué le contestó Mary al cliente.
//    Uso: node --test banco/   (lo corre actualizar.sh antes de instalar: si uno falla, NO se instala)
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mary-escenarios-'));
const NEG_F = path.join(DIR, 'negocios.json');
fs.writeFileSync(NEG_F, JSON.stringify([
  { bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default', activo: true },
  { bid: 'studio-lua', instancia: 'studio-lua', motor: 'evolution', activo: true }
]));
Object.assign(process.env, {
  DATOS: DIR, NEGOCIOS: NEG_F, GAS_URL: 'https://gas.prueba/exec', MARY_KEY: 'clave-prueba', EVO_KEY: 'evo-prueba',
  WAHA_URL: 'http://waha-agendador:3000', WAHA_KEY: 'waha-prueba', MARY_MODO: 'todos', MARY_PRUEBA: '573187920386',
  SILENCIO_MIN: '15', HUMANO_MIN: '15', TZ: 'America/Bogota'
});
const P = require('../principal');
const B = P._banco;

// ---------- el mundo simulado ----------
const NEGOCIO = { negocio: 'Lina Spa', link: 'https://tuagenda.vip/?b=lina-spa', cuposHoy: 4 };
let W;
function mundoNuevo() {
  W = { enviados: [], gas: [], citas: {}, activo: true, gasFalla: false, proof: null };
  B.reiniciar(); P.CFG.modo = 'todos';
}
const resp = (o, code) => new Response(JSON.stringify(o), { status: code || 200, headers: { 'Content-Type': 'application/json' } });
global.fetch = async (url, o) => {
  const u = String(url), b = o && o.body ? JSON.parse(o.body) : null;
  if (u.startsWith('https://gas.prueba')) {
    W.gas.push(b.op);
    if (W.gasFalla && b.op === 'chat') return resp({ ok: false, error: 'Servicio invocado demasiadas veces' });
    if (b.op === 'chat') return resp({ ok: true, data: Object.assign({ activo: W.activo, citas: W.citas[b.phone] || [] }, NEGOCIO) });
    if (b.op === 'info') return resp({ ok: true, data: NEGOCIO });
    if (b.op === 'proof') return resp({ ok: true, data: W.proof || { ok: false, motivo: 'sin_cita_pendiente' } });
    return resp({ ok: true, data: {} });
  }
  if (/\/api\/sendText$/.test(u)) { const id = 'W' + W.enviados.length; W.enviados.push({ motor: 'waha', a: b.chatId.split('@')[0], texto: b.text, sesion: b.session }); return resp({ id }); }
  if (/\/api\/(start|stop)Typing$/.test(u)) return resp({});
  if (/\/message\/sendText\//.test(u)) { const id = 'E' + W.enviados.length; W.enviados.push({ motor: 'evolution', a: String(b.number), texto: b.text }); return resp({ key: { id } }, 201); }
  if (/\/chat\/sendPresence\//.test(u)) return resp({}, 201);
  return resp({}, 404);
};

// ---------- avisos de WhatsApp como los manda cada motor ----------
let nid = 0;
const wahaMsg = (de, texto, x) => Object.assign({ event: 'message', session: 'default', me: { id: '573110000000@c.us' },
  payload: Object.assign({ id: 'false_' + de + '@c.us_' + (++nid), from: de + '@c.us', fromMe: false, body: texto, _data: { notifyName: 'Camila' } }, x || {}) });
const evoMsg = (de, texto, x) => ({ event: 'messages.upsert', instance: 'studio-lua',
  data: Object.assign({ key: { remoteJid: de + '@s.whatsapp.net', fromMe: false, id: 'E-' + (++nid) }, pushName: 'Camila', message: { conversation: texto } }, x || {}) });
const llega = (b) => P._banco.alMensaje(P.deWaha && b.session ? P.deWaha(b) : b);
const CLIENTE = '573001234567';
const ultimoRegistro = () => (B.ultimos[B.ultimos.length - 1] || {}).que || '';
const CONFIRMADA = [{ code: 'R-ABC123', status: 'confirmed', dia: 'viernes 14', hora: '3:00 p. m.', servicio: 'Manicure', con: 'Lina' }];

test.beforeEach(mundoNuevo);

test('WAHA · cliente sin cita escribe «hola» → 1 respuesta con el link, a SU número', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 1);
  assert.equal(W.enviados[0].a, CLIENTE); assert.equal(W.enviados[0].sesion, 'default');
  assert.match(W.enviados[0].texto, /tuagenda\.vip\/\?b=lina-spa/); assert.match(W.enviados[0].texto, /4 cupos/);
});
test('Evolution · mismo caso por el otro motor → 1 respuesta con el link', async () => {
  await llega(evoMsg(CLIENTE, 'buenas, tienen cupo?'));
  assert.equal(W.enviados.length, 1); assert.equal(W.enviados[0].motor, 'evolution'); assert.match(W.enviados[0].texto, /tuagenda\.vip/);
});
test('Número oculto (…@lid) con el real en el aviso → responde al número REAL', async () => {
  await llega(wahaMsg('x', 'hola', { from: '123456789012345@lid', _data: { Info: { Sender: '123456789012345@lid', SenderAlt: CLIENTE + '@s.whatsapp.net' } } }));
  assert.equal(W.enviados.length, 1); assert.equal(W.enviados[0].a, CLIENTE);
});
test('Número oculto SIN el real → no responde y lo deja escrito', async () => {
  await llega(wahaMsg('x', 'hola', { from: '999999999999999@lid', _data: {} }));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /LID/);
});
test('Modo prueba · número que no es de prueba → callada y lo deja escrito', async () => {
  P.CFG.modo = 'prueba';
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /modo prueba/);
});
test('Modo prueba · tu número de prueba → sí responde', async () => {
  P.CFG.modo = 'prueba';
  await llega(wahaMsg('573187920386', 'hola'));
  assert.equal(W.enviados.length, 1); assert.equal(W.enviados[0].a, '573187920386');
});
test('Modo apagado → no responde a nadie', async () => {
  P.CFG.modo = 'apagado';
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 0);
});
test('Sesión que no está en negocios.json → callada y lo deja escrito', async () => {
  await llega(Object.assign(wahaMsg(CLIENTE, 'hola'), { session: 'otra' }));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /negocios\.json/);
});
test('El mismo aviso dos veces → una sola respuesta', async () => {
  const m = wahaMsg(CLIENTE, 'hola');
  await Promise.all([llega(m), llega(JSON.parse(JSON.stringify(m)))]);
  assert.equal(W.enviados.length, 1);
});
test('Cita confirmada · «ok gracias» → callada; «quiero cancelar» → le muestra su cita', async () => {
  W.citas[CLIENTE] = CONFIRMADA;
  await llega(wahaMsg(CLIENTE, 'ok gracias'));
  assert.equal(W.enviados.length, 0, 'con cita confirmada no responde a cualquier cosa');
  await llega(wahaMsg(CLIENTE, 'quiero cancelar mi cita'));
  assert.equal(W.enviados.length, 1); assert.match(W.enviados[0].texto, /viernes 14/);
});
test('No repite: «hola» 3 veces seguidas → máximo 2 respuestas', async () => {
  for (let i = 0; i < 3; i++) await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 2);
});
test('Tras responder, un «ok» sin pregunta → callada y no gasta cupo de Google', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  const antes = W.gas.length;
  await llega(wahaMsg(CLIENTE, 'ok'));
  assert.equal(W.enviados.length, 1); assert.equal(W.gas.length, antes, 'no debió preguntarle a Google');
});
test('El dueño escribe a mano → Mary se calla en ese chat', async () => {
  await llega(wahaMsg('x', 'ya te atiendo yo', { id: 'true_' + CLIENTE + '@c.us_D1', from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true }));
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /dueño/);
});
test('El eco del mensaje de Mary NO la calla', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  await llega(wahaMsg('x', W.enviados[0].texto, { id: 'W0', from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true }));
  W.citas[CLIENTE] = [];
  await llega(wahaMsg(CLIENTE, 'cuánto vale el manicure?'));
  assert.equal(W.enviados.length, 2);
});
test('Agenda suspendida → callada y lo deja escrito', async () => {
  W.activo = false;
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /suspendida/);
});
test('Google falla (cupo agotado) → mensaje amable con el link, una sola vez', async () => {
  W.gasFalla = true;
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 1); assert.match(W.enviados[0].texto, /problema/); assert.match(W.enviados[0].texto, /tuagenda\.vip/);
});
test('Foto del pago con cita esperando → «la recibí» y queda en revisión', async () => {
  W.proof = { ok: true, cita: { code: 'R-ABC123', status: 'payment_review' } };
  await llega(evoMsg(CLIENTE, '', { message: { imageMessage: { mimetype: 'image/jpeg', caption: '' }, base64: 'aGVsbG8=' } }));
  assert.equal(W.enviados.length, 1); assert.ok(W.gas.includes('proof'));
});
test('Mensajes de grupos y estados → nunca responde', async () => {
  await llega(wahaMsg('x', 'hola', { from: '120363000000@g.us' }));
  await llega(evoMsg('x', 'hola', { key: { remoteJid: 'status@broadcast', fromMe: false, id: 'S1' } }));
  assert.equal(W.enviados.length, 0);
});
