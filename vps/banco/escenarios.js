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
  SILENCIO_MIN: '15', HUMANO_MIN: '15', TZ: 'America/Bogota', ESPERA_MS: '5', AGRUPAR_MS: '0', GUIA_ESPACIO_MS: '5'
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
  const u = String(url); let b = null; try { b = o && typeof o.body === 'string' ? JSON.parse(o.body) : null; } catch (e) { b = null; }
  if (u.startsWith('https://gas.prueba')) {
    W.gas.push(b.op); W.llamadas.push(b);
    const BOTX = Object.assign({ activo: true, agendar: true, cupos: true, saludoDiario: true, pedirNombre: true, pedirCorreo: true, loDeSiempre: true, recordatorioMin: 60, recordatorioConfirmar: true, cambios: true, pausaMin: 30, estados: { activo: true, horas: ['11:00'], manana: true, semanal: false } }, W.bot);
    const ok = (data) => resp({ ok: true, data: data && typeof data === 'object' && !Array.isArray(data) && (data.negocio || data.citas) ? Object.assign({ bot: BOTX }, data) : data });
    if (b.op === 'proximas') return resp({ ok: true, data: { citas: W.proximas, dobles: W.dobles || [], info: Object.assign({ bot: BOTX, recordatorioMin: BOTX.recordatorioMin }, NEGOCIO) } });
    if (b.op === 'cancelar') { W.cancelado = { code: b.code, motivo: b.motivo || '', conCodigo: b.conCodigo === true }; if (W.cancelarTarde && !b.motivo) return resp({ ok: true, data: { ok: false, tarde: true, motivo: 'Falta poco' } }); }   // 3.53
    if (b.op === 'asistencia' || b.op === 'cancelar') return resp({ ok: true, data: { ok: true, link: NEGOCIO.link, cita: (W.proximas[0] || {}) } });
    if (b.op === 'reagendar') { const d = W.cupos.find((x) => x.date === b.date); return resp({ ok: true, data: { ok: true, cita: Object.assign({}, W.proximas[0] || {}, { dia: d.dia, hora: d.horas[d.libres.indexOf(b.time)], link: NEGOCIO.link + '&cita=R-VIEJA1' }) } }); }
    if (b.op === 'contactos') return resp({ ok: true, data: { numeros: W.contactos, bloqueados: W.bloqueados || [] } });
    if (b.op === 'citaCodigo') { const c = (W.porCodigo || {})[b.code]; return resp({ ok: true, data: c ? { ok: true, cita: c } : { ok: false } }); }   // 3.53
    if (b.op === 'reconocer') { W.reconocido = { phone: b.phone, email: b.email }; const c = (W.porCorreo || {})[b.email]; return resp({ ok: true, data: c ? { ok: true, nombre: c.nombre, citas: c.citas || [] } : { ok: false } }); }   // 3.52
    if (b.op === 'guardarContacto') { (W.guardados = W.guardados || []).push({ phone: b.phone, nombre: b.nombre }); return resp({ ok: true, data: { ok: true, nuevo: true } }); }   // 3.52
    if (b.op === 'historia') { (W.historias = W.historias || []).push({ id: b.id, label: b.label, horas: b.horas, img: String(b.img).slice(0, 22) }); return resp({ ok: true, data: { ok: true } }); }   // 3.51
    if (b.op === 'avisos') { const A = W.avisos || []; W.avisos = []; return resp({ ok: true, data: { avisos: A, numero: W.avisosNum || '' } }); }   // 3.47
    if (b.op === 'revisarPago') { W.revisado = { code: b.code, aprobar: b.aprobar, de: b.de }; return resp({ ok: true, data: { ok: true, aprobado: b.aprobar } }); }
    if (b.op === 'waPedido') { const p = W.pedido; W.pedido = null; return resp({ ok: true, data: { pedido: p } }); }
    if (b.op === 'waResultado') { W.resultados.push(b); return resp({ ok: true, data: { ok: true } }); }
    if (W.gasFalla && b.op === 'chat') return resp({ ok: false, error: 'Servicio invocado demasiadas veces' });
    if (b.op === 'chat' && b.conNombre && W.nombreBase) { W.pidioNombre = (W.pidioNombre || 0) + 1; }
    if (W.falla === b.op) return resp({ ok: false, error: 'Tiempo de espera agotado' });   // 3.28: Google falla en un paso
    if (b.op === 'estadisticas') { W.stats = (W.stats || []).concat([b]); return ok({ ok: true }); }
    if (b.op === 'volver') return ok({ clientes: W.volver || [], negocio: 'Lina Spa', link: NEGOCIO.link });
    if (b.op === 'volverAvisado') { W.volverAvisados = (W.volverAvisados || []).concat(b.codes); return ok({ ok: true }); }
    if (b.op === 'chat') return ok(Object.assign({}, NEGOCIO, { activo: W.activo, citas: W.citas[b.phone] || [] }, b.conNombre && W.nombreBase ? { cliente: W.nombreBase } : {}));
    if (b.op === 'info') return ok(NEGOCIO);
    if (b.op === 'proof') return ok(W.proof || { ok: false, motivo: 'sin_cita_pendiente' });
    if (b.op === 'catalogo') return ok(Object.assign({}, CATALOGO, { abono: W.abono, activo: W.activo }));
    if (b.op === 'cupos') return ok(Object.assign({ dias: W.cupos }, NEGOCIO, { prueba: !!W.prueba, marca: W.marca !== false }));
    if (b.op === 'dias') return ok({ dias: W.cupos.filter((x) => x.horas.length).map((x) => ({ date: x.date, dia: x.dia, n: x.horas.length })), link: NEGOCIO.link });   // como el servidor: solo días con horas
    if (b.op === 'horas') { const d = W.cupos.find((x) => x.date === b.date) || { horas: [], libres: [] }; return ok({ date: b.date, dia: d.dia, horas: d.libres.map((t, i) => ({ time: t, hora: d.horas[i], staff: b.staffId ? [{ id: b.staffId, nombre: b.staffId === 's1' ? 'Lina' : 'Andrés' }] : [{ id: 's1', nombre: 'Lina' }, { id: 's2', nombre: 'Andrés' }] })), link: NEGOCIO.link }); }
    if (b.op === 'crear') {
      if (W.crearFalla) { const m = W.crearFalla; W.crearFalla = null; return ok({ ok: false, motivo: m }); }
      const todos = [].concat(...CATALOGO.categorias.map((x) => x.servicios)), sel = b.ids.map((id) => todos.find((x) => x.id === id));
      const d = W.cupos.find((x) => x.date === b.date), tot = sel.reduce((a, x) => a + x.precio, 0);
      return ok({ ok: true, medios: NEGOCIO.medios, holdMinutes: 30, cita: { code: 'R-NUEVA1', status: W.abono ? 'pending_payment' : 'confirmed', dia: d.dia, hora: d.horas[d.libres.indexOf(b.time)], servicio: sel.map((x) => x.nombre).join(' + '), con: b.staffId === 's2' ? 'Andrés' : 'Lina', abono: Math.min(W.abono, tot), total: tot, link: NEGOCIO.link + '&cita=R-NUEVA1' } });
    }
    return ok({});
  }
  if (/\/api\/contacts\/all/.test(u)) return W.wahaLibreta ? resp(W.wahaLibreta) : resp({ error: 'no' }, 404);   // 3.51: la libreta del WhatsApp
  if (/\/api\/[^/]+\/chats\?/.test(u)) return W.wahaChats ? resp(W.wahaChats) : resp({ error: 'no' }, 404);        // 3.51: quienes le han escrito
  const lidM = u.match(/\/api\/[^/]+\/lids\/([^/?]+)$/);   // 3.49: WAHA dice (o no) el número real de un código …@lid
  if (lidM) { const pn = (W.lids || {})[decodeURIComponent(lidM[1])]; return pn ? resp({ lid: decodeURIComponent(lidM[1]), pn }) : resp({ error: 'no lo sé' }, 404); }
  if (/\/api\/sendText$/.test(u)) { const id = 'W' + W.enviados.length; W.enviados.push({ id, motor: 'waha', a: b.chatId.split('@')[0], chatId: b.chatId, texto: b.text, sesion: b.session }); return resp({ id }); }
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
  if (/\/documents\/platform\/public/.test(u) && W.avisoPend) return resp({ fields: { maryAvisoPend: { mapValue: { fields: { 'lina-spa': { integerValue: String(W.avisoPend) } } } } } });   // 3.47: bandera de avisos
  if (/\/documents\/platform\/public/.test(u) && W.botOff) return resp({ fields: { botOff: { arrayValue: { values: W.botOff.map((x) => ({ stringValue: x })) } } } });   // 3.45: lo que el superusuario apagó
  if (W.fsDirecto && /firestore|\/documents\/businesses\//.test(u)) {   // 3.30: la base de datos que el VPS lee directo (configuración, equipo, servicios, cupos ocupados)
    const D = W.fsDirecto, aFs2 = (v) => typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(aFs2) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFs2(x)])) } };
    const docu = (n, o) => ({ name: n, fields: aFs2(o).mapValue.fields });
    W.fsLecturas = (W.fsLecturas || 0) + 1;
    if (/\/settings\/general/.test(u)) return resp(docu('s/general', Object.assign({ maryBot: W.fsBot || {} }, D.st)));
    if (/\/staff\?/.test(u)) return resp({ documents: D.staff.map((x) => docu('x/staff/' + x.id, x)) });
    if (/\/services\?/.test(u)) return resp({ documents: D.servicios.map((x) => docu('x/services/' + x.id, x)) });
    if (/:runQuery/.test(u)) return resp([]);
    if (/\/documents\/businesses\/[^/?]+\?/.test(u)) return resp(docu('businesses/x', D.biz || { status: 'active' }));   // 3.43: el negocio (plan, adicional sin marca)
  }
  if (/\/documents\/businesses\/[^/]+\/settings\/general/.test(u)) {   // 3.23: el panel guarda «maryBot» en la base y el VPS lo lee directo
    if (!W.fsBot) return resp({ error: { code: 404 } }, 404);
    const aFs = (v) => typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(aFs) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFs(x)])) } };
    return resp({ fields: { maryBot: aFs(W.fsBot) } });
  }
  if (/\/api\/files\//.test(u)) return new Response(Buffer.from('AUDIO-OGG'), { status: 200 });   // la nota de voz que baja de WAHA
  if (/oido-agendador:9000\/transcribir$/.test(u)) { W.oidoLlamadas = (W.oidoLlamadas || 0) + 1; return W.oido == null ? resp({ error: 'el oído todavía está cargando' }, 503) : resp({ texto: W.oido, duracion: 3, tardo: 2 }); }
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
test('Número oculto SIN el real → (3.49) ya no se queda callada: responde en ese chat con el link; en modo prueba sigue callada', async () => {
  await llega(wahaMsg('x', 'hola', { from: '999999999999999@lid', _data: {} }));
  assert.equal(W.enviados.length, 1); assert.equal(ultimo().chatId, '999999999999999@lid'); assert.match(ultimoRegistro(), /número oculto: le respondí con el link/);
  P.CFG.modo = 'prueba';
  await llega(wahaMsg('x', 'hola', { from: '888888888888888@lid', _data: {} }));
  assert.equal(W.enviados.length, 1, 'en modo prueba no se sabe si es un número de prueba: no responde'); assert.match(ultimoRegistro(), /modo prueba/);
  P.CFG.modo = 'todos';
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
  assert.equal(W.enviados.length, 1); assert.match(ultimoRegistro(), /pausado|callada|no repito/);
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
test('3.0 · Agendar COMPLETO con listas: 2 servicios, día, hora, profesional, nombre, correo → «✅ Cita confirmada» (el correo o «no» ya confirma)', async () => {
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
  assert.match(par, /Cita confirmada, Andrés!/); assert.match(par, /Degradado \+ Perfilado de barba · \*\$37\.000\* \(1 h 5 min\)/); assert.match(par, /Hoy a las \*3:00 p\. m\.\*/);
  assert.match(par, /Con Andrés/); assert.match(par, /A nombre de Andrés Ruiz/); assert.ok(!ultimo().lista, 'sin «¿Lo confirmo?»');
  const cr = W.llamadas.find((x) => x.op === 'crear');
  assert.deepEqual(cr.ids, ['c2', 'b1']); assert.equal(cr.date, HOY); assert.equal(cr.time, '15:00'); assert.equal(cr.staffId, 's2');
  assert.equal(cr.nombre, 'Andrés Ruiz'); assert.equal(cr.email, 'andres@gmail.com'); assert.equal(cr.phone, CLIENTE);
  assert.match(ultimo().texto, /R-NUEVA1/); assert.match(ultimo().texto, /calendario/);
  assert.match(ultimo().texto, /Regístrate gratis en https:\/\/tuagenda\.vip\/$/, '3.30: al pie, la invitación a la plataforma');
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
  assert.match(ultimo().texto, /Te aparté el cupo, Camila/); assert.match(ultimo().texto, /exactamente \$8\.000/, 'el abono nunca pasa del total'); assert.match(ultimo().texto, /Nequi: \*3001112233\*/);
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
  await llega(toca('dia:' + HOY)); await llega(toca('hora:16:30')); await llega(toca('pro:s1'));
  assert.match(ultimo().texto, /la acaban de tomar/); assert.equal(ultimo().lista.button, 'Elegir hora');
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
test('3.1 · Panel: sin pedir nombre ni correo → usa el nombre de WhatsApp y aparta de una', async () => {
  W.bot = { pedirNombre: false, pedirCorreo: false };
  await llega(wahaMsg(CLIENTE, 'hola'));
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  await llega(toca('dia:' + HOY)); await llega(toca('hora:15:00')); await llega(toca('pro:s1'));
  assert.match(ultimo().texto, /Cita confirmada, Camila/); assert.match(ultimo().texto, /A nombre de Camila/);
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
  assert.match(ultimo().texto, /Tu cita es el \*viernes 14 a las 3:00 p\. m\.\*[\s\S]*¿Deseas \*cancelarla\* o \*reagendarla\*\?/); assert.deepEqual(ids(ultimo()), ['can:si', 'can:mover', 'can:no']);
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
  assert.equal(r.ok, true); assert.deepEqual(W.estados[0].contacts, ['573001112233@c.us', '573004445566@c.us', '573187920386@c.us'], 'los clientes del negocio + el número de prueba de Alex (3.50)'); assert.match(ultimoRegistro(), /estado hoy publicado · a 3 contactos \(2 clientes, 0 que le han escrito, 0 de su libreta\)$/);
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
test('3.27 · VINCULAR sin terminar: a los 3 minutos se BORRA la sesión del WAHA del agendador y el panel dice «venció»', async () => {
  const antes = fs.readFileSync(NEG_F, 'utf8'), ahora = Date.now, t0 = Date.now();
  try {
    W.pedido = { accion: 'conectar', numero: '573005556677' };
    await P.atenderPedidoWa('nuevo-spa');
    const c = W.resultados.find((x) => x.estado === 'codigo');
    assert.ok(c.vence - t0 >= 3 * 60000 - 1000 && c.vence - t0 <= 3 * 60000 + 5000, 'el panel recibe cuándo vence (3 min) para la cuenta regresiva');
    assert.ok(W.sesiones['nuevo-spa'], 'la sesión existe mientras espera');
    Date.now = () => t0 + 2 * 60000; await P.limpiarSinVincular();
    assert.ok(W.sesiones['nuevo-spa'], 'a los 2 min todavía espera');
    Date.now = () => t0 + 3 * 60000 + 5000; await P.limpiarSinVincular();
    assert.equal(W.sesiones['nuevo-spa'], undefined, 'a los 3 min la sesión ya no existe en waha-agendador');
    assert.ok(W.wahaLlamadas.includes('POST nuevo-spa logout') && W.wahaLlamadas.includes('DELETE nuevo-spa'));
    assert.ok(W.resultados.some((x) => x.estado === 'vencido'), 'el panel muestra «venció»');
    assert.equal(leerNeg().find((x) => x.bid === 'nuevo-spa').activo, false);
    const n = W.wahaLlamadas.length; await P.limpiarSinVincular(); assert.equal(W.wahaLlamadas.length, n, 'se borra una sola vez');
  } finally { Date.now = ahora; fs.writeFileSync(NEG_F, antes); }
});
test('3.27 · CANCELAR mientras vincula: se borra al instante y después no queda nada por vencer', async () => {
  const antes = fs.readFileSync(NEG_F, 'utf8'), ahora = Date.now, t0 = Date.now();
  try {
    W.pedido = { accion: 'conectar', numero: '573005556677' };
    await P.atenderPedidoWa('nuevo-spa');
    W.pedido = { accion: 'desconectar' };
    await P.atenderPedidoWa('nuevo-spa');
    assert.equal(W.sesiones['nuevo-spa'], undefined, 'cancelar borra la sesión ya');
    Date.now = () => t0 + 4 * 60000; const n = W.resultados.length; await P.limpiarSinVincular();
    assert.equal(W.resultados.length, n, 'no llega un «venció» tardío que tape el panel');
  } finally { Date.now = ahora; fs.writeFileSync(NEG_F, antes); }
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
  assert.equal(F({ texto: 'hola', hist: { textos: [['hola', 99000]], pausa: false } }).responder, false, '«hola» repetido en el mismo minuto: pausa');
  assert.equal(F({ texto: 'hola', hist: { textos: [['hola', 100000 - 17 * 60000]], pausa: false } }).responder, true, '3.28: «hola» otra vez 17 min después sí se responde');
  assert.equal(F({ texto: 'quiero agendar', enFlujo: false, hist: { textos: [['quiero agendar', 100000 - 10 * 60000]], pausa: false } }).responder, true, '3.28: volver a pedir cita no es de robot');
  assert.equal(F({ texto: 'combos desde $20.000', rowId: 'cat:1', hist: { textos: [['combos desde $20.000', 99000]], pausa: true } }).responder, true, '3.28: tocar NUESTRA lista es de una persona');
});

// =====================================================================
//  3.6 · Varios mensajes seguidos = UNA respuesta · nunca el mismo mensaje dos veces
// =====================================================================
test('3.6 · «Hola» «Papito» «Ya soy 11» seguidos → espera, los lee juntos y responde UNA sola vez', async () => {
  P.CFG.agruparMs = 60;
  try {
    await Promise.all([llega(wahaMsg(CLIENTE, 'Hola')), llega(wahaMsg(CLIENTE, 'Papito')), llega(wahaMsg(CLIENTE, 'Ya soy 11'))]);
    assert.equal(W.enviados.length, 1, 'una sola respuesta'); assert.match(W.enviados[0].texto, /Soy el asistente de/);
    assert.ok(B.ultimos.some((x) => /3 mensajes seguidos/.test(x.que)));
  } finally { P.CFG.agruparMs = 0; }
});
test('3.6 · Pregunta por cupos en medio de varios mensajes → responde los cupos (una vez)', async () => {
  P.CFG.agruparMs = 60;
  try {
    await Promise.all([llega(wahaMsg(CLIENTE, 'buenas')), llega(wahaMsg(CLIENTE, 'una pregunta')), llega(wahaMsg(CLIENTE, 'tienen cupo hoy?'))]);
    assert.equal(W.enviados.length, 1); assert.match(W.enviados[0].texto, /Estos son los cupos de hoy/);
  } finally { P.CFG.agruparMs = 0; }
});
test('3.6 · Nunca le manda el MISMO mensaje dos veces seguidas («Hoy hicimos la inauguración» después del link)', async () => {
  await llega(wahaMsg(CLIENTE, 'Hola'));
  await llega(wahaMsg(CLIENTE, 'necesito info'));          // respuesta sin saludo (ya saludó hoy)
  const n = W.enviados.length;
  await llega(wahaMsg(CLIENTE, 'Hoy hicimos la inauguración'));
  assert.equal(W.enviados.length, n, 'no repite el mismo link'); assert.match(ultimoRegistro(), /no repito|callada/);
});
test('3.6 · yaLoDije: el mismo texto otra vez en 15 min = no se manda; otro texto o pasados 15 min = sí', () => {
  const neg = { bid: 'lina-spa' }, n = CLIENTE;
  assert.equal(B.yaLoDije(neg, n, 'Hoy quedan 15 cupos. Agenda aquí: L'), false);
  assert.equal(B.yaLoDije(neg, n, 'Hoy quedan 15 cupos.  Agenda aquí: L'), true, 'igual (aunque cambien espacios)');
  assert.equal(B.yaLoDije(neg, n, 'Tienes esta cita: viernes'), false, 'otro texto sí se manda');
  B.memDicho()['lina-spa:' + n].t -= 16 * 60000;
  assert.equal(B.yaLoDije(neg, n, 'Tienes esta cita: viernes'), false, 'pasados 15 min se puede repetir');
});
test('3.6 · Tocar una opción de la lista NO espera (responde al instante)', async () => {
  P.CFG.agruparMs = 5000;
  try {
    await llega(toca('menu:agendar'));   // sin conversación abierta también responde
    const t0 = Date.now(); await llega(wahaMsg(CLIENTE, '', { _data: { notifyName: 'Camila', Message: { listResponseMessage: { singleSelectReply: { selectedRowID: 'menu:cupos' } } } } }));
    assert.ok(Date.now() - t0 < 2000, 'no esperó los 5 s');
  } finally { P.CFG.agruparMs = 0; }
});

test('3.8 · El dueño toca «Ver cupos» desde el celular del NEGOCIO → al cliente le llegan los cupos (y no se pausa)', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));   // el cliente recibe el menú
  await llega(wahaMsg('x', '🕐 Ver cupos\nDías y horas disponibles', { id: 'true_' + CLIENTE + '@c.us_TAP', from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true,
    _data: { Message: { listResponseMessage: { singleSelectReply: { selectedRowID: 'menu:cupos' } } } } }));
  assert.equal(ultimo().a, CLIENTE); assert.match(ultimo().texto, /Estos son los cupos de hoy/); assert.match(ultimoRegistro(), /el negocio tocó|le mostré los cupos/);
  assert.ok(!B.memHumano()['lina-spa:' + CLIENTE], 'no cuenta como «el dueño escribió»');
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  assert.ok(ultimo().lista, 'el asistente sigue atendiendo al cliente');
});

test('3.9 · Si WAHA avisa el toque del negocio SIN la opción (solo el texto «🕐 Ver cupos»), igual se reconoce por el título', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  await llega(wahaMsg('x', '🕐 Ver cupos de hoy\nHoras disponibles', { id: 'true_' + CLIENTE + '@c.us_TAP2', from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true }));
  assert.equal(ultimo().a, CLIENTE); assert.match(ultimo().texto, /Estos son los cupos de hoy/);
  assert.ok(!B.memHumano()['lina-spa:' + CLIENTE], 'no cuenta como «el dueño escribió»');
  // y un mensaje normal del dueño SÍ lo calla
  await llega(wahaMsg('x', 'te atiendo yo', { id: 'true_' + CLIENTE + '@c.us_DUE9', from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true }));
  assert.ok(B.memHumano()['lina-spa:' + CLIENTE]);
});

// =====================================================================
//  3.10 · «¿Hay cupos?» = «Estos son los cupos de hoy» + LISTA de horas (+ Mañana / Otro día) → hora → servicio → confirmar
// =====================================================================
test('3.10 · «¿hay cupos?» → «Estos son los cupos de hoy. Elige tu hora» con la lista de HORAS + Mañana + Otro día (y el link)', async () => {
  await llega(wahaMsg(CLIENTE, 'tienen cupo hoy?'));
  const e = ultimo();
  assert.match(e.texto, /Estos son los cupos de hoy/); assert.match(e.texto, /Elige tu hora/); assert.match(e.texto, /tuagenda\.vip/);
  assert.doesNotMatch(e.texto, /3:00 p\. m\., 4:30/, 'las horas ya no van escritas en el texto');
  assert.equal(e.lista.button, 'Ver horas');
  assert.deepEqual(ids(e), ['hc:15:00', 'hc:16:30', 'hc:18:00', 'hc:dia:' + masDias(1), 'hc:otro']);
  assert.deepEqual(e.lista.sections.map((x) => x.title), ['🌇 Tarde', 'Otro día']);
});
test('3.10 · Elige la HORA → servicio → con quién → «✅ Cita confirmada» con esa misma hora', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  await llega(wahaMsg(CLIENTE, 'hay cupos?'));
  await llega(toca('hc:16:30', '4:30 p. m.'));
  assert.match(ultimo().texto, /4:30 p\. m\./); assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2'], 'ahora pide el servicio');
  await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  assert.deepEqual(ids(ultimo()), ['pro:s1', 'pro:s2', 'pro:'], 'va directo a «con quién», sin volver a pedir día ni hora');
  await llega(toca('pro:s1'));
  assert.match(ultimo().texto, /Cita confirmada/); assert.match(ultimo().texto, /Hoy a las \*4:30 p\. m\.\*/);
  const cr = W.llamadas.find((x) => x.op === 'crear'); assert.equal(cr.date, HOY); assert.equal(cr.time, '16:30');
});
test('3.10 · «📅 Mañana» → las horas de mañana · «🗓️ Otro día» → días → horas de ese día', async () => {
  await llega(wahaMsg(CLIENTE, 'hay cupos?'));
  await llega(toca('hc:dia:' + masDias(1), '📅 Mañana'));
  assert.match(ultimo().texto, /Estos son los cupos de mañana/); assert.deepEqual(ids(ultimo()).slice(0, 1), ['hc:09:00']);
  await llega(toca('hc:otro', '🗓️ Otro día'));
  assert.equal(ultimo().lista.button, 'Elegir día'); assert.ok(ids(ultimo()).includes('dia:' + masDias(2)));
  await llega(toca('dia:' + masDias(2), 'Pasado'));
  assert.match(ultimo().texto, /Estos son los cupos del pasado/); assert.deepEqual(ids(ultimo()).slice(0, 2), ['hc:10:00', 'hc:11:00']);
});
test('3.10 · Hoy sin cupos → «Hoy ya no hay cupos» y la lista de horas del siguiente día con cupo', async () => {
  W.cupos[0].horas = []; W.cupos[0].libres = [];
  await llega(wahaMsg(CLIENTE, 'hay disponibilidad hoy?'));
  assert.match(ultimo().texto, /Hoy ya no hay cupos/); assert.match(ultimo().texto, /Estos son los cupos de mañana/);
  assert.equal(ids(ultimo())[0], 'hc:09:00');
});
test('3.10 · Si la hora elegida no alcanza para el servicio → le muestra las horas que SÍ sirven ese día', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  await llega(wahaMsg(CLIENTE, 'hay cupos?'));
  await llega(toca('hc:18:00', '6:00 p. m.'));
  W.cupos[0].libres = ['15:00', '16:30']; W.cupos[0].horas = ['3:00 p. m.', '4:30 p. m.'];   // con ese servicio, a las 6 ya no alcanza
  await llega(toca('cat:0')); await llega(toca('svc:c2')); await llega(toca('mas:no'));
  assert.match(ultimo().texto, /A las 6:00 p\. m\. no alcanza el tiempo/); assert.equal(ultimo().lista.button, 'Elegir hora');
});

// =====================================================================
//  3.11 · Conversación natural: «¿tienes cupo hoy a las 3?» → «Sí… ¿Lo vas a apartar?» → servicio (o el de siempre) → nombre → ✅
// =====================================================================
test('3.11 · El saludo invita a escribir el día y la hora y trae la lista de SERVICIOS (por categorías)', async () => {
  await llega(wahaMsg(CLIENTE, 'hola'));
  assert.match(W.enviados[0].texto, /escríbeme el día y la hora/); assert.equal(W.enviados[0].lista.button, 'Ver servicios');
  assert.deepEqual(ids(W.enviados[0]), ['cat:0', 'cat:1', 'cat:2', 'menu:cupos']);
  await llega(toca('cat:1', 'Barba'));
  assert.match(ultimo().texto, /Barba/); assert.ok(ids(ultimo()).includes('svc:b1'));
});
test('3.11 · «Hey Barba, ¿tienes cupo hoy a las 3?» → «Sí, tengo… ¿Lo vas a apartar?» → sí → ¿qué te vas a hacer? → nombre → ✅ Apartado', async () => {
  await llega(wahaMsg(CLIENTE, 'Hey Barba, tienes cupo para hoy a las 3?'));
  assert.match(ultimo().texto, /Sí, tengo un cupo \*hoy a las 3:00 p\. m\.\* ¿Lo vas a apartar\?/); assert.deepEqual(ids(ultimo()), ['ap:si', 'ap:otra']);
  await llega(wahaMsg(CLIENTE, 'si'));
  assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2'], 'cliente nuevo: «¿Qué te vas a hacer?»');
  await llega(toca('cat:0')); await llega(toca('svc:c1', 'Corte clásico'));
  assert.match(ultimo().texto, /A nombre de quién/, 'sin «¿agregar otro?» ni «¿con quién?»: directo');
  await llega(wahaMsg(CLIENTE, 'Andrés'));
  await llega(wahaMsg(CLIENTE, 'no'));   // correo (si el dueño lo deja pedir)
  const cr = W.llamadas.find((x) => x.op === 'crear');
  assert.ok(cr, 'apartada sin otra pregunta de confirmación'); assert.equal(cr.date, HOY); assert.equal(cr.time, '15:00'); assert.deepEqual(cr.ids, ['c1']);
  assert.match(ultimo().texto, /Cita confirmada, Andrés!/);
});
test('3.11 · A esa hora no hay → «A las 4:00 no tengo, pero tengo antes a las 3:00 o después a las 4:30» → toca una → apartada', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  await llega(wahaMsg(CLIENTE, 'hay cupo hoy a las 4?'));
  assert.match(ultimo().texto, /A las 4:00 p\. m\. no tengo, pero tengo antes a las \*3:00 p\. m\.\* o después a las \*4:30 p\. m\.\* hoy/);
  assert.deepEqual(ids(ultimo()), ['ap:15:00', 'ap:16:30', 'ap:otra']);
  await llega(toca('ap:16:30', '✅ 4:30 p. m.'));
  await llega(toca('cat:2')); await llega(toca('svc:e1'));
  assert.equal(W.llamadas.find((x) => x.op === 'crear').time, '16:30');
});
test('3.11 · «Si siempre se hace las uñas, ya sabemos que es uñas»: cliente conocido → aparta lo de siempre sin preguntar', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  cl.combos = { 'e1|Lina': { n: 4, ids: ['e1'], staffId: 's1', servicio: 'Cejas', con: 'Lina' } };
  await llega(wahaMsg(CLIENTE, 'mañana a las 9 tienes?'));
  assert.match(ultimo().texto, /Sí, tengo un cupo \*mañana a las 9:00 a\. m\.\*/);
  await llega(toca('ap:si'));
  const cr = W.llamadas.find((x) => x.op === 'crear');
  assert.deepEqual(cr.ids, ['e1']); assert.equal(cr.staffId, 's1'); assert.match(ultimo().texto, /Cita confirmada/); assert.match(ultimo().texto, /como siempre/);
});
test('3.11 · Servicio y hora en el mismo mensaje («un degradado hoy a las 6») → revisa con el tiempo de ESE servicio', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero un degradado hoy a las 6'));
  assert.match(ultimo().texto, /Sí, tengo un cupo \*hoy a las 6:00 p\. m\.\*/);
  assert.deepEqual(W.llamadas.filter((x) => x.op === 'horas').pop().ids, ['c2']);
});
test('3.11 · Ese día no hay nada → «Ese día ya no tengo cupos. El más cercano es…»', async () => {
  W.cupos[0].horas = []; W.cupos[0].libres = [];
  await llega(wahaMsg(CLIENTE, 'tienes cupo hoy a las 5?'));
  assert.match(ultimo().texto, /Hoy ya no tengo cupos\. El más cercano es \*mañana a las 9:00 a\. m\.\*/);
});
test('3.11 · horaPedida entiende cómo escribe la gente', () => {
  const A = require('../asistente');
  const H = (t) => A.horaPedida(t);
  assert.deepEqual(H('a las 3'), { hm: '15:00' }); assert.deepEqual(H('3pm'), { hm: '15:00' }); assert.deepEqual(H('3:30'), { hm: '15:30' });
  assert.deepEqual(H('16:00'), { hm: '16:00' }); assert.deepEqual(H('a las 10 de la mañana'), { hm: '10:00' }); assert.deepEqual(H('a las 9'), { hm: '09:00' });
  assert.deepEqual(H('a las 4 y media'), { hm: '16:30' }); assert.deepEqual(H('mediodía'), { hm: '12:00' }); assert.deepEqual(H('8 de la noche'), { hm: '20:00' });
  assert.deepEqual(H('temprano'), { franja: 'manana' }); assert.deepEqual(H('el viernes en la tarde'), { franja: 'tarde' });
  assert.equal(H('para el 20 de diciembre'), null, 'una fecha no es una hora'); assert.equal(H('hola'), null);
});

test('3.12 · Con la lista de días/horas abierta, «¿Tienes cupo para mañana a las 11am?» → responde ESA hora (no vuelve a mandar la lista)', async () => {
  await llega(wahaMsg(CLIENTE, 'hay cupos?'));
  await llega(toca('hc:otro', '🗓️ Otro día'));          // queda abierta «Elegir día»
  await llega(wahaMsg(CLIENTE, 'Tienes cupo para mañana a las 11am?'));
  assert.match(ultimo().texto, /A las 11:00 a\. m\. no tengo, pero tengo antes, a las \*9:00 a\. m\.\* mañana/);
  assert.deepEqual(ids(ultimo()), ['ap:09:00', 'ap:otra']);
  await llega(wahaMsg(CLIENTE, 'y a las 9?'));
  assert.match(ultimo().texto, /Sí, tengo un cupo \*mañana a las 9:00 a\. m\.\*/);
});

// =====================================================================
//  3.13 · 👂 OÍDO: nota de voz → texto → el asistente responde igual que si la hubieran escrito
// =====================================================================
const audio = () => wahaMsg(CLIENTE, '', { hasMedia: true, media: { url: 'http://waha-agendador:3000/api/files/default/nota.oga', mimetype: 'audio/ogg; codecs=opus' } });
test('3.13 · Nota de voz «¿tienes cupo hoy a las 3?» → el oído la escucha → «Sí, tengo un cupo hoy a las 3:00… ¿Lo vas a apartar?»', async () => {
  W.oido = 'Hola, ¿tienes cupo para hoy a las 3?';
  await llega(audio());
  assert.equal(W.oidoLlamadas, 1);
  assert.match(ultimo().texto, /Sí, tengo un cupo \*hoy a las 3:00 p\. m\.\*/); assert.ok(B.ultimos.some((x) => /🎤 escuché: «Hola, ¿tienes cupo/.test(x.que)));
  assert.ok(!W.gas.includes('proof'), 'un audio no es una foto de pago');
});
test('3.13 · El oído no está listo (cargando o caído) → «En este momento no puedo escuchar audios… ¿me lo escribes?»', async () => {
  W.oido = null;
  await llega(audio());
  assert.match(ultimo().texto, /no puedo escuchar audios/); assert.ok(B.ultimos.some((x) => /el oído no pudo/.test(x.que)));
});
test('3.13 · Panel: «Escuchar notas de voz» apagado → no lo manda al oído y pide que escriba', async () => {
  W.bot = { audios: false }; W.oido = 'quiero agendar';
  await llega(wahaMsg(CLIENTE, 'hola'));   // trae la configuración del panel
  await llega(audio());
  assert.equal(W.oidoLlamadas || 0, 0); assert.match(ultimo().texto, /no puedo escuchar audios/);
});

// =====================================================================
//  3.14 · Dos citas que se cruzan → «Tienes 2 citas… ¿deseas cancelar una de las dos?» → la 1 / la 2 / mantener
// =====================================================================
const DOS = [
  { code: 'R-92KAFG', status: 'confirmed', date: HOY, time: '18:30', dia: 'Hoy', hora: '6:30 p. m.', servicio: 'Corte clásico', con: 'Yeferson', link: 'L1', ids: ['c1'], staffId: 's1' },
  { code: 'R-RZP6UR', status: 'confirmed', date: HOY, time: '18:30', dia: 'Hoy', hora: '6:30 p. m.', servicio: 'Corte clásico', con: 'Gabriel', link: 'L2', ids: ['c1'], staffId: 's2' }];
test('3.14 · 2 citas a la misma hora con 2 barberos → «¿Con quién te quieres quedar?» → «con Gabriel» cancela la de Yeferson', async () => {
  W.dobles = [{ whatsapp: CLIENTE, nombre: 'Nicolas', citas: DOS }];
  await B.tickRecordatorios(true);
  assert.match(ultimo().texto, /Tienes 2 citas para hoy a las 6:30 p\. m\.: con \*?Yeferson\*? y con \*?Gabriel\*?/); assert.match(ultimo().texto, /¿Con quién te quieres quedar\?/);
  assert.deepEqual(ids(ultimo()), ['dobq:0', 'dobq:1', 'dob:no']);
  assert.deepEqual(W.llamadas.find((x) => x.op === 'dobleAvisado').codes, ['R-92KAFG', 'R-RZP6UR'], 'queda marcado: no se vuelve a preguntar');
  await llega(wahaMsg(CLIENTE, 'me quedo con gabriel'));
  assert.deepEqual(W.llamadas.filter((x) => x.op === 'cancelar').map((x) => x.code), ['R-92KAFG']);
  assert.match(ultimo().texto, /te quedas con \*Gabriel\*/);
});
test('3.14 · «Quiero las dos» → no cancela nada · tocar «Con Yeferson» cancela la de Gabriel', async () => {
  W.dobles = [{ whatsapp: CLIENTE, nombre: 'Nicolas', citas: DOS }];
  await B.tickRecordatorios(true);
  await llega(toca('dob:no', '✅ Quiero las dos'));
  assert.ok(!W.llamadas.some((x) => x.op === 'cancelar')); assert.match(ultimo().texto, /quedan las dos como estaban/);
  mundoNuevo(); W.dobles = [{ whatsapp: CLIENTE, nombre: 'Nicolas', citas: DOS }];
  await B.tickRecordatorios(true);
  await llega(toca('dobq:0', '💈 Con Yeferson'));
  assert.deepEqual(W.llamadas.filter((x) => x.op === 'cancelar').map((x) => x.code), ['R-RZP6UR']);
});
test('3.14 · 2 citas que se cruzan con el MISMO barbero → «¿deseas cancelar una de las dos?» → «la dos» cancela la 2', async () => {
  const MISMO = DOS.map((x) => Object.assign({}, x, { con: 'Lina', staffId: 's1' }));
  W.dobles = [{ whatsapp: CLIENTE, nombre: 'Nicolas', citas: MISMO }];
  await B.tickRecordatorios(true);
  assert.match(ultimo().texto, /Tienes \*?2 citas\*? para hoy a la misma hora/); assert.match(ultimo().texto, /¿Deseas cancelar una de las dos\?/);
  assert.deepEqual(ids(ultimo()), ['dob:0', 'dob:1', 'dob:no']);
  await llega(wahaMsg(CLIENTE, 'cancela la dos'));
  assert.equal(W.llamadas.find((x) => x.op === 'cancelar').code, 'R-RZP6UR');
});
test('3.14 · Cliente con 2 citas escribe «quiero cancelar mi cita» → «¿Cuál cita deseas cancelar?» (no cancela la primera a ciegas)', async () => {
  W.citas[CLIENTE] = DOS;
  await llega(wahaMsg(CLIENTE, 'quiero cancelar mi cita'));
  assert.match(ultimo().texto, /¿Cuál cita deseas cancelar\?/); assert.deepEqual(ids(ultimo()), ['dob:0', 'dob:1', 'dob:no']);
  await llega(toca('dob:1', '🚫 Cancelar la 2'));
  assert.equal(W.llamadas.find((x) => x.op === 'cancelar').code, 'R-RZP6UR');
});

// =====================================================================
//  3.15 · Ya tiene una cita abierta → «¿Seguro que quieres sacar otra? (p. ej. para otra persona)»
// =====================================================================
const YA = [{ code: 'R-YATENG', status: 'confirmed', date: HOY, time: '18:30', dia: 'Hoy', hora: '6:30 p. m.', servicio: 'Corte clásico', con: 'Yeferson', link: 'L', ids: ['c1'], staffId: 's1' }];
test('3.15 · Con una cita abierta, «quiero agendar» → «Ya tienes una cita… ¿Seguro que quieres sacar otra?» → sí → a nombre de la OTRA persona', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Nicolas'; cl.correo = 'nico@x.com';
  W.citas[CLIENTE] = YA;
  await llega(wahaMsg(CLIENTE, 'quiero agendar una cita'));
  assert.match(ultimo().texto, /Ya tienes una cita activa: \*?Hoy · 6:30 p\. m\.\*? · Corte clásico con Yeferson/); assert.match(ultimo().texto, /¿Quieres sacar otra .*cambiar o cancelar la que tienes\?/);
  assert.deepEqual(ids(ultimo()), ['otra:si', 'otra:cambiar', 'otra:cancelar', 'otra:no']);
  await llega(toca('otra:si', '✅ Sí, otra cita'));
  assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2'], 'sigue el agendamiento');
  await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no')); await llega(toca('dia:' + masDias(1))); await llega(toca('hora:09:00'));
  await llega(toca('pro:s1'));
  assert.match(ultimo().texto, /A nombre de quién es esta cita\? \(si es para ti, escribe \*yo\*\)/);
  await llega(wahaMsg(CLIENTE, 'mi hijo Tomás'));
  assert.match(ultimo().texto, /A nombre de Tomás\n/);
  await llega(toca('ok:si'));
  const cr = W.llamadas.find((x) => x.op === 'crear'); assert.equal(cr.nombre, 'Tomás'); assert.equal(cr.email, '', 'el correo de Nicolás no va en la cita de Tomás');
  assert.equal(B.ASIS.cliente('lina-spa:' + CLIENTE).nombre, 'Nicolas', 'el nombre del cliente no cambia');
});
test('3.15 · «No, solo la que tengo» → no agenda · «Cambiar la que tengo» → la mueve', async () => {
  W.citas[CLIENTE] = YA;
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  await llega(toca('otra:no'));
  assert.match(ultimo().texto, /sigues con tu cita de \*hoy a las 6:30 p\. m\.\*/); assert.ok(!W.llamadas.some((x) => x.op === 'crear'));
  mundoNuevo(); W.citas[CLIENTE] = YA;
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  await llega(toca('otra:cambiar'));
  assert.match(ultimo().texto, /Vamos a cambiar tu cita/); assert.equal(ultimo().lista.button, 'Elegir día');
});
test('3.15 · Por la conversación natural también: «¿tienes cupo mañana a las 9?» → sí → «Ya tienes una cita…»', async () => {
  W.citas[CLIENTE] = YA;
  await llega(wahaMsg(CLIENTE, 'tienes cupo mañana a las 9?'));
  await llega(toca('ap:si'));
  assert.match(ultimo().texto, /¿Quieres sacar otra/);
});
test('3.16 · «Ya tienes una cita activa» → «🚫 Cancelar la que tengo» la cancela', async () => {
  W.citas[CLIENTE] = YA;
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  await llega(toca('otra:cancelar', '🚫 Cancelar la que tengo'));
  assert.equal(W.llamadas.find((x) => x.op === 'cancelar').code, 'R-YATENG'); assert.match(ultimo().texto, /cancelé tu cita/);
});
test('3.15 · Sin citas abiertas NO pregunta nada (va directo)', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2']);
});
test('3.19 · Sin doble punto: «… a las 2:00 p. m. ¿Lo vas a apartar?» (no «p. m.. ¿Lo vas…»)', async () => {
  await llega(wahaMsg(CLIENTE, 'tienes cupo hoy a las 3?'));
  assert.doesNotMatch(ultimo().texto, /m\.\*?\.\s/); assert.match(ultimo().texto, /p\. m\.\*? ¿Lo vas a apartar\?/);
});

test('3.22 · Fechas y horas en PALABRAS (como las escribe el oído): «el veinte de noviembre a las cuatro de la tarde»…', () => {
  const A = require('../asistente'), F = (t) => A.fechaPedida(t, '2026-11-12'), H = (t) => A.horaPedida(t);
  assert.equal(F('tienes cita para el veinte de noviembre a las cuatro de la tarde'), '2026-11-20'); assert.deepEqual(H('tienes cita para el veinte de noviembre a las cuatro de la tarde'), { hm: '16:00' });
  assert.equal(F('para el sábado a las diez de la mañana'), '2026-11-14'); assert.deepEqual(H('para el sábado a las diez de la mañana'), { hm: '10:00' });
  assert.equal(F('el quince a las tres y media'), '2026-11-15'); assert.deepEqual(H('el quince a las tres y media'), { hm: '15:30' });
  assert.equal(F('el treinta y uno de diciembre'), '2026-12-31'); assert.deepEqual(H('a la una'), { hm: '13:00' });
  assert.equal(F('el lunes diecisiete a las once'), '2026-11-17', 'el número del día manda sobre el día de la semana');
  assert.equal(F('el viernes 14 a las 3'), '2026-11-14'); assert.equal(F('mañana a las 4 de la tarde'), '2026-11-13', '«4 de la tarde» no es el día 4');
  assert.equal(F('para el sábado a las 10 de la mañana'), '2026-11-14', '«10 de la mañana» no es el día 10');
  assert.equal(F('quiero una cita el viernes'), '2026-11-13');
});
test('3.22 · Con una oferta abierta para mañana, pedir OTRA fecha («el viernes a las 10») responde por ESA fecha (no por mañana)', async () => {
  await llega(wahaMsg(CLIENTE, 'tienes cupo mañana a las 9?'));
  assert.match(ultimo().texto, /mañana a las 9:00/);
  await llega(wahaMsg(CLIENTE, 'mejor pasado mañana a las diez'));
  assert.match(ultimo().texto, /Sí, tengo un cupo \*?el pasado a las 10:00 a\. m\./);
});

// =====================================================================
//  3.23 · El panel manda: apagar en «WhatsApp Bot» se aplica aunque Google esté caído (se lee directo de la base)
// =====================================================================
test('3.23 · El dueño APAGA el asistente en el panel → no responde, aunque Google siga diciendo «encendido» o esté caído', async () => {
  W.fsBot = { activo: false }; W.bot = { activo: true };
  await llega(wahaMsg(CLIENTE, 'hola')); await llega(wahaMsg(CLIENTE, 'hay cupos hoy?'));
  assert.equal(W.enviados.length, 0); assert.match(ultimoRegistro(), /apagado en el panel/);
  assert.ok(!W.gas.includes('chat'), 'ni siquiera le pregunta a Google');
});
test('3.23 · Apagar «agendar» y «cupos» en el panel → solo el link (leído de la base, sin Google)', async () => {
  W.fsBot = { agendar: false, cupos: false };
  await llega(wahaMsg(CLIENTE, 'hola')); await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  assert.ok(!ultimo().lista); assert.match(ultimo().texto, /tuagenda\.vip/);
});
test('3.23 · botNormal: los mismos valores por defecto que el servidor y el panel', () => {
  const c = P.botNormal({ activo: false, estados: { horas: ['09:00', '11:00', '15:00'] } }, 60);
  assert.equal(c.activo, false); assert.equal(c.agendar, true); assert.equal(c.recordatorioMin, 60); assert.equal(c.pausaMin, 30);
  assert.deepEqual(c.estados.horas, ['09:00', '11:00'], 'máximo 2 estados'); assert.deepEqual(P.botNormal(null).estados.horas, ['11:00']);
});

// =====================================================================
//  3.24 · LEY /sinbot
// =====================================================================
const delNegocio = (texto, id) => wahaMsg('x', texto, { id: 'true_' + CLIENTE + '@c.us_' + id, from: '573110000000@c.us', to: CLIENTE + '@c.us', fromMe: true });
test('3.24 · El dueño escribe /sinbot → mudo en ese chat (sin límite, ni recordatorios) → otro /sinbot del CLIENTE lo reactiva', async () => {
  await llega(delNegocio('/sinbot', 'SB1'));
  assert.match(ultimoRegistro(), /queda mudo en este chat/);
  const H = B.memHumano(); delete H['lina-spa:' + CLIENTE];   // aunque pase la pausa normal del dueño
  await llega(wahaMsg(CLIENTE, 'hola')); await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  W.proximas = [{ code: 'R-1', status: 'confirmed', dia: 'Hoy', hora: '3:00 p. m.', servicio: 'Corte', link: 'L', whatsapp: CLIENTE, nombre: 'Ana' }];
  await B.tickRecordatorios(true);
  assert.equal(W.enviados.filter((x) => x.motor === 'waha').length, 0, 'ni respuestas ni recordatorio en el chat silenciado');
  assert.equal(W.enviados.filter((x) => x.motor === 'evolution').length, 1, 'el otro negocio sí manda su recordatorio');
  W.enviados = [];
  await llega(wahaMsg(CLIENTE, '/sinbot'));
  assert.match(ultimoRegistro(), /vuelve a atender este chat \(el cliente\)/);
  await llega(wahaMsg(CLIENTE, 'hay cupos hoy?'));
  assert.equal(W.enviados.length, 1, 'ya responde');
});
test('3.24 · /sinbot del dueño otra vez también lo reactiva · un /sinbot del cliente sin estar mudo no hace nada', async () => {
  await llega(wahaMsg(CLIENTE, '/sinbot'));
  assert.match(ultimoRegistro(), /sin estar mudo: no hace nada/);
  await llega(delNegocio('/sinbot', 'SB2')); await llega(delNegocio('/SinBot', 'SB3'));
  assert.match(ultimoRegistro(), /vuelve a atender este chat \(el negocio\)/);
});
test('3.24 · /sinbot no es «el dueño escribió» (no deja la pausa de 30 min) y no se agrupa con otros mensajes', async () => {
  await llega(delNegocio('/sinbot', 'SB4'));
  assert.ok(!B.memHumano()['lina-spa:' + CLIENTE]);
  P.CFG.agruparMs = 60;
  try { await Promise.all([llega(wahaMsg(CLIENTE, 'hola')), llega(wahaMsg(CLIENTE, '/sinbot'))]); } finally { P.CFG.agruparMs = 0; }
  assert.ok(B.ultimos.some((x) => /vuelve a atender/.test(x.que)));
});

test('3.28 · Volver a escribir «quiero agendar» a los pocos minutos: el bot NO se queda mudo en «¿Qué día?» (las listas sí se repiten)', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  assert.equal(ultimo().lista.button, 'Elegir día');
  B.memDicho()['lina-spa:' + CLIENTE].t -= 3 * 60000;   // pasan 3 minutos
  for (const x of Object.values(P._banco.memRobot())) (x.textos || []).forEach((y) => { y[1] -= 4 * 60000; });
  const n = W.enviados.length;
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  assert.equal(W.enviados.length, n + 4, 'respondió los 4 pasos otra vez');
  assert.equal(ultimo().lista.button, 'Elegir día'); assert.match(ultimo().texto, /Qué día/);
  assert.doesNotMatch(B.ultimos.slice(-4).map((x) => x.que).join('|'), /no repito/);
});
test('3.28 · Google falla al buscar los días en medio del agendamiento → el bot AVISA (no se queda mudo) sin preguntarle a Google', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1'));
  W.falla = 'dias'; const g = W.gas.length;
  await llega(toca('mas:no', '✅ No, solo eso'));
  assert.match(ultimo().texto, /Se me demoró el sistema/); assert.match(ultimo().texto, /tuagenda\.vip\/index\.html\?b=lina-spa/);
  assert.equal(W.gas.slice(g).filter((x) => x === 'info').length, 0, 'no le pregunta a Google (que es el que falla)');
  assert.match(B.ultimos.map((x) => x.que).join('|'), /falló el asistente: Tiempo de espera/);
  W.falla = null; await llega(wahaMsg(CLIENTE, 'agendar'));
  assert.match(ultimo().texto, /Qué te quieres hacer/, 'al escribir «agendar» empieza otra vez');
});
test('3.28 · La MISMA lista dos veces en el mismo instante (doble envío) sí se frena', async () => {
  const neg = { bid: 'lina-spa' }, n = CLIENTE;
  assert.equal(B.yaLoDije(neg, n, 'L|dia:1', 30000), false); assert.equal(B.yaLoDije(neg, n, 'L|dia:1', 30000), true);
  B.memDicho()['lina-spa:' + n].t -= 31000; assert.equal(B.yaLoDije(neg, n, 'L|dia:1', 30000), false, 'a los 30 s ya se puede volver a mostrar');
});

test('3.29 · «Presenta problemas tu aplicativo para agendamiento» → «Qué pena… te agendo por aquí mismo» y la lista de servicios', async () => {
  await llega(wahaMsg(CLIENTE, 'Presenta problemas tu aplicativo para agendamiento'));
  assert.match(ultimo().texto, /Qué pena que el link te esté fallando/); assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2']);
  assert.ok(B.ultimos.some((x) => /link le falla/.test(x.que)));
});
test('3.29 · «el link no me abre» también; «tengo un problema con la barba» NO (no habla del link)', async () => {
  await llega(wahaMsg(CLIENTE, 'el link no me abre'));
  assert.match(ultimo().texto, /te agendo por aquí mismo/);
  const A = require('../asistente'); assert.ok(!(/link|enlace|pagina|aplicativo/.test('tengo un problema con la barba')), 'no habla del link');
});
test('3.29 · «Ver más horas» sí pasa a la siguiente página (antes volvía a la primera)', async () => {
  W.cupos[0].libres = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];
  W.cupos[0].horas = W.cupos[0].libres.map((t) => { const [h, m] = t.split(':').map(Number); return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' p. m.' : ' a. m.'); });
  await llega(wahaMsg(CLIENTE, 'hay cupos?'));
  assert.ok(ids(ultimo()).includes('hc:mas')); assert.ok(!ids(ultimo()).includes('hc:13:00'));
  await llega(toca('hc:mas'));
  assert.ok(ids(ultimo()).includes('hc:13:00'), 'segunda página'); assert.ok(!ids(ultimo()).includes('hc:09:00'));
});

test('3.30 · 💰 Agendar por WhatsApp SIN gastar Google en días y horas: el VPS los calcula leyendo la base (Google solo para el catálogo y crear)', async () => {
  const todos = { open: '06:00', close: '23:30' };
  W.fsDirecto = { st: { slotDurationMinutes: 30, minAdvanceMinutes: 0, bookingWindowDays: 30, businessHours: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), [todos]])) },
    staff: [{ id: 's1', name: 'Lina', active: true }, { id: 's2', name: 'Andrés', active: true }],
    servicios: [{ id: 'c1', name: 'Corte clásico', minutes: 40, active: true }, { id: 'c2', name: 'Degradado', minutes: 45, active: true }, { id: 'b1', name: 'Perfilado de barba', minutes: 20, active: true }, { id: 'e1', name: 'Cejas', minutes: 15, active: true }] };
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  assert.equal(ultimo().lista.button, 'Elegir día');
  assert.ok(!W.gas.includes('dias'), 'los días NO se le piden a Google');
  const dia = ids(ultimo())[1];   // mañana (siempre tiene horas)
  await llega(toca(dia));
  assert.equal(ultimo().lista.button, 'Elegir hora'); assert.ok(!W.gas.includes('horas'), 'las horas tampoco');
  const hora = ids(ultimo()).find((x) => x.startsWith('hora:'));
  await llega(toca(hora)); await llega(toca('pro:s1'));
  assert.ok(W.gas.includes('crear'), 'crear SÍ va a Google'); assert.match(ultimo().texto, /Cita confirmada|Te aparté/);
  assert.ok(W.fsLecturas > 0);
});
test('3.30 · Si la base no deja leer, se usa Google como antes (nada se rompe)', async () => {
  W.fsDirecto = null;
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  assert.equal(ultimo().lista.button, 'Elegir día'); assert.ok(W.gas.includes('dias'), 'cayó a Google');
});

test('3.30 · El saludo usa el NOMBRE que el cliente ya tiene en el negocio (aunque WhatsApp no lo mande) y no lo vuelve a buscar', async () => {
  W.nombreBase = 'Jeferson Villalobos';
  await llega(wahaMsg(CLIENTE, 'Q es eso mano', { _data: {} }));
  assert.match(W.enviados[0].texto, /^Hola Jeferson 👋 Soy el asistente de/);
  assert.equal(B.ASIS.cliente('lina-spa:' + CLIENTE).nombre, 'Jeferson Villalobos');
  const n = W.pidioNombre; await llega(wahaMsg(CLIENTE, 'tienen cupo?'));
  assert.equal(W.pidioNombre, n, 'ya lo sabe: no se lo pide otra vez a Google');
});
test('3.30 · WAHA (GOWS) manda el nombre en Info.PushName → también se usa', async () => {
  await llega(wahaMsg(CLIENTE, 'hola', { _data: { Info: { PushName: 'Mateo Gil' } } }));
  assert.match(W.enviados[0].texto, /^Hola Mateo 👋/);
});

// =====================================================================
//  3.32 · 🔁 recordatorio de servicio
// =====================================================================
const VOLVER = { code: 'R-VIEJA9', whatsapp: CLIENTE, nombre: 'Nicolas', servicio: 'Degradado', con: 'Lina', ids: ['c2'], staffId: 's1', diasDesde: 21 };
test('3.32 · 🔁 Recordatorio de servicio: «Ya van 3 semanas desde tu último Degradado con Lina. ¿Te agendo de nuevo?» → Sí, lo mismo → día → hora → ✅ Cita confirmada (sin pedir correo)', async () => {
  W.volver = [VOLVER];
  B.BOT.set('lina-spa', { cfg: P.botNormal({ volver: { activo: true, dias: 21 } }), t: Date.now() });
  const espacio = P.CFG.volverEspacioMs; P.CFG.volverEspacioMs = 0;
  try {
    await B.tickVolver(true); await new Promise((ok) => setTimeout(ok, 20));
    assert.deepEqual(W.volverAvisados, ['R-VIEJA9'], 'se marca para no escribirle dos veces por la misma visita');
    const m = ultimo();
    assert.equal(m.a, CLIENTE); assert.match(m.texto, /Hola Nicolas 👋 Te escribe el asistente de \*?Lina Spa/); assert.match(m.texto, /Ya van 3 semanas desde tu último \*?Degradado\*? con Lina\. ¿Te agendo de nuevo\?/);
    assert.deepEqual(ids(m), ['vol:si', 'vol:otro', 'vol:no']);
    await llega(toca('vol:si', '✅ Sí, lo mismo'));
    assert.equal(ultimo().lista.button, 'Elegir día'); assert.equal(W.llamadas.filter((x) => x.op === 'dias').pop().staffId, 's1', 'con el mismo profesional');
    await llega(toca('dia:' + HOY)); await llega(toca('hora:15:00'));
    const cr = W.llamadas.find((x) => x.op === 'crear');
    assert.ok(cr, 'confirmada sin preguntar el correo'); assert.deepEqual(cr.ids, ['c2']); assert.equal(cr.staffId, 's1'); assert.equal(cr.nombre, 'Nicolas');
    assert.match(ultimo().texto, /Cita confirmada, Nicolas/); assert.ok(B.ultimos.some((x) => /volvió a agendar/.test(x.que)));
    await B.tickVolver(true); assert.deepEqual(W.volverAvisados, ['R-VIEJA9'], 'una sola vez al día');
  } finally { P.CFG.volverEspacioMs = espacio; }
});
test('3.32 · 🔁 «No, gracias» → se despide y no insiste · «Otro servicio» → lista de servicios', async () => {
  B.BOT.set('lina-spa', { cfg: P.botNormal({ volver: { activo: true, dias: 21 } }), t: Date.now() });
  await B.ASIS.ofrecerVolver({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, CLIENTE, VOLVER, 'Lina Spa');
  await llega(toca('vol:no', '🙅 No, gracias'));
  assert.match(ultimo().texto, /aquí estamos cuando quieras/);
  await B.ASIS.ofrecerVolver({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, CLIENTE, VOLVER, 'Lina Spa');
  await llega(wahaMsg(CLIENTE, 'otro'));
  assert.deepEqual(ids(ultimo()), ['cat:0', 'cat:1', 'cat:2']);
});
test('3.32 · 🔁 Sin días elegidos por el dueño (o apagado) NO sale nada', async () => {
  W.volver = [VOLVER];
  B.BOT.set('lina-spa', { cfg: P.botNormal({ volver: { activo: true } }), t: Date.now() });
  await B.tickVolver(true); assert.ok(!W.gas.includes('volver'));
  B.BOT.set('lina-spa', { cfg: P.botNormal({ volver: { activo: false, dias: 21 } }), t: Date.now() });
  await B.tickVolver(true); assert.ok(!W.gas.includes('volver')); assert.equal(W.enviados.length, 0);
});

// =====================================================================
//  3.33 · ⏰ retomar al cliente que dejó el agendamiento a medias
// =====================================================================
function envejecer(min) { const c = P._banco.memConv()['lina-spa:' + CLIENTE]; c.t -= min * 60000; }
test('3.33 · ⏰ 30 min sin elegir el día → «¿Seguimos con tu cita? Te quedaste en elegir el día» → Seguir → la MISMA lista de días → sigue normal', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  const dias = ids(ultimo());
  envejecer(29); await B.tickRetomar(true); assert.equal(ultimo().lista.button, 'Elegir día', 'a los 29 min todavía no');
  envejecer(2); await B.tickRetomar(true);
  assert.match(ultimo().texto, /¿Seguimos con tu cita\?/); assert.match(ultimo().texto, /Te quedaste en \*?elegir el día/); assert.deepEqual(ids(ultimo()), ['ret:si', 'ret:no']);
  const n = W.enviados.length; envejecer(40); await B.tickRetomar(true); assert.equal(W.enviados.length, n, 'una sola vez');
  await llega(toca('ret:si', '✅ Seguir'));
  assert.match(ultimo().texto, /Seguimos/); assert.deepEqual(ids(ultimo()), dias, 'la misma lista donde quedó');
  await llega(toca(dias[0])); assert.equal(ultimo().lista.button, 'Elegir hora', 'y sigue normal');
});
test('3.33 · ⏰ «Ya no» → se despide · si responde directo (p. ej. «mañana») sigue donde quedó', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  envejecer(31); await B.tickRetomar(true);
  await llega(toca('ret:no', '🙅 Ya no'));
  assert.match(ultimo().texto, /Cuando quieras, escribe \*agendar\*/); assert.equal(P._banco.memConv()['lina-spa:' + CLIENTE], undefined);
  for (const x of Object.values(P._banco.memRobot())) (x.textos || []).forEach((y) => { y[1] -= 4 * 60000; });   // un rato después
  if (B.memDicho()['lina-spa:' + CLIENTE]) B.memDicho()['lina-spa:' + CLIENTE].t -= 60000;
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no'));
  envejecer(31); await B.tickRetomar(true);
  await llega(wahaMsg(CLIENTE, 'mañana'));
  assert.match(ultimo().texto, /Horas libres · Mañana/);
});
test('3.33 · ⏰ NO retoma: el saludo que nunca tocó, si el dueño habla en el chat, o con /sinbot', async () => {
  await llega(wahaMsg(CLIENTE, 'hola')); const n0 = W.enviados.length;
  const c0 = P._banco.memConv()['lina-spa:' + CLIENTE]; if (c0) c0.t -= 31 * 60000;
  await B.tickRetomar(true); assert.equal(W.enviados.length, n0, 'el saludo no es un agendamiento');
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2'));
  B.memHumano()['lina-spa:' + CLIENTE] = Date.now();
  envejecer(31); const n1 = W.enviados.length; await B.tickRetomar(true); assert.equal(W.enviados.length, n1, 'el dueño está hablando');
});

test('3.33 · ⏰ El «¿Seguimos con tu cita?» saluda por el NOMBRE: el de WhatsApp, o el que tiene en el negocio', async () => {
  const sinNombre = (row) => wahaMsg(CLIENTE, row, { _data: { Message: { listResponseMessage: { singleSelectReply: { selectedRowID: row } } } } });
  await llega(wahaMsg(CLIENTE, 'quiero agendar', { _data: { Info: { PushName: 'Oscar Pérez' } } })); await llega(sinNombre('cat:2'));
  envejecer(31); await B.tickRetomar(true);
  assert.match(ultimo().texto, /^Hola Oscar 👋 ¿Seguimos con tu cita\?/);
});
test('3.33 · ⏰ Sin nombre de WhatsApp → lo busca en los clientes del negocio (una vez) y saluda con él', async () => {
  W.nombreBase = 'Oscar Ruiz';
  await llega(wahaMsg(CLIENTE, 'quiero agendar', { _data: {} })); await llega(wahaMsg(CLIENTE, 'cat:2', { _data: { Message: { listResponseMessage: { singleSelectReply: { selectedRowID: 'cat:2' } } } } }));
  envejecer(31); await B.tickRetomar(true);
  assert.match(ultimo().texto, /^Hola Oscar 👋 ¿Seguimos/);
});

test('3.36 · ⏰ Se quedó eligiendo la hora de HOY y ya va a cerrar → «Hoy ya no quedan horas… te la busco para otro día» → otro día (sin hoy), con el servicio que ya eligió', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no')); await llega(toca('dia:' + HOY));
  assert.equal(ultimo().lista.button, 'Elegir hora');
  W.cupos[0].libres = []; W.cupos[0].horas = [];   // ya es hora de cerrar: hoy no queda nada
  envejecer(31); await B.tickRetomar(true);
  assert.match(ultimo().texto, /Hoy ya no quedan horas \(ya vamos a cerrar\), así que te la busco para \*otro día\*/); assert.equal(filas(ultimo())[0].title, '📅 Elegir otro día');
  await llega(toca('ret:si'));
  assert.equal(ultimo().lista.button, 'Elegir día'); assert.ok(!ids(ultimo()).includes('dia:' + HOY), 'hoy NO sale'); assert.ok(ids(ultimo()).includes('dia:' + masDias(1)));
  assert.deepEqual(W.llamadas.filter((x) => x.op === 'dias').pop().ids, ['e1'], 'con el servicio que ya había elegido');
  await llega(toca('dia:' + masDias(1))); await llega(toca('hora:09:00'));
  assert.ok(ids(ultimo()).includes('pro:s1') || /A nombre de quién|Cita confirmada/.test(ultimo().texto), 'sigue normal');
});
test('3.36 · ⏰ «¿Hay cupos?» de hoy sin tocar ninguna hora y ya cerraron → al seguir le salen los cupos de MAÑANA', async () => {
  await llega(wahaMsg(CLIENTE, 'hay cupos?')); await llega(toca('hc:otro')); await llega(toca('dia:' + HOY));
  W.cupos[0].libres = []; W.cupos[0].horas = [];
  envejecer(31); await B.tickRetomar(true);
  assert.match(ultimo().texto, /Hoy ya no quedan horas/);
  await llega(toca('ret:si'));
  assert.match(ultimo().texto, /cupos de mañana/i); assert.ok(!ids(ultimo()).some((x) => x === 'hc:15:00'));
});
test('3.36 · ⏰ Si TODAVÍA hay horas hoy, el «¿Seguimos?» sigue en el mismo día', async () => {
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1')); await llega(toca('mas:no')); await llega(toca('dia:' + HOY));
  envejecer(31); await B.tickRetomar(true);
  assert.match(ultimo().texto, /Te quedaste en \*elegir la hora/);
  await llega(toca('ret:si')); assert.equal(ultimo().lista.button, 'Elegir hora');
});

// =====================================================================
//  3.37 · 📊 reporte del bot
// =====================================================================
test('3.37 · 📊 El bot cuenta personas, interacciones, quién eligió de la lista y lo guarda en Google UNA vez (sin números de teléfono)', async () => {
  const cl = B.ASIS.cliente('lina-spa:' + CLIENTE); cl.nombre = 'Camila'; cl.correo = '';
  await llega(wahaMsg(CLIENTE, 'hola')); await llega(wahaMsg('573009998877', 'hola'));
  await llega(wahaMsg(CLIENTE, 'quiero agendar')); await llega(toca('cat:2')); await llega(toca('svc:e1'));
  const g = W.gas.filter((x) => x === 'estadisticas').length;
  assert.equal(g, 0, 'no se manda por cada mensaje');
  await B.tickEstadisticas();
  assert.equal(W.stats.length, 1); const e = W.stats[0];
  assert.equal(e.n.mensajes, 5); assert.equal(e.n.listas, 2); assert.equal(e.personas.length, 2, '2 personas distintas'); assert.equal(e.listas.length, 1, '1 persona eligió de la lista');
  assert.ok(e.personas.every((x) => /^[0-9a-f]{10}$/.test(x)), 'solo huellas'); assert.ok(!JSON.stringify(e).includes(CLIENTE.slice(-10)), 'sin el número');
  await B.tickEstadisticas(); assert.equal(W.stats.length, 1, 'sin cambios no se vuelve a mandar');
});
test('3.37 · 📊 Recordatorio de servicio y «¿Seguimos?»: enviados y cuántos terminaron agendando', async () => {
  B.BOT.set('lina-spa', { cfg: P.botNormal({ volver: { activo: true, dias: 21 } }), t: Date.now() });
  await B.ASIS.ofrecerVolver({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, CLIENTE, { code: 'R-V', whatsapp: CLIENTE, nombre: 'Nicolas', servicio: 'Degradado', con: 'Lina', ids: ['c2'], staffId: 's1', diasDesde: 21 }, 'Lina Spa');
  await llega(toca('vol:si')); await llega(toca('dia:' + HOY)); await llega(toca('hora:15:00'));
  await B.tickEstadisticas();
  assert.equal(W.stats.pop().n.volverOk, 1);
});

// =====================================================================
//  3.38 · 🏷️ marca de agua y «Regístrate gratis» en la prueba
// =====================================================================
test('3.38 · 🏷️ Todo estado lleva la marca de agua tuagenda.vip; con el adicional «sin marca» no', () => {
  const E = require('../estado'), info = Object.assign({}, NEGOCIO, { color: '#2B59C3', categorias: [] }), dia = { date: HOY, horas: ['3:00 p. m.'] };
  assert.match(E.svgHoy(info, dia), /tuagenda\.vip<\/text><\/g>/); assert.match(E.svgSemana(info, [{ date: HOY, dow: 1, abierto: true, libres: ['15:00'] }]), /tuagenda\.vip<\/text><\/g>/);
  assert.doesNotMatch(E.svgHoy(Object.assign({}, info, { marca: false }), dia), /tuagenda\.vip<\/text><\/g>/);
});
test('3.38 · 🚀 Prueba gratis: UN estado al día lleva «Regístrate gratis y crea tu agenda aquí: https://tuagenda.vip/»; en un plan de pago, nunca', async () => {
  W.prueba = true;
  await B.publicarEstado({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, 'hoy');
  assert.match(W.estados[0].caption, /Regístrate gratis y crea tu agenda aquí: https:\/\/tuagenda\.vip\/$/);
  await B.publicarEstado({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, 'hoy');
  assert.doesNotMatch(W.estados[1].caption, /Regístrate gratis/, 'solo uno al día');
  W.prueba = false; P._banco.reiniciar(); W.estados = [];
  await B.publicarEstado({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' }, 'hoy');
  assert.doesNotMatch(W.estados[0].caption, /Regístrate gratis/, 'plan de pago: sin invitación');
});

test('3.43 · 📲 Estado «Cómo agendar»: 2 imágenes EN ORDEN (pasos 1-2 y 3-4) con nombre, tipo, servicios y equipo reales · sin gastar Google', async () => {
  const todos = { open: '08:00', close: '18:00' };
  W.fsDirecto = { st: { businessName: 'Uñas Valen', businessType: 'unas', slotDurationMinutes: 30, minAdvanceMinutes: 0, bookingWindowDays: 30, businessHours: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), [todos]])) },
    staff: [{ id: 's1', name: 'Valen', active: true }],
    servicios: [{ id: 'm1', name: 'Manicure', minutes: 45, priceCOP: 25000, type: 'base', active: true }, { id: 'p1', name: 'Semipermanente', minutes: 60, priceCOP: 40000, type: 'base', active: true }],
    biz: { status: 'active', addons: {} } };
  const gasAntes = W.gas.length;
  const r = await B.publicarGuia({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' });
  assert.equal(r.ok, true);
  assert.equal(W.estados.length, 2, 'dos estados');
  assert.match(W.estados[0].caption, /Así agendas tu cita en Uñas Valen.*\(1 de 2\)/);
  assert.match(W.estados[1].caption, /Agenda aquí: https:\/\/tuagenda\.vip\/index\.html\?b=lina-spa/);
  assert.ok(!W.gas.slice(gasAntes).some((op) => op !== 'contactos' && op !== 'historia'), 'los datos NO se le piden a Google (solo la lista de contactos, que se guarda 6 h, y dejar la imagen en la página)');
  assert.deepEqual((W.historias || []).map((h) => h.id), ['guia1', 'guia2'], '3.51: las 2 imágenes quedan también en los estados de la página');
  assert.match(ultimoRegistro(), /cómo agendar.*publicado/);
});
test('3.43 · 📲 «Cómo agendar» usa lo real del negocio: tipo «Uñas», sus servicios y precios; sin servicios, los de ejemplo de su tipo; sin marca con el adicional', () => {
  const G = require('../guia');
  const base = { hoy: '2026-11-13', link: 'https://tuagenda.vip/index.html?b=x', staff: [{ name: 'Valen' }], cupos: { dias: [] }, biz: {} };
  let i = G.datosGuia(Object.assign({}, base, { st: { businessName: 'Uñas Valen', businessType: 'unas' }, servicios: [{ name: 'Manicure', minutes: 45, priceCOP: 25000, type: 'base' }] }));
  assert.equal(i.tipo, 'Uñas'); assert.deepEqual(i.servicios.map((s) => s.nombre), ['Manicure']); assert.equal(i.ejemplo, false);
  const svg = G.svgGuia(i, 2); assert.match(svg, /Manicure/); assert.match(svg, /\$25\.000/); assert.match(svg, /Uñas Valen/);
  i = G.datosGuia(Object.assign({}, base, { st: { businessName: 'Pelos', businessType: 'mascotas' }, servicios: [] }));
  assert.equal(i.ejemplo, true); assert.match(i.servicios[0].nombre, /Baño/);
  i = G.datosGuia(Object.assign({}, base, { st: { businessType: 'otro', businessTypeLabel: 'Bronceado' }, servicios: [] }));
  assert.equal(i.tipo, 'Bronceado');
  i = G.datosGuia(Object.assign({}, base, { st: { businessName: 'X' }, servicios: [], biz: { addons: { sinMarca: true } } }));
  assert.equal(i.marca, false); assert.doesNotMatch(G.svgGuia(i, 1), /Hecho con tuagenda/);
  for (const p of [1, 2]) assert.match(G.svgGuia(i, p), new RegExp(p + ' de 2'));
});
test('3.43 · 📲 «Cómo agendar» sale a las 8:00 cada 3 días (lo cambia el dueño en el panel) y una sola vez', () => {
  const G = require('../guia'), a = (fecha, hm) => ({ fecha, hm });
  assert.equal(G.guiaToca({}, a('2026-11-13', '07:59'), null), false, 'antes de las 8 no');
  assert.equal(G.guiaToca({}, a('2026-11-13', '08:00'), null), true, 'la primera vez sí');
  assert.equal(G.guiaToca({}, a('2026-11-13', '09:00'), '2026-11-13'), false, 'una vez al día');
  assert.equal(G.guiaToca({}, a('2026-11-15', '08:00'), '2026-11-13'), false, 'a los 2 días todavía no');
  assert.equal(G.guiaToca({}, a('2026-11-16', '08:00'), '2026-11-13'), true, 'a los 3 días sí');
  assert.equal(G.guiaToca({ cadaDias: 1, hora: '10:00' }, a('2026-11-14', '09:30'), '2026-11-13'), false, 'su hora');
  assert.equal(G.guiaToca({ cadaDias: 1, hora: '10:00' }, a('2026-11-14', '10:00'), '2026-11-13'), true);
  assert.equal(G.guiaToca({ activo: false }, a('2026-11-20', '08:00'), null), false, 'apagado');
});

test('3.45 · 🤖 Lo que el superusuario APAGA en su panel (para todas las tiendas) manda sobre lo que tenga cada tienda; al prenderlo vuelve como estaba', async () => {
  const neg = { bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' };
  W.fsBot = { cupos: true, volver: { activo: true, dias: 21 }, guia: { activo: true }, recordatorioMin: 60 };
  W.botOff = ['cupos', 'volver', 'guia', 'recordatorio']; B.botOff.t = 0; B.botOff.L = [];
  let c = await B.botAlDia(neg);
  assert.equal(c.cupos, false, 'cupos apagado por el superusuario'); assert.equal(c.volver.activo, false); assert.equal(c.guia.activo, false); assert.equal(c.recordatorioMin, 0);
  assert.equal(c.agendar, true, 'lo demás sigue igual');
  W.botOff = []; B.botOff.t = 0;
  c = await B.botAlDia(neg);
  assert.equal(c.cupos, true, 'lo prende otra vez: vuelve como lo tenía la tienda'); assert.equal(c.volver.dias, 21); assert.equal(c.recordatorioMin, 60);
  W.botOff = null; W.fsBot = null; B.botOff.L = []; B.botOff.t = 0;
});

test('3.47 · 🔔 Avisos al dueño por WhatsApp: le llegan a su número personal; un comprobante se aprueba respondiendo 1 (o 2 = rechazar); Google solo se llama cuando hay avisos', async () => {
  const DUENO = '573009998877';
  W.avisosNum = DUENO; W.avisos = [{ t: Date.now(), texto: 'NUEVA RESERVA\nJuan Pérez · R-AAAA1', code: '' }, { t: Date.now(), texto: 'COMPROBANTE POR REVISAR\nJuan Pérez · R-AAAA1', code: 'R-AAAA1' }];
  let antes = W.gas.length;
  await B.tickPedidosWa();
  assert.ok(!W.gas.slice(antes).includes('avisos'), 'sin bandera no se le pregunta nada a Google');
  W.avisoPend = Date.now(); await B.tickPedidosWa();
  const alDueno = W.enviados.filter((x) => x.a === DUENO);
  assert.equal(alDueno.length, 2); assert.match(alDueno[0].texto, /^🔔 NUEVA RESERVA/); assert.match(alDueno[1].texto, /Responde \*1\* para APROBAR/);
  antes = W.gas.length; await B.tickPedidosWa();
  assert.ok(!W.gas.slice(antes).includes('avisos'), 'la misma bandera no se atiende dos veces');
  // un cliente cualquiera que escribe «1» NO aprueba nada
  await llega(wahaMsg(CLIENTE, '1')); assert.equal(W.revisado, undefined);
  await llega(wahaMsg(DUENO, '1'));
  assert.deepEqual(W.revisado, { code: 'R-AAAA1', aprobar: true, de: DUENO }); assert.match(ultimo().texto, /Pago aprobado.*R-AAAA1/);
  W.revisado = undefined; await llega(wahaMsg(DUENO, '1')); assert.equal(W.revisado, undefined, 'ya no hay nada pendiente: el 1 no vuelve a aprobar');
  W.avisoPend = 0; W.avisos = []; W.avisosNum = '';
});

test('3.49 · 🕵️ Número oculto (…@lid): si WAHA sabe el número real, se atiende normal (y se recuerda); si no, se responde EN ESE CHAT con el link, una sola vez', async () => {
  const lid = (codigo, texto) => wahaMsg('x', texto, { from: codigo + '@lid' });
  // 1) WAHA no sabe el número → responde con el link al chat oculto
  await llega(lid('111222333444555', 'hola quiero una cita'));
  assert.equal(ultimo().chatId, '111222333444555@lid'); assert.match(ultimo().texto, /Para agendar tu cita entra aquí 👉 https:\/\/tuagenda\.vip\/index\.html\?b=lina-spa/);
  assert.match(ultimoRegistro(), /número oculto: le respondí con el link/);
  const n = W.enviados.length;
  await llega(lid('111222333444555', 'hola??')); assert.equal(W.enviados.length, n, 'no repite el link en menos de 12 h'); assert.match(ultimoRegistro(), /ya le mandé el link/);
  // 2) WAHA sí sabe el número → se atiende como cualquier cliente, a su número real
  W.lids = { '999888777666555@lid': '573005550101@c.us' };
  await llega(lid('999888777666555', 'hola'));
  assert.equal(ultimo().a, '573005550101', 'le responde a su número real'); assert.doesNotMatch(ultimo().texto, /Para agendar tu cita entra aquí 👉/, 'ya no es el mensaje de emergencia');
  assert.equal(B.memLids()['lina-spa:999888777666555@lid'], '573005550101', 'queda guardado para la próxima');
  W.lids = {};
});

test('3.51 · 📣 Los estados del bot llegan a TRES fuentes (clientes + quienes le han escrito + la libreta del WhatsApp), sin bloqueados ni repetidos, con tope; apagado → solo clientes', async () => {
  const neg = { bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' };
  W.bloqueados = ['573009990000'];
  W.wahaChats = [{ id: '573001112233@c.us' }, { id: '573015550001@c.us' }, { id: '120363@g.us' }, { id: '777@lid' }, { id: '573009990000@c.us' }];
  W.wahaLibreta = [{ id: '573025550002@c.us', isMyContact: true }, { id: '573035550003@c.us', isMyContact: false }, { id: '573015550001@c.us', isMyContact: true }];
  B.memConv(); P._banco.ASIS.cliente('lina-spa:573045550004').nombre = 'Ana';   // alguien que le escribió al bot
  await B.publicarEstado(neg, 'hoy');
  const C = W.estados[0].contacts.map((x) => x.split('@')[0]);
  assert.deepEqual(C, ['573001112233', '573004445566', '573045550004', '573015550001', '573025550002', '573187920386'], 'clientes, luego chats, luego libreta, y el número de prueba; sin grupos, sin ocultos, sin bloqueados, sin repetir');
  assert.match(ultimoRegistro(), /a 6 contactos \(2 clientes, 2 que le han escrito, 1 de su libreta\)/);
  assert.equal(W.historias[0].id, 'hoy', 'y queda en los estados de la página'); assert.match(W.historias[0].img, /^data:image\/png;base64,/);
  // el dueño lo apaga → solo los clientes del panel, y no va a la página
  W.fsBot = { estados: { todos: false, pagina: false } }; await B.botAlDia(neg); B.AUDIENCIA.clear(); W.estados = []; W.historias = [];
  await B.publicarEstado(neg, 'hoy');
  assert.deepEqual(W.estados[0].contacts.map((x) => x.split('@')[0]), ['573001112233', '573004445566', '573187920386']); assert.equal(W.historias.length, 0);
  W.fsBot = null; W.wahaChats = null; W.wahaLibreta = null; W.bloqueados = null;
});

test('3.52 · 📧 El cliente escribe su correo en medio de las listas: se busca en los clientes del negocio, se le reconoce y se sigue donde iba (antes: «No te entendí»)', async () => {
  W.porCorreo = { 'alex@correo.com': { nombre: 'Alex Ruiz', citas: [{ code: 'R-1', status: 'confirmed', dia: 'Mañana', hora: '10:00 a. m.', servicio: 'Corte' }] } };
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));
  const lista = ultimo().lista.button;
  await llega(wahaMsg(CLIENTE, 'alex@correo.com'));
  assert.deepEqual(W.reconocido, { phone: CLIENTE, email: 'alex@correo.com' }, 'se le pregunta al servidor por ese correo');
  assert.match(ultimo().texto, /Ya te encontré y dejé tu WhatsApp al día/); assert.match(ultimo().texto, /Tu cita: \*Mañana\* a las \*10:00 a\. m\.\*/);
  assert.doesNotMatch(ultimo().texto, /No te entendí/); assert.equal(ultimo().lista.button, lista, 'y vuelve a mostrar la misma lista');
  assert.equal(B.ASIS.cliente('lina-spa:' + CLIENTE).nombre, 'Alex Ruiz');
  // un correo que no está: no se enreda, sigue igual
  await llega(wahaMsg(CLIENTE, 'otro@correo.com'));
  assert.match(ultimo().texto, /No encontré ese correo/); assert.equal(ultimo().lista.button, lista);
  W.porCorreo = null;
});
test('3.52 · 🧠 Guardado inteligente: apagado por defecto (no guarda a nadie); si el dueño lo activa, guarda a quien escribe con su nombre de WhatsApp, una sola vez', async () => {
  await llega(wahaMsg(CLIENTE, 'hola, ¿cuánto vale el corte?'));
  assert.ok(!W.gas.includes('guardarContacto'), 'apagado: no guarda');
  P._banco.reiniciar(); W.fsBot = { guardado: true }; await B.botAlDia({ bid: 'lina-spa', instancia: 'lina-spa', motor: 'waha', sesion: 'default' });
  await llega(wahaMsg(CLIENTE, 'hola, ¿cuánto vale el corte?')); await new Promise((ok) => setTimeout(ok, 20));
  assert.deepEqual(W.guardados, [{ phone: CLIENTE, nombre: 'Camila' }]);
  await llega(wahaMsg(CLIENTE, 'gracias')); await new Promise((ok) => setTimeout(ok, 20));
  assert.equal(W.guardados.length, 1, 'una sola vez por persona');
  W.fsBot = null; W.guardados = null;
});

test('3.53 · 🚫 «Necesito cancelar mi reserva R-G2GKAH» en medio de las listas: NO arranca a agendar; usa esa reserva y, si falta poco, pide el motivo y cancela', async () => {
  W.porCodigo = { 'R-G2GKAH': { code: 'R-G2GKAH', status: 'confirmed', dia: 'Hoy', hora: '11:00 a. m.', servicio: 'Corte', link: 'https://tuagenda.vip/?b=lina-spa&cita=R-G2GKAH' } };
  W.cancelarTarde = true;
  await llega(wahaMsg(CLIENTE, 'quiero agendar'));                       // deja una lista viva, como en el chat de Alex
  await llega(wahaMsg(CLIENTE, 'cancelar mi reserva R-G2GKAH'));   // corto: en la prueba llega al instante y el freno anti-bots pausa los textos largos
  assert.doesNotMatch(ultimo().texto, /Qué te quieres hacer/, 'ya no arranca a agendar');
  assert.match(ultimo().texto, /Tu cita es el \*hoy a las 11:00 a\. m\.\*[\s\S]*¿Deseas \*cancelarla\* o \*reagendarla\*\?/);
  await llega(wahaMsg(CLIENTE, 'sí'));
  assert.match(ultimo().texto, /Falta poco para tu cita/); assert.match(ultimo().texto, /por qué no puedes ir/);
  await llega(wahaMsg(CLIENTE, 'se me dañó la moto'));
  assert.deepEqual(W.cancelado, { code: 'R-G2GKAH', motivo: 'se me dañó la moto', conCodigo: true });
  assert.match(ultimo().texto, /cancelé tu cita/);
  W.porCodigo = null; W.cancelarTarde = false; W.cancelado = null;
});
test('3.53 · Quiere cancelar y no se le encuentra cita: se le dice y se le pide el número de reserva (antes arrancaba a agendar)', async () => {
  await llega(wahaMsg(CLIENTE, 'necesito cancelar mi reserva'));
  assert.match(ultimo().texto, /No encontré una cita activa/); assert.match(ultimo().texto, /cancelar R-ABC123/); assert.ok(!ultimo().lista, 'sin lista de servicios');
});

test('3.54 · «Quiero cancelar» → «¿Deseas cancelarla o reagendarla?» → elige REAGENDAR → sigue el flujo de cambiar la cita (pide el día), sin cancelar nada', async () => {
  W.citas[CLIENTE] = [{ code: 'R-ABC123', status: 'confirmed', dia: 'Viernes 14', hora: '3:00 p. m.', servicio: 'Manicure', link: 'L', ids: ['e1'], staffId: 's1' }];
  await llega(wahaMsg(CLIENTE, 'quiero cancelar mi cita'));
  await llega(toca('can:mover', '🔄 Reagendarla'));
  assert.match(ultimo().texto, /Vamos a cambiar tu cita/); assert.equal(ultimo().lista.button, 'Elegir día');
  assert.ok(!W.llamadas.some((x) => x.op === 'cancelar'), 'no canceló nada');
  // y escrito a mano también lo entiende
  P._banco.reiniciar(); W.citas[CLIENTE] = [{ code: 'R-ABC123', status: 'confirmed', dia: 'Viernes 14', hora: '3:00 p. m.', servicio: 'Manicure', link: 'L', ids: ['e1'], staffId: 's1' }];
  await llega(wahaMsg(CLIENTE, 'quiero cancelar mi cita')); await llega(wahaMsg(CLIENTE, 'reagendar'));
  assert.match(ultimo().texto, /Vamos a cambiar tu cita/);
});
