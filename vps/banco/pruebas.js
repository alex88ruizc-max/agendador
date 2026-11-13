// 🧪 BANCO DE PRUEBAS DE MARY DEL AGENDADOR: node --test banco/   (si una falla, actualizar.sh NO instala)
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../correo'), T = require('../textos'), E = require('../estado'), P = require('../principal');

test('lee montos colombianos', () => {
  assert.deepEqual(C.montos('Recibiste $15.000 de Ana'), [15000]);
  assert.deepEqual(C.montos('valor $ 45,000.00 COP'), [45000]);
  assert.deepEqual(C.montos('Te llegaron $15.000,00'), [15000]);
  assert.deepEqual(C.montos('monto: $20000'), [20000]);
  assert.deepEqual(C.montos('COP 1.250.000'), [1250000]);
  assert.deepEqual(C.montos('saldo $500'), []);
});
test('reconoce pagos recibidos y descarta lo demás', () => {
  const p = C.leerPago('Recibiste plata', 'Laura Gómez te envió $15.000 por Bre-B a tu llave @studiolua');
  assert.equal(p.amount, 15000); assert.match(p.payer, /Laura/);
  assert.equal(C.leerPago('Compraste en Éxito', 'Pagaste $15.000 con tu tarjeta'), null);
  assert.equal(C.leerPago('Código de verificación', 'Tu código es 123456'), null);
  assert.equal(C.leerPago('Nequi', 'Transferencia recibida por $ 20.000 de: CARLOS PEREZ').amount, 20000);
  assert.equal(C.leerPago('Promo', 'Gana $50.000 en premios'), null);
});
test('vistos recuerda por negocio', () => {
  const dir = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'v-'));
  const V = C.Vistos(dir); V.poner('a', 'm1');
  assert.equal(V.ya('a', 'm1'), true); assert.equal(V.ya('b', 'm1'), false);
  assert.equal(C.Vistos(dir).ya('a', 'm1'), true);
});
test('lee mensajes de Evolution: número, LID, grupos, fotos', () => {
  const m = P.leerMensaje({ event: 'messages.upsert', instance: 'lua', data: { key: { remoteJid: '573001234567@s.whatsapp.net', id: 'X1' }, pushName: 'Camila R', message: { conversation: 'hola, tienen cupo?' } } });
  assert.equal(m.tel, '573001234567'); assert.equal(m.texto, 'hola, tienen cupo?'); assert.equal(m.grupo, false); assert.equal(m.inst, 'lua');
  const lid = P.leerMensaje({ event: 'MESSAGES_UPSERT', data: { key: { remoteJid: '1234567890123@lid', remoteJidAlt: '573009998877@s.whatsapp.net' }, message: { conversation: 'hola' } } });
  assert.equal(lid.tel, '573009998877'); assert.equal(lid.evento, 'messages.upsert');
  const g = P.leerMensaje({ event: 'messages.upsert', data: { key: { remoteJid: '1203@g.us' }, message: { conversation: 'x' } } });
  assert.equal(g.grupo, true);
  const f = P.leerMensaje({ event: 'messages.upsert', data: { key: { remoteJid: '573001234567@s.whatsapp.net' }, message: { imageMessage: { mimetype: 'image/jpeg', caption: 'listo' }, base64: 'AAA' } } });
  assert.equal(f.media, 'image'); assert.equal(f.base64, 'AAA'); assert.equal(f.texto, 'listo');
});
test('números para WhatsApp', () => {
  assert.equal(P.numeroWa('3001234567'), '573001234567');
  assert.equal(P.numeroWa('+57 300 123 4567'), '573001234567');
  assert.equal(P.numeroWa('+584121234567'), '584121234567');
});
test('detecta preguntas concretas', () => {
  ['¿tienen cupo hoy?', 'quiero cambiar mi cita', 'ya pagué', 'R-7KQ2PX', 'cuánto vale'].forEach((t) => assert.ok(P.PREGUNTA.test(t), t));
  ['gracias', 'ok', '👍', 'listo', 'jaja'].forEach((t) => assert.ok(!P.PREGUNTA.test(t), t));
  ['Hola', 'buenas tardes', 'quiero confirmar', 'cancelar por favor', 'puedo reagendar?', 'dónde quedan'].forEach((t) => assert.ok(P.PREGUNTA.test(t), t));
});
const INFO = { negocio: 'Studio Lúa', link: 'https://tuagenda.vip/index.html?b=studio-lua', medios: [{ label: 'Bre-B', account: '@studiolua', holder: 'Laura Gómez' }], color: '#5B3FE0', categorias: ['Uñas', 'Pestañas', 'Cejas'] };
test('textos: sin cita lleva el link, con cita el link de la cita y el pago', () => {
  const s = T.sinCita(Object.assign({ cuposHoy: 6 }, INFO), T.saludo(INFO.negocio, 'camila rodriguez'));
  assert.match(s, /Hola Camila/); assert.match(s, /Soy el asistente de/); assert.doesNotMatch(s, /Mary/); assert.match(s, /6 cupos/); assert.ok(s.includes(INFO.link));
  const cita = { code: 'R-AAAAAA', status: 'pending_payment', dia: 'Hoy', hora: '3:30 p. m.', servicio: 'Semipermanente', con: 'Daniela', abono: 15000, saldo: 30000, link: INFO.link + '&cita=R-AAAAAA' };
  const c = T.conCita(Object.assign({ citas: [cita] }, INFO), '');
  assert.match(c, /\$15\.000/); assert.match(c, /@studiolua/); assert.ok(c.includes('&cita=R-AAAAAA'));
  assert.doesNotMatch(c, /undefined|null/);
  assert.match(T.decision(Object.assign({ decision: 'approved' }, cita)), /aprobado/);
  assert.match(T.decision(Object.assign({ decision: 'rejected', motivo: 'Rechazado desde Telegram', linkAgenda: INFO.link }, cita)), /cupo quedó libre/);
  assert.doesNotMatch(T.decision(Object.assign({ decision: 'rejected', motivo: 'Rechazado desde Telegram', linkAgenda: INFO.link }, cita)), /Telegram/);
});
test('estados: SVG válido y PNG 1080×1920', () => {
  const dia = { date: '2026-11-07', dia: 'Hoy', dow: 5, abierto: true, libres: ['14:00', '15:00'], horas: ['2:00 p. m.', '3:00 p. m.', '3:30 p. m.', '4:00 p. m.', '5:30 p. m.', '6:00 p. m.', '6:30 p. m.'] };
  const svg = E.svgHoy(INFO, dia);
  assert.match(svg, /^<svg/); assert.match(svg, /Cupos/); assert.match(svg, /SÁBADO 7 DE NOVIEMBRE/); assert.doesNotMatch(svg, /undefined|NaN/);
  const vacio = E.svgHoy(INFO, Object.assign({}, dia, { horas: [], libres: [] })); assert.match(vacio, /llena hoy/);
  const sem = E.svgSemana(INFO, [0, 1, 2, 3, 4, 5].map((i) => ({ date: '2026-11-' + String(10 + i).padStart(2, '0'), dow: (1 + i) % 7, abierto: true, libres: Array(9 - i).fill('x') })));
  assert.match(sem, /Tu semana/); assert.doesNotMatch(sem, /undefined|NaN/);
  const png = E.png(svg); assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1920);
  const fs = require('fs'), dir = process.env.DATOS || require('path').join(__dirname, '..', 'datos'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(require('path').join(dir, 'prueba-hoy.png'), png);
  fs.writeFileSync(require('path').join(dir, 'prueba-semana.png'), E.png(sem));
});
test('hora local de Colombia', () => { const a = P.ahoraLocal(); assert.match(a.fecha, /^\d{4}-\d{2}-\d{2}$/); assert.match(a.hm, /^\d{2}:\d{2}$/); assert.ok(a.dow >= 0 && a.dow <= 6); });

// ---------- 1.1: hallazgos del revisor ----------
test('1.1 · NO toma pagos enviados, promociones ni «recibió tu transferencia» como recibidos', () => {
  assert.equal(C.leerPago('Transferencia', 'Transferiste $15.000 a Juan por Bre-B'), null);
  assert.equal(C.leerPago('Bre-B', 'Realizaste una transferencia por Bre-B de $15.000 a Juan'), null);
  assert.equal(C.leerPago('Listo', 'Juan Pérez recibió tu transferencia de $15.000'), null);
  assert.equal(C.leerPago('Nequi', 'Registra tu llave Bre-B y gana hasta $50.000'), null);
  assert.equal(C.leerPago('Recibiste plata', 'Laura Gómez te envió $15.000').amount, 15000);
  assert.equal(C.leerPago('Bre-B', 'Recibiste $20.000 por Bre-B de CARLOS PEREZ').amount, 20000);
});
test('1.1 · estado de la semana: «Hoy» es solo hoy aunque hoy esté cerrado', () => {
  const dias = [{ date: '2026-11-08', dow: 0, abierto: false, libres: [] }, { date: '2026-11-09', dow: 1, abierto: true, libres: ['10:00'] }];
  const sem = E.svgSemana(INFO, dias);
  assert.doesNotMatch(sem, />Hoy</); assert.match(sem, />Lun</);
});
test('1.1 · estado de hoy: máximo 9 horas (no se esconden bajo el botón) y dice cuántas más', () => {
  const horas = Array.from({ length: 12 }, (_, i) => (i + 1) + ':00 p. m.');
  const svg = E.svgHoy(INFO, { date: '2026-11-07', horas, libres: horas, abierto: true });
  assert.equal((svg.match(/rx="40" fill="#FFFFFF"/g) || []).length, 9);
  assert.match(svg, /y 3 horas más/);
});
test('1.1 · fila por chat: mensajes seguidos del mismo chat van en orden y no se repiten', async () => {
  const orden = []; const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
  await Promise.all([P.enFila('a', async () => { await espera(30); orden.push(1); }), P.enFila('a', async () => { orden.push(2); }), P.enFila('b', async () => { orden.push(3); })]);
  assert.deepEqual(orden, [3, 1, 2]);
  assert.equal(P.yaVisto('id-1'), false); assert.equal(P.yaVisto('id-1'), true);
});
test('1.1 · estados en modo prueba: solo a los números de prueba', () => {
  assert.deepEqual(P.quienVeEstados('prueba', ['573001234567']), { allContacts: false, statusJidList: ['573001234567@s.whatsapp.net'] });
  assert.deepEqual(P.quienVeEstados('todos', []), { allContacts: true });
  assert.equal(P.quienVeEstados('apagado', []), null);
});

test('1.8 · cuándo responde Mary', () => {
  const conf = [{ status: 'confirmed' }], pend = [{ status: 'pending_payment' }];
  assert.equal(P.debeResponder({ texto: 'hola', pausadoPorDueno: true }), false, 'el dueño escribió: se calla');
  assert.equal(P.debeResponder({ texto: 'gracias', citas: conf }), false, 'cita confirmada + «gracias»: callada');
  assert.equal(P.debeResponder({ texto: 'jaja ok', citas: conf }), false);
  assert.equal(P.debeResponder({ texto: 'hola', citas: conf }), true, 'cita confirmada + saludo: responde');
  assert.equal(P.debeResponder({ texto: 'quiero cancelar', citas: conf }), true);
  assert.equal(P.debeResponder({ texto: 'me ayudas?', citas: [] }), true, 'sin cita: responde');
  assert.equal(P.debeResponder({ texto: 'ok', citas: [], reciente: true }), false, 'sin cita pero le respondió hace poco: no repite');
  assert.equal(P.debeResponder({ texto: 'ya te mandé', citas: pend }), true, 'falta pagar: responde');
  assert.equal(P.debeResponder({ texto: 'hola', citas: [], reciente: true, repetido: true }), false, 'ya le dijo lo mismo 2 veces');
});

test('2.2 · WAHA: mensajes, fotos y conexión se entienden igual que Evolution', () => {
  const m = P.deWaha({ event: 'message', session: 'lina-spa', payload: { id: 'false_573001234567@c.us_ABC', from: '573001234567@c.us', fromMe: false, body: 'hola, tienen cupo?', _data: { notifyName: 'Camila' } } });
  const c = P.leerMensaje(m);
  assert.equal(c.evento, 'messages.upsert'); assert.equal(c.tel, '573001234567'); assert.equal(c.texto, 'hola, tienen cupo?'); assert.equal(c.nombre, 'Camila'); assert.equal(c.deMi, false);
  const f = P.leerMensaje(P.deWaha({ event: 'message', session: 's', payload: { id: 'x', from: '573001234567@c.us', hasMedia: true, media: { url: 'http://waha:3000/api/files/s/x.jpeg', mimetype: 'image/jpeg' } } }));
  assert.equal(f.media, 'image'); assert.match(f.mediaUrl, /files/);
  const yo = P.leerMensaje(P.deWaha({ event: 'message.any', session: 's', payload: { id: 'true_573001234567@c.us_Z', from: '573110000000@c.us', to: '573001234567@c.us', fromMe: true, body: 'te atiendo yo' } }));
  assert.equal(yo.deMi, true); assert.equal(yo.tel, '573001234567');
  const g = P.leerMensaje(P.deWaha({ event: 'message', session: 's', payload: { id: 'g', from: '1203@g.us', body: 'x' } })); assert.equal(g.grupo, true);
  assert.deepEqual(P.deWaha({ event: 'session.status', session: 's', payload: { status: 'WORKING' }, me: { id: '573110000000@c.us' } }).data.state, 'open');
  assert.equal(P.deWaha({ event: 'presence.update', session: 's', payload: {} }), null);
});

test('2.6 · WAHA con número oculto (…@lid): encuentra el número real y no confunde el del negocio', () => {
  const c = P.leerMensaje(P.deWaha({ event: 'message', session: 'default', me: { id: '573110000000@c.us' }, payload: { id: 'L1', from: '123456789012345@lid', fromMe: false, body: 'hola', _data: { Info: { Chat: '123456789012345@lid', Sender: '123456789012345@lid', SenderAlt: '573001234567@s.whatsapp.net', MessageSource: { Recipient: '573110000000@s.whatsapp.net' } } } } }));
  assert.equal(c.tel, '573001234567');
  const sin = P.leerMensaje(P.deWaha({ event: 'message', session: 'default', me: { id: '573110000000@c.us' }, payload: { id: 'L2', from: '999@lid', body: 'hola', _data: { Info: { Recipient: '573110000000@s.whatsapp.net' } } } }));
  assert.equal(sin.tel, '', 'el número del negocio nunca se toma como el del cliente');
});

const GS_MARY = require('path').join(__dirname, '..', 'gs', 'mary.gs');
test('3.4 · Categorías automáticas (servicios sin categoría): El Barba queda en Cortes, Barba, Cejas, Diseños y Combos — panel y servidor con la MISMA regla', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const fs = require('fs'), path = require('path');
  const gs = fs.readFileSync(GS_MARY, 'utf8');
  const srv = new Function(gs.match(/function maryCatAuto_[\s\S]*?\n}\n/)[0] + '; return maryCatAuto_;')();
  const web = path.join(__dirname, '..', '..', 'common.js');
  const esperado = { 'Cejas': 'Cejas', 'Diseño o línea': 'Diseños', 'Corte + barba': 'Combos', 'Corte de tijera': 'Cortes', 'Corte clasico': 'Cortes', 'Corte + cejas': 'Combos', 'Arreglo de barba': 'Barba', 'Uñas en gel': 'Uñas', 'Lifting de pestañas': 'Pestañas', 'Keratina': 'Cabello' };
  for (const [n, c] of Object.entries(esperado)) assert.equal(srv(n), c, n);
  if (fs.existsSync(web)) {   // en el repositorio (en el VPS solo está el servidor)
    const src = fs.readFileSync(web, 'utf8').match(/export function categoriaAuto[\s\S]*?\n}\n/)[0].replace('export ', '');
    const panel = new Function(src + '; return categoriaAuto;')();
    for (const n of Object.keys(esperado)) assert.equal(panel(n), srv(n), 'panel ≠ servidor en «' + n + '»');
  }
});

test('3.7 · Cita rápida SIN WhatsApp (pasar citas de antes): se guarda con el nombre y sin WhatsApp; con WhatsApp va la función de siempre', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const commits = [], llamadasOriginal = [];
  const G = {
    ACTIONS: { createManualAppointment: (b) => { llamadasOriginal.push(b); return { original: true }; } }, PUBLIC_ACTIONS: {},
    getAdmin: () => ({ role: 'owner' }), loadSettings: () => ({ slotDurationMinutes: 30 }),
    computeItems: () => ({ items: [{ id: 'c1', name: 'Corte' }], totalMinutes: 40, totalCOP: 20000 }), occupiedFor: (m) => 45,
    loadServices: () => [], loadStaff: () => [{ _id: 's1', name: 'Lina' }], checkSlot: () => {}, withLock: (fn) => fn(),
    reserveLocks: () => ({ all: ['l1'], create: ['l1'] }), newCode: () => 'R-MIGRA1', wCreate: (p, d) => ({ p, d }), lockWrites: () => [], incWrites: () => [], addDelta: () => ({}),
    commit: (w) => commits.push(...w), bp: (x) => x, mstr: () => '15:45', tmin: () => 900, mkDate: () => new Date(), tgEventOn: () => false, tgNotify: () => {}, aptText: () => '',
    emailClient: () => {}, aptPublic: (a) => a, fail: (m) => { const e = new Error(m); e.userMessage = m; throw e; }, console
  };
  const fn = new Function(...Object.keys(G), src + '\nreturn ACTIONS;');
  const A = fn(...Object.values(G));
  const base = { mainId: 'c1', staffId: 's1', date: '2026-11-20', time: '15:00', paymentMethod: 'local' };
  assert.deepEqual(A.createManualAppointment(Object.assign({ customer: { whatsapp: '3001234567', firstName: 'Ana' } }, base), { uid: 'u' }), { original: true });
  const r = A.createManualAppointment(Object.assign({ customer: { whatsapp: '', firstName: 'Pedro Pérez' } }, base), { uid: 'u' });
  assert.equal(r.appointment.code, 'R-MIGRA1'); assert.equal(r.appointment.customer.whatsapp, ''); assert.equal(r.appointment.customer.firstName, 'Pedro Pérez');
  assert.equal(llamadasOriginal.length, 1, 'sin WhatsApp no pasa por la función que lo exige');
  assert.throws(() => A.createManualAppointment(Object.assign({ customer: { whatsapp: '', firstName: '' } }, base), { uid: 'u' }), /nombre o el WhatsApp/);
});

test('3.20 · 🔒 Bloquear cupos: crea bloqueos de 15 min para todo el equipo, respeta lo ocupado, liberar quita solo esa hora', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const DB = { 'slotLocks/s1_20261120_1500': { staffId: 's1', date: '2026-11-20', time: '15:00', state: 'booked', appointmentId: 'R-X' } };
  let admin = { role: 'owner' };
  const tmin = (t) => { const p = t.split(':'); return +p[0] * 60 + +p[1]; }, mstr = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const G = {
    ACTIONS: {}, PUBLIC_ACTIONS: {}, console,
    getAdmin: () => Object.assign({ staffId: 's2' }, admin), loadSettings: () => ({ slotDurationMinutes: 30 }),
    loadStaff: () => [{ _id: 's1', name: 'Lina' }, { _id: 's2', name: 'Andrés' }, { _id: 's3', name: 'Inactivo', active: false }],
    toDateStr: () => '2026-11-12', lockId: (s, d, t) => s + '_' + d.replace(/-/g, '') + '_' + t.replace(':', ''),
    unitTimes: (time, occ) => { const o = []; for (let t = tmin(time); t < tmin(time) + occ; t += 15) o.push(mstr(t)); return o; },
    withLock: (fn) => fn(), bp: (x) => x, addDelta: (d) => d, incWrites: () => [],
    fsBatchGet: (paths) => Object.fromEntries(paths.filter((p) => DB[p]).map((p) => [p, DB[p]])),
    fsQuery: () => Object.entries(DB).map(([k, v]) => Object.assign({ _id: k.split('/')[1] }, v)),
    wCreate: (p, d) => ({ create: p, d }), wDelete: (p) => ({ del: p }),
    commit: (w) => w.forEach((x) => { if (x.create) DB[x.create] = x.d; if (x.del) delete DB[x.del]; }),
    fail: (m) => { throw new Error(m); }
  };
  const A = new Function(...Object.keys(G), src + '\nreturn ACTIONS;')(...Object.values(G));
  let r = A.bloquearCupo({ date: '2026-11-20', times: ['15:00'], accion: 'bloquear' }, { uid: 'dueno' });
  assert.equal(r.bloqueados, 3, '2 profesionales × 2 bloques de 15 min, menos el que ya tenía cita');
  assert.equal(DB['slotLocks/s1_20261120_1500'].state, 'booked', 'la cita que ya estaba no se toca');
  assert.equal(DB['slotLocks/s2_20261120_1515'].state, 'block'); assert.equal(DB['slotLocks/s2_20261120_1515'].bloqueo, '15:00');
  assert.ok(!Object.keys(DB).some((k) => k.includes('s3_')), 'los inactivos no');
  A.bloquearCupo({ date: '2026-11-20', times: ['16:00', '16:30'], accion: 'bloquear' }, { uid: 'dueno' });
  r = A.bloquearCupo({ date: '2026-11-20', times: ['15:00'], accion: 'desbloquear' }, { uid: 'dueno' });
  assert.equal(r.liberados, 3); assert.ok(DB['slotLocks/s1_20261120_1600'], 'liberar las 3:00 no toca las 4:00');
  assert.ok(DB['slotLocks/s1_20261120_1500'], 'ni la cita');
  r = A.bloquearCupo({ date: '2026-11-20', times: ['19:00'], accion: 'bloquear', staffId: 's1' }, { uid: 'dueno' });
  assert.equal(r.bloqueados, 2, '3.30: el dueño bloquea a UN profesional (Lina) y Andrés sigue libre'); assert.ok(DB['slotLocks/s1_20261120_1900'] && !DB['slotLocks/s2_20261120_1900']);
  admin = { role: 'staff' };
  r = A.bloquearCupo({ date: '2026-11-20', times: ['18:00'], accion: 'bloquear' }, { uid: 'andres' });
  assert.equal(r.bloqueados, 2, 'un profesional solo bloquea lo suyo'); assert.ok(DB['slotLocks/s2_20261120_1800'] && !DB['slotLocks/s1_20261120_1800']);
  assert.throws(() => A.bloquearCupo({ date: '2026-11-01', times: ['10:00'] }, { uid: 'dueno' }), /ya pasaron/);
});

test('3.28 · Días con cupo (servidor): lee servicios y equipo UNA vez y no consulta la base en días que nadie atiende', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const n = { servicios: 0, equipo: 0, locks: 0 };
  const tmin = (t) => { const p = t.split(':'); return +p[0] * 60 + +p[1]; }, mstr = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const dia = (i) => new Date(Date.UTC(2030, 0, 1 + i)).toISOString().slice(0, 10);   // 2030-01-01 es martes
  let hoy = 0;
  const G = {
    ACTIONS: {}, PUBLIC_ACTIONS: {}, console, fail: (m) => { throw new Error(m); },
    loadServices: () => { n.servicios++; return [{ _id: 'c1', name: 'Corte', minutes: 30, priceCOP: 20000 }]; },
    loadStaff: () => { n.equipo++; return [{ _id: 's1', name: 'Lina' }]; },
    fsQuery: (col) => { if (col === 'slotLocks') n.locks++; return []; },
    plansCfg: () => ({ basic: { daysAhead: 30 } }), bizPlan: () => 'basic',
    toDateStr: (d) => dia(Math.round((d.getTime() - Date.now()) / 86400000) + hoy), waDayLabel: (d) => d,
    staffHoursFor: (st, sf, date) => new Date(date + 'T12:00:00Z').getUTCDay() === 0 ? [] : [{ open: '09:00', close: '10:00' }],   // los domingos no atiende
    siteUrl: () => 'https://x', BID: 'b', occupiedFor: () => 30, tmin, mstr, mkDate: () => new Date(Date.now() + 86400000 * 400), unitTimes: (t) => [t]
  };
  const F = new Function(...Object.keys(G), src + '\nreturn { maryDias_ };')(...Object.values(G));
  const r = F.maryDias_({ slotDurationMinutes: 30, bookingWindowDays: 30 }, { ids: ['c1'], staffId: '' });
  assert.equal(r.dias.length, 10); assert.equal(r.dias[0].n, 2, '9:00 y 9:30');
  assert.equal(n.servicios, 1, 'los servicios se leen una sola vez'); assert.equal(n.equipo, 1, 'el equipo una sola vez');
  assert.ok(!r.dias.some((x) => new Date(x.date + 'T12:00:00Z').getUTCDay() === 0), 'el domingo no sale');
  assert.equal(n.locks, 10, 'solo se consulta la base en los días que alguien atiende');
});

test('3.30 · «✅ WhatsApp vinculado» llega a Telegram SOLO cuando se vincula de verdad (no en cada reinicio del VPS)', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  let ajustes = {}; const tg = [], commits = [];
  const cache = { put() {}, remove() {}, get() { return null; } };
  const G = {
    ACTIONS: {}, PUBLIC_ACTIONS: {}, console, fail: (m) => { throw new Error(m); },
    CacheService: { getScriptCache: () => cache }, PropertiesService: { getScriptProperties: () => ({ deleteProperty() {} }) },
    loadSettings: () => ajustes, bp: (x) => x, docName: (x) => x, fp: (x) => x.join('.'),
    wPatch: (p, d) => ({ p, d }), commit: (w) => { commits.push(...w); w.forEach((x) => { if (x.d && x.d.maryWa) ajustes = Object.assign({}, ajustes, { maryWa: x.d.maryWa }); }); },
    tgSys: (m) => tg.push(m), esc: (x) => x, BID: 'b', encFields: (x) => x
  };
  const F = new Function(...Object.keys(G), src + '\nreturn { maryWaResultado_ };')(...Object.values(G));
  F.maryWaResultado_({ estado: 'conectado', numero: '573117604262' });
  assert.equal(tg.length, 1, 'la primera vez sí avisa');
  F.maryWaResultado_({ estado: 'conectado', numero: '573117604262' });
  F.maryWaResultado_({ estado: 'conectado', numero: '573117604262' });
  assert.equal(tg.length, 1, 'reinicios del VPS con el MISMO número: no repite el aviso');
  F.maryWaResultado_({ estado: 'conectado', numero: '573187920386' });
  assert.equal(tg.length, 2, 'otro número: sí avisa');
  F.maryWaResultado_({ estado: 'desconectado' }); F.maryWaResultado_({ estado: 'conectado', numero: '573187920386' });
  assert.equal(tg.length, 3, 'desvinculó y volvió a vincular: sí avisa');
});

// ---------- 3.30 · 💰 cupos calculados en el VPS (sin Google) ----------
const CL = require('../cuposLocal');
const fsVal = (v) => v === null ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(fsVal) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fsVal(x)])) } };
function baseFalsa(D, cuenta) {
  const docu = (name, o) => ({ name, fields: fsVal(o).mapValue.fields });
  return async (u, o) => {
    cuenta.n++;
    const ok = (j) => ({ ok: true, status: 200, json: async () => j });
    if (/\/settings\/general\?/.test(u)) return ok(docu('x/settings/general', D.st));
    if (/\/staff\?/.test(u)) return ok({ documents: D.staff.map((x) => docu('x/staff/' + x.id, x)) });
    if (/\/services\?/.test(u)) return ok({ documents: D.servicios.map((x) => docu('x/services/' + x.id, x)) });
    if (/:runQuery\?/.test(u)) { const f = JSON.parse(o.body).structuredQuery.where.fieldFilter.value.stringValue; return ok(D.locks.filter((l) => l.date === f).map((l) => ({ document: docu('x/slotLocks/' + l.staffId + l.time, l) }))); }
    return { ok: false, status: 404, json: async () => ({}) };
  };
}
const SEMANA = { '1': [{ open: '09:00', close: '12:00' }, { open: '14:00', close: '18:00' }], '2': [{ open: '09:00', close: '18:00' }], '3': [{ open: '09:00', close: '18:00' }], '4': [{ open: '09:00', close: '18:00' }], '5': [{ open: '09:00', close: '19:00' }], '6': [{ open: '08:00', close: '14:00' }] };
function mundoCupos() {
  return {
    st: { slotDurationMinutes: 30, minAdvanceMinutes: 60, bookingWindowDays: 30, closedDates: ['2030-01-04'], businessHours: SEMANA },
    staff: [{ id: 's1', name: 'Gabriel', active: true }, { id: 's2', name: 'Yeferson', active: true, ownHours: true, hours: { '2': [{ open: '13:00', close: '20:00' }] }, offDates: ['2030-01-08'], serviceIds: ['c1'] }, { id: 's3', name: 'Inactivo', active: false }],
    servicios: [{ id: 'c1', name: 'Corte', minutes: 30, active: true }, { id: 'c2', name: 'Corte + barba', minutes: 45, active: true }, { id: 'x', name: 'Viejo', minutes: 30, active: false }],
    locks: [{ staffId: 's1', date: '2030-01-01', time: '10:00', state: 'booked' }, { staffId: 's1', date: '2030-01-01', time: '10:15', state: 'booked' }, { staffId: 's2', date: '2030-01-01', time: '15:00', state: 'block' }]
  };
}
const AHORA = () => ({ fecha: '2030-01-01', min: 9 * 60 + 10 });   // martes 1 de enero de 2030, 9:10 a. m.

test('3.30 · Cupos en el VPS = las MISMAS horas que calcula la página (computeSlots) para varios servicios, días y profesionales', { skip: !require('fs').existsSync(require('path').join(__dirname, '..', '..', 'common.js')) && 'sin la página aquí' }, () => {
  const web = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'common.js'), 'utf8');
  const fuente = ['export function staffHours', 'export function computeSlots'].map((n) => web.slice(web.indexOf(n), web.indexOf('\n}\n', web.indexOf(n)) + 3).replace('export ', '')).join('\n');
  const dowW = (f) => { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  const addDays = (f, n) => { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
  const pagina = new Function('tmin', 'mstr', 'UNIT', 'bogNow', 'addDays', 'dow', fuente + '; return computeSlots;')(
    (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; }, (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'), 15, () => ({ date: AHORA().fecha, min: AHORA().min }), addDays, dowW);
  const M = mundoCupos(), staffP = M.staff.map((x) => Object.assign({}, x));
  let casos = 0;
  for (const date of ['2030-01-01', '2030-01-02', '2030-01-04', '2030-01-05', '2030-01-06', '2030-01-07', '2030-01-08'])
    for (const [ids, mins] of [[['c1'], 30], [['c2'], 45], [['c1', 'c2'], 75]])
      for (const staffId of ['', 's1', 's2']) {
        const vps = CL.libres({ st: M.st, staff: M.staff, servicios: M.servicios, locks: M.locks, date, ids, staffId, ahora: AHORA() });
        const web2 = pagina({ settings: M.st, staffList: staffP.filter((x) => !x.serviceIds || ids.every((i) => x.serviceIds.includes(i))), locks: M.locks.filter((l) => l.date === date), date, totalMinutes: mins, staffFilter: staffId || undefined });
        assert.deepEqual(vps, web2, date + ' ' + ids.join('+') + ' ' + (staffId || 'todos')); casos++;
      }
  assert.equal(casos, 63);
});
test('3.30 · horas / días / cupos salen de la base (sin Google) con el formato que espera el asistente; los domingos y días cerrados ni se consultan', async () => {
  const M = mundoCupos(), n = { n: 0 };
  const L = CL.crear({ fetch: baseFalsa(M, n), url: 'https://fs', proyecto: 'p', llave: 'k', ahora: AHORA });
  const h = await L.horas('elbarba', { ids: ['c1'], date: '2030-01-01', staffId: '' });
  assert.equal(h.dia, 'Hoy'); assert.equal(h.horas[0].time, '10:30', '9:10 + 60 min de anticipación; 10:00 lo tiene Gabriel ocupado… y Yeferson empieza a la 1');
  assert.equal(h.horas[0].hora, '10:30 a. m.'); assert.deepEqual(h.horas.find((x) => x.time === '13:00').staff, [{ id: 's1', nombre: 'Gabriel' }, { id: 's2', nombre: 'Yeferson' }]);
  assert.ok(!h.horas.find((x) => x.time === '15:00').staff.some((s) => s.id === 's2'), 'el bloqueo de Yeferson a las 3 cuenta');
  const d = await L.dias('elbarba', { ids: ['c2'] });
  assert.equal(d.dias[0].dia, 'Hoy'); assert.equal(d.dias[1].dia, 'Mañana'); assert.equal(d.dias.length, 10);
  assert.ok(!d.dias.some((x) => x.date === '2030-01-04'), 'día cerrado'); assert.ok(!d.dias.some((x) => x.date === '2030-01-06'), 'domingo');
  assert.equal(d.dias.find((x) => x.date === '2030-01-07').dia, 'Lunes 7 de enero');
  const c = await L.cupos('elbarba', { dias: 3 });
  assert.equal(c.dias.length, 3); assert.equal(c.dias[0].libres[0], '10:30'); assert.equal(c.dias[0].horas[0], '10:30 a. m.');
  const antes = n.n; await L.horas('elbarba', { ids: ['c1'], date: '2030-01-01' });
  assert.equal(n.n, antes, 'lo recién leído se guarda un momento en memoria (no repite lecturas)');
});
test('3.30 · Si la base no deja leer → falla (y el VPS usa Google como antes)', async () => {
  const L = CL.crear({ fetch: async () => ({ ok: false, status: 403, json: async () => ({}) }), url: 'https://fs', proyecto: 'p', llave: 'k', ahora: AHORA });
  await assert.rejects(() => L.horas('elbarba', { ids: ['c1'], date: '2030-01-01' }), /403/);
});
test('3.30 · Servidor: el nombre del cliente sale de sus datos en el negocio (por WhatsApp o registrado en la página con +57…)', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const DB = { 'customers/wa3001112233': { firstName: 'Cliente' } }, Q = { '+573136320094': [{ firstName: 'Nicolas', lastName: 'Camacho Pérez' }] };
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, bp: (x) => x, fsGet: (p) => DB[p] || null, fsQuery: (col, f) => (col === 'customers' ? Q[f[0][2]] || [] : []), fail: (m) => { throw new Error(m); } };
  const F = new Function(...Object.keys(G), src + '\nreturn { maryNombreCliente_ };')(...Object.values(G));
  assert.equal(F.maryNombreCliente_('573136320094'), 'Nicolas Camacho');
  assert.equal(F.maryNombreCliente_('573001112233'), '', '«Cliente» no es un nombre');
  DB['customers/wa3001112233'] = { firstName: 'Ana', lastName: 'Ruiz' }; assert.equal(F.maryNombreCliente_('3001112233'), 'Ana Ruiz');
});
test('3.32 · 🔁 Recordatorio de servicio (servidor): solo clientes cuya ÚLTIMA visita fue hace N días, sin cita próxima, sin aviso previo; máximo 20', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const HOY = Date.UTC(2030, 0, 31, 15), dia = (n) => new Date(HOY - n * 86400000).toISOString().slice(0, 10);
  const cita = (code, n, wa, x) => Object.assign({ code, date: dia(n), startTime: '10:00', status: 'attended', customer: { whatsapp: wa, firstName: 'Cli ' + code }, items: [{ id: 'c1', name: 'Corte' }], staffId: 's1', staffName: 'Gabriel', startAt: new Date(HOY - n * 86400000) }, x || {});
  const A = [
    cita('A', 21, '573000000001'),                                   // le toca
    cita('B', 21, '573000000002'), cita('B2', 5, '573000000002'),    // volvió hace 5 días: su última visita es reciente
    cita('C', 22, '573000000003'),                                   // le toca (margen)
    cita('D', 21, '573000000004', { maryVolver: true }),            // ya se le escribió
    cita('E', 21, '573000000005', { status: 'cancelled' }),         // cancelada no cuenta
    cita('F', 40, '573000000006'),                                   // muy vieja
    cita('G', 21, '573000000007')                                    // tiene cita próxima
  ];
  const futura = { code: 'G2', status: 'confirmed', customer: { whatsapp: '573000000007' }, startAt: new Date(HOY + 86400000) };
  let bot = { activo: true, volver: { activo: true, dias: 21 } };
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, ACTIVE: ['pending_payment', 'pending_verification', 'confirmed'], BIZ: { name: 'Barba' }, Date: class extends Date { constructor(...a) { if (a.length) super(...a); else super(HOY); } static now() { return HOY; } },
    toDateStr: (d) => d.toISOString().slice(0, 10), fsQuery: (col, f) => f[0][0] === 'status' ? (f[0][2] === 'confirmed' ? [futura] : []) : A.filter((a) => a.date === f[0][2]),
    waDayLabel: (d) => d, hora12: (t) => t, siteUrl: () => 'https://x', BID: 'b', fail: (m) => { throw new Error(m); } };
  const correr = () => new Function(...Object.keys(G), 'BOT', src + '\nreturn maryVolver_({ maryBot: BOT, businessName: "Barba" }, {});')(...Object.values(G), bot);
  const r = correr();
  assert.deepEqual(r.clientes.map((x) => x.code).sort(), ['A', 'C']);
  const a = r.clientes.find((x) => x.code === 'A'); assert.deepEqual(a.ids, ['c1']); assert.equal(a.staffId, 's1'); assert.equal(a.con, 'Gabriel'); assert.equal(a.diasDesde, 21); assert.equal(a.whatsapp, '573000000001');
  bot = { activo: true, volver: { activo: true, dias: 0 } }; assert.deepEqual(correr().clientes, [], 'sin días elegidos por el dueño: no sale');
  bot = { activo: true, volver: { activo: false, dias: 21 } }; assert.deepEqual(correr().clientes, [], 'apagado: no sale');
});

test('3.37 · 📊 Servidor: guarda el resumen del día y el reporte suma un rango (personas sin repetir)', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const DB = {}; let rol = 'owner';
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, fail: (m) => { throw new Error(m); }, bp: (x) => x, wSet: (p, d) => ({ p, d }), commit: (w) => w.forEach((x) => { DB[x.p] = x.d; }),
    fsBatchGet: (L) => Object.fromEntries(L.filter((p) => DB[p]).map((p) => [p, DB[p]])), getAdmin: () => ({ role: rol }), toDateStr: (d) => d.toISOString().slice(0, 10) };
  const F = new Function(...Object.keys(G), src + '\nreturn { maryEstadisticas_, ACTIONS };')(...Object.values(G));
  F.maryEstadisticas_({ fecha: '2030-01-01', n: { mensajes: 10, listas: 3, malo$: 5 }, personas: ['aaaaaaaaaa', 'bbbbbbbbbb', '573001234567'], listas: ['aaaaaaaaaa'] });
  F.maryEstadisticas_({ fecha: '2030-01-03', n: { mensajes: 4, volverOk: 1 }, personas: ['aaaaaaaaaa', 'cccccccccc'], listas: ['cccccccccc'] });
  assert.deepEqual(DB['stats/2030-01-01'].personas, ['aaaaaaaaaa', 'bbbbbbbbbb'], 'un número de teléfono no se guarda'); assert.equal(DB['stats/2030-01-01'].wa.malo$, undefined);
  const r = F.ACTIONS.maryReporte({ desde: '2030-01-01', hasta: '2030-01-31' }, {});
  assert.equal(r.tot.mensajes, 14); assert.equal(r.tot.volverOk, 1); assert.equal(r.personas, 3, 'aaaa contada una sola vez'); assert.equal(r.listas, 2);
  assert.equal(F.ACTIONS.maryReporte({ desde: '2030-01-02', hasta: '2030-01-02' }, {}).tot.mensajes, undefined);
  rol = 'staff'; assert.throws(() => F.ACTIONS.maryReporte({ desde: '2030-01-01', hasta: '2030-01-02' }, {}), /Solo el dueño/);
});

test('3.38 · 🏷️ Servidor: el superusuario activa o quita el adicional «sin marca de agua» (y la info lo dice)', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const DB = { 'businesses/elbarba': { name: 'Barba', addons: { otro: 1 } } }, llamadas = [];
  const G = { ACTIONS: { superUpdateBusiness: (b) => { llamadas.push(b); if (b.noSuper) throw new Error('Solo el superusuario'); return { ok: true }; } }, PUBLIC_ACTIONS: {}, console,
    fsGet: (p) => DB[p] || null, wPatch: (p, d) => ({ p, d }), commit: (w) => w.forEach((x) => { DB[x.p] = Object.assign({}, DB[x.p], x.d); }), fail: (m) => { throw new Error(m); } };
  const A = new Function(...Object.keys(G), src + '\nreturn ACTIONS;')(...Object.values(G));
  A.superUpdateBusiness({ businessId: 'elbarba', sinMarca: true }, {});
  assert.deepEqual(DB['businesses/elbarba'].addons, { otro: 1, sinMarca: true }, 'no borra otros adicionales');
  A.superUpdateBusiness({ businessId: 'elbarba', sinMarca: false }, {}); assert.equal(DB['businesses/elbarba'].addons.sinMarca, false);
  assert.throws(() => A.superUpdateBusiness({ businessId: 'elbarba', sinMarca: true, noSuper: true }, {}), /superusuario/); assert.equal(DB['businesses/elbarba'].addons.sinMarca, false, 'sin permiso no cambia');
  assert.equal(llamadas.length, 3, 'siempre pasa por la acción original (que revisa al superusuario)');
});
test('3.41 · 💳 Pago del plan: Bre-B al precio exacto; link Nequi/Bancolombia y otros bancos con la comisión de Wompi (siempre te llega el precio completo); montos únicos', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const DB = { 'platform/public': { brebEnabled: true, brebKey: '@llave', nequiLink: 'https://checkout.nequi.wompi.co/l/X' } }; let n = 0;
  const G = { ACTIONS: { createPlanOrder: (b) => { const id = 'barba_' + (++n); const o = { id, businessId: 'barba', baseCOP: 35000, amountCOP: 35000 + (b.ocupado ? 1 : 0), status: 'pending', expiresAt: new Date(Date.now() + 1800000), months: 1, plan: 'gold' }; DB['platformOrders/' + id] = o; return o; } }, PUBLIC_ACTIONS: {}, console,
    fsGet: (p) => DB[p] || null, fsQueryAt: (r, col) => Object.entries(DB).filter(([k, v]) => k.startsWith('platformOrders/') && v.status === 'pending').map(([k, v]) => v),
    wPatch: (p, d) => ({ p, d }), commit: (w) => w.forEach((x) => { DB[x.p] = Object.assign({}, DB[x.p], x.d); }), bp: (x) => 'b/' + x, toMillis: (v) => new Date(v).getTime(), ORDER_GRACE_HOURS: 3, fail: (m) => { throw new Error(m); } };
  const F = new Function(...Object.keys(G), src + '\nreturn { ACTIONS, pagoConComision_, montosPago_, PAGO_SI, PAGO_NO };')(...Object.values(G));
  // las cuentas: lo que queda después de la comisión (con IVA) nunca es menos que el precio
  for (const [base, met, pct] of [[35000, 'nequi', 0.015], [35000, 'banco', 0.0269], [20000, 'nequi', 0.015], [20000, 'banco', 0.0269], [100000, 'banco', 0.0269]]) {
    const v = F.pagoConComision_(base, met), llega = v - Math.round(v * pct) - Math.round(v * pct * 0.19);
    assert.ok(llega >= base && llega - base < 20, base + ' ' + met + ' → ' + v + ' llega ' + llega);
  }
  assert.equal(F.pagoConComision_(35000, 'nequi'), 35640); assert.equal(F.pagoConComision_(35000, 'banco'), 36160); assert.equal(F.pagoConComision_(35000, 'breb'), 35000);
  const a = F.ACTIONS.createPlanOrder({ metodo: 'breb' }, {}); assert.equal(a.amountCOP, 35000);
  const b = F.ACTIONS.createPlanOrder({ metodo: 'nequi' }, {}); assert.equal(b.amountCOP, 35640); assert.equal(b.comisionCOP, 640); assert.equal(DB['platformOrders/' + b.id].metodo, 'nequi');
  const c = F.ACTIONS.createPlanOrder({ metodo: 'nequi' }, {}); assert.equal(c.amountCOP, 35641, 'otra tienda pagando a la vez: +$1 (como en Epic)');
  assert.equal(F.ACTIONS.createPlanOrder({ metodo: 'raro' }, {}).metodo, 'breb', 'forma desconocida = Bre-B');
  DB['platform/public'].nequiLink = ''; assert.throws(() => F.ACTIONS.createPlanOrder({ metodo: 'banco' }, {}), /no está disponible/);
  // el correo real de Nequi Negocios (Wompi)
  const correo = 'Transacción APROBADA en ALEX alexander ruiz - ref. APP-1794535061767 Venta exitosa por $35,640 Método de pago de Wompi Monto: COP $35,640 Estado: APROBADA Método de pago: Nequi';
  assert.ok(F.PAGO_SI.test(correo) && !F.PAGO_NO.test(correo)); assert.ok(F.montosPago_(correo).includes(35640));
  assert.ok(F.PAGO_NO.test('Transacción RECHAZADA por $35,640'), 'un pago rechazado nunca activa');
  assert.ok(F.montosPago_('Recibiste $35.000 de Laura por Bre-B').includes(35000), 'Bre-B sigue igual');
  // el correo REAL de una venta por la llave Bre-B de Nequi Negocios (otro formato: «$ 2.000» con espacio y punto)
  const breb = 'Detalle de tu venta por Bre-B Venta exitosa por $ 35.000 Detalle de la venta Monto: $ 35.000 Estado: Aprobada Fecha: 12/11/2026 10:19:36 Pagador: LEONARDO FAJARDO Banco: Nequi Referencia: M05565670 Método de pago: QR Negocios Bre-B';
  assert.ok(F.PAGO_SI.test(breb) && !F.PAGO_NO.test(breb), 'el correo de la llave Bre-B se reconoce'); assert.deepEqual(F.montosPago_(breb), [35000, 35000]);
});
test('3.41 · 💳 El lector del Gmail del servidor activa SOLO el pedido con el monto exacto (los pagos de Epic y los rechazados se ignoran)', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8'), ahora = Date.now();
  const orden = { id: 'barba_1', businessId: 'barba', businessName: 'Barba', amountCOP: 35640, metodo: 'nequi', comisionCOP: 640, status: 'pending', createdAt: new Date(ahora - 600000), expiresAt: new Date(ahora + 1200000), months: 1, plan: 'gold', creditCOP: 0 };
  const DB = { 'platform/public': { brebEnabled: true }, 'platformOrders/barba_1': orden }, pagados = [], avisos = [], etiquetados = [];
  const msg = (sub, body) => ({ getSubject: () => sub, getPlainBody: () => body, getDate: () => new Date(ahora - 60000) });
  const hilos = [
    { m: [msg('Transacción APROBADA en ALEX', 'Venta exitosa por $52,000 Estado: APROBADA')], tag: 'epic' },            // pago de Epic: no coincide
    { m: [msg('Transacción RECHAZADA en ALEX', 'Venta por $35,640 Estado: RECHAZADA')], tag: 'rechazado' },
    { m: [msg('Transacción APROBADA en ALEX alexander ruiz', 'Venta exitosa por $35,640 Monto: COP $35,640 Estado: APROBADA')], tag: 'bueno' }
  ].map((h) => ({ getMessages: () => h.m, addLabel: () => etiquetados.push(h.tag) }));
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, BID: '', fsGet: (p) => DB[p] || null, fsQueryAt: () => Object.values(DB).filter((v) => v.status === 'pending'),
    GmailApp: { getUserLabelByName: () => ({}), createLabel: () => ({}), search: (q) => { assert.match(q, /^from:\(nequi\) newer_than:2d -label:agendador-ok$/); return hilos; } },
    setBusiness: () => {}, registerPlanPayment: (m, a, nota) => { pagados.push([a, nota]); return { paidUntil: '2026-12-13' }; },
    wPatch: (p, d) => ({ p, d }), commit: (w) => w.forEach((x) => { if (DB[x.p]) Object.assign(DB[x.p], x.d); }), bp: (x) => x, toMillis: (v) => new Date(v).getTime(), ORDER_GRACE_HOURS: 3,
    superNotify: (t) => avisos.push(t), esc: (x) => x, cop: (n) => '$' + n, fechaLarga: (d) => d, fail: (m) => { throw new Error(m); } };
  const F = new Function(...Object.keys(G), src + '\nreturn { revisarPagosBreb };')(...Object.values(G));
  F.revisarPagosBreb();
  assert.deepEqual(pagados, [[35640, 'link de Nequi automático']], 'solo el pago correcto activa el plan');
  assert.equal(DB['platformOrders/barba_1'].status, 'paid'); assert.deepEqual(etiquetados, ['bueno']);
  assert.match(avisos[0], /Pago de plan recibido.*link de Nequi/s); assert.match(avisos[0], /640 de comisión/);
});

test('3.42 · 🚀 El correo trae al pie «Crea la tuya gratis» (abre la prueba) y NO sale con el adicional «sin marca»', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'gs', 'correo.gs'), 'utf8');
  const pie = src.slice(src.indexOf('3.42 · una sola línea'), src.indexOf('// 📅 3.0 · invitación'));
  assert.match(pie, /BIZ\.addons\.sinMarca/, 'respeta el adicional sin marca');
  assert.match(pie, /Crea la tuya gratis/);
  assert.match(pie, /tuagenda\.vip\/\?probar=1/, 'abre directo «Probar gratis»');
});

test('3.44 · 📅 Días para reservar: MANDA EL SÚPER PANEL (el 5 guardado al crear la tienda ya no limita; el dueño solo puede poner menos si lo eligió)', () => {
  const { ventana } = require('../cuposLocal');
  const plat = { plans: { free: { daysAhead: 30 }, basic: { daysAhead: 45 }, gold: { daysAhead: 120 } } };
  assert.equal(ventana({ bookingWindowDays: 5 }, { trial: true }, plat), 30, 'prueba: 30 del súper panel aunque se guardó 5 al crear');
  assert.equal(ventana({ bookingWindowDays: 5 }, { plan: 'gold' }, plat), 120, 'subió a Gold: los días de Gold');
  assert.equal(ventana({ bookingWindowDays: 10, bookingWindowOwner: true }, { plan: 'gold' }, plat), 10, 'el dueño eligió menos: se respeta');
  assert.equal(ventana({ bookingWindowDays: 500, bookingWindowOwner: true }, { plan: 'basic' }, plat), 45, 'nunca más que el plan');
  assert.equal(ventana({}, { plan: 'gold' }, {}), 90, 'sin súper panel: respaldo de Gold');
  if (!require('fs').existsSync(GS_MARY)) return;   // dentro de la imagen del VPS no está gs/: lo del servidor se revisa fuera
  const gs = require('fs').readFileSync(GS_MARY, 'utf8');
  assert.match(gs, /loadSettings = function \(\)[\s\S]*bookingWindowOwner === true/, 'el servidor de Google usa la misma regla');
  assert.doesNotMatch(gs.match(/function maryVentana_[^\n]*/)[0], /, 21\)/, 'sin tope escondido de 21 días');
});

test('3.45 · 🤖 Servidor de Google: maryBotCfg_ también respeta lo que el superusuario apagó para todas las tiendas', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  let OFF = ['cambios', 'estados'];
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, platformPublic: () => ({ botOff: OFF }) };
  const F = new Function(...Object.keys(G), src + '\nreturn { maryBotCfg_ };')(...Object.values(G));
  let c = F.maryBotCfg_({ maryBot: { cambios: true } });
  assert.equal(c.cambios, false); assert.equal(c.estados.activo, false); assert.equal(c.agendar, true);
  OFF = []; c = F.maryBotCfg_({ maryBot: { cambios: true } }); assert.equal(c.cambios, true);
});

test('3.46 · 🔄 Reactivar un apartado vencido: «ya pagó» → confirmada; «más tiempo» → espera el comprobante; si la hora ya la tomó otro o ya pasó, no', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  let apt, tomada = false, escrito = null;
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, fail: (m) => { throw new Error(m); }, bp: (x) => x,
    getAdmin: () => ({ role: 'owner' }), withLock: (fn) => fn(), getApt: () => JSON.parse(JSON.stringify(apt)), loadSettings: () => ({ holdMinutes: 30 }),
    mkDate: (d, t) => new Date(d + 'T' + t + ':00-05:00'), tmin: (t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]),
    reserveLocks: () => { if (tomada) throw new Error('Ese horario ya fue tomado. Elige otra hora.'); return { all: ['L1', 'L2'], create: ['L1', 'L2'], overwrite: [], timeOf: {} }; },
    lockWrites: (r, s, d, state) => [{ lock: state }], incWrites: () => [], addDelta: () => ({}), hist: (a, x) => [x], wPatch: (p, v) => ({ p, v }), commit: (w) => { escrito = w; } };
  const F = new Function(...Object.keys(G), src + '\nreturn { ACTIONS };')(...Object.values(G));
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  apt = { code: 'R-1', status: 'expired', staffId: 's1', date: manana, startTime: '16:30', endTime: '17:30', occupiedMinutes: 60, payment: { mode: 'deposit', status: 'awaiting' } };
  let r = F.ACTIONS.maryReactivar({ code: 'R-1', modo: 'pagada' }, { uid: 'u' });
  assert.equal(r.status, 'confirmed'); assert.equal(escrito[0].v.payment.status, 'approved'); assert.deepEqual(escrito[1], { lock: 'booked' });
  r = F.ACTIONS.maryReactivar({ code: 'R-1', modo: 'tiempo' }, { uid: 'u' });
  assert.equal(r.status, 'pending_payment'); assert.ok(escrito[0].v.holdExpiresAt > new Date()); assert.deepEqual(escrito[1], { lock: 'hold' });
  tomada = true; assert.throws(() => F.ACTIONS.maryReactivar({ code: 'R-1', modo: 'pagada' }, { uid: 'u' }), /ya fue tomado/);
  tomada = false; apt.date = '2020-01-01'; assert.throws(() => F.ACTIONS.maryReactivar({ code: 'R-1' }, { uid: 'u' }), /ya pasó/);
  apt.date = manana; apt.status = 'confirmed'; assert.throws(() => F.ACTIONS.maryReactivar({ code: 'R-1' }, { uid: 'u' }), /no está vencida/);
});

test('3.47 · 🔔 Servidor: los avisos (los mismos de Telegram) quedan en la cola del WhatsApp del dueño; sin número, con el número del negocio o apagado por el superusuario, no', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  let st, OFF = [], escrito = [], cola = {}, tgLlamado = 0, revisado = null;
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, BID: 'barba', bp: (x) => x, fp: (x) => x.join('.'), docName: (x) => x, encFields: (x) => x, platformPublic: () => ({ botOff: OFF }),
    loadSettings: () => st, planHas: () => true, fsGet: (p) => (p === 'private/maryAvisos' ? cola : null), wPatch: (p, v) => ({ p, v }), commit: (w) => { escrito = w; if (w[0].p === 'private/maryAvisos') cola = w[0].v; },
    tgNotify: () => { tgLlamado++; }, tgPhoto: () => { tgLlamado++; }, doReview: (code, ap, motivo, por) => { revisado = { code, ap, por }; } };
  const F = new Function(...Object.keys(G), src + '\nreturn { tgNotify, tgPhoto, maryAvisos_, maryRevisarPago_, maryBotCfg_ };')(...Object.values(G));
  st = { maryWa: { conectado: true, numero: '573110000000' }, maryBot: { avisos: { activo: true, numero: '300 999 8877' } } };
  F.tgNotify(['s1'], '✅ <b>NUEVA RESERVA</b>\nJuan &amp; Ana · R-1');
  assert.equal(tgLlamado, 1, 'Telegram sigue igual'); assert.equal(cola.cola.length, 1); assert.equal(cola.cola[0].texto, '✅ NUEVA RESERVA\nJuan & Ana · R-1');
  F.tgPhoto(['s1'], null, '🧾 <b>COMPROBANTE POR REVISAR</b>', [[{ text: 'Aprobar', callback_data: 'ap|barba|R-1' }]]);
  assert.equal(cola.cola[1].code, 'R-1');
  F.tgNotify(['s1'], 'recordatorio solo para el profesional', true); assert.equal(cola.cola.length, 2, 'lo que es solo del profesional no va al dueño');
  let r = F.maryAvisos_(); assert.equal(r.numero, '573009998877'); assert.equal(r.avisos.length, 2); assert.equal(cola.cola.length, 0, 'la cola se vacía');
  assert.deepEqual(F.maryRevisarPago_({ code: 'R-1', aprobar: true, de: '573009998877' }), { ok: true, aprobado: true }); assert.equal(revisado.code, 'R-1');
  assert.equal(F.maryRevisarPago_({ code: 'R-1', aprobar: true, de: '573001112233' }).ok, false, 'otro número no puede aprobar');
  st.maryBot.avisos.numero = '573110000000'; F.tgNotify([], 'x'); assert.equal(cola.cola.length, 0, 'el número del negocio no sirve');
  st.maryBot.avisos.numero = '3009998877'; OFF = ['avisosWa']; F.tgNotify([], 'x'); assert.equal(cola.cola.length, 0, 'apagado por el superusuario');
});

test('3.51 · 🖼️ Servidor: el estado del bot queda en los estados de la página (un documento por tipo: el nuevo reemplaza al viejo); apagado por el dueño o imagen rara, no', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  let st = {}, escrito = null;
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, bp: (x) => x, loadSettings: () => st, wSet: (p, v) => ({ p, v }), commit: (w) => { escrito = w; } };
  const F = new Function(...Object.keys(G), src + '\nreturn { maryHistoria_, maryContactos_: typeof maryContactos_ };')(...Object.values(G));
  assert.deepEqual(F.maryHistoria_({ id: 'hoy', label: 'Cupos de hoy', horas: 9, img: 'data:image/png;base64,AAAA' }), { ok: true });
  assert.equal(escrito[0].p, 'stories/bot-hoy'); assert.equal(escrito[0].v.bot, true); assert.ok(escrito[0].v.expiresAt > new Date());
  assert.equal(F.maryHistoria_({ id: 'hoy', img: '<script>' }).ok, false);
  st = { maryBot: { estados: { pagina: false } } }; assert.equal(F.maryHistoria_({ id: 'hoy', img: 'data:image/png;base64,AAAA' }).ok, false);
});

test('3.52 · Servidor: la cita con el número MAL escrito se encuentra por el cliente (y se corrige sola); por correo se reconoce y su WhatsApp queda al día; guardado inteligente solo si el dueño lo activó', { skip: !require('fs').existsSync(GS_MARY) && 'dentro de la imagen no está gs/' }, () => {
  const src = require('fs').readFileSync(GS_MARY, 'utf8');
  const manana = new Date(Date.now() + 86400000);
  let st = {}, escrito = [];
  const CL = [{ _id: 'uid7', firstName: 'Alex', lastName: 'Ruiz Castro', email: 'alex@correo.com', whatsapp: '+573187920386' }];
  const CITAS = [{ code: 'R-9', status: 'confirmed', customerUid: 'uid7', customer: { whatsapp: '+573187920000', email: 'alex@correo.com' }, startAt: manana, date: '2030-01-01', startTime: '10:00', items: [{ id: 'c1', name: 'Corte' }] }];
  const G = { ACTIONS: {}, PUBLIC_ACTIONS: {}, console, ACTIVE: ['confirmed'], bp: (x) => x, loadSettings: () => st, fsGet: () => null, wPatch: (p, v) => ({ p, v }), wSet: (p, v) => ({ p, v, nuevo: true }), commit: (w) => { escrito = escrito.concat(w); },
    fsQuery: (col, f) => (col === 'appointments' ? CITAS : f[0][0] === 'whatsapp' ? CL.filter((c) => f[0][2].includes(c.whatsapp)) : f[0][0] === 'email' ? CL.filter((c) => c.email === f[0][2]) : []),
    waDayLabel: () => 'Mañana', hora12: (t) => t, siteUrl: () => 'https://x', BID: 'barba' };
  const F = new Function(...Object.keys(G), src + '\nreturn { maryCitasDe_, maryCorregirWa_, maryReconocer_, maryGuardarContacto_ };')(...Object.values(G));
  // 1) escribe desde su número BUENO (ya corregido en Clientes): encuentra la cita que se creó con el número malo
  const L = F.maryCitasDe_('573187920386'); assert.equal(L.length, 1, 'la encuentra por el cliente, no por el número de la cita');
  assert.equal(F.maryCorregirWa_(L, '573187920386'), 1); assert.equal(escrito[0].p, 'appointments/R-9'); assert.equal(escrito[0].v.customer.whatsapp, '+573187920386', 'la cita queda con el número bueno');
  // 2) escribe desde OTRO número y da su correo: se le reconoce y su ficha queda con este WhatsApp
  escrito = []; const r = F.maryReconocer_({ phone: '3001112233', email: 'ALEX@correo.com' });
  assert.equal(r.ok, true); assert.equal(r.nombre, 'Alex Ruiz'); assert.equal(r.citas.length, 1);
  assert.ok(escrito.some((w) => w.p === 'customers/uid7' && w.v.whatsapp === '+573001112233'));
  assert.equal(F.maryReconocer_({ phone: '3001112233', email: 'nadie@correo.com' }).ok, false);
  // 3) guardado inteligente
  escrito = []; assert.equal(F.maryGuardarContacto_({ phone: '573025550002', nombre: 'Juan 😎 Pérez' }).ok, false, 'apagado por defecto');
  st = { maryBot: { guardado: true } };
  assert.deepEqual(F.maryGuardarContacto_({ phone: '573025550002', nombre: 'Juan 😎 Pérez' }), { ok: true, nuevo: true });
  assert.equal(escrito[0].p, 'customers/wa3025550002'); assert.equal(escrito[0].v.firstName, 'Juan'); assert.equal(escrito[0].v.lastName, 'Pérez'); assert.equal(escrito[0].v.prospecto, true);
  assert.deepEqual(F.maryGuardarContacto_({ phone: '573187920386', nombre: 'Otro' }), { ok: true, existia: true }, 'si ya existe con ese número, no se toca');
});
