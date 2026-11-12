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
