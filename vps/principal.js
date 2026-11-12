// 👩‍💼 MARY DEL AGENDADOR · recepcionista por WhatsApp (sin IA). Servicio aparte: NO toca a Mary de Epic ni su Evolution.
//   · Alguien escribe → si su número tiene cita, se la muestra con el link para cambiarla; si no, le manda el link para agendar.
//   · Foto del pago → la pasa a la cita que espera abono.        · Correo del banco del negocio → confirma la cita sola.
//   · Estados de WhatsApp con los cupos de hoy (cada mañana) y de la semana (un día a la semana).   · Recordatorio antes de la cita.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const T = require('./textos'), C = require('./correo'), E = require('./estado');

const VERSION = 'agendador-ia-2.9';
const env = (k, d) => (process.env[k] === undefined || process.env[k] === '' ? d : process.env[k]);
const CFG = {
  puerto: parseInt(env('PUERTO', '3060'), 10),
  evo: String(env('EVO_URL', 'http://evolution-agendador:8080')).replace(/\/+$/, ''), evoKey: env('EVO_KEY', ''),
  gas: env('GAS_URL', ''), maryKey: env('MARY_KEY', ''),
  publico: String(env('PUBLICO', 'http://agendador-ia:3060')).replace(/\/+$/, ''),   // dirección con la que Evolution (por dentro) baja las imágenes de los estados
  datos: env('DATOS', path.join(__dirname, 'datos')), negocios: env('NEGOCIOS', path.join(__dirname, 'negocios.json')),
  modo: String(env('MARY_MODO', 'prueba')).toLowerCase(),   // prueba (solo MARY_PRUEBA) | todos | apagado
  prueba: String(env('MARY_PRUEBA', '')).split(/[,\s]+/).map((x) => x.replace(/\D/g, '')).filter((x) => x.length >= 10),
  silencioMin: parseInt(env('SILENCIO_MIN', '15'), 10),     // no repite lo mismo en un chat antes de esto (salvo que el cliente diga algo de la lista)
  humanoMin: parseFloat(env('HUMANO_MIN', '15')),           // 1.8: si el dueño escribe a mano en un chat, Mary se calla ahí 15 min (antes 12 h)
  tz: env('TZ', 'America/Bogota'),
  // 2.2 · motor de WhatsApp: evolution (el de siempre) o waha. Cada negocio puede tener el suyo en negocios.json ("motor", "sesion").
  motor: String(env('WA_MOTOR', 'evolution')).toLowerCase(),
  waha: String(env('WAHA_URL', 'http://waha-agendador:3000')).replace(/\/+$/, ''), wahaKey: env('WAHA_KEY', '')
};
const log = (...a) => console.log(new Date().toISOString(), ...a);
const est = { desde: new Date().toISOString(), recibidos: 0, respondidos: 0, fotos: 0, pagosLeidos: 0, pagosConfirmados: 0, estados: 0, recordatorios: 0, errores: 0 };
const ultimos = []; const anotar = (x) => { ultimos.push(Object.assign({ t: new Date().toISOString() }, x)); if (ultimos.length > 300) ultimos.shift(); };

// ---------- negocios (negocios.json, se relee solo al cambiar) ----------
let NEG = [], negT = 0;
function negocios() {
  try { const t = fs.statSync(CFG.negocios).mtimeMs; if (t !== negT) { NEG = JSON.parse(fs.readFileSync(CFG.negocios, 'utf8')).filter((n) => n && n.bid && n.instancia && n.activo !== false); negT = t; log('📒 negocios:', NEG.map((n) => n.bid).join(', ') || '(ninguno)'); } }
  catch (e) { if (negT !== -1) log('⚠️ No pude leer negocios.json:', e.message); negT = -1; NEG = []; }
  return NEG;
}
const negDe = (inst) => negocios().find((n) => n.instancia === inst);

// ---------- memoria pequeña en disco (último mensaje por chat, estados publicados, chats en manos del dueño) ----------
const MEM_F = path.join(CFG.datos, 'memoria.json');
let MEM = { chats: {}, estados: {}, humano: {}, enviados: [] };
try { MEM = Object.assign(MEM, JSON.parse(fs.readFileSync(MEM_F, 'utf8'))); } catch (e) { /* primera vez */ }
let memSucia = false; const memGuardar = () => { memSucia = true; };
setInterval(() => { if (!memSucia) return; memSucia = false; try { fs.mkdirSync(CFG.datos, { recursive: true }); fs.writeFileSync(MEM_F + '.tmp', JSON.stringify(MEM)); fs.renameSync(MEM_F + '.tmp', MEM_F); } catch (e) { log('memoria:', e.message); } }, 5000).unref();

// ---------- Evolution (el de Mary del agendador) ----------
async function evo(metodo, ruta, cuerpo, ms) {
  const r = await fetch(CFG.evo + ruta, { method: metodo, headers: { apikey: CFG.evoKey, 'Content-Type': 'application/json' }, body: cuerpo ? JSON.stringify(cuerpo) : undefined, signal: AbortSignal.timeout(ms || 30000) });
  const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) { j = { raw: txt.slice(0, 300) }; }
  if (!r.ok) throw new Error('Evolution ' + r.status + ' ' + ruta + ': ' + txt.slice(0, 200));
  return j;
}
// ---------- WAHA (otro motor de WhatsApp) ----------
const esWaha = (neg) => String((neg && neg.motor) || CFG.motor) === 'waha';
const sesionDe = (neg) => String((neg && (neg.sesion || neg.instancia)) || 'default');
async function waha(metodo, ruta, cuerpo, ms) {
  const r = await fetch(CFG.waha + ruta, { method: metodo, headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, CFG.wahaKey ? { 'X-Api-Key': CFG.wahaKey } : {}), body: cuerpo ? JSON.stringify(cuerpo) : undefined, signal: AbortSignal.timeout(ms || 30000) });
  const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) { j = { raw: txt.slice(0, 300) }; }
  if (!r.ok) throw new Error('WAHA ' + r.status + ' ' + ruta + ': ' + txt.slice(0, 200));
  return j;
}
// 2.6: número real (…@s.whatsapp.net / …@c.us) escondido en cualquier parte del aviso, que no sea el del propio negocio
function telEnAviso(p, me) {
  const mio = String((me && me.id) || '').split('@')[0].replace(/\D/g, '');
  let hallado = '';
  (function mirar(o, prof) {
    if (hallado || o == null || prof > 6) return;
    if (typeof o === 'string') { const m = o.match(/^(\d{10,15})(?::\d+)?@(s\.whatsapp\.net|c\.us)$/); if (m && m[1] !== mio) hallado = m[1] + '@s.whatsapp.net'; return; }
    if (typeof o === 'object') for (const v of Object.values(o)) mirar(v, prof + 1);
  })(p, 0);
  return hallado;
}
// Convierte lo que manda WAHA al mismo formato que ya entiende Mary (el de Evolution)
function deWaha(b) {
  const ev = String(b.event || ''), p = b.payload || {};
  const neg = negocios().find((n) => (n.sesion || n.instancia) === b.session) || { instancia: b.session };
  if (ev === 'session.status') return { event: 'connection.update', instance: neg.instancia, data: { state: String(p.status || '').toUpperCase() === 'WORKING' ? 'open' : 'close', wuid: (b.me && b.me.id) || '' } };
  if (!/^message(\.any)?$/.test(ev)) return null;
  const chat = String(p.fromMe ? (p.to || '') : (p.from || '')), jid = chat.replace(/@c\.us$/, '@s.whatsapp.net');
  const d = p._data || {};
  let alt = String((d.key && d.key.remoteJidAlt) || d.senderPn || p.participant || '').replace(/@c\.us$/, '@s.whatsapp.net');
  if (!/@(s\.whatsapp\.net|c\.us)$/.test(jid) && !/@s\.whatsapp\.net$/.test(alt)) alt = telEnAviso(p, b.me) || alt;   // 2.6: WhatsApp oculta el número (…@lid): se busca el real
  const mime = String((p.media && p.media.mimetype) || '');
  const message = p.hasMedia && /image|pdf/.test(mime) ? (/pdf/.test(mime) ? { documentMessage: { mimetype: mime } } : { imageMessage: { mimetype: mime, caption: p.body || '' } }) : { conversation: String(p.body || '') };
  return { event: 'messages.upsert', instance: neg.instancia, data: { key: { remoteJid: jid, remoteJidAlt: /@/.test(alt) ? alt : '', fromMe: p.fromMe === true, id: String(p.id || '') }, pushName: String(d.notifyName || d.pushName || ''), message, mediaUrl: String((p.media && p.media.url) || '') } };
}
async function bajarMediaWaha(url) {
  if (!url) return '';
  const u = url.replace(/^https?:\/\/[^/]+/, CFG.waha);   // WAHA a veces da su dirección pública: se baja por dentro
  const r = await fetch(u, { headers: CFG.wahaKey ? { 'X-Api-Key': CFG.wahaKey } : {}, signal: AbortSignal.timeout(45000) });
  if (!r.ok) return '';
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}
function numeroWa(x) { let d = String(x || '').replace(/\D/g, ''); if (d.length === 10 && /^3/.test(d)) d = '57' + d; return d; }
const ULT_ENVIO = new Map();   // chat → cuándo le escribió Mary (para no confundir su propio eco con el dueño)
async function escribir(neg, numero, texto) {
  const n = numeroWa(numero); if (n.length < 11) { const e = new Error('número inválido'); e.permanente = true; throw e; }
  ULT_ENVIO.set(neg.bid + ':' + n, Date.now());
  let r;
  if (esWaha(neg)) {
    const chatId = n + '@c.us', session = sesionDe(neg);
    try { await waha('post', '/api/startTyping', { session, chatId }, 8000); await new Promise((ok) => setTimeout(ok, 1200)); await waha('post', '/api/stopTyping', { session, chatId }, 8000); } catch (e) { /* no importa */ }
    try { r = await waha('post', '/api/sendText', { session, chatId, text: texto, linkPreview: false }); }
    catch (e) { if (/WAHA 4\d\d/.test(e.message) && !/WAHA 42/.test(e.message)) e.permanente = true; throw e; }
    const idw = r && (r.id && (r.id._serialized || r.id.id || r.id)) || (r && r.key && r.key.id); r = { key: { id: typeof idw === 'string' ? idw : '' } };
  } else {
    try { await evo('post', '/chat/sendPresence/' + encodeURIComponent(neg.instancia), { number: n, presence: 'composing', delay: 1200 }, 8000); } catch (e) { /* no importa */ }
    try { r = await evo('post', '/message/sendText/' + encodeURIComponent(neg.instancia), { number: n, text: texto, linkPreview: false }); }
    catch (e) { if (/Evolution 4\d\d/.test(e.message)) e.permanente = true; throw e; }   // 400: número sin WhatsApp → no se reintenta
  }
  const id = r && r.key && r.key.id; if (id) { MEM.enviados.push(id); if (MEM.enviados.length > 500) MEM.enviados.splice(0, 100); memGuardar(); }
  est.respondidos++;
  return r;
}

// ---------- servidor del agendador (Apps Script, acción "mary") ----------
async function gas(neg, op, datos) {
  if (!CFG.gas || !CFG.maryKey) throw new Error('Falta GAS_URL o MARY_KEY en agendador-ia.env');
  const r = await fetch(CFG.gas, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'mary', businessId: neg.bid, key: CFG.maryKey, op }, datos || {})), redirect: 'follow', signal: AbortSignal.timeout(60000) });
  const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch (e) { throw new Error('El servidor respondió algo raro: ' + txt.slice(0, 160)); }
  if (!j.ok) throw new Error(j.error || 'error del servidor');
  return j.data;
}

// ---------- ¿quién escribe? ----------
function leerMensaje(b) {
  const d = (b && b.data) || {}, k = d.key || {}, jid = String(k.remoteJid || '');
  const alt = String(k.remoteJidAlt || d.senderPn || k.senderPn || '');
  const tel = [jid, alt].map((x) => (/@(s\.whatsapp\.net|c\.us)$/.test(x) ? x.split('@')[0].replace(/\D/g, '') : '')).find((x) => x.length >= 10) || '';
  const m = d.message || {};
  const texto = String(m.conversation || (m.extendedTextMessage && m.extendedTextMessage.text) || (m.imageMessage && m.imageMessage.caption) || (m.buttonsResponseMessage && m.buttonsResponseMessage.selectedDisplayText) || '').trim();
  const media = m.imageMessage ? 'image' : (m.documentMessage && /image|pdf/.test(String(m.documentMessage.mimetype || ''))) ? 'document' : '';
  return {
    evento: String(b && b.event || '').toLowerCase().replace(/_/g, '.'), inst: String(b && b.instance || ''), jid, tel, texto, media, id: String(k.id || ''),
    nombre: String(d.pushName || ''), deMi: k.fromMe === true, grupo: /@g\.us$/.test(jid), estado: /status@broadcast/.test(jid),
    base64: String(m.base64 || d.base64 || ''), mediaUrl: String(d.mediaUrl || ''), mime: String((m.imageMessage && m.imageMessage.mimetype) || (m.documentMessage && m.documentMessage.mimetype) || 'image/jpeg')
  };
}
function atiende(c) {
  if (CFG.modo === 'apagado') return false;
  if (CFG.modo === 'todos') return true;
  return CFG.prueba.some((p) => c.tel.slice(-10) === p.slice(-10));
}
// ¿pregunta algo concreto? (entonces responde aunque haya respondido hace poco)
// 1.8: lo que siempre merece respuesta (aunque el cliente ya tenga su cita confirmada o Mary le haya escrito hace poco)
const PREGUNTA = /(^|\b)(hola|holi|buenas|buenos|buen d[ií]a|saludos|hey|info|informaci[oó]n)\b|cita|agend|reserv|turno|cupo|hora|confirm|cambi|cancel|mover|muev|reprogram|reagend|aplaz|pago|pagu|abono|transfer|consign|link|enlace|precio|cu[aá]nto|horario|disponib|ma[ñn]ana|hoy|direcci[oó]n|ubicaci|d[oó]nde|\bR-?[A-Z0-9]{6}\b/i;
// ¿Mary responde este texto? (función pura, con pruebas en el banco)
//  · el dueño escribió hace menos de HUMANO_MIN → no
//  · el cliente ya tiene su cita CONFIRMADA (y ninguna esperando pago) → solo si dice algo de la lista (hola, confirmar, cancelar, cambiar…)
//  · le respondió hace menos de SILENCIO_MIN → solo si dice algo de la lista
//  · ya le dijo lo mismo 2 veces seguidas → no
function debeResponder({ texto, pausadoPorDueno, reciente, citas, repetido }) {
  if (pausadoPorDueno) return false;
  const patron = PREGUNTA.test(String(texto || ''));
  const L = citas || [], todasConfirmadas = L.length > 0 && L.every((c) => c.status === 'confirmed');
  if (todasConfirmadas && !patron) return false;
  if (reciente && !patron) return false;
  if (reciente && repetido) return false;
  return true;
}

// 🧵 1.1: una fila por chat (dos mensajes seguidos no producen dos respuestas cruzadas) y nunca el mismo mensaje dos veces
const FILAS = new Map();
function enFila(k, fn) { const antes = FILAS.get(k) || Promise.resolve(); const p = antes.then(fn, fn); const fin = p.catch(() => {}); FILAS.set(k, fin); fin.then(() => { if (FILAS.get(k) === fin) FILAS.delete(k); }); return p; }
const VISTOS_ID = new Map();
function yaVisto(id) { if (!id) return false; if (VISTOS_ID.has(id)) return true; VISTOS_ID.set(id, Date.now()); if (VISTOS_ID.size > 2000) { const lim = Date.now() - 3600000; for (const [k, t] of VISTOS_ID) if (t < lim) VISTOS_ID.delete(k); } return false; }
function alMensaje(b) {
  const c = leerMensaje(b);
  if (!/^messages\.upsert$/.test(c.evento) || !c.jid || c.grupo || c.estado || yaVisto(c.id)) return Promise.resolve();
  const neg = negDe(c.inst); if (!neg) { if (!c.deMi) anotar({ que: '⚠️ mensaje de «' + c.inst + '», que no está en negocios.json: no respondo' }); return Promise.resolve(); }
  return enFila(neg.bid + ':' + (c.tel || c.jid), () => atenderMensaje(c, neg));
}
async function atenderMensaje(c, neg) {
  const k = neg.bid + ':' + (c.tel || c.jid);
  if (c.deMi) {   // 🙋 el dueño escribió a mano en este chat (no fue Mary): Mary se hace a un lado
    // 1.1: ¿es el eco de lo que Mary acaba de mandar? Si Mary escribió hace poco, se espera 3 s a que Evolution le confirme el id del envío
    if (c.id && MEM.enviados.indexOf(c.id) === -1 && Date.now() - (ULT_ENVIO.get(k) || 0) < 20000) await new Promise((ok) => setTimeout(ok, 3000));
    if (c.id && MEM.enviados.indexOf(c.id) === -1) { MEM.humano[k] = Date.now(); memGuardar(); anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'dueño escribió: Mary se calla ' + CFG.humanoMin + ' min' }); }
    return;
  }
  est.recibidos++;
  if (!c.tel) { anotar({ bid: neg.bid, que: 'sin número visible (LID): no respondo' }); return; }
  if (!atiende(c)) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: CFG.modo === 'apagado' ? 'Mary está apagada' : 'modo prueba: no es un número de prueba' }); return; }
  const pausadoPorDueno = !!(MEM.humano[k] && Date.now() - MEM.humano[k] < CFG.humanoMin * 60000);
  if (pausadoPorDueno) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'callada: el dueño escribió hace poco' }); return; }
  const prev = MEM.chats[k] || {};
  // 📸 foto del pago
  if (c.media) {
    est.fotos++;
    let b64 = c.base64;
    if (!b64 && c.mediaUrl) { try { b64 = await bajarMediaWaha(c.mediaUrl); } catch (e) { log('foto WAHA:', e.message); } }
    if (!b64 && !esWaha(neg)) { try { const r = await evo('post', '/chat/getBase64FromMediaMessage/' + encodeURIComponent(neg.instancia), { message: { key: { id: c.id } }, convertToMp4: false }, 45000); b64 = String(r.base64 || ''); } catch (e) { log('foto:', e.message); } }
    if (!b64) return;
    const r = await gas(neg, 'proof', { phone: c.tel, image: 'data:' + c.mime.split(';')[0] + ';base64,' + b64.replace(/^data:[^,]+,/, '') }).catch((e) => ({ ok: false, error: e.message }));
    if (r.ok && r.ya) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'otra foto del mismo pago (ya estaba en revisión)' }); }
    else if (r.ok) { MEM.revPend = MEM.revPend || {}; MEM.revPend[neg.bid] = Date.now() + 48 * 3600000; memGuardar();   // 2.5: hay una captura esperando al dueño
      await escribir(neg, c.tel, T.fotoRecibida(r.cita)); anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'foto del pago → ' + r.cita.code + ' ' + r.cita.status }); }
    else if (r.motivo === 'sin_cita_pendiente') { if (!prev.t || Date.now() - prev.t > CFG.silencioMin * 60000) { const info = await gas(neg, 'info'); await escribir(neg, c.tel, T.fotoSinCita(info)); } }
    else { est.errores++; anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'foto: ' + (r.error || r.motivo) }); }
    MEM.chats[k] = { t: Date.now(), firma: 'foto' }; memGuardar();
    return;
  }
  if (!c.texto) return;
  const reciente = prev.t && Date.now() - prev.t < CFG.silencioMin * 60000;
  if (reciente && !PREGUNTA.test(c.texto)) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'callada (ya le respondí hace poco)' }); return; }   // atajo: ni se consulta a Google (no va a responder)
  let info;
  try { info = await gas(neg, 'chat', { phone: c.tel }); }
  catch (e) { est.errores++; log('❌ chat', neg.bid, e.message); if (!reciente) { try { const i2 = await gas(neg, 'info'); await escribir(neg, c.tel, T.problema(i2)); } catch (e2) { /* nada */ } } return; }
  if (!info.activo) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'agenda suspendida: no respondo' }); return; }   // agenda suspendida: el dueño atiende
  const texto = info.citas && info.citas.length ? T.conCita(info, c.nombre) : T.sinCita(info, c.nombre);
  const firma = (info.citas || []).map((x) => x.code + x.status).join(',') || 'sin';
  if (!debeResponder({ texto: c.texto, pausadoPorDueno, reciente, citas: info.citas, repetido: prev.firma === firma && prev.n >= 2 })) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'callada (' + (info.citas.length ? 'ya tiene su cita' : 'ya le respondí') + ')' }); return; }
  await escribir(neg, c.tel, texto);
  MEM.chats[k] = { t: Date.now(), firma, n: prev.firma === firma ? (prev.n || 1) + 1 : 1 }; memGuardar();
  anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: info.citas.length ? 'tiene ' + info.citas.length + ' cita(s)' : 'link para agendar' });
}

// ---------- pagos del correo ----------
const vistos = C.Vistos(CFG.datos);
async function revisarCorreos() {
  if (CFG.modo === 'apagado') return;
  for (const neg of negocios()) {
    if (!neg.correo || !neg.correo.host) continue;
    try {
      await C.revisarBuzon(neg, vistos, async (p) => {
        est.pagosLeidos++;
        const r = await gas(neg, 'pago', Object.assign({ prueba: CFG.modo === 'prueba' ? CFG.prueba : null }, p));   // 1.1: en prueba solo citas de tus números
        anotar({ bid: neg.bid, que: 'pago ' + T.cop(p.amount) + (p.payer ? ' de ' + p.payer : '') + ' → ' + (r.ok ? r.code : (r.repetido ? 'ya visto' : r.motivo)) });
        if (r.ok && r.cita && r.antes !== 'confirmed') { est.pagosConfirmados++; if (r.cita.whatsapp && atiende({ tel: numeroWa(r.cita.whatsapp) })) await escribir(neg, r.cita.whatsapp, T.pagoConfirmado(r.cita)).catch((e) => log('aviso pago:', e.message)); }
      }, log);
    } catch (e) { est.errores++; log('❌ correo', neg.bid, e.message); }
  }
}

// ---------- estados con los cupos ----------
const IMG = new Map();   // id → { png, t } (Evolution las baja por dentro; se borran a los 30 min)
function guardarImg(png) { const id = Math.random().toString(36).slice(2) + Date.now().toString(36); IMG.set(id, { png, t: Date.now() }); for (const [k, v] of IMG) if (Date.now() - v.t > 30 * 60000) IMG.delete(k); return CFG.publico + '/img/' + id + '.png'; }
async function armarEstado(neg, tipo) {
  const d = await gas(neg, 'cupos', { dias: tipo === 'semana' ? 7 : 1 });
  const svg = tipo === 'semana' ? E.svgSemana(d, d.dias) : E.svgHoy(d, d.dias[0]);
  return { d, png: E.png(svg), caption: tipo === 'semana' ? E.textoSemana(d) : E.textoHoy(d, d.dias[0]) };
}
function quienVeEstados(modo, prueba) {
  if (modo === 'apagado') return null;
  if (modo === 'prueba') return { allContacts: false, statusJidList: prueba.map((n) => numeroWa(n) + '@s.whatsapp.net') };
  return { allContacts: true };
}
async function publicarEstado(neg, tipo) {
  const quien = quienVeEstados(CFG.modo, CFG.prueba);
  if (!quien) return { ok: false, motivo: 'Mary está apagada' };
  const { d, png, caption } = await armarEstado(neg, tipo);
  if (!d.activo) return { ok: false, motivo: 'la agenda del negocio no está activa' };
  if (tipo === 'hoy' && !d.dias[0].abierto) return { ok: false, motivo: 'hoy está cerrado' };
  const url = guardarImg(png);
  try {
    if (esWaha(neg)) await waha('post', '/api/' + encodeURIComponent(sesionDe(neg)) + '/status/image', Object.assign({ file: { mimetype: 'image/png', url }, caption }, quien.allContacts ? {} : { contacts: quien.statusJidList.map((j) => j.replace('@s.whatsapp.net', '@c.us')) }), 120000);
    else await evo('post', '/message/sendStatus/' + encodeURIComponent(neg.instancia), Object.assign({ type: 'image', content: url, caption }, quien), 120000);
  }
  catch (e) { if (!/timeout|aborted|524|504/i.test(e.message)) throw e; }   // ⏳ publicar a muchos contactos tarda: Evolution lo sigue haciendo solo
  est.estados++; anotar({ bid: neg.bid, que: 'estado ' + tipo + ' publicado' });
  return { ok: true };
}
function ahoraLocal() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: CFG.tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { fecha: p.year + '-' + p.month + '-' + p.day, hm: (p.hour === '24' ? '00' : p.hour) + ':' + p.minute, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}
async function tickEstados() {
  if (CFG.modo === 'apagado') return;
  const a = ahoraLocal();
  for (const neg of negocios()) {
    const ce = Object.assign({ hoy: '07:30', semana: '07:00', semanaDia: 1 }, neg.estados || {});
    if (ce.activo === false) continue;
    const tareas = [];
    if (ce.hoy && a.hm >= ce.hoy && a.hm < '12:00') tareas.push(['hoy', a.fecha]);
    if (ce.semana && a.dow === Number(ce.semanaDia) && a.hm >= ce.semana && a.hm < '12:00') tareas.push(['semana', a.fecha]);
    for (const [tipo, fecha] of tareas) {
      const k = neg.bid + ':' + tipo; if (MEM.estados[k] === fecha) continue;
      MEM.estados[k] = fecha; memGuardar();   // una sola vez al día aunque falle (no reintenta en bucle sobre WhatsApp)
      try { const r = await publicarEstado(neg, tipo); if (!r.ok) anotar({ bid: neg.bid, que: 'estado ' + tipo + ': ' + r.motivo }); }
      catch (e) { est.errores++; log('❌ estado', neg.bid, tipo, e.message); anotar({ bid: neg.bid, que: 'estado ' + tipo + ' falló: ' + e.message.slice(0, 120) }); }
      if (tipo === 'hoy' && tareas.length > 1) await new Promise((ok) => setTimeout(ok, 60000));   // dos estados seguidos, con un minuto entre ellos
    }
  }
}

// ---------- recordatorios por WhatsApp ----------
async function tickRecordatorios() {
  const hm = ahoraLocal().hm; if (hm < '05:00' || hm > '21:30') return;   // 2.5: de noche no hay citas próximas: no se gasta cupo
  for (const neg of negocios()) {
    const min = Number(neg.recordatorioMin == null ? 120 : neg.recordatorioMin); if (!min) continue;
    try {
      const r = await gas(neg, 'proximas', { minutos: min });
      if (!r.info || !r.info.activo) continue;
      for (const c of r.citas || []) {   // 1.1: cada cita por su lado; una que falla no frena las demás ni se repite cada 5 min
        if (!atiende({ tel: numeroWa(c.whatsapp) })) continue;
        try { await escribir(neg, c.whatsapp, T.recordatorio(c, r.info)); est.recordatorios++; anotar({ bid: neg.bid, que: 'recordatorio ' + c.code }); }
        catch (e) { if (!e.permanente) { log('recordatorio', c.code, e.message); continue; } anotar({ bid: neg.bid, que: 'recordatorio ' + c.code + ' no se pudo: ' + e.message }); }
        await gas(neg, 'recordada', { code: c.code }).catch((e) => log('recordada', c.code, e.message));
      }
    } catch (e) { est.errores++; log('❌ recordatorios', neg.bid, e.message); }
  }
}

// ---------- decisiones del dueño sobre las capturas (aprobó o rechazó en Telegram) ----------
// 2.5 · CUPO DE GOOGLE: solo se pregunta por las decisiones del dueño cuando de verdad hay capturas esperando
//        (antes se preguntaba cada 45 s por cada negocio, todo el día: miles de llamadas a Google).
async function tickRevisadas() {
  const P = MEM.revPend || {};
  for (const neg of negocios()) {
    if (!P[neg.bid] || P[neg.bid] < Date.now()) { if (P[neg.bid]) { delete P[neg.bid]; memGuardar(); } continue; }
    try {
      const r = await gas(neg, 'revisadas');
      if (!(r.citas || []).length && Number(r.pendientes || 0) === 0) { delete P[neg.bid]; memGuardar(); continue; }
      for (const c of r.citas || []) {
        c.linkAgenda = r.info.link;
        if (c.whatsapp && atiende({ tel: numeroWa(c.whatsapp) })) {
          try { await escribir(neg, c.whatsapp, T.decision(c)); }
          catch (e) { if (!e.permanente) { log('decisión', c.code, e.message); continue; } }
        }
        await gas(neg, 'avisada', { code: c.code }).catch((e) => log('avisada', c.code, e.message));
        anotar({ bid: neg.bid, que: 'captura ' + (c.decision === 'approved' ? 'aprobada' : 'rechazada') + ' por el dueño → avisé ' + c.code });
      }
    } catch (e) { est.errores++; log('❌ revisadas', neg.bid, e.message); }
  }
}

// ---------- 📲 CONECTAR WHATSAPP DESDE EL PANEL (sin abrir el VPS a internet) ----------
// El panel deja un pedido en Google y una marca pública en platform/public.maryWaPend (solo el id del negocio y la hora).
// Aquí se lee esa marca cada 5 s; si hay algo nuevo se pide el detalle a Google (con la clave de Mary) y se atiende en NUESTRO Evolution.
const FS = { url: env('FS_URL', 'https://firestore.googleapis.com'), proyecto: env('FS_PROYECTO', 'agendador-alex'), llave: env('FS_LLAVE', 'AIzaSyC8J-JbGWo-eTx4p5M8PS8PRQIhH8HK0-A') };
const EVENTOS = ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'];
const atendidos = new Map();   // bid → hora del último pedido atendido
const vinculando = new Map();  // bid → hasta cuándo se reenvían los QR nuevos al panel
const VENCE_MIN = Math.max(5, parseInt(env('VINCULAR_MIN', '15'), 10));   // si no vincula en este tiempo, se borra la conexión vacía
function guardarNegocio(bid, extra) {
  let L = []; try { L = JSON.parse(fs.readFileSync(CFG.negocios, 'utf8')); } catch (e) { L = []; }
  const i = L.findIndex((x) => x.bid === bid);
  if (i === -1) L.push(Object.assign({ bid, instancia: bid, motor: CFG.motor, sesion: bid, activo: true, recordatorioMin: 120, estados: { activo: true, hoy: '07:30', semana: '07:00', semanaDia: 1 } }, extra || {}));
  else Object.assign(L[i], extra || {});
  fs.writeFileSync(CFG.negocios, JSON.stringify(L, null, 2));   // se escribe en el MISMO archivo (está montado desde el VPS)
  negT = 0; negocios();
}
function negocioRegistrado(bid) { try { return JSON.parse(fs.readFileSync(CFG.negocios, 'utf8')).some((x) => x && x.bid === bid); } catch (e) { return false; } }
const motorBid = (bid) => { const n = negocios().find((x) => x.bid === bid); return esWaha(n || null) ? 'waha' : 'evolution'; };
async function asegurarInstancia(bid) {
  if (motorBid(bid) === 'waha') {
    const config = { webhooks: [{ url: CFG.publico + '/webhook', events: ['message.any', 'session.status'] }] };
    let existe = false; try { await waha('get', '/api/sessions/' + encodeURIComponent(bid)); existe = true; } catch (e) { existe = false; }
    if (!existe) await waha('post', '/api/sessions', { name: bid, start: true, config });
    else { await waha('put', '/api/sessions/' + encodeURIComponent(bid), { name: bid, config }).catch(() => {}); await waha('post', '/api/sessions/' + encodeURIComponent(bid) + '/start').catch(() => {}); }
    await new Promise((ok) => setTimeout(ok, 3000));
    return;
  }
  let existe = false;
  try { const r = await evo('get', '/instance/fetchInstances?instanceName=' + encodeURIComponent(bid)); existe = JSON.stringify(r).indexOf('"' + bid + '"') !== -1; } catch (e) { existe = false; }
  const webhook = { url: CFG.publico + '/webhook', byEvents: false, base64: true, events: EVENTOS };
  if (!existe) await evo('post', '/instance/create', { instanceName: bid, integration: 'WHATSAPP-BAILEYS', qrcode: true, rejectCall: false, groupsIgnore: true, alwaysOnline: false, readMessages: false, syncFullHistory: false, webhook });
  else await evo('post', '/webhook/set/' + encodeURIComponent(bid), { webhook: Object.assign({ enabled: true }, webhook) }).catch(() => {});
}
async function estadoInstancia(bid) {
  if (motorBid(bid) === 'waha') { try { const r = await waha('get', '/api/sessions/' + encodeURIComponent(bid)); return String(r.status || '').toUpperCase() === 'WORKING' ? 'open' : String(r.status || '').toLowerCase(); } catch (e) { return ''; } }
  try { const r = await evo('get', '/instance/connectionState/' + encodeURIComponent(bid)); return String((r.instance && r.instance.state) || r.state || ''); } catch (e) { return ''; }
}
async function numeroInstancia(bid) {
  if (motorBid(bid) === 'waha') { try { const r = await waha('get', '/api/sessions/' + encodeURIComponent(bid)); return String((r.me && r.me.id) || '').split('@')[0].replace(/\D/g, ''); } catch (e) { return ''; } }
  try { const r = await evo('get', '/instance/fetchInstances?instanceName=' + encodeURIComponent(bid)); const x = (Array.isArray(r) ? r[0] : r) || {}; const i = x.instance || x; return String(i.ownerJid || i.owner || i.number || '').split('@')[0].replace(/\D/g, ''); } catch (e) { return ''; }
}
async function atenderPedidoWa(bid) {
  const neg = { bid, instancia: bid };
  const { pedido } = await gas(neg, 'waPedido');
  if (!pedido) return;
  try {
    if (pedido.accion === 'conectar') {
      await asegurarInstancia(bid);   // 1.7: el negocio NO se activa para Mary hasta que vincule de verdad
      if (await estadoInstancia(bid) === 'open') { await gas(neg, 'waResultado', { estado: 'conectado', numero: await numeroInstancia(bid) }); anotar({ bid, que: 'WhatsApp ya estaba conectado' }); return; }
      const c = motorBid(bid) === 'waha'
        ? await (async () => { const r = await waha('post', '/api/' + encodeURIComponent(bid) + '/auth/request-code', { phoneNumber: pedido.numero }); let qr = ''; try { const q = await waha('get', '/api/' + encodeURIComponent(bid) + '/auth/qr?format=image'); if (q && q.data) qr = 'data:' + (q.mimetype || 'image/png') + ';base64,' + q.data; } catch (e) { /* solo código */ } return { pairingCode: r.code || '', base64: qr }; })()
        : await evo('get', '/instance/connect/' + encodeURIComponent(bid) + '?number=' + encodeURIComponent(pedido.numero));
      vinculando.set(bid, Date.now() + 5 * 60000);
      MEM.pendientesWa = MEM.pendientesWa || {}; MEM.pendientesWa[bid] = Date.now() + VENCE_MIN * 60000; memGuardar();   // se recuerda aunque el VPS se reinicie
      await gas(neg, 'waResultado', { estado: 'codigo', codigo: String(c.pairingCode || ''), qr: String(c.base64 || '') });
      anotar({ bid, que: 'código para vincular enviado al panel' + (c.pairingCode ? '' : ' (solo QR)') });
    } else if (pedido.accion === 'desconectar') {
      if (motorBid(bid) === 'waha') await waha('post', '/api/sessions/' + encodeURIComponent(bid) + '/logout').catch(() => {});
      else await evo('delete', '/instance/logout/' + encodeURIComponent(bid)).catch(() => {});
      guardarNegocio(bid, { activo: false }); if (MEM.conectados) { delete MEM.conectados[bid]; memGuardar(); }
      await gas(neg, 'waResultado', { estado: 'desconectado' });
      anotar({ bid, que: 'WhatsApp desconectado desde el panel' });
    }
  } catch (e) {
    est.errores++; log('❌ pedido WhatsApp', bid, e.message);
    await gas(neg, 'waResultado', { estado: 'error', error: 'No pude preparar la conexión: ' + e.message.slice(0, 120) }).catch(() => {});
  }
}
// 🧹 1.7: conexiones que nunca se vincularon → se borran de Evolution a los VINCULAR_MIN minutos y el panel avisa «venció»
async function limpiarSinVincular() {
  const P = MEM.pendientesWa || {};
  for (const [bid, hasta] of Object.entries(P)) {
    if (Date.now() < hasta) continue;
    delete P[bid]; memGuardar(); vinculando.delete(bid);
    if (await estadoInstancia(bid) === 'open') continue;   // sí vinculó (el aviso pudo perderse)
    if (motorBid(bid) === 'waha') { await waha('post', '/api/sessions/' + encodeURIComponent(bid) + '/logout').catch(() => {}); await waha('delete', '/api/sessions/' + encodeURIComponent(bid)).catch(() => {}); }
    else { await evo('delete', '/instance/logout/' + encodeURIComponent(bid)).catch(() => {}); await evo('delete', '/instance/delete/' + encodeURIComponent(bid)).catch(() => {}); }
    const L = negocios().find((n) => n.bid === bid); if (L) guardarNegocio(bid, { activo: false });
    await gas({ bid, instancia: bid }, 'waResultado', { estado: 'vencido' }).catch(() => {});
    anotar({ bid, que: '🧹 no vinculó en ' + VENCE_MIN + ' min: borré la conexión vacía' });
  }
}
async function tickPedidosWa() {
  if (!CFG.gas || !CFG.maryKey) return;
  await limpiarSinVincular().catch((e) => log('limpiar', e.message));
  let pend = {};
  try {
    const r = await fetch(FS.url + '/v1/projects/' + FS.proyecto + '/databases/(default)/documents/platform/public?key=' + FS.llave + '&mask.fieldPaths=maryWaPend', { signal: AbortSignal.timeout(15000) });
    const j = await r.json(); const f = (((j.fields || {}).maryWaPend || {}).mapValue || {}).fields || {};
    for (const k of Object.keys(f)) pend[k] = Number(f[k].integerValue || f[k].doubleValue || 0);
  } catch (e) { return; }
  for (const [bid, t] of Object.entries(pend)) {
    if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(bid) || Date.now() - t > 15 * 60000 || atendidos.get(bid) === t) continue;
    atendidos.set(bid, t);
    await atenderPedidoWa(bid).catch((e) => log('pedido', bid, e.message));
  }
}
// eventos de conexión de Evolution: al vincular se le avisa al panel; los QR nuevos se reenvían mientras se está vinculando
async function alEventoConexion(b) {
  const ev = String(b.event || '').toLowerCase().replace(/_/g, '.'), bid = String(b.instance || ''), d = b.data || {};
  if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(bid)) return;
  if (ev === 'connection.update' && String(d.state || '') === 'open') {
    // 2.9: solo cuenta si ese negocio existe o lo pidió desde su panel (antes, la sesión «default» de WAHA se volvía un negocio falso)
    const pedido = !!(MEM.pendientesWa && MEM.pendientesWa[bid]) || vinculando.has(bid);
    if (!pedido && !negocioRegistrado(bid)) { anotar({ que: '⚠️ conexión de «' + bid + '», que no es ningún negocio: la ignoro' }); return; }
    vinculando.delete(bid); if (MEM.pendientesWa) { delete MEM.pendientesWa[bid]; memGuardar(); }
    if (MEM.conectados && MEM.conectados[bid]) return;
    MEM.conectados = MEM.conectados || {}; MEM.conectados[bid] = Date.now(); memGuardar();
    guardarNegocio(bid, { activo: true });
    await gas({ bid }, 'waResultado', { estado: 'conectado', numero: String(d.wuid || '').split('@')[0].replace(/\D/g, '') || await numeroInstancia(bid) }).catch((e) => log('conectado', e.message));
    anotar({ bid, que: '✅ WhatsApp vinculado' });
  } else if (ev === 'connection.update' && String(d.state || '') === 'close') {
    if (MEM.conectados) { delete MEM.conectados[bid]; memGuardar(); }
  } else if (ev === 'qrcode.updated' && (vinculando.get(bid) || 0) > Date.now()) {
    const q = d.qrcode || d; await gas({ bid }, 'waResultado', { estado: 'codigo', codigo: String(q.pairingCode || ''), qr: String(q.base64 || '') }).catch(() => {});
  }
}

// ---------- relojes ----------
let ocupado = { correo: false, estados: false, record: false, revis: false, wa: false };
const cada = (ms, k, fn) => setInterval(async () => { if (ocupado[k]) return; ocupado[k] = true; try { await fn(); } catch (e) { log(k, e.message); } finally { ocupado[k] = false; } }, ms);
function arrancarRelojes() {
  cada(60000, 'correo', revisarCorreos);
  cada(30000, 'estados', tickEstados);
  cada(15 * 60000, 'record', tickRecordatorios);   // 2.5: cada 15 min (antes 5): el recordatorio sale igual con tiempo de sobra
  cada(60000, 'revis', tickRevisadas);
  cada(5000, 'wa', tickPedidosWa);
}

// ---------- HTTP ----------
function leerCuerpo(req, max) { return new Promise((ok, mal) => { const P = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > max) { mal(new Error('muy grande')); req.destroy(); } else P.push(c); }); req.on('end', () => ok(Buffer.concat(P).toString('utf8'))); req.on('error', mal); }); }
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'POST' && /^\/webhook(\/.*)?$/.test(url.pathname)) {
      const raw = await leerCuerpo(req, 40 * 1024 * 1024); json(res, 200, { ok: true });   // responde ya: Evolution no espera
      let b; try { b = JSON.parse(raw); } catch (e) { return; }
      if (b && b.session && b.payload && !b.instance) { b = deWaha(b); if (!b) return; }   // 2.2: viene de WAHA
      if (/^(connection|qrcode)[._]update/i.test(String(b.event || ''))) alEventoConexion(b).catch((e) => log('❌ conexión', e.message));
      else alMensaje(b).catch((e) => { est.errores++; log('❌ mensaje', e.message); });
      return;
    }
    const mImg = url.pathname.match(/^\/img\/([a-z0-9]+)\.png$/);
    if (req.method === 'GET' && mImg) { const x = IMG.get(mImg[1]); if (!x) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }); return res.end(x.png); }
    if (req.method === 'GET' && url.pathname === '/salud') return json(res, 200, { ok: true, version: VERSION, modo: CFG.modo, prueba: CFG.prueba.length, negocios: negocios().map((n) => n.bid), gas: !!(CFG.gas && CFG.maryKey), evo: !!CFG.evoKey, est });
    if (req.method === 'GET' && url.pathname === '/registro') return json(res, 200, ultimos.slice(-Math.min(100, parseInt(url.searchParams.get('n') || '20', 10))));
    // 🧪 vista previa del estado (no publica): curl -s "127.0.0.1:3060/vista?bid=mi-negocio&tipo=hoy" -o hoy.png
    if (req.method === 'GET' && url.pathname === '/vista') { const neg = negocios().find((n) => n.bid === url.searchParams.get('bid')); if (!neg) return json(res, 404, { ok: false, error: 'negocio no está en negocios.json' }); const { png } = await armarEstado(neg, url.searchParams.get('tipo') === 'semana' ? 'semana' : 'hoy'); res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(png); }
    if (req.method === 'POST' && url.pathname === '/publicar') { const neg = negocios().find((n) => n.bid === url.searchParams.get('bid')); if (!neg) return json(res, 404, { ok: false, error: 'negocio no está en negocios.json' }); return json(res, 200, await publicarEstado(neg, url.searchParams.get('tipo') === 'semana' ? 'semana' : 'hoy')); }
    if (req.method === 'POST' && url.pathname === '/correo-ya') { await revisarCorreos(); return json(res, 200, { ok: true, est }); }
    json(res, 404, { ok: false });
  } catch (e) { est.errores++; json(res, 500, { ok: false, error: e.message }); }
});

if (require.main === module) {
  fs.mkdirSync(CFG.datos, { recursive: true });
  servidor.listen(CFG.puerto, () => { log('👩‍💼 ' + VERSION + ' escuchando en ' + CFG.puerto + ' · modo ' + CFG.modo); negocios(); arrancarRelojes(); });
}
// 🧪 solo para el banco de escenarios (banco/escenarios.js): deja a Mary como recién encendida
const _banco = { alMensaje, alEventoConexion, ultimos, reiniciar() { MEM.chats = {}; MEM.estados = {}; MEM.humano = {}; MEM.enviados = []; delete MEM.revPend; ULT_ENVIO.clear(); VISTOS_ID.clear(); FILAS.clear(); ultimos.length = 0; negT = 0; } };
module.exports = { _banco, telEnAviso, deWaha, esWaha, debeResponder, alEventoConexion, tickPedidosWa, limpiarSinVincular, leerMensaje, atiende, PREGUNTA, numeroWa, ahoraLocal, enFila, yaVisto, quienVeEstados, CFG };
