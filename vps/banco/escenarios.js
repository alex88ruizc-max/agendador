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
  SILENCIO_MIN: '15', HUMANO_MIN: '15', TZ: 'America/Bogota', ESPERA_MS: '5'
});
const P = require('../principal');
const B = P._banco;

// ---------- el mundo simulado ----------
const NEGOCIO = { negocio: 'Lina Spa', link: 'https://tuagenda.vip/?b=lina-spa', cuposHoy: 4, activo: true, medios: [{ label: 'Nequi', account: '3001112233', holder: 'Lina' }] };
const HOY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const masDias = (n) => { const [y, m, d] = HOY.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const CATALOGO = Object.assign({}, NEGOCIO, { staffLabel: 'Profesional', abono: 0,
  categorias: [
    { nombre: 'Cortes', desde: 20000, servicios: [{ id: 'c1', nombre: 'Corte clásico', precio: 20000, min: 40 }, { id: 'c2', nombre: 'Degradado', precio: 25000, min: 45 }] },
    { nombre: 'Barba', desde: 12000, servicios: [{ id: 'b1', nombre: 'Perfilado de barba', precio: 12000, min: 20 }] },
    { nombre: 'Cejas', desde: 8000, servicios: [{ id: 'e1', nombre: 'Cejas', precio: 8000, min: 15 }] }
  ],
  staff: [{ id: 's1', nombre: 'Lina', servicios: [] }, { id: 's2', nombre: 'Andrés', servicios: [] }] });
let W;
function mundoNuevo() {
  W = { enviados: [], gas: [], llamadas: [], citas: {}, activo: true, gasFalla: false, proof: null, listaFalla: false, abono: 0, crearFalla: null,
    bot: {}, proximas: [], pedido: null, resultados: [], sesiones: {}, wahaLlamadas: [], estados: [], contactos: ['573001112233', '573004445566'],
    cupos: [{ date: HOY, dia: 'Hoy', horas: ['3:00 p. m.', '4:30 p. m.', '6:00 p. m.'], libres: ['15:00', '16:30', '18:00'] }, { date: masDias(1), dia: 'Mañana', horas: ['9:00 a. m.'], libres: ['09:00'] }, { date: masDias(2), dia: 'Pasado', horas: ['10:00 a. m.', '11:00 a. m.'], libres: ['10:00', '11:00'] }] };
  B.reiniciar(); P.CFG.modo = 'todos';
}
const resp = (o, code) => new Response(JSON.stringify(o), { status: code || 200, headers: { 'Content-Type': 'application/json' } });
global.fetch = async (url, o) => {
  const u = String(url), b = o && o.body ? JSON.parse(o.body) : null;
  if (u.startsWith('https://gas.prueba')) {
    W.gas.push(b.op); W.llamadas.push(b);
    const BOTX = Object.assign({ activo: true, agendar: true, cupos: true, saludoDiario: true, pedirNombre: true, pedirCorreo: true, loDeSiempre: true, recordatorioMin: 60, recordatorioConfirmar: true, cambios: true, pausaMin: 30, estados: { activo: true, horas: ['11:00'], manana: true, semanal: false } }, W.bot);
    const ok = (data) => resp({ ok: true, data: data && typeof data === 'object' && !Array.isArray(data) && (data.negocio || data.citas) ? Object.assign({ bot: BOTX }, data) : data });
    if (b.op === 'proximas') return resp({ ok: true, data: { citas: W.proximas, info: Object.assign({ bot: BOTX, recordatorioMin: BOTX.recordatorioMin }, NEGOCIO) } });
    if (b.op === 'asistencia' || b.op === 'cancelar') return resp({ ok: true, data: { ok: true, link: NEGOCIO.link, cita: (W.proximas[0] || {}) } });
    if (b.op === 'reagendar') { const d = W.cupos.find((x) => x.date === b.date); return resp({ ok: true, data: { ok: true, cita: Object.assign({}, W.proximas[0] || {}, { dia: d.dia, hora: d.horas[d.libres.indexOf(b.time)], link: NEGOCIO.link + '&cita=R-VIEJA1' }) } }); }
    if (b.op === 'contactos') return resp({ ok: true, data: { numeros: W.contactos } });
    if (b.op === 'waPedido') { const p = W.pedido; W.pedido = null; return resp({ ok: true, data: { pedido: p } }); }
    if (b.op === 'waResultado') { W.resultados.push(b); return resp({ ok: true, data: { ok: true } }); }
    if (W.gasFalla && b.op === 'chat') return resp({ ok: false, error: 'Servicio invocado demasiadas veces' });
    if (b.op === 'chat') return ok(Object.assign({}, NEGOCIO, { activo: W.activo, citas: W.citas[b.phone] || [] }));
    if (b.op === 'info') return ok(NEGOCIO);
    if (b.op === 'proof') return ok(W.proof || { ok: false, motivo: 'sin_cita_pendiente' });
    if (b.op === 'catalogo') return ok(Object.assign({}, CATALOGO, { abono: W.abono, activo: W.activo }));
    if (b.op === 'cupos') return ok(Object.assign({ dias: W.cupos }, NEGOCIO));
    if (b.op === 'dias') return ok({ dias: W.cupos.map((x) => ({ date: x.date, dia: x.dia, n: x.horas.length })), link: NEGOCIO.link });
    if (b.op === 'horas') { const d = W.cupos.find((x) => x.date === b.date) || { horas: [], libres: [] }; return ok({ date: b.date, dia: d.dia, horas: d.libres.map((t, i) => ({ time: t, hora: d.horas[i], staff: b.staffId ? [{ id: b.staffId, nombre: b.staffId === 's1' ? 'Lina' : 'Andrés' }] : [{ id: 's1', nombre: 'Lina' }, { id: 's2', nombre: 'Andrés' }] })), link: NEGOCIO.link }); }
    if (b.op === 'crear') {
      if (W.crearFalla) { const m = W.crearFalla; W.crearFalla = null; return ok({ ok: false, motivo: m }); }
      const todos = [].concat(...CATALOGO.categorias.map((x) => x.servicios)), sel = b.ids.map((id) => todos.find((x) => x.id === id));
      const d = W.cupos.find((x) => x.date === b.date), tot = sel.reduce((a, x) => a + x.precio, 0);
      return ok({ ok: true, medios: NEGOCIO.medios, holdMinutes: 30, cita: { code: 'R-NUEVA1', status: W.abono ? 'pending_payment' : 'confirmed', dia: d.dia, hora: d.horas[d.libres.indexOf(b.time)], servicio: sel.map((x) => x.nombre).join(' + '), con: b.staffId === 's2' ? 'Andrés' : 'Lina', abono: Math.min(W.abono, tot), total: tot, link: NEGOCIO.link + '&cita=R-NUEVA1' } });
    }
    return ok({});
  }
  if (/\/api\/sendText$/.test(u)) { const id = 'W' + W.enviados.length; W.enviados.push({ id, motor: 'waha', a: b.chatId.split('@')[0], texto: b.text, sesion: b.session }); return resp({ id }); }
  if (/\/api\/sendList$/.test(u)) {
    if (W.listaFalla) return resp({ error: 'no soportado' }, 501);
    // 3.3: las MISMAS reglas que WAHA (chatting.list.dto.ts): título, botón y título de sección obligatorios; filas con título y rowId
    const mm = b.message || {}, vacio = (x) => typeof x !== 'string' || !x.trim();
    if (vacio(mm.title) || vacio(mm.button) || !Array.isArray(mm.sections) || !mm.sections.length || mm.sections.some((x) => vacio(x.title) || !x.rows || !x.rows.length || x.rows.some((r) => vacio(r.title) || vacio(r.rowId))))
      return resp({ statusCode: 400, message: ['message.title should not be empty'], error: 'Bad Request' }, 400);
    const id = 'WL' + W.enviados.length; W.enviados.push({ id, motor: 'waha', a: b.chatId.split('@')[0], texto: [b.message.title, b.message.description].filter(Boolean).join('\n'), lista: b.message, sesion: b.session }); return resp({ id });
  }
  if (/\/api\/(start|stop)Typing$/.test(u)) return resp({});
  // ---- sesiones de WAHA (vincular / desvincular desde el panel) ----
  const m = u.match(/\/api\/sessions\/([^/?]+)(\/(start|logout))?$/), metodo = String((o && o.method) || 'GET').toUpperCase();
  if (/\/api\/sessions$/.test(u) && metodo === 'POST') { W.wahaLlamadas.push('crear ' + b.name); W.sesiones[b.name] = { status: 'SCAN_QR_CODE', config: b.config }; return resp({ name: b.name }); }
  if (m) { const n = decodeURIComponent(m[1]); W.wahaLlamadas.push(metodo + ' ' + n + (m[3] ? ' ' + m[3] : ''));
    if (m[3] === 'logout') { if (W.sesiones[n]) W.sesiones[n].status = 'STOPPED'; return resp({}); }
    if (m[3] === 'start') return resp({});
    if (metodo === 'DELETE') { delete W.sesiones[n]; return resp({}); }
    if (!W.sesiones[n]) return resp({ error: 'no existe' }, 404);
    if (metodo === 'PUT') return resp({ name: n });
    return resp(Object.assign({ name: n }, W.sesiones[n])); }
  const ac = u.match(/\/api\/([^/]+)\/auth\/(request-code|qr)/);
  if (ac) { W.wahaLlamadas.push(ac[2] + ' ' + decodeURIComponent(ac[1])); return ac[2] === 'qr' ? resp({ mimetype: 'image/png', data: 'UVI=' }) : resp({ code: 'ABCD1234' }); }
  if (/\/status\/image$/.test(u)) { W.estados.push({ sesion: u.split('/api/')[1].split('/')[0], caption: b.caption, contacts: b.contacts }); return resp({}); }
  if (/\/message\/sendText\//.test(u)) { const id = 'E' + W.enviados.length; W.enviados.push({ motor: 'evolution', a: String(b.number), texto: b.text }); return resp({ key: { id } }, 201); }
  if (/\/message\/sendList\//.test(u)) { const id = 'EL' + W.enviados.length; W.enviados.push({ motor: 'evolution', a: String(b.number), texto: [b.title, b.description].filter((x) => x && x.trim()).join('\n'), lista: b }); return resp({ key: { id } }, 201); }
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
test('No repite: «hola» 3 veces seguidas → 1 respuesta (3.5: el mismo mensaje otra vez = pausa)', async () => {
  for (let i = 0; i < 3; i++) await llega(wahaMsg(CLIENTE, 'hola'));
  assert.equal(W.enviados.length, 1); assert.match(ultimoRegistro(), /pausado/);
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
  await llega(wahaMsg('x', W.enviados[0].texto, { id: W.enviados[0].id, from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true }));
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

test('2.9 · Al vincular por WAHA, la sesión «default» NO se vuelve un negocio falso', async () => {
  await P._banco.alEventoConexion(P.deWaha({ event: 'session.status', session: 'otra-sesion', payload: { status: 'WORKING' }, me: { id: '573110000000@c.us' } }));
  const L = JSON.parse(fs.readFileSync(NEG_F, 'utf8'));
  assert.equal(L.some((n) => n.bid === 'otra-sesion'), false, 'no debió crear un negocio');
  assert.match(ultimoRegistro(), /no es ningún negocio/);
});

// =====================================================================
//  3.0 · ASISTENTE: saludo una vez al día, cupos, agendar con listas, nombre, correo, gustos, abono, audios
// =====================================================================
const toca = (rowId, titulo) => wahaMsg(CLIENTE, titulo || rowId, { _data: { notifyName: 'Camila', Message: { listResponseMessage: { singleSelectReply: { selectedRowID: rowId } } } } });
const ultimo = () => W.enviados[W.enviados.length - 1] || {};
const filas = (e) => [].concat(...((e.lista || {}).sections || []).map((s) => s.rows));
const ids = (e) => filas(e).map((r) => r.rowId);

test('3.0 · Saludo «Soy el asistente de…» (sin «Mary») y UNA sola vez al día', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.match(W.enviados[0].texto, /Soy el asistente de \*?Lina Spa\*?/); assert.doesNotMatch(W.enviados[0].texto, /Mary/);
  assert.ok(W.enviados[0].lista, 'la respuesta lleva la lista Ver opciones');
  await llega(wahaMsg(CLIENTE, 'hay cupos hoy?'));
  assert.doesNotMatch(ultimo().texto, /Soy el asistente/, 'el segundo mensaje del día ya no saluda');
});
test('3.0 · «¿hay cupos?» → las horas de hoy + el link + la lista de días (SIEMPRE el link)', async () => {
  await llega(wahaMsg(CLIENTE, 'buenas, tienen cupo hoy?'));
  const e = ultimo();
  assert.match(e.texto, /Hoy\*? hay cupo a las 3:00 p\. m\., 4:30 p\. m\. y 6:00 p\. m\./); assert.match(e.texto, /tuagenda\.vip/);
  assert.equal(e.lista.button, 'Elegir día'); assert.ok(ids(e).includes('dia:' + HOY));
  await llega(wahaMsg(CLIENTE, 'y cupos mañana?'));
  assert.match(ultimo().texto, /Mañana\*? hay cupo a las 9:00 a\. m\./); assert.match(ultimo().texto, /tuagenda\.vip/);
});
test('3.0 · Hoy sin cupos → «pero sí hay mañana…» y pregunta qué día le sirve', async () => {
  W.cupos[0].horas = []; W.cupos[0].libres = [];
  await llega(wahaMsg(CLIENTE, 'hay disponibilidad hoy?'));
  assert.match(ultimo().texto, /Hoy ya no hay cupos, pero sí hay mañana y pasado/); assert.match(ultimo().texto, /Qué día te sirve/);
  assert.match(ultimo().texto, /tuagenda\.vip/);
});
test('3.0 · Agendar COMPLETO con listas: 2 servicios, día, hora, profesional, nombre, correo, paráfrasis y SÍ', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar una cita'));
  assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2']); assert.match(filas(ultimo())[0].description, /desde \$20\.000/);
  await llega(toca('cat:0', 'Cortes'));
  assert.ok(ids(ultimo()).includes('svc:c2')); assert.match(filas(ultimo()).find((r) => r.rowId === 'svc:c2').description, /\$25\.000 · 45 min/);
  await llega(toca('svc:c2', 'Degradado'));
  assert.match(ultimo().texto, /Anotado: \*?Degradado\*? \(/); assert.deepEqual(ids(ultimo()), ['mas:si', 'mas:no']);
  await llega(toca('mas:si', '➕ Agregar otro'));
  await llega(toca('cat:1', 'Barba'));
  await llega(toca('svc:b1', 'Perfilado de barba'));
  assert.match(ultimo().texto, /Degradado \+ Perfilado de barba\*? \(\$37\.000\)/);
  await llega(toca('mas:no', '✅ No, solo eso'));
  assert.equal(ultimo().lista.button, 'Elegir día');
  await llega(toca('dia:' + HOY, 'Hoy'));
  assert.equal(ultimo().lista.button, 'Elegir hora'); assert.ok(ids(ultimo()).includes('hora:15:00'));
  assert.deepEqual(ultimo().lista.sections.map((x) => x.title), ['🌇 Tarde', 'Más']);
  await llega(toca('hora:15:00', '3:00 p. m.'));
  assert.deepEqual(ids(ultimo()), ['pro:s1', 'pro:s2', 'pro:'], 'dos profesionales libres: pregunta con quién');
  await llega(toca('pro:s2', 'Andrés'));
  assert.match(ultimo().texto, /A nombre de quién/);
  await llega(wahaMsg(CLIENTE, 'andrés ruiz'));
  assert.match(ultimo().texto, /calendario/);
  await llega(wahaMsg(CLIENTE, 'Andres@Gmail.com'));
  const par = ultimo().texto;
  assert.match(par, /Entendí esto/); assert.match(par, /Degradado \+ Perfilado de barba · \*\$37\.000\* \(1 h 5 min\)/); assert.match(par, /Hoy a las \*3:00 p\. m\.\*/);
  assert.match(par, /Con Andrés/); assert.match(par, /A nombre de Andrés Ruiz/); assert.deepEqual(ids(ultimo()), ['ok:si', 'ok:no']);
  await llega(toca('ok:si', '✅ Sí, confirmar'));
  const cr = W.llamadas.find((x) => x.op === 'crear');
  assert.deepEqual(cr.ids, ['c2', 'b1']); assert.equal(cr.date, HOY); assert.equal(cr.time, '15:00'); assert.equal(cr.staffId, 's2');
  assert.equal(cr.nombre, 'Andrés Ruiz'); assert.equal(cr.email, 'andres@gmail.com'); assert.equal(cr.phone, CLIENTE);
  assert.match(ultimo().texto, /Listo, Andrés! Tu cita quedó confirmada/); assert.match(ultimo().texto, /R-NUEVA1/); assert.match(ultimo().texto, /calendario/);
  if (process.env.BANCO_VISTA) fs.writeFileSync(process.env.BANCO_VISTA, JSON.stringify(W.enviados, null, 1));   // para dibujar la vista previa
});
test('3.0 · Responder ESCRIBIENDO (número o nombre) en vez de tocar la lista también funciona', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero una cita'));
  await llega(wahaMsg(CLIENTE, '2'));                       // 2 = Barba
  assert.match(ultimo().texto, /\*?Barba\*?\n/);
  await llega(wahaMsg(CLIENTE, 'perfilado de barba'));
  assert.match(ultimo().texto, /Anotado: \*?Perfilado de barba\*?/);
  await llega(wahaMsg(CLIENTE, 'no, solo eso'));
  assert.equal(ultimo().lista.button, 'Elegir día');
  await llega(wahaMsg(CLIENTE, 'mañana'));
  assert.match(ultimo().texto, /Horas libres · Mañana/);
});
test('3.0 · «quiero corte y barba»: reconoce los servicios escritos de una', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero degradado y perfilado de barba'));
  assert.match(ultimo().texto, /Anotado: \*?Degradado \+ Perfilado de barba\*?/);
});
test('3.0 · Con abono del dueño → queda apartada con el monto y los datos de pago', async () => {
  W.abono = 10000;
  B.ASIS.cliente(P.CFG && 'lina-spa:' + CLIENTE).nombre = 'Camila'; B.ASIS.cliente('lina-spa:' + CLIENTE).correo = '';
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  await llega(toca('cat:2', 'Cejas'));
  await llega(toca('svc:e1', 'Cejas')); await llega(toca('mas:no'));
  await llega(toca('dia:' + masDias(2), 'Pasado')); await llega(toca('hora:10:00', '10:00 a. m.')); await llega(toca('pro:', 'El que esté libre'));
  assert.match(ultimo().texto, /Abono para apartar: \*\$8\.000\*/, 'el abono nunca pasa del total');
  await llega(wahaMsg(CLIENTE, 'si'));
  assert.match(ultimo().texto, /Te aparté el cupo, Camila/); assert.match(ultimo().texto, /exactamente \$8\.000/); assert.match(ultimo().texto, /Nequi: \*3001112233\*/);
});
test('3.0 · «¿Lo de siempre?»: aprende la combinación y la ofrece la próxima vez', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  cl.combos = { 'b1+c2|Lina': { n: 3, ids: ['c2', 'b1'], staffId: 's1', servicio: 'Degradado + Perfilado de barba', con: 'Lina' } };
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  assert.match(ultimo().texto, /Lo de siempre\? \*?Degradado \+ Perfilado de barba\*? con \*?Lina\*?/);
  await llega(toca('fav:si'));
  assert.equal(ultimo().lista.button, 'Elegir día');
  assert.deepEqual(W.llamadas.filter((x) => x.op === 'dias').pop().ids, ['c2', 'b1']); assert.equal(W.llamadas.filter((x) => x.op === 'dias').pop().staffId, 's1');
});
test('3.0 · Si otro tomó la hora justo antes → «la acaban de tomar» y muestra las que quedan', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  W.crearFalla = 'ocupada';
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  await llega(toca('dia:' + HOY)); await llega(toca('hora:16:30')); await llega(toca('pro:s1')); await llega(toca('ok:si'));
  assert.match(ultimo().texto, /la acaban de tomar/); assert.equal(ultimo().lista.button, 'Elegir hora');
});
test('3.0 · Desde «¿hay cupos?» elige el día → elige servicio → va directo a las horas de ESE día', async () => {
  await llega(wahaMsg(CLIENTE, 'hay cupos?'));
  await llega(toca('dia:' + masDias(1), 'Mañana'));
  assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2']);
  await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  assert.match(ultimo().texto, /Horas libres · Mañana/); assert.ok(!W.gas.includes('dias'), 'no volvió a preguntar el día');
});
test('3.0 · «cancelar» a mitad de camino → lo deja y no insiste', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:0'));
  await llega(wahaMsg(CLIENTE, 'cancelar'));
  assert.match(ultimo().texto, /lo dejamos así/);
});
test('3.0 · Algo que no está en la lista → «No te entendí» y la misma lista otra vez', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  await llega(wahaMsg(CLIENTE, 'jajaja'));
  assert.match(ultimo().texto, /No te entendí/); assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2']);
});
test('3.0 · Audio → «En este momento no puedo escuchar audios», sin romper nada', async () => {
  await llega(wahaMsg(CLIENTE, '', { hasMedia: true, media: { url: 'http://waha-agendador:3000/api/files/x.oga', mimetype: 'audio/ogg; codecs=opus' } }));
  assert.match(ultimo().texto, /no puedo escuchar audios/); assert.match(ultimo().texto, /Soy el asistente de/);
  assert.ok(!W.gas.includes('proof'), 'un audio no es una foto de pago');
});
test('3.0 · Si WhatsApp no acepta la lista → llega igual como texto con números', async () => {
  W.listaFalla = true;
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  assert.match(ultimo().texto, /1\. Cortes\n2\. Barba\n3\. Cejas/); assert.match(ultimo().texto, /Responde con el número/);
  await llega(wahaMsg(CLIENTE, '3'));
  assert.match(ultimo().texto, /\*?Cejas\*?\n/);
});
test('3.0 · Evolution también manda listas y entiende la opción elegida', async () => {
  await llega(evoMsg(CLIENTE, 'quiero agendar'));
  assert.equal(ultimo().motor, 'evolution'); assert.ok(ultimo().lista.sections);
  await llega(evoMsg(CLIENTE, '', { message: { listResponseMessage: { title: 'Barba', singleSelectReply: { selectedRowId: 'cat:1' } } } }));
  assert.match(ultimo().texto, /\*?Barba\*?\n/);
});
test('3.0 · Fechas: hoy, mañana, pasado mañana, «el viernes», «el 20», «20 de diciembre», «20/12»', () => {
  const A = require('../asistente');
  assert.equal(A.fechaPedida('hay cupo hoy?', '2026-11-12'), '2026-11-12');
  assert.equal(A.fechaPedida('para mañana', '2026-11-12'), '2026-11-13');
  assert.equal(A.fechaPedida('mañana en la mañana', '2026-11-12'), '2026-11-13');
  assert.equal(A.fechaPedida('pasado mañana', '2026-11-12'), '2026-11-14');
  assert.equal(A.fechaPedida('el viernes', '2026-11-12'), '2026-11-13');   // 12-nov-2026 es jueves
  assert.equal(A.fechaPedida('el jueves', '2026-11-12'), '2026-11-12');
  assert.equal(A.fechaPedida('para el 20', '2026-11-12'), '2026-11-20');
  assert.equal(A.fechaPedida('el 5', '2026-11-12'), '2026-12-05');
  assert.equal(A.fechaPedida('20 de diciembre', '2026-11-12'), '2026-12-20');
  assert.equal(A.fechaPedida('20/12', '2026-11-12'), '2026-12-20');
  assert.equal(A.fechaPedida('3 de enero', '2026-11-12'), '2027-01-03');
  assert.equal(A.fechaPedida('hay cupos?', '2026-11-12'), null);
});
test('3.0 · Recordatorio según el panel: «Recuerda que tu cita es en 1 hora» (y 2 horas, 30 min…)', () => {
  const T = require('../textos'), c = { nombre: 'andrés', dia: 'Hoy', hora: '3:00 p. m.', servicio: 'Degradado', con: 'Lina', link: 'L', saldo: 0 };
  assert.match(T.recordatorio(c, { negocio: 'El Barba', recordatorioMin: 60 }), /Hola Andrés 👋 Recuerda que tu cita en \*El Barba\* es en \*1 hora\*/);
  assert.match(T.recordatorio(c, { negocio: 'El Barba', recordatorioMin: 120 }), /es en \*2 horas\*/);
  assert.match(T.recordatorio(c, { negocio: 'El Barba', recordatorioMin: 30 }), /es en \*30 minutos\*/);
  assert.match(T.recordatorio(c, { negocio: 'El Barba', recordatorioMin: 90 }), /es en \*1 hora y 30 minutos\*/);
});
test('3.0 · Agenda suspendida → tampoco agenda ni muestra cupos', async () => {
  W.activo = false;
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(wahaMsg(CLIENTE, 'hay cupos?'));
  assert.equal(W.enviados.length, 0);
});

// =====================================================================
//  3.1 · PANEL «WhatsApp Bot»: pausa del dueño, opciones, recordatorio sí/cancelar/modificar, estados, vincular/desvincular
// =====================================================================
const leerNeg = () => JSON.parse(fs.readFileSync(NEG_F, 'utf8'));
test('3.1 · El dueño escribe → el asistente se calla 30 min (lo del panel): a los 20 min sigue callado, a los 31 vuelve', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));   // primera respuesta: trae la configuración del panel (pausa 30 min)
  await llega(wahaMsg('x', 'hola, ya te atiendo yo', { id: 'true_' + CLIENTE + '@c.us_DUE', from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true }));
  assert.match(ultimoRegistro(), /se calla 30 min/);
  const H = B.memHumano(), k = 'lina-spa:' + CLIENTE, n0 = W.enviados.length;
  H[k] = Date.now() - 20 * 60000;
  await llega(wahaMsg(CLIENTE, 'hay cupos hoy?'));
  assert.equal(W.enviados.length, n0, 'a los 20 min sigue callado'); assert.match(ultimoRegistro(), /dueño escribió hace poco/);
  H[k] = Date.now() - 31 * 60000;
  await llega(wahaMsg(CLIENTE, 'hay cupos hoy?'));
  assert.equal(W.enviados.length, n0 + 1, 'a los 31 min vuelve a atender');
});
test('3.1 · Panel: asistente APAGADO → no responde nada', async () => {
  W.bot = { activo: false };
  await llega(wahaMsg(CLIENTE, 'hola'));          // la primera respuesta trae la configuración
  const n0 = W.enviados.length;
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  assert.equal(W.enviados.length, n0); assert.match(ultimoRegistro(), /apagado en el panel/);
});
test('3.1 · Panel: «agendar por WhatsApp» y «cupos» apagados → solo el link, sin lista', async () => {
  W.bot = { agendar: false, cupos: false };
  await llega(wahaMsg(CLIENTE, 'hola'));
  await llega(wahaMsg(CLIENTE, 'quiero agendar una cita'));
  assert.ok(!ultimo().lista, 'sin listas'); assert.match(ultimo().texto, /tuagenda\.vip/); assert.ok(!W.gas.includes('catalogo') || !W.gas.includes('dias'));
});
test('3.1 · Panel: sin pedir nombre ni correo → usa el nombre de WhatsApp y va directo a «¿Lo confirmo?»', async () => {
  W.bot = { pedirNombre: false, pedirCorreo: false };
  await llega(wahaMsg(CLIENTE, 'hola'));
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  await llega(toca('dia:' + HOY)); await llega(toca('hora:15:00')); await llega(toca('pro:s1'));
  assert.match(ultimo().texto, /Entendí esto/); assert.match(ultimo().texto, /A nombre de Camila/);
});
test('3.1 · Panel: saludo diario apagado → saluda en cada respuesta', async () => {
  W.bot = { saludoDiario: false };
  await llega(wahaMsg(CLIENTE, 'hola')); await llega(wahaMsg(CLIENTE, 'hay cupos mañana?'));
  assert.match(ultimo().texto, /Soy el asistente de/);
});
test('3.1 · Recordatorio: «Recuerda que tu cita es en 1 hora · ¿Puedes continuar? sí / cancelar / modificar» → «sí» confirma y avisa al dueño', async () => {
  W.proximas = [{ code: 'R-VIEJA1', status: 'confirmed', dia: 'Hoy', hora: '3:00 p. m.', servicio: 'Degradado', con: 'Lina', link: NEGOCIO.link + '&cita=R-VIEJA1', whatsapp: CLIENTE, nombre: 'Andrés', ids: ['c2'], staffId: 's1', saldo: 0 }];
  await B.tickRecordatorios(true);
  assert.match(ultimo().texto, /Recuerda que tu cita en \*Lina Spa\* es en \*1 hora\*/); assert.match(ultimo().texto, /Responde \*sí\* y te esperamos/); assert.match(ultimo().texto, /\*cancelar\* o \*modificar\*/);
  await llega(wahaMsg(CLIENTE, 'si señor'));
  const a = W.llamadas.find((x) => x.op === 'asistencia'); assert.equal(a.code, 'R-VIEJA1'); assert.equal(a.phone, CLIENTE);
  assert.match(ultimo().texto, /Gracias, Andrés! Tu cita quedó confirmada. Te esperamos/);
});
test('3.1 · Recordatorio → «cancelar» cancela de una (respetando las reglas del dueño en el servidor)', async () => {
  W.proximas = [{ code: 'R-VIEJA1', status: 'confirmed', dia: 'Hoy', hora: '3:00 p. m.', servicio: 'Degradado', link: 'L', whatsapp: CLIENTE, nombre: 'Andrés', ids: ['c2'], staffId: 's1' }];
  await B.tickRecordatorios(true);
  await llega(wahaMsg(CLIENTE, 'cancelar'));
  assert.equal(W.llamadas.find((x) => x.op === 'cancelar').code, 'R-VIEJA1'); assert.match(ultimo().texto, /cancelé tu cita del hoy a las 3:00 p\. m\./);
});
test('3.1 · Recordatorio → «modificar» → días → horas → «cambio tu cita de… ¿Lo confirmo?» → sí → queda cambiada', async () => {
  W.proximas = [{ code: 'R-VIEJA1', status: 'confirmed', dia: 'Hoy', hora: '3:00 p. m.', servicio: 'Degradado', con: 'Lina', link: 'L', whatsapp: CLIENTE, nombre: 'Andrés', ids: ['c2'], staffId: 's1' }];
  await B.tickRecordatorios(true);
  await llega(wahaMsg(CLIENTE, 'modificar'));
  assert.equal(ultimo().lista.button, 'Elegir día'); assert.deepEqual(W.llamadas.filter((x) => x.op === 'dias').pop().ids, ['c2']);
  await llega(toca('dia:' + masDias(1), 'Mañana'));
  await llega(toca('hora:09:00', '9:00 a. m.'));
  assert.match(ultimo().texto, /cambio tu cita de \*hoy a las 3:00 p\. m\.\* para \*Mañana a las 9:00 a\. m\.\* con Lina/);
  await llega(toca('ok:si'));
  const r = W.llamadas.find((x) => x.op === 'reagendar'); assert.equal(r.code, 'R-VIEJA1'); assert.equal(r.date, masDias(1)); assert.equal(r.time, '09:00'); assert.equal(r.staffId, 's1');
  assert.match(ultimo().texto, /Tu cita quedó para mañana a las 9:00 a\. m\./);
});
test('3.1 · Sin recordatorio de por medio: «quiero cancelar mi cita» → pregunta si está seguro → sí → cancelada', async () => {
  W.citas[CLIENTE] = [{ code: 'R-ABC123', status: 'confirmed', dia: 'Viernes 14', hora: '3:00 p. m.', servicio: 'Manicure', link: 'L', ids: ['e1'], staffId: 's1' }];
  await llega(wahaMsg(CLIENTE, 'quiero cancelar mi cita'));
  assert.match(ultimo().texto, /Seguro que cancelo tu cita del \*viernes 14 a las 3:00 p\. m\.\*/); assert.deepEqual(ids(ultimo()), ['can:si', 'can:no']);
  await llega(toca('can:si', '🚫 Sí, cancelarla'));
  assert.equal(W.llamadas.find((x) => x.op === 'cancelar').code, 'R-ABC123');
});
test('3.1 · Estados: 1 al día a las 11:00 a. m. (máximo 2), una sola vez cada uno, y semanal solo si el dueño lo prende', () => {
  const E = (hm, cfg, hechos, dow) => P.estadosQueTocan(cfg, { fecha: '2026-11-12', hm, dow: dow == null ? 4 : dow }, hechos || {}, 'b');
  assert.deepEqual(E('10:59', { horas: ['11:00'] }), []);
  assert.deepEqual(E('11:03', { horas: ['11:00'] }).map((x) => x.tipo), ['hoy']);
  assert.deepEqual(E('11:30', { horas: ['11:00'] }, { 'b:hoy@11:00': '2026-11-12' }), [], 'ya se publicó hoy');
  assert.deepEqual(E('15:10', { horas: ['11:00', '15:00'] }, { 'b:hoy@11:00': '2026-11-12' }).map((x) => x.k), ['b:hoy@15:00']);
  assert.equal(E('11:30', { horas: ['09:00', '11:00', '15:00'] }).length, 2, 'nunca más de 2 al día');
  assert.equal(E('15:10', { horas: ['09:00', '11:00', '15:00'] }).length, 0, 'el tercero no existe');
  assert.deepEqual(E('11:05', { activo: false, horas: ['11:00'] }), []);
  assert.deepEqual(E('07:10', { horas: ['11:00'], semanal: true }, {}, 1).map((x) => x.tipo), ['semana']);
  assert.deepEqual(E('07:10', { horas: ['11:00'], semanal: false }, {}, 1), []);
});
test('3.1 · Estado: con cupos hoy → hoy; sin cupos hoy → los de mañana; sin cupos → no publica · va a los clientes del negocio', async () => {
  let r = await B.publicarEstado({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, 'hoy');
  assert.equal(r.ok, true); assert.deepEqual(W.estados[0].contacts, ['573001112233@c.us', '573004445566@c.us']); assert.match(ultimoRegistro(), /estado hoy publicado$/);
  W.cupos[0].libres = []; W.cupos[0].horas = [];
  r = await B.publicarEstado({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, 'hoy');
  assert.equal(r.ok, true); assert.match(ultimoRegistro(), /cupos de mañana/);
  W.cupos[1].libres = []; W.cupos[1].horas = [];
  r = await B.publicarEstado({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, 'hoy');
  assert.equal(r.ok, false); assert.match(r.motivo, /no hay cupos hoy ni mañana/); assert.equal(W.estados.length, 2);
});
test('3.1 · Panel: VINCULAR crea la sesión del negocio en waha-agendador y manda el código (y el QR) al panel', async () => {
  const antes = fs.readFileSync(NEG_F, 'utf8');
  try {
    W.pedido = { accion: 'conectar', numero: '573005556677' };
    await P.atenderPedidoWa('nuevo-spa');
    assert.ok(W.wahaLlamadas.includes('crear nuevo-spa')); assert.ok(W.wahaLlamadas.includes('request-code nuevo-spa'));
    const c = W.resultados.find((x) => x.estado === 'codigo'); assert.equal(c.codigo, 'ABCD1234'); assert.match(c.qr, /^data:image\/png;base64,/);
    const reg = leerNeg().find((x) => x.bid === 'nuevo-spa'); assert.equal(reg.sesion, 'nuevo-spa'); assert.equal(reg.motor, 'waha'); assert.equal(reg.activo, false, 'no atiende hasta que vincule');
    // el QR se renueva mientras espera (el código sigue igual)
    await P.renovarQr();
    assert.equal(W.resultados.filter((x) => x.estado === 'codigo').length, 2);
  } finally { fs.writeFileSync(NEG_F, antes); }
});
test('3.1 · Panel: DESVINCULAR cierra la sesión y la BORRA (no queda abierta); la próxima vez se crea una nueva', async () => {
  const antes = fs.readFileSync(NEG_F, 'utf8');
  try {
    W.sesiones.default = { status: 'WORKING', me: { id: '573187920386@c.us' } };
    W.pedido = { accion: 'desconectar' };
    await P.atenderPedidoWa('lina-spa');
    assert.ok(W.wahaLlamadas.includes('POST default logout')); assert.ok(W.wahaLlamadas.includes('DELETE default')); assert.equal(W.sesiones.default, undefined);
    const reg = leerNeg().find((x) => x.bid === 'lina-spa'); assert.equal(reg.activo, false); assert.equal(reg.sesion, 'lina-spa');
    assert.ok(W.resultados.some((x) => x.estado === 'desconectado'));
    W.pedido = { accion: 'conectar', numero: '573187920386' };
    await P.atenderPedidoWa('lina-spa');
    assert.ok(W.wahaLlamadas.includes('crear lina-spa'), 'vinculación nueva = sesión nueva');
  } finally { fs.writeFileSync(NEG_F, antes); }
});
test('3.1 · Un negocio vinculado por el VPS aparece «✅ Vinculado» en su panel (una sola vez)', async () => {
  W.sesiones.default = { status: 'WORKING', me: { id: '573187920386@c.us' } };
  await P.sincronizarConectados(); await P.sincronizarConectados();
  const r = W.resultados.filter((x) => x.estado === 'conectado' && x.businessId === 'lina-spa');
  assert.equal(r.length, 1); assert.equal(r[0].numero, '573187920386');
});

test('3.3 · La lista cumple lo que WAHA exige (título, botón, secciones): llega como LISTA, no como texto con números', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.ok(W.enviados[0].lista, 'el saludo va como lista'); assert.match(W.enviados[0].lista.title, /Soy el asistente de Lina Spa/);
  assert.doesNotMatch(W.enviados[0].lista.title, /\*/, 'sin asteriscos en el título');
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  assert.ok(ultimo().lista); assert.equal(ultimo().lista.title, '✨ ¿Qué te quieres hacer?'); assert.doesNotMatch(ultimo().texto, /Responde con el número/);
});

// =====================================================================
//  3.5 · FRENO ANTI-BOTS: listas/botones de otro bot, mensajes repetidos, publicidad, respuestas instantáneas
// =====================================================================
test('3.5 · Otro bot contesta al instante con un texto largo → se pausa; un mensaje DISTINTO después → vuelve a responder', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  const n0 = W.enviados.length;
  await llega(wahaMsg(CLIENTE, 'Parece que me mandaste un mensaje de otra parte por error 🙂 ¿Quieres que sigamos con las cuentas de streaming o necesitas algo más?'));
  assert.equal(W.enviados.length, n0, 'no le contesta al otro bot'); assert.match(ultimoRegistro(), /pausado/);
  await llega(wahaMsg(CLIENTE, 'Parece que me mandaste un mensaje de otra parte por error 🙂 ¿Quieres que sigamos con las cuentas de streaming o necesitas algo más?'));
  assert.equal(W.enviados.length, n0, 'el mismo mensaje otra vez: sigue pausado'); assert.match(ultimoRegistro(), /pausado/);
  await new Promise((ok) => setTimeout(ok, 5));
  P._banco.memHumano();   // (sin dueño de por medio)
  await llega(wahaMsg(CLIENTE, 'hay cupos hoy?'));
  assert.equal(W.enviados.length, n0 + 1, 'mensaje distinto: responde');
});
test('3.5 · Publicidad de una empresa (link + precio) → pausa; la misma publicidad repetida → sigue pausado', async () => {
  const promo = '🔥 PROMOCIÓN 50% de descuento en planes de internet desde $49.900 al mes. Escríbenos ya: https://promo.ejemplo.com';
  await llega(wahaMsg(CLIENTE, promo));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /publicidad/);
  await llega(wahaMsg(CLIENTE, promo));
  assert.equal(W.enviados.length, 0);
});
test('3.5 · Mensaje con listas o botones (de otro bot) → pausa', async () => {
  await llega(wahaMsg(CLIENTE, 'Elige una opción', { _data: { notifyName: 'Tienda X', Message: { listMessage: { title: 'Menú', sections: [] } } } }));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /listas o botones/);
});
test('3.5 · Una PERSONA tocando la lista rápido o escribiendo «1» dos veces en el agendamiento NO se pausa', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  await llega(toca('cat:0', 'Cortes'));           // tocar la lista al instante es normal
  await llega(toca('svc:c1', 'Corte clásico'));
  await llega(toca('mas:si')); await llega(wahaMsg(CLIENTE, '1'));   // «1» = Cortes otra vez (otra lista): no es repetición de bot
  assert.match(ultimo().texto, /Cortes/); assert.doesNotMatch(ultimoRegistro(), /pausado/);
});
test('3.5 · frenoRobot (reglas sueltas)', () => {
  const F = (x) => P.frenoRobot(Object.assign({ ahora: 100000, hist: { textos: [], pausa: false } }, x));
  assert.equal(F({ texto: 'hola, tienen cupo mañana?' }).responder, true);
  assert.equal(F({ texto: 'Gracias por comunicarte con nosotros. En breve te atenderemos.' }).responder, false);
  assert.equal(F({ texto: 'Te escribo porque quiero saber si atienden el sábado en la tarde', ultimoEnvio: 99000 }).responder, false, 'texto largo en 1 s');
  assert.equal(F({ texto: 'Te escribo porque quiero saber si atienden el sábado en la tarde', ultimoEnvio: 60000 }).responder, true, 'en 40 s sí es una persona');
  assert.equal(F({ texto: 'ok', hist: { textos: [['ok', 99000]], pausa: false } }).responder, true, '«ok» corto no cuenta como repetición');
  assert.equal(F({ texto: 'cuanto vale el corte', hist: { textos: [['cuanto vale el corte', 99000]], pausa: true } }).responder, false);
  assert.equal(F({ texto: 'y la barba?', hist: { textos: [['cuanto vale el corte', 99000]], pausa: true } }).responder, true);
  assert.equal(F({ texto: 'hola', hist: { textos: [['hola', 100000 - 13 * 3600000]], pausa: false } }).responder, true, 'un «hola» de ayer no cuenta');
});
