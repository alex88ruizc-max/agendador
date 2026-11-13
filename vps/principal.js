// 👩‍💼 MARY DEL AGENDADOR · recepcionista por WhatsApp (sin IA). Servicio aparte: NO toca a Mary de Epic ni su Evolution.
//   · Alguien escribe → si su número tiene cita, se la muestra con el link para cambiarla; si no, le manda el link para agendar.
//   · Foto del pago → la pasa a la cita que espera abono.        · Correo del banco del negocio → confirma la cita sola.
//   · Estados de WhatsApp con los cupos de hoy (cada mañana) y de la semana (un día a la semana).   · Recordatorio antes de la cita.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const T = require('./textos'), C = require('./correo'), E = require('./estado'), A = require('./asistente');

const VERSION = 'agendador-ia-3.39';
const env = (k, d) => (process.env[k] === undefined || process.env[k] === '' ? d : process.env[k]);
const CFG = {
  puerto: parseInt(env('PUERTO', '3060'), 10),
  evo: String(env('EVO_URL', 'http://evolution-agendador:8080')).replace(/\/+$/, ''), evoKey: env('EVO_KEY', ''),
  gas: env('GAS_URL', ''), maryKey: env('MARY_KEY', ''),
  publico: String(env('PUBLICO', 'http://agendador-ia:3060')).replace(/\/+$/, ''),   // dirección con la que Evolution (por dentro) baja las imágenes de los estados
  datos: env('DATOS', path.join(__dirname, 'datos')), negocios: env('NEGOCIOS', path.join(__dirname, 'negocios.json')),
  modo: String(env('MARY_MODO', 'prueba')).toLowerCase(),   // prueba (solo MARY_PRUEBA) | todos | apagado
  prueba: String(env('MARY_PRUEBA', '')).split(/[,\s]+/).map((x) => x.replace(/\D/g, '')).filter((x) => x.length >= 10),
  leerDirecto: env('LEER_DIRECTO', 'si') !== 'no',
  volverEspacioMs: parseInt(env('VOLVER_ESPACIO_MS', String(3 * 60000)), 10),   // 3.32: minutos entre un recordatorio de servicio y el siguiente   // 3.30: días/horas/cupos calculados en el VPS (LEER_DIRECTO=no → todo por Google como antes)
  silencioMin: parseInt(env('SILENCIO_MIN', '15'), 10),     // no repite lo mismo en un chat antes de esto (salvo que el cliente diga algo de la lista)
  humanoMin: parseFloat(env('HUMANO_MIN', '30')),           // 3.1: si el dueño escribe a mano en un chat, se calla ahí 30 min (o lo que diga su panel)
  agruparMs: parseInt(env('AGRUPAR_MS', '7000'), 10),
  oido: String(env('OIDO_URL', 'http://oido-agendador:9000')).replace(/\/+$/, ''),   // 3.13: el oído (notas de voz → texto)   // 3.6: espera a que el cliente termine de escribir (varios mensajes = UNA respuesta)
  tz: env('TZ', 'America/Bogota'), esperaMs: parseInt(env('ESPERA_MS', '2000'), 10),
  // 2.2 · motor de WhatsApp: evolution (el de siempre) o waha. Cada negocio puede tener el suyo en negocios.json ("motor", "sesion").
  motor: String(env('WA_MOTOR', env('WAHA_KEY', '') ? 'waha' : 'evolution')).toLowerCase(),   // 3.1: con WAHA del agendador, los negocios nuevos van por WAHA
  waha: String(env('WAHA_URL', 'http://waha-agendador:3000')).replace(/\/+$/, ''), wahaKey: env('WAHA_KEY', '')
};
const log = (...a) => console.log(new Date().toISOString(), ...a);
const est = { desde: new Date().toISOString(), recibidos: 0, respondidos: 0, fotos: 0, pagosLeidos: 0, pagosConfirmados: 0, estados: 0, recordatorios: 0, errores: 0, directo: 0, directoFallo: 0 };   // 3.30: directo = cálculos hechos en el VPS sin gastar Google
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
function buscarClave(o, re, prof) {
  if (o == null || typeof o !== 'object' || (prof || 0) > 7) return '';
  for (const [k, v] of Object.entries(o)) { if (re.test(k) && (typeof v === 'string' || typeof v === 'number') && String(v)) return String(v); const r = buscarClave(v, re, (prof || 0) + 1); if (r) return r; }
  return '';
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
  const fila = buscarClave(p, /^selectedrowid$/i);   // 3.0: tocó una opción de una lista
  const interactivo = !p.fromMe && /"(listMessage|buttonsMessage|templateMessage|interactiveMessage|ListMessage|ButtonsMessage|TemplateMessage|InteractiveMessage)"/.test(JSON.stringify(p._data || {}));
  const esAudio = (p.hasMedia && /audio|ogg|opus/.test(mime)) || /^(ptt|audio|voice)$/i.test(String(p.type || d.type || ''));
  const message = interactivo && !fila ? { conversation: String(p.body || ''), _interactivo: true } : fila ? { listResponseMessage: { title: String(p.body || ''), singleSelectReply: { selectedRowId: String(fila) } } }
    : esAudio ? { audioMessage: { mimetype: mime || 'audio/ogg' } }
    : p.hasMedia && /image|pdf/.test(mime) ? (/pdf/.test(mime) ? { documentMessage: { mimetype: mime } } : { imageMessage: { mimetype: mime, caption: p.body || '' } }) : { conversation: String(p.body || '') };
  return { event: 'messages.upsert', instance: neg.instancia, data: { key: { remoteJid: jid, remoteJidAlt: /@/.test(alt) ? alt : '', fromMe: p.fromMe === true, id: String(p.id || '') }, pushName: String(d.notifyName || d.pushName || (d.Info && (d.Info.PushName || d.Info.pushName)) || ''),   /* 3.30: GOWS manda el nombre en Info.PushName */ message, mediaUrl: String((p.media && p.media.url) || ''), mediaError: p.hasMedia && !(p.media && p.media.url) ? String((p.media && p.media.error) || 'hasMedia sin url') : '' } };
}
async function bajarMediaWaha(url) {
  if (!url) return '';
  if (!/^https?:/.test(url)) url = CFG.waha + (url.startsWith('/') ? '' : '/') + url;
  const u = url.replace(/^https?:\/\/[^/]+/, CFG.waha);   // WAHA a veces da su dirección pública: se baja por dentro
  const r = await fetch(u, { headers: CFG.wahaKey ? { 'X-Api-Key': CFG.wahaKey } : {}, signal: AbortSignal.timeout(45000) });
  if (!r.ok) return '';
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}
function numeroWa(x) { let d = String(x || '').replace(/\D/g, ''); if (d.length === 10 && /^3/.test(d)) d = '57' + d; return d; }
const ULT_ENVIO = new Map();   // chat → cuándo le escribió Mary (para no confundir su propio eco con el dueño)
// 🙊 3.6: nunca se le manda a un cliente el MISMO mensaje dos veces seguidas en 15 min
function yaLoDije(neg, n, texto, ventanaMs) {
  MEM.dicho = MEM.dicho || {};
  const k = neg.bid + ':' + n, h = normal(texto), x = MEM.dicho[k];
  if (x && x.h === h && Date.now() - x.t < (ventanaMs || 15 * 60000)) { anotar({ bid: neg.bid, chat: n.slice(-4), que: '🙊 no repito el mismo mensaje' }); return true; }
  MEM.dicho[k] = { h, t: Date.now() }; memGuardar();
  return false;
}
async function escribir(neg, numero, texto) {
  const n = numeroWa(numero); if (n.length < 11) { const e = new Error('número inválido'); e.permanente = true; throw e; }
  if (yaLoDije(neg, n, texto)) return { key: { id: '' }, repetido: true };
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

// 📋 3.0 · LISTA de WhatsApp («Ver opciones»): por WAHA o por Evolution. Si el motor no la acepta, va como texto con números.
//    L = { texto, boton, pie, secciones: [{ titulo, filas: [{ id, titulo, desc }] }] }  (WhatsApp: máximo 10 filas en total)
async function escribirLista(neg, numero, L) {
  const n = numeroWa(numero); if (n.length < 11) { const e = new Error('número inválido'); e.permanente = true; throw e; }
  // 3.28: una lista es el siguiente paso que el cliente pidió al tocar una opción: solo se frena si es la MISMA en los últimos 30 s
  //       (doble toque). Antes eran 15 min y, si el cliente volvía a agendar, el bot se quedaba mudo en «¿Qué día?».
  if (yaLoDije(neg, n, L.texto + '|' + L.secciones.map((x) => x.filas.map((f) => f.id).join(',')).join(';'), 30000)) return { key: { id: '' }, repetido: true };
  // 3.3: WAHA EXIGE título en la lista y en cada sección (si va vacío la rechaza y salía el texto con números).
  //      Título = primera línea del mensaje (sin *), como «🎬 Elige tu Amazon» en Epic; el resto va de descripción.
  const lineas = String(L.texto || '').split('\n'), i0 = lineas.findIndex((x) => x.trim());
  const l0 = String(lineas[i0] || '').replace(/\*/g, '').trim();
  const corto = l0 && l0.length <= 60;   // si la primera línea es larga, no se corta: va completa en el cuerpo y el título es el negocio
  const titulo = corto ? l0 : (String(L.pie || '').split(' · ')[0].trim() || 'Opciones').slice(0, 60);
  const cuerpo = (corto ? lineas.slice(i0 + 1).join('\n') : String(L.texto || '')).trim();
  const sec = L.secciones.filter((x) => x.filas.length).map((x) => ({ title: String(x.titulo || 'Opciones').slice(0, 24) || 'Opciones', rows: x.filas.map((f) => Object.assign({ title: String(f.titulo).slice(0, 24), rowId: f.id }, f.desc ? { description: String(f.desc).slice(0, 72) } : {})) }));
  ULT_ENVIO.set(neg.bid + ':' + n, Date.now());
  try {
    let r;
    if (esWaha(neg)) {
      r = await waha('post', '/api/sendList', { session: sesionDe(neg), chatId: n + '@c.us', message: Object.assign({ title: titulo, button: String(L.boton || 'Ver opciones').slice(0, 20), sections: sec }, cuerpo ? { description: cuerpo } : {}, L.pie ? { footer: String(L.pie).slice(0, 60) } : {}) });
      const idw = r && (r.id && (r.id._serialized || r.id.id || r.id)) || (r && r.key && r.key.id); r = { key: { id: typeof idw === 'string' ? idw : '' } };
    } else r = await evo('post', '/message/sendList/' + encodeURIComponent(neg.instancia), { number: n, title: titulo, description: cuerpo || ' ', buttonText: String(L.boton || 'Ver opciones').slice(0, 20), footerText: L.pie || ' ', sections: sec });
    const id = r && r.key && r.key.id; if (id) { MEM.enviados.push(id); if (MEM.enviados.length > 500) MEM.enviados.splice(0, 100); memGuardar(); }
    est.respondidos++;
    return r;
  } catch (e) {
    if (/número inválido/.test(e.message)) throw e;
    log('lista → texto:', e.message);
    if (MEM.dicho) delete MEM.dicho[neg.bid + ':' + n];
    let i = 0; const op = L.secciones.map((x) => x.filas.map((f) => `${++i}. ${f.titulo}`).join('\n')).join('\n');
    return escribir(neg, numero, L.texto + '\n\n' + op + '\n\nResponde con el número 👆');
  }
}

// 👂 3.13 · el oído: baja la nota de voz (WAHA o Evolution) y se la pasa a oido-agendador. Si no puede, devuelve '' (y el asistente pide que escriba)
async function escuchar(neg, c) {
  try {
    let b64 = c.base64;
    if (!b64 && c.mediaUrl) b64 = await bajarMediaWaha(c.mediaUrl);
    if (!b64 && !esWaha(neg)) { const r = await evo('post', '/chat/getBase64FromMediaMessage/' + encodeURIComponent(neg.instancia), { message: { key: { id: c.id } }, convertToMp4: false }, 45000); b64 = String(r.base64 || ''); }
    if (!b64) { anotar({ bid: neg.bid, chat: (c.tel || '').slice(-4), que: '🎤 no pude bajar el audio de WhatsApp (' + (c.mediaUrl ? 'WAHA no lo entregó: ' + c.mediaUrl.slice(-40) : 'el aviso no trae el archivo' + (c.mediaError ? ': ' + c.mediaError : '')) + ')' }); return ''; }
    const datos = Buffer.from(String(b64).replace(/^data:[^,]+,/, ''), 'base64');
    const r = await fetch(CFG.oido + '/transcribir', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: datos, signal: AbortSignal.timeout(120000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: '🎤 el oído no pudo: ' + String(j.error || r.status).slice(0, 80) }); return ''; }
    return String(j.texto || '').trim();
  } catch (e) { anotar({ bid: neg.bid, chat: (c.tel || '').slice(-4), que: '🎤 el oído no respondió: ' + e.message.slice(0, 60) }); return ''; }
}

// ---------- servidor del agendador (Apps Script, acción "mary") ----------
async function gas(neg, op, datos) {
  if (!CFG.gas || !CFG.maryKey) throw new Error('Falta GAS_URL o MARY_KEY en agendador-ia.env');
  const r = await fetch(CFG.gas, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'mary', businessId: neg.bid, key: CFG.maryKey, op }, datos || {})), redirect: 'follow', signal: AbortSignal.timeout(60000) });
  const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch (e) { throw new Error('El servidor respondió algo raro: ' + txt.slice(0, 160)); }
  if (!j.ok) throw new Error(j.error || 'error del servidor');
  const bc = j.data && (j.data.bot || (j.data.info && j.data.info.bot));
  if (bc && Date.now() - (BOT_LEIDO.get(neg.bid) || 0) > 60000) BOT.set(neg.bid, { cfg: bc, t: Date.now() });   // la base (panel) manda   // 3.1: «💬 WhatsApp Bot» del panel (viene en cada respuesta, sin gastar llamadas extra)
  return j.data;
}
// ---------- 3.1 · configuración del panel «WhatsApp Bot» (por negocio) ----------
const BOT = new Map();
const BOT_DEF = { audios: true, activo: true, agendar: true, cupos: true, saludoDiario: true, pedirNombre: true, pedirCorreo: true, loDeSiempre: true, recordatorioMin: 120, recordatorioConfirmar: true, cambios: true, pausaMin: 30, estados: { activo: true, horas: ['11:00'], manana: true, semanal: false } };
function botDe(neg) { const x = BOT.get(neg.bid); const c = Object.assign({}, BOT_DEF, x ? x.cfg : {}); c.estados = Object.assign({}, BOT_DEF.estados, (x && x.cfg.estados) || {}); if (!x) c.pausaMin = CFG.humanoMin; return c; }
// 3.23 · lo que el dueño elige en el panel se lee DIRECTO de la base (cada minuto como mucho), sin pasar por Google:
//        si apaga el asistente, en menos de 1 minuto deja de responder aunque el servidor de Google esté caído
function deFs(v) {
  if (!v || typeof v !== 'object') return null;
  if ('booleanValue' in v) return v.booleanValue; if ('integerValue' in v) return Number(v.integerValue); if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue; if ('nullValue' in v) return null;
  if ('arrayValue' in v) return ((v.arrayValue || {}).values || []).map(deFs);
  if ('mapValue' in v) { const o = {}; Object.entries(((v.mapValue || {}).fields) || {}).forEach(([k, x]) => { o[k] = deFs(x); }); return o; }
  return null;
}
function botNormal(b, recordatorioViejo) {   // mismos valores por defecto que el servidor (maryBotCfg_) y el panel (BOT_DEF)
  b = b || {}; const e = b.estados || {}, d = (v, x) => (v === undefined || v === null || v === '' ? x : v);
  let horas = (Array.isArray(e.horas) ? e.horas : ['11:00']).filter((h) => /^\d{2}:\d{2}$/.test(String(h))).slice(0, 2); if (!horas.length) horas = ['11:00'];
  const c = {}; ['audios', 'activo', 'agendar', 'cupos', 'saludoDiario', 'pedirNombre', 'pedirCorreo', 'loDeSiempre', 'recordatorioConfirmar', 'cambios'].forEach((k) => { c[k] = d(b[k], true) !== false; });
  c.recordatorioMin = Math.max(0, Number(d(b.recordatorioMin, d(recordatorioViejo, 120)))); c.pausaMin = Math.max(5, Number(d(b.pausaMin, 30)));
  c.estados = { activo: d(e.activo, true) !== false, horas, manana: d(e.manana, true) !== false, semanal: d(e.semanal, false) === true };
  const v = b.volver || {}; c.volver = { activo: v.activo === true, dias: Math.max(0, Math.min(60, Number(v.dias || 0))) };   // 3.32: recordatorio de servicio (lo elige el dueño)
  return c;
}
const BOT_LEIDO = new Map();   // bid → cuándo se leyó de la base
async function botDesdeBase(neg) {
  try {
    const r = await fetch(FS.url + '/v1/projects/' + FS.proyecto + '/databases/(default)/documents/businesses/' + encodeURIComponent(neg.bid) + '/settings/general?key=' + FS.llave + '&mask.fieldPaths=maryBot&mask.fieldPaths=maryReminderMinutes', { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return false;
    const f = ((await r.json()) || {}).fields || {};
    BOT.set(neg.bid, { cfg: botNormal(deFs(f.maryBot), deFs(f.maryReminderMinutes)), t: Date.now() }); BOT_LEIDO.set(neg.bid, Date.now());
    return true;
  } catch (e) { return false; }
}
async function botAlDia(neg) { if (Date.now() - (BOT_LEIDO.get(neg.bid) || 0) > 60000) await botDesdeBase(neg); return botDe(neg); }
async function botFresco(neg, maxMs) { const x = BOT.get(neg.bid); if (!x || Date.now() - x.t > maxMs) await gas(neg, 'info').catch(() => {}); return botDe(neg); }

// ---------- 🛑 3.5 · FRENO ANTI-BOTS (función pura, con pruebas) ----------
//  Se pausa en un chat si el mensaje parece de un bot o una empresa: repite uno anterior, trae listas/botones, es publicidad,
//  o es un texto largo que llega en menos de 3 s después de nuestra respuesta (ninguna persona escribe tan rápido).
//  Pausado: si llega un mensaje DISTINTO a los anteriores, vuelve a responder; si es el MISMO de antes, sigue pausado.
const PUBLICIDAD = /mensaje automatico|respuesta automatica|asistente virtual|soy un (bot|asistente)|responde con el numero|escribe el numero|marca (el )?\d|gracias por (comunicarte|contactarnos|escribirnos|tu mensaje)|en breve (te|le) (atenderemos|responderemos|contactaremos)|horario de atencion|promocion|\boferta|descuento|\bgana(s)? hasta|\bgratis\b|cuentas de streaming|ver opciones|haz clic|clic aqui|suscribete|unete a nuestro|catalogo/;
const normal = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
function frenoRobot({ texto, rowId, interactivo, enFlujo, ultimoEnvio, ahora, hist }) {
  const t = normal(texto), largo = t.length;
  const vistos = ((hist && hist.textos) || []).filter((x) => ahora - x[1] < 12 * 3600000).map((x) => x[0]);   // lo de las últimas 12 h
  const recientes = ((hist && hist.textos) || []).filter((x) => ahora - x[1] < 3 * 60000).map((x) => x[0]);
  const motivo =
    interactivo ? 'trae listas o botones automáticos'
    : rowId ? ''
    : (largo >= 25 && vistos.includes(t)) || (largo >= 4 && recientes.includes(t)) ? 'repite un mensaje anterior'   // 3.28: textos largos (bots) o lo mismo en menos de 3 min; «hola» o «quiero agendar» más tarde es normal
    : largo >= 40 && ultimoEnvio && ahora - ultimoEnvio < 3000 ? 'respondió en menos de 3 s (como un bot)'
    : (PUBLICIDAD.test(t) && largo >= 25) || (/https?:\/\/|www\./i.test(texto) && /\$\s?\d|\d+ ?%/.test(texto) && largo >= 60) ? 'parece publicidad o un mensaje automático'
    : '';
  const pausado = !!(hist && hist.pausa);
  if (motivo) return { responder: false, pausa: true, motivo };
  if (pausado && !rowId && vistos.includes(t)) return { responder: false, pausa: true, motivo: 'sigue igual (mensaje repetido)' };
  return { responder: true, pausa: false, motivo: pausado ? 'mensaje distinto: vuelve a responder' : '' };
}

// ---------- 🤖 3.0 · el asistente (agendar por listas, cupos, saludo una vez al día, nombre y gustos) ----------
// 📊 3.37 · REPORTE DEL BOT: cuántas personas escribieron, cuántas interacciones, cuántas eligieron de la lista,
//    recordatorios de servicio y «¿Seguimos?» enviados y cuántos terminaron agendando. Se cuenta por día en el VPS y se guarda
//    en Google una vez por hora (no por mensaje). De las personas solo se guarda una huella corta (no el número).
const huella = (tel) => require('crypto').createHash('sha256').update('agendador:' + String(tel || '').replace(/\D/g, '').slice(-10)).digest('hex').slice(0, 10);
function contar(bid, campo, tel) {
  MEM.stats = MEM.stats || {};
  const f = ahoraLocal().fecha, k = bid + '|' + f;
  const d = MEM.stats[k] = MEM.stats[k] || { bid, fecha: f, n: {}, personas: {}, listas: {}, cambio: true };
  d.n[campo] = (d.n[campo] || 0) + 1; d.cambio = true;
  if (tel && campo === 'mensajes') d.personas[huella(tel)] = 1;
  if (tel && campo === 'listas') d.listas[huella(tel)] = 1;
  memGuardar();
}
async function tickEstadisticas() {
  const S = MEM.stats || {}, hoy = ahoraLocal().fecha;
  for (const [k, d] of Object.entries(S)) {
    if (d.cambio) {
      const neg = negocios().find((x) => x.bid === d.bid);
      if (neg) {
        try { await gas(neg, 'estadisticas', { fecha: d.fecha, n: d.n, personas: Object.keys(d.personas), listas: Object.keys(d.listas) }); d.cambio = false; memGuardar(); }
        catch (e) { log('estadísticas', k, e.message); continue; }
      } else d.cambio = false;
    }
    if (!d.cambio && d.fecha < hoy && Date.parse(hoy) - Date.parse(d.fecha) > 2 * 86400000) { delete S[k]; memGuardar(); }   // ya guardado: se olvida
  }
}
// 💰 3.30 · ahorro de Google: días, horas y cupos se calculan en el VPS leyendo la base directo (como la página). Si falla → Google.
let CL = null;
const DIRECTO = new Set(['horas', 'dias', 'cupos']);
async function leer(neg, op, d) {
  if (!DIRECTO.has(op) || CFG.leerDirecto === false) return gas(neg, op, d);
  try {
    CL = CL || require('./cuposLocal').crear({ fetch: (...x) => fetch(...x), url: FS.url, proyecto: FS.proyecto, llave: FS.llave, ahora: () => { const a = ahoraLocal(); const [h, m] = a.hm.split(':').map(Number); return { fecha: a.fecha, min: h * 60 + m }; } });
    const cat = (ASIS._cat.get(neg.bid) || {}).d;
    if (op === 'cupos' && !cat) throw new Error('sin catálogo en memoria');   // el nombre y el link vienen del catálogo
    const r = await CL[op](neg.bid, d || {});
    est.directo++;
    return Object.assign({ link: (cat && cat.link) || '', negocio: (cat && cat.negocio) || '' }, r);
  } catch (e) {
    est.directoFallo++;
    if (!leer.avisado) { leer.avisado = true; log('💰 no pude calcular ' + op + ' en el VPS (' + String(e.message).slice(0, 80) + '): uso Google'); }
    return gas(neg, op, d);
  }
}
const ASIS = A.crear({ contar: (bid, campo) => contar(bid, campo), gas: (neg, op, d) => leer(neg, op, d), texto: (neg, tel, t) => escribir(neg, tel, t), lista: (neg, tel, L) => escribirLista(neg, tel, L),
  get mem() { return MEM; }, guardar: () => memGuardar(), anotar: (x) => anotar(x), tz: CFG.tz, bot: (neg) => botDe(neg) });

// ---------- ¿quién escribe? ----------
function leerMensaje(b) {
  const d = (b && b.data) || {}, k = d.key || {}, jid = String(k.remoteJid || '');
  const alt = String(k.remoteJidAlt || d.senderPn || k.senderPn || '');
  const tel = [jid, alt].map((x) => (/@(s\.whatsapp\.net|c\.us)$/.test(x) ? x.split('@')[0].replace(/\D/g, '') : '')).find((x) => x.length >= 10) || '';
  const m = d.message || {};
  const lr = m.listResponseMessage || {};
  const texto = String(m.conversation || (m.extendedTextMessage && m.extendedTextMessage.text) || (m.imageMessage && m.imageMessage.caption) || (m.buttonsResponseMessage && m.buttonsResponseMessage.selectedDisplayText) || lr.title || '').trim();
  const rowId = String((lr.singleSelectReply && lr.singleSelectReply.selectedRowId) || '');
  const media = m.imageMessage ? 'image' : (m.documentMessage && /image|pdf/.test(String(m.documentMessage.mimetype || ''))) ? 'document' : '';
  return {
    evento: String(b && b.event || '').toLowerCase().replace(/_/g, '.'), inst: String(b && b.instance || ''), jid, tel, texto, media, id: String(k.id || ''), rowId, audio: !!m.audioMessage,
    interactivo: !!(m._interactivo || m.listMessage || m.buttonsMessage || m.templateMessage || m.interactiveMessage),
    nombre: String(d.pushName || ''), deMi: k.fromMe === true, grupo: /@g\.us$/.test(jid), estado: /status@broadcast/.test(jid),
    base64: String(m.base64 || d.base64 || ''), mediaUrl: String(d.mediaUrl || ''), mediaError: String(d.mediaError || ''), mime: String((m.imageMessage && m.imageMessage.mimetype) || (m.documentMessage && m.documentMessage.mimetype) || 'image/jpeg')
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
// 🧺 3.6: si el cliente manda varios mensajes seguidos («Hola» «Papito» «Ya soy 11»), se espera a que termine y se responde UNA vez
const AGRUPA = new Map();
function alMensaje(b) {
  const c = leerMensaje(b);
  if (!/^messages\.upsert$/.test(c.evento) || !c.jid || c.grupo || c.estado || yaVisto(c.id)) return Promise.resolve();
  const neg = negDe(c.inst); if (!neg) { if (!c.deMi) anotar({ que: '⚠️ mensaje de «' + c.inst + '», que no está en negocios.json: no respondo' }); return Promise.resolve(); }
  const k = neg.bid + ':' + (c.tel || c.jid);
  c.llegada = Date.now();
  const agrupar = CFG.agruparMs > 0 && !c.deMi && !c.media && !c.rowId && !c.audio && !!c.texto && !/^\s*\//.test(c.texto);   // los comandos (/sinbot) van al instante
  if (!agrupar) return enFila(k, () => atenderMensaje(c, neg));
  return new Promise((listo) => {
    const g = AGRUPA.get(k) || { lista: [], avisar: [] };
    g.lista.push(c); g.avisar.push(listo); clearTimeout(g.timer);
    g.timer = setTimeout(() => {
      AGRUPA.delete(k);
      const textos = [...new Set(g.lista.map((x) => x.texto.trim()).filter(Boolean))];
      const junto = Object.assign({}, g.lista[g.lista.length - 1], { texto: textos.join('\n'), llegada: g.lista[0].llegada, varios: g.lista.length });
      if (g.lista.length > 1) anotar({ bid: neg.bid, chat: (junto.tel || '').slice(-4), que: '🧺 ' + g.lista.length + ' mensajes seguidos: una sola respuesta' });
      enFila(k, () => atenderMensaje(junto, neg)).catch((e) => { est.errores++; log('❌ mensaje', e.message); }).finally(() => g.avisar.forEach((f) => f()));
    }, CFG.agruparMs);
    AGRUPA.set(k, g);
  });
}
// 🤐 3.24 · LEY /sinbot: «/sinbot» escrito por el dueño en un chat → el asistente queda MUDO en ese chat (sin respuestas, recordatorios
//    ni preguntas), sin límite de tiempo. Otro «/sinbot» en ese chat (del dueño o del cliente) lo vuelve a activar. Nada lo salta.
const esSinbot = (t) => /^\/\s*sin\s*bot\s*$/i.test(String(t || '').trim());
const mudo = (k) => !!(MEM.sinbot && MEM.sinbot[k]);
async function atenderMensaje(c, neg) {
  const k = neg.bid + ':' + (c.tel || c.jid);
  if (esSinbot(c.texto)) {
    MEM.sinbot = MEM.sinbot || {};
    if (mudo(k)) { delete MEM.sinbot[k]; memGuardar(); anotar({ bid: neg.bid, chat: (c.tel || '').slice(-4), que: '🔊 /sinbot: el asistente vuelve a atender este chat (' + (c.deMi ? 'el negocio' : 'el cliente') + ')' }); return; }
    if (!c.deMi) { anotar({ bid: neg.bid, chat: (c.tel || '').slice(-4), que: '/sinbot del cliente sin estar mudo: no hace nada' }); return; }
    MEM.sinbot[k] = { desde: Date.now() }; if (MEM.conv) delete MEM.conv[k]; memGuardar();
    anotar({ bid: neg.bid, chat: (c.tel || '').slice(-4), que: '🤐 /sinbot: el asistente queda mudo en este chat hasta otro /sinbot' }); return;
  }
  if (mudo(k)) { if (!c.deMi) anotar({ bid: neg.bid, chat: (c.tel || '').slice(-4), que: '🤐 mudo por /sinbot' }); return; }
  // 👆 3.8: el dueño tocó una opción de la lista DESDE el celular del negocio → el asistente la hace para ese cliente
  //        (p. ej. «Ver cupos» en el chat de Marianna → a Marianna le llegan los cupos). No cuenta como «el dueño escribió».
  // 3.9: WAHA a veces avisa el toque del negocio SIN la opción (solo el texto «🕐 Ver cupos…»): se reconoce por el título,
  //      comparándolo con la última lista que el asistente le mandó a ese cliente
  if (c.deMi && !c.rowId && c.texto) {
    const cv = MEM.conv && MEM.conv[k], l0 = normal(String(c.texto).split('\n')[0]);
    const op = cv && (cv.opciones || []).find((o) => normal(o.titulo) === l0);
    if (op) c.rowId = op.id;
  }
  if (c.deMi && c.rowId) {
    await botAlDia(neg);
    if (!botDe(neg).activo || !c.tel) return;
    if (MEM.humano) delete MEM.humano[k];
    contar(neg.bid, 'listas', c.tel);
    anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: '👆 el negocio tocó «' + (c.texto || c.rowId).split('\n')[0] + '»: lo hago para el cliente' });
    try { await ASIS.manejar(neg, { k, tel: c.tel, texto: '', rowId: c.rowId, nombre: '' }); }
    catch (e) { est.errores++; log('❌ asistente (opción del negocio)', e.message); }
    return;
  }
  if (c.deMi) {   // 🙋 el dueño escribió a mano en este chat (no fue Mary): Mary se hace a un lado
    // 1.1: ¿es el eco de lo que Mary acaba de mandar? Si Mary escribió hace poco, se espera 3 s a que Evolution le confirme el id del envío
    if (c.id && MEM.enviados.indexOf(c.id) === -1 && Date.now() - (ULT_ENVIO.get(k) || 0) < 20000) await new Promise((ok) => setTimeout(ok, 3000));
    if (c.id && MEM.enviados.indexOf(c.id) === -1) { MEM.humano[k] = Date.now(); memGuardar(); anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'dueño escribió: se calla ' + botDe(neg).pausaMin + ' min' }); }
    return;
  }
  est.recibidos++;
  if (!c.tel) { anotar({ bid: neg.bid, que: 'sin número visible (LID): no respondo' }); return; }
  if (!atiende(c)) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: CFG.modo === 'apagado' ? 'Mary está apagada' : 'modo prueba: no es un número de prueba' }); return; }
  await botAlDia(neg);
  if (!botDe(neg).activo) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'asistente apagado en el panel' }); return; }
  const pausadoPorDueno = !!(MEM.humano[k] && Date.now() - MEM.humano[k] < botDe(neg).pausaMin * 60000);
  if (pausadoPorDueno) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'callada: el dueño escribió hace poco' }); return; }
  const prev = MEM.chats[k] || {};
  contar(neg.bid, 'mensajes', c.tel); if (c.rowId) contar(neg.bid, 'listas', c.tel);   // 📊 3.37: reporte del bot
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
  // 👂 3.13: nota de voz → texto (el oído del agendador) → se atiende como si la hubiera escrito
  if (c.audio && botDe(neg).audios !== false) {
    const oido = await escuchar(neg, c);
    if (oido) { c.texto = oido; c.audio = false; anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: '🎤 escuché: «' + oido.slice(0, 80) + '»' }); }
  }
  // 🛑 3.5: freno anti-bots / publicidad / mensajes repetidos
  if (c.texto || c.interactivo) {
    MEM.robot = MEM.robot || {};
    const h = MEM.robot[k] = MEM.robot[k] || { textos: [], pausa: false };
    h.textos = (h.textos || []).filter((x) => Array.isArray(x) && Date.now() - x[1] < 12 * 3600000);
    if (!h.textos.length) h.pausa = false;
    const enFlujo = !!(MEM.conv && MEM.conv[k] && MEM.conv[k].paso !== 'menu');
    const f = frenoRobot({ texto: c.texto, rowId: c.rowId, interactivo: c.interactivo, enFlujo, ultimoEnvio: ULT_ENVIO.get(k), ahora: c.llegada || Date.now(), hist: h });   // 3.6: la hora en que LLEGÓ (no después de esperar)
    const tn = normal(c.texto);
    if (tn) { const ya = h.textos.find((x) => x[0] === tn); if (ya) ya[1] = Date.now(); else { h.textos.push([tn, Date.now()]); if (h.textos.length > 15) h.textos.shift(); } }   // 3.28: guarda la ÚLTIMA vez que lo dijo
    h.t = Date.now(); h.pausa = f.pausa; memGuardar();
    if (!f.responder) { if (MEM.conv) delete MEM.conv[k]; anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: '🛑 pausado: ' + f.motivo }); return; }
    if (f.motivo) anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: '▶️ ' + f.motivo });
  }
  // 🤖 3.0: agendamiento en curso, «¿hay cupos?», «quiero una cita», opción de lista o audio → lo atiende el asistente
  if (c.texto || c.rowId || c.audio) {
    if (c.nombre && /^[\p{L}][\p{L} .'-]{1,40}$/u.test(String(c.nombre).trim())) { const cl = ASIS.cliente(k); if (cl.nombreWa !== c.nombre) { cl.nombreWa = String(c.nombre).trim(); memGuardar(); } }   // 3.33: el nombre de WhatsApp queda guardado (para el «¿Seguimos?» y el recordatorio)
    const ca = { k, tel: c.tel, texto: c.texto, rowId: c.rowId, audio: c.audio, nombre: c.nombre };
    let r = null;
    try { r = await ASIS.manejar(neg, ca); }
    catch (e) {
      est.errores++; log('❌ asistente', neg.bid, e.message); anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: '❌ falló el asistente: ' + String(e.message).slice(0, 120) });
      // 3.28: si estaba agendando, SIEMPRE se le avisa (antes se quedaba mudo porque «ya le había respondido hace poco»)
      const agendando = !!(MEM.conv && MEM.conv[k] && MEM.conv[k].paso && MEM.conv[k].paso !== 'menu');
      if (agendando || !(prev.t && Date.now() - prev.t < CFG.silencioMin * 60000)) {
        const link = 'https://tuagenda.vip/index.html?b=' + encodeURIComponent(neg.bid);   // sin preguntarle a Google (puede ser Google el que falla)
        try { await escribir(neg, c.tel, agendando ? T.demora(link) : T.problema({ link })); } catch (e2) { /* nada */ }
        if (MEM.conv) delete MEM.conv[k];
      } MEM.chats[k] = { t: Date.now(), firma: 'error' }; memGuardar(); return; }
    if (r === 'suspendida') { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'agenda suspendida: no respondo' }); return; }
    if (r) { MEM.chats[k] = { t: Date.now(), firma: r, n: 1 }; memGuardar(); anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: { flujo: 'agendando por WhatsApp', cupos: 'le mostré los cupos', agendar: 'empezó a agendar', audio: 'audio: le pedí que escriba' }[r] || r }); return; }
  }
  if (!c.texto) return;
  const reciente = prev.t && Date.now() - prev.t < CFG.silencioMin * 60000;
  if (reciente && !PREGUNTA.test(c.texto)) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'callada (ya le respondí hace poco)' }); return; }   // atajo: ni se consulta a Google (no va a responder)
  let info;
  const cl0 = ASIS.cliente(k), buscarNombre = !cl0.nombre && cl0.nombreBuscado !== ahoraLocal().fecha;   // una vez al día como mucho (no gasta Google de más)
  if (buscarNombre) { cl0.nombreBuscado = ahoraLocal().fecha; memGuardar(); }
  try { info = await gas(neg, 'chat', Object.assign({ phone: c.tel }, buscarNombre ? { conNombre: 1 } : {})); }   // 3.30: si no sabemos su nombre, Google lo busca en los clientes del negocio
  catch (e) { est.errores++; log('❌ chat', neg.bid, e.message); if (!reciente) { try { const i2 = await gas(neg, 'info'); await escribir(neg, c.tel, T.problema(i2)); } catch (e2) { /* nada */ } } return; }
  if (!info.activo) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'agenda suspendida: no respondo' }); return; }   // agenda suspendida: el dueño atiende
  const firma = (info.citas || []).map((x) => x.code + x.status).join(',') || 'sin';
  if (!debeResponder({ texto: c.texto, pausadoPorDueno, reciente, citas: info.citas, repetido: prev.firma === firma && prev.n >= 2 })) { anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'callada (' + (info.citas.length ? 'ya tiene su cita' : 'ya le respondí') + ')' }); return; }
  if (info.cliente && !ASIS.cliente(k).nombre && /^[\p{L}][\p{L} .'-]{1,40}$/u.test(info.cliente)) { ASIS.cliente(k).nombre = info.cliente; memGuardar(); }   // 3.30: el nombre que ya tiene en el negocio
  const sal = ASIS.saludo(k, info.negocio, c.nombre, !botDe(neg).saludoDiario);   // «Hola 👋 Soy el asistente de…» solo la primera vez del día (o siempre, si el dueño lo apaga)
  if (info.citas && info.citas.length) await escribir(neg, c.tel, T.conCita(info, sal));
  else if (botDe(neg).agendar || botDe(neg).cupos) await ASIS.menu(neg, { k, tel: c.tel, texto: c.texto }, T.sinCita(info, sal), info.negocio);
  else await escribir(neg, c.tel, T.sinCita(info, sal, true));
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
  const d = await gas(neg, 'cupos', { dias: tipo === 'semana' ? 7 : 2 });
  if (tipo === 'semana') return { d, png: E.png(E.svgSemana(d, d.dias)), caption: E.textoSemana(d) };
  // 3.1: si hoy ya no hay cupos, el estado es el de mañana (si el dueño lo deja así); si tampoco hay, no se publica
  let dia = d.dias[0];
  if (tipo === 'hoy' && !(dia && dia.libres && dia.libres.length)) dia = botDe(neg).estados.manana && d.dias[1] && d.dias[1].libres.length ? d.dias[1] : null;
  if (!dia) return { d, png: null, caption: '', dia: null };
  return { d, dia, png: E.png(E.svgHoy(d, dia)), caption: E.textoHoy(d, dia) };
}
function quienVeEstados(modo, prueba) {
  if (modo === 'apagado') return null;
  if (modo === 'prueba') return { allContacts: false, statusJidList: prueba.map((n) => numeroWa(n) + '@s.whatsapp.net') };
  return { allContacts: true };
}
async function publicarEstado(neg, tipo) {
  const quien = quienVeEstados(CFG.modo, CFG.prueba);
  if (!quien) return { ok: false, motivo: 'Mary está apagada' };
  const { d, png, caption: cap0, dia } = await armarEstado(neg, tipo);
  if (!d.activo) return { ok: false, motivo: 'la agenda del negocio no está activa' };
  MEM.piePrueba = MEM.piePrueba || {};
  const conPie = !!d.prueba && MEM.piePrueba[neg.bid] !== ahoraLocal().fecha;   // 🚀 3.38: prueba gratis → la invitación en UN estado al día
  const caption = cap0 + (conPie ? E.PIE_PRUEBA : '');
  if (tipo === 'hoy' && !png) return { ok: false, motivo: 'no hay cupos hoy ni mañana: no publiqué' };
  const url = guardarImg(png);
  try {
    // 3.1: WAHA solo conoce a quien escribió hace poco → el estado va a TODOS los clientes del negocio (sus números)
    let para = quien.allContacts ? null : quien.statusJidList.map((j) => j.replace('@s.whatsapp.net', '@c.us'));
    if (!para && esWaha(neg)) { const r = await contactosDe(neg); if (r.length) para = r.map((n) => n + '@c.us'); }
    if (esWaha(neg)) await waha('post', '/api/' + encodeURIComponent(sesionDe(neg)) + '/status/image', Object.assign({ file: { mimetype: 'image/png', url }, caption }, para ? { contacts: para } : {}), 120000);
    else await evo('post', '/message/sendStatus/' + encodeURIComponent(neg.instancia), Object.assign({ type: 'image', content: url, caption }, quien), 120000);
  }
  catch (e) { if (!/timeout|aborted|524|504/i.test(e.message)) throw e; }   // ⏳ publicar a muchos contactos tarda: Evolution lo sigue haciendo solo
  if (conPie) { MEM.piePrueba[neg.bid] = ahoraLocal().fecha; memGuardar(); }
  est.estados++; anotar({ bid: neg.bid, que: 'estado ' + tipo + ' publicado' + (dia && dia !== d.dias[0] ? ' (cupos de mañana)' : '') });
  return { ok: true };
}
const CONTACTOS = new Map();   // bid → { L, t } (6 h)
async function contactosDe(neg) {
  const x = CONTACTOS.get(neg.bid); if (x && Date.now() - x.t < 6 * 3600000) return x.L;
  let L = []; try { L = ((await gas(neg, 'contactos')) || {}).numeros || []; } catch (e) { L = (x && x.L) || []; }
  CONTACTOS.set(neg.bid, { L, t: Date.now() }); return L;
}
// 3.1 · qué estados tocan ahora (función pura, con pruebas): máximo 2 al día a las horas del panel, cada uno una sola vez
function estadosQueTocan(cfg, a, hechos, bid) {
  const e = cfg || {}, out = [];
  if (e.activo === false) return out;
  const horas = (e.horas || ['11:00']).filter((h) => /^\d{2}:\d{2}$/.test(h)).slice(0, 2);
  const fin = (h) => { const [H, M] = h.split(':').map(Number); const t = Math.min(H * 60 + M + 180, 21 * 60); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  horas.forEach((h) => { const k = bid + ':hoy@' + h; if (a.hm >= h && a.hm < fin(h) && hechos[k] !== a.fecha) out.push({ tipo: 'hoy', k }); });
  if (e.semanal && a.dow === 1 && a.hm >= '07:00' && a.hm < '12:00' && hechos[bid + ':semana'] !== a.fecha) out.push({ tipo: 'semana', k: bid + ':semana' });
  return out;
}
function ahoraLocal() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: CFG.tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { fecha: p.year + '-' + p.month + '-' + p.day, hm: (p.hour === '24' ? '00' : p.hour) + ':' + p.minute, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}
async function tickEstados() {
  if (CFG.modo === 'apagado') return;
  const a = ahoraLocal();
  if (a.hm < '06:30' || a.hm > '21:00') return;
  for (const neg of negocios()) {
    if (neg.estados && neg.estados.activo === false) continue;   // apagado a mano en negocios.json
    const bot = await botAlDia(neg);   // 3.23: lo que el dueño eligió en su panel (de la base, cada minuto como mucho)
    if (!bot.activo) continue;
    const tareas = estadosQueTocan(bot.estados, a, MEM.estados, neg.bid);
    for (const [n, t] of tareas.entries()) {
      MEM.estados[t.k] = a.fecha; memGuardar();   // una sola vez al día aunque falle (no reintenta en bucle sobre WhatsApp)
      try { const r = await publicarEstado(neg, t.tipo); if (!r.ok) anotar({ bid: neg.bid, que: 'estado ' + t.tipo + ': ' + r.motivo }); }
      catch (e) { est.errores++; log('❌ estado', neg.bid, t.tipo, e.message); anotar({ bid: neg.bid, que: 'estado ' + t.tipo + ' falló: ' + e.message.slice(0, 120) }); }
      if (n < tareas.length - 1) await new Promise((ok) => setTimeout(ok, 60000));
    }
  }
}

// ---------- recordatorios por WhatsApp ----------
// 🔁 3.32 · RECORDATORIO DE SERVICIO: a los clientes cuya última visita fue hace N días (lo elige el dueño) se les escribe
//    «Ya van 3 semanas desde tu último Corte con Gabriel. ¿Te agendo de nuevo?». Una vez al día desde las 10:00,
//    máximo 20 y con unos minutos entre uno y otro (si WhatsApp ve muchos mensajes de golpe, puede bloquear el número).
async function tickVolver(aCualquierHora) {
  if (CFG.modo === 'apagado') return;
  const a = ahoraLocal(); if (!aCualquierHora && (a.hm < '10:00' || a.hm > '18:00')) return;
  MEM.volver = MEM.volver || {};
  for (const neg of negocios()) {
    if (MEM.volver[neg.bid] === a.fecha) continue;
    const bot = await botAlDia(neg);
    if (!bot.activo || !bot.volver || !bot.volver.activo || !bot.volver.dias) continue;
    MEM.volver[neg.bid] = a.fecha; memGuardar();   // una sola vez al día aunque falle
    try {
      const r = await gas(neg, 'volver', { max: 20 });
      const L = (r.clientes || []).filter((x) => atiende({ tel: numeroWa(x.whatsapp) }) && !mudo(neg.bid + ':' + numeroWa(x.whatsapp)) && !(MEM.conv && MEM.conv[neg.bid + ':' + numeroWa(x.whatsapp)]));
      if (!L.length) continue;
      await gas(neg, 'volverAvisado', { codes: L.map((x) => x.code) });   // marcado antes de mandar: nunca se le escribe dos veces por la misma visita
      L.forEach((x, i) => setTimeout(() => {
        ASIS.ofrecerVolver(neg, numeroWa(x.whatsapp), x, r.negocio).then(() => { contar(neg.bid, 'volverEnv'); }).then(() => anotar({ bid: neg.bid, chat: numeroWa(x.whatsapp).slice(-4), que: '🔁 recordatorio de servicio (' + x.diasDesde + ' días)' }))
          .catch((e) => log('volver', x.code, e.message));
      }, i * CFG.volverEspacioMs));
      anotar({ bid: neg.bid, que: '🔁 recordatorio de servicio: ' + L.length + ' cliente(s) hoy' });
    } catch (e) { est.errores++; log('❌ volver', neg.bid, e.message); }
  }
}
// ⏰ 3.33 · RETOMAR: el cliente empezó a agendar y lleva 30 min sin elegir nada → «¿Seguimos con tu cita?» (una sola vez).
//    De noche (9:00 p. m. a 7:00 a. m.) no: se le escribe a las 7:00 si sigue pendiente. Nunca si el dueño habla en ese chat o hay /sinbot.
async function tickRetomar(aCualquierHora) {
  if (CFG.modo === 'apagado' || !MEM.conv) return;
  const a = ahoraLocal(); if (!aCualquierHora && (a.hm < '07:00' || a.hm >= '21:00')) return;
  const ahora = Date.now();
  for (const [k, conv] of Object.entries(MEM.conv)) {
    if (!ASIS.porRetomar(conv, ahora)) continue;
    const i = k.indexOf(':'), bid = k.slice(0, i), tel = k.slice(i + 1), neg = negocios().find((x) => x.bid === bid);
    if (!neg || !atiende({ tel }) || mudo(k) || (MEM.humano && MEM.humano[k] && ahora - MEM.humano[k] < botDe(neg).pausaMin * 60000)) continue;
    if (!(await botAlDia(neg)).activo) continue;
    conv.retomado = true; memGuardar();   // una sola vez aunque falle
    try { await ASIS.retomar(neg, tel, conv); contar(bid, 'retomarEnv'); anotar({ bid, chat: tel.slice(-4), que: '⏰ lo retomé: «¿Seguimos con tu cita?» (llevaba 30 min sin elegir)' }); }
    catch (e) { log('retomar', k, e.message); }
  }
}
async function tickRecordatorios(aCualquierHora) {
  const hm = ahoraLocal().hm; if (!aCualquierHora && (hm < '05:00' || hm > '21:30')) return;   // 2.5: de noche no hay citas próximas: no se gasta cupo
  for (const neg of negocios()) {
    const min = Number(neg.recordatorioMin == null ? 120 : neg.recordatorioMin); if (!min) continue;
    if (!(await botAlDia(neg)).activo) continue;   // 3.23: asistente apagado en el panel → sin recordatorios
    try {
      const r = await gas(neg, 'proximas', { minutos: min });
      if (!r.info || !r.info.activo) continue;
      for (const c of r.citas || []) {   // 1.1: cada cita por su lado; una que falla no frena las demás ni se repite cada 5 min
        if (!atiende({ tel: numeroWa(c.whatsapp) }) || mudo(neg.bid + ':' + numeroWa(c.whatsapp))) continue;   // 3.24: /sinbot
        try {
          const bot = botDe(neg);
          await escribir(neg, c.whatsapp, T.recordatorio(c, r.info, bot)); est.recordatorios++; anotar({ bid: neg.bid, que: 'recordatorio ' + c.code });
          if (bot.recordatorioConfirmar || bot.cambios) ASIS.trasRecordatorio(neg, numeroWa(c.whatsapp), c);
        }
        catch (e) { if (!e.permanente) { log('recordatorio', c.code, e.message); continue; } anotar({ bid: neg.bid, que: 'recordatorio ' + c.code + ' no se pudo: ' + e.message }); }
        await gas(neg, 'recordada', { code: c.code }).catch((e) => log('recordada', c.code, e.message));
      }
      // 3.14 · el mismo cliente con 2 citas que se cruzan → «Tienes 2 citas… ¿deseas cancelar una de las dos?» (una sola vez)
      for (const d of r.dobles || []) {
        const tel = numeroWa(d.whatsapp);
        if (!atiende({ tel }) || !botDe(neg).cambios || mudo(neg.bid + ':' + tel)) continue;
        try { await ASIS.preguntarDobles(neg, tel, d, r.info.negocio); anotar({ bid: neg.bid, chat: tel.slice(-4), que: '👀 tiene ' + d.citas.length + ' citas que se cruzan: le pregunté cuál cancelar' }); }
        catch (e) { log('dobles', e.message); continue; }
        await gas(neg, 'dobleAvisado', { codes: d.citas.map((x) => x.code) }).catch((e) => log('dobleAvisado', e.message));
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
const VENCE_MIN = Math.max(2, parseInt(env('VINCULAR_MIN', '3'), 10));   // 3.27: si no vincula en 3 min, se borra la conexión vacía (el panel muestra la cuenta regresiva)
function guardarNegocio(bid, extra) {
  let L = []; try { L = JSON.parse(fs.readFileSync(CFG.negocios, 'utf8')); } catch (e) { L = []; }
  const i = L.findIndex((x) => x.bid === bid);
  if (i === -1) L.push(Object.assign({ bid, instancia: bid, motor: CFG.motor, sesion: bid, activo: true, recordatorioMin: 120, estados: { activo: true, hoy: '07:30', semana: '07:00', semanaDia: 1 } }, extra || {}));
  else Object.assign(L[i], extra || {});
  fs.writeFileSync(CFG.negocios, JSON.stringify(L, null, 2));   // se escribe en el MISMO archivo (está montado desde el VPS)
  negT = 0; negocios();
}
function negocioRegistrado(bid) { try { return JSON.parse(fs.readFileSync(CFG.negocios, 'utf8')).some((x) => x && x.bid === bid); } catch (e) { return false; } }
// 3.1: la sesión de WAHA de un negocio (la de su registro en negocios.json, aunque esté inactivo; si no hay, su propio nombre)
function registroDe(bid) { try { return JSON.parse(fs.readFileSync(CFG.negocios, 'utf8')).find((x) => x && x.bid === bid) || null; } catch (e) { return null; } }
const sesionBid = (bid) => { const n = registroDe(bid); return String((n && (n.sesion || n.instancia)) || bid); };
const motorBid = (bid) => { const n = registroDe(bid); return esWaha(n || null) ? 'waha' : 'evolution'; };
async function asegurarInstancia(bid) {
  if (motorBid(bid) === 'waha') {
    const ses = sesionBid(bid), config = { webhooks: [{ url: CFG.publico + '/webhook', events: ['message.any', 'session.status'] }] };
    let existe = false; try { await waha('get', '/api/sessions/' + encodeURIComponent(ses)); existe = true; } catch (e) { existe = false; }
    if (!existe) await waha('post', '/api/sessions', { name: ses, start: true, config });
    else { await waha('put', '/api/sessions/' + encodeURIComponent(ses), { name: ses, config }).catch(() => {}); await waha('post', '/api/sessions/' + encodeURIComponent(ses) + '/start').catch(() => {}); }
    // 3.1: el código solo se puede pedir cuando la sesión ya está esperando vincular
    for (let i = 0; i < 15; i++) { const e = await estadoInstancia(bid); if (e === 'open' || e === 'scan_qr_code') break; await new Promise((ok) => setTimeout(ok, CFG.esperaMs)); }
    return;
  }
  let existe = false;
  try { const r = await evo('get', '/instance/fetchInstances?instanceName=' + encodeURIComponent(bid)); existe = JSON.stringify(r).indexOf('"' + bid + '"') !== -1; } catch (e) { existe = false; }
  const webhook = { url: CFG.publico + '/webhook', byEvents: false, base64: true, events: EVENTOS };
  if (!existe) await evo('post', '/instance/create', { instanceName: bid, integration: 'WHATSAPP-BAILEYS', qrcode: true, rejectCall: false, groupsIgnore: true, alwaysOnline: false, readMessages: false, syncFullHistory: false, webhook });
  else await evo('post', '/webhook/set/' + encodeURIComponent(bid), { webhook: Object.assign({ enabled: true }, webhook) }).catch(() => {});
}
async function estadoInstancia(bid) {
  if (motorBid(bid) === 'waha') { try { const r = await waha('get', '/api/sessions/' + encodeURIComponent(sesionBid(bid))); return String(r.status || '').toUpperCase() === 'WORKING' ? 'open' : String(r.status || '').toLowerCase(); } catch (e) { return ''; } }
  try { const r = await evo('get', '/instance/connectionState/' + encodeURIComponent(bid)); return String((r.instance && r.instance.state) || r.state || ''); } catch (e) { return ''; }
}
async function numeroInstancia(bid) {
  if (motorBid(bid) === 'waha') { try { const r = await waha('get', '/api/sessions/' + encodeURIComponent(sesionBid(bid))); return String((r.me && r.me.id) || '').split('@')[0].replace(/\D/g, ''); } catch (e) { return ''; } }
  try { const r = await evo('get', '/instance/fetchInstances?instanceName=' + encodeURIComponent(bid)); const x = (Array.isArray(r) ? r[0] : r) || {}; const i = x.instance || x; return String(i.ownerJid || i.owner || i.number || '').split('@')[0].replace(/\D/g, ''); } catch (e) { return ''; }
}
async function atenderPedidoWa(bid) {
  const neg = { bid, instancia: bid };
  const { pedido } = await gas(neg, 'waPedido');
  if (!pedido) return;
  try {
    if (pedido.accion === 'conectar') {
      // 3.1: un WhatsApp por negocio, en SU sesión de WAHA (nueva, con el nombre del negocio) · se registra inactivo hasta que vincule
      const reg = registroDe(bid);
      if (!reg || (reg.activo === false && reg.sesion !== bid)) guardarNegocio(bid, Object.assign({ activo: false, instancia: bid, motor: CFG.motor }, CFG.motor === 'waha' ? { sesion: bid } : {}));
      await asegurarInstancia(bid);   // 1.7: el negocio NO se activa para Mary hasta que vincule de verdad
      if (await estadoInstancia(bid) === 'open') { await gas(neg, 'waResultado', { estado: 'conectado', numero: await numeroInstancia(bid) }); anotar({ bid, que: 'WhatsApp ya estaba conectado' }); return; }
      const c = motorBid(bid) === 'waha'
        ? await (async () => { const ses = encodeURIComponent(sesionBid(bid)); const r = await waha('post', '/api/' + ses + '/auth/request-code', { phoneNumber: pedido.numero }); return { pairingCode: r.code || '', base64: await qrWaha(bid) }; })()
        : await evo('get', '/instance/connect/' + encodeURIComponent(bid) + '?number=' + encodeURIComponent(pedido.numero));
      const vence = Date.now() + VENCE_MIN * 60000;
      vinculando.set(bid, vence);
      MEM.pendientesWa = MEM.pendientesWa || {}; MEM.pendientesWa[bid] = vence;   // se recuerda aunque el VPS se reinicie
      MEM.codigos = MEM.codigos || {}; MEM.codigos[bid] = { codigo: String(c.pairingCode || ''), t: Date.now() }; memGuardar();
      await gas(neg, 'waResultado', { estado: 'codigo', codigo: String(c.pairingCode || ''), qr: String(c.base64 || ''), vence });
      anotar({ bid, que: 'código para vincular enviado al panel' + (c.pairingCode ? '' : ' (solo QR)') });
    } else if (pedido.accion === 'desconectar') {
      // 3.1: desvincular = cerrar la sesión y BORRAR la conexión (no queda nada abierto). La próxima vinculación crea una nueva.
      if (motorBid(bid) === 'waha') { const ses = encodeURIComponent(sesionBid(bid)); await waha('post', '/api/sessions/' + ses + '/logout').catch(() => {}); await waha('delete', '/api/sessions/' + ses).catch(() => {}); }
      else { await evo('delete', '/instance/logout/' + encodeURIComponent(bid)).catch(() => {}); await evo('delete', '/instance/delete/' + encodeURIComponent(bid)).catch(() => {}); }
      guardarNegocio(bid, Object.assign({ activo: false }, motorBid(bid) === 'waha' ? { sesion: bid, instancia: bid } : {}));
      if (MEM.conectados) { delete MEM.conectados[bid]; memGuardar(); }
      if (MEM.pendientesWa) { delete MEM.pendientesWa[bid]; memGuardar(); }   // 3.27: «Cancelar» mientras vinculaba: ya no queda nada por vencer
      vinculando.delete(bid);
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
    if (motorBid(bid) === 'waha') { const ses = encodeURIComponent(sesionBid(bid)); await waha('post', '/api/sessions/' + ses + '/logout').catch(() => {}); await waha('delete', '/api/sessions/' + ses).catch(() => {}); }
    else { await evo('delete', '/instance/logout/' + encodeURIComponent(bid)).catch(() => {}); await evo('delete', '/instance/delete/' + encodeURIComponent(bid)).catch(() => {}); }
    const L = negocios().find((n) => n.bid === bid); if (L) guardarNegocio(bid, { activo: false });
    await gas({ bid, instancia: bid }, 'waResultado', { estado: 'vencido' }).catch(() => {});
    anotar({ bid, que: '🧹 no vinculó en ' + VENCE_MIN + ' min: borré la conexión vacía' });
  }
}
async function qrWaha(bid) {
  try { const q = await waha('get', '/api/' + encodeURIComponent(sesionBid(bid)) + '/auth/qr?format=image'); if (q && q.data) return 'data:' + (q.mimetype || 'image/png') + ';base64,' + q.data; } catch (e) { /* solo código */ }
  return '';
}
// 3.1: el QR de WhatsApp cambia cada ~20 s: mientras el dueño vincula, se le manda el nuevo al panel (el código sigue igual)
const QR_T = new Map(), SINC = { t: Date.now() - 29 * 60000 };   // la primera sincronización, al minuto de encender
async function renovarQr() {
  for (const [bid, hasta] of vinculando) {
    if (Date.now() > hasta || motorBid(bid) !== 'waha' || Date.now() - (QR_T.get(bid) || 0) < 15000) continue;
    QR_T.set(bid, Date.now());
    if (await estadoInstancia(bid) === 'open') continue;
    const qr = await qrWaha(bid); if (!qr) continue;
    await gas({ bid, instancia: bid }, 'waResultado', { estado: 'codigo', codigo: ((MEM.codigos || {})[bid] || {}).codigo || '', qr, vence: hasta }).catch(() => {});
  }
}
// 3.1: negocios que ya tienen WhatsApp funcionando (p. ej. vinculados por el VPS) → el panel lo muestra «✅ Vinculado»
async function sincronizarConectados() {
  for (const neg of negocios()) {
    if (MEM.conectados && MEM.conectados[neg.bid]) continue;
    if (await estadoInstancia(neg.bid) !== 'open') continue;
    MEM.conectados = MEM.conectados || {}; MEM.conectados[neg.bid] = Date.now(); memGuardar();
    await gas(neg, 'waResultado', { estado: 'conectado', numero: await numeroInstancia(neg.bid) }).catch((e) => log('sincronizar', e.message));
    anotar({ bid: neg.bid, que: '✅ el panel ya muestra el WhatsApp vinculado' });
  }
}
async function tickPedidosWa() {
  if (!CFG.gas || !CFG.maryKey) return;
  await limpiarSinVincular().catch((e) => log('limpiar', e.message));
  await renovarQr().catch((e) => log('qr', e.message));
  if (Date.now() - SINC.t > 30 * 60000) { SINC.t = Date.now(); await sincronizarConectados().catch((e) => log('sincronizar', e.message)); }
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
  cada(15 * 60000, 'record', tickRecordatorios);
  cada(5 * 60000, 'volver', tickVolver);
  cada(60000, 'retomar', tickRetomar);
  cada(60 * 60000, 'estadisticas', tickEstadisticas);   // 📊 3.37: el reporte se guarda en Google una vez por hora   // 3.33: «¿Seguimos con tu cita?» a los 30 min sin elegir nada   // 3.32: recordatorio de servicio (una vez al día, desde las 10:00)   // 2.5: cada 15 min (antes 5): el recordatorio sale igual con tiempo de sobra
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
    if (req.method === 'GET' && url.pathname === '/salud') { let oido = 'no instalado'; try { const r = await fetch(CFG.oido + '/salud', { signal: AbortSignal.timeout(2000) }); const j = await r.json(); oido = j.ok ? 'listo (' + j.modelo + ')' : 'cargando' + (j.error ? ': ' + j.error.slice(0, 60) : ''); } catch (e) { /* no está */ }
      return json(res, 200, { ok: true, version: VERSION, oido, modo: CFG.modo, prueba: CFG.prueba.length, negocios: negocios().map((n) => n.bid), gas: !!(CFG.gas && CFG.maryKey), evo: !!CFG.evoKey, est }); }
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
const _banco = { ASIS, BOT, yaLoDije, memDicho: () => (MEM.dicho = MEM.dicho || {}), memHumano: () => MEM.humano, memRobot: () => (MEM.robot = MEM.robot || {}), memConv: () => (MEM.conv = MEM.conv || {}), tickRecordatorios, tickVolver, tickRetomar, tickEstadisticas, memStats: () => (MEM.stats = MEM.stats || {}), publicarEstado, alMensaje, alEventoConexion, ultimos, reiniciar() { CL = null; MEM.volver = {}; MEM.stats = {}; MEM.piePrueba = {}; leer.avisado = false; BOT_LEIDO.clear(); MEM.sinbot = {}; MEM.chats = {}; MEM.estados = {}; MEM.humano = {}; MEM.enviados = []; MEM.conv = {}; MEM.clientes = {}; MEM.conectados = {}; MEM.pendientesWa = {}; MEM.codigos = {}; MEM.robot = {}; MEM.dicho = {}; AGRUPA.clear(); ASIS._cat.clear(); BOT.clear(); CONTACTOS.clear(); vinculando.clear(); delete MEM.revPend; ULT_ENVIO.clear(); VISTOS_ID.clear(); FILAS.clear(); ultimos.length = 0; negT = 0; } };
module.exports = { _banco, botNormal, frenoRobot, estadosQueTocan, atenderPedidoWa, sincronizarConectados, renovarQr, telEnAviso, deWaha, esWaha, debeResponder, alEventoConexion, tickPedidosWa, limpiarSinVincular, leerMensaje, atiende, PREGUNTA, numeroWa, ahoraLocal, enFila, yaVisto, quienVeEstados, CFG };
