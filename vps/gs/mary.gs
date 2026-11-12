/**
 * MARY · RECEPCIONISTA DEL AGENDADOR (complemento del servidor)
 * --------------------------------------------------------------
 * Va en un ARCHIVO NUEVO del mismo proyecto de Apps Script (Archivo > + > Secuencia de comandos, nómbralo "mary").
 * No cambia nada del servidor: solo agrega la acción pública "mary", protegida con su propia clave.
 *
 * La usa el servicio "agendador-ia" del VPS (sin IA) para:
 *   chat    → ¿este número tiene cita? (para responder con su cita o con el link para agendar)
 *   proof   → el cliente mandó la foto del pago por WhatsApp
 *   pago    → llegó al correo del negocio el aviso del banco con un monto: se busca la cita y se confirma sola
 *   cupos   → horas libres de hoy o de la semana (para los estados de WhatsApp)
 *   proximas / recordada → recordatorio por WhatsApp antes de la cita
 *
 * Instalación: pega este archivo, ejecuta activarMary() una vez, copia la clave que sale en el registro
 * y ponla en el mary.env del VPS (MARY_KEY). Vuelve a implementar la aplicación web (Implementar > Administrar > editar > Nueva versión).
 */
const MARY_VERSION = 'agendador-ia-3.31';

// Se registra como acción pública del servidor (sin sesión: entra con la clave de Mary).
// ⚠️ Este archivo debe quedar DEBAJO del archivo principal en la lista de archivos de Apps Script (los nuevos quedan al final: así está bien).
try { PUBLIC_ACTIONS.mary = maryAgenda; } catch (e) { console.error('Mary: el archivo "mary" quedó ANTES del principal. Muévelo abajo.'); }

function activarMary() {
  const pr = PropertiesService.getScriptProperties();
  let k = pr.getProperty('MARY_KEY');
  if (!k) { k = randKey(32); pr.setProperty('MARY_KEY', k); }
  if (PUBLIC_ACTIONS.mary !== maryAgenda) throw new Error('El archivo "mary" está ANTES del principal en la lista de archivos. Arrástralo para que quede de último y vuelve a ejecutar activarMary.');
  Logger.log('✅ Mary lista. Pon esta clave en el VPS cuando instalar.sh la pida (MARY_KEY):  ' + k);
  Logger.log('👉 Ahora: Implementar › Administrar implementaciones › ✏️ › Versión: Nueva versión › Implementar (la URL /exec no cambia).');
}

function maryAgenda(b) {
  // La clave la pone el VPS al subir el código (archivo «mary-clave», generado por actualizar-google.sh); activarMary() queda como plan B a mano
  const k = (typeof MARY_CLAVE !== 'undefined' && MARY_CLAVE) || PropertiesService.getScriptProperties().getProperty('MARY_KEY');
  if (!k || String(b.key || '') !== k) fail('No autorizado.');
  Object.keys(_settings).forEach(function (x) { delete _settings[x]; });
  const st = loadSettings();
  switch (String(b.op || '')) {
    case 'chat': return maryChat_(st, b);
    case 'proof': return maryProof_(st, b);
    case 'pago': return maryPago_(st, b);
    case 'cupos': return maryCupos_(st, b);
    case 'proximas': return maryProximas_(st, b);
    case 'recordada': return maryRecordada_(b);
    case 'revisadas': return maryRevisadas_(st);
    case 'avisada': return maryAvisada_(b);
    case 'info': return maryInfo_(st);
    case 'waPedido': return maryWaPedido_();
    case 'waResultado': return maryWaResultado_(b);
    case 'catalogo': return maryCatalogo_(st);   // 3.0 · agendar por WhatsApp (listas)
    case 'dias': return maryDias_(st, b);
    case 'horas': return maryHoras_(st, b);
    case 'crear': return maryCrear_(st, b);
    case 'asistencia': return maryAsistencia_(st, b);   // 3.1 · respuesta al recordatorio
    case 'cancelar': return maryCancelar_(st, b);
    case 'reagendar': return maryReagendar_(st, b);
    case 'contactos': return maryContactos_();
    case 'dobleAvisado': return maryDobleAvisado_(b);
  }
  fail('Operación no válida.');
}

// ---------- utilidades ----------
function maryLast10_(x) { return String(x || '').replace(/\D/g, '').slice(-10); }
function maryLinkAgenda_() { return siteUrl() + '/index.html?b=' + BID; }
function maryLinkCita_(code) { return siteUrl() + '/index.html?b=' + BID + '&cita=' + encodeURIComponent(code); }
function maryCitaOut_(a) {
  return {
    code: a.code, status: a.status, date: a.date, time: a.startTime, dia: waDayLabel(a.date), hora: hora12(a.startTime),
    servicio: (a.items || []).map(function (i) { return i.name; }).join(' + '), con: a.staffName || '',
    abono: Number(a.depositCOP || 0), saldo: Number(a.balanceDueCOP || 0), total: Number(a.totalCOP || 0),
    pagoEstado: (a.payment || {}).status || '', vence: a.holdExpiresAt ? a.holdExpiresAt.toISOString() : null,
    link: maryLinkCita_(a.code), ids: (a.items || []).map(function (i) { return i.id; }), staffId: a.staffId || '', asistencia: !!a.clientConfirmed
  };
}
// Citas activas (desde hace 2 h en adelante) de un número de WhatsApp
function maryCitasDe_(phone) {
  const d10 = maryLast10_(phone);
  if (d10.length < 10) return [];
  const desde = Date.now() - 2 * 3600000;
  let all = [];
  ACTIVE.forEach(function (s) { all = all.concat(fsQuery('appointments', [['status', 'EQUAL', s]])); });
  return all.filter(function (a) { return maryLast10_((a.customer || {}).whatsapp) === d10 && a.startAt && a.startAt.getTime() >= desde; })
    .sort(function (x, y) { return x.startAt.getTime() - y.startAt.getTime(); });
}
function maryMedios_(st) {
  return (st.paymentMethods || []).map(function (m) { return { label: m.label || '', account: m.account || '', holder: m.holder || '' }; });
}
function maryInfo_(st) {
  const ap = st.appearance || {};
  return {
    version: MARY_VERSION, negocio: st.businessName || BIZ.name || '', activo: BIZ.status === 'active',
    link: maryLinkAgenda_(), direccion: [st.address, st.city].filter(Boolean).join(', '),
    color: (ap.colors || {}).primary || '', logo: ap.logo || '', categorias: maryCategorias_(), medios: maryMedios_(st),
    holdMinutes: Math.max(5, Number(st.holdMinutes || 30)), bot: maryBotCfg_(st)
  };
}
// 3.1 · «💬 WhatsApp Bot» del panel del dueño (settings.maryBot). Todo tiene un valor por defecto.
function maryBotCfg_(st) {
  const b = st.maryBot || {}, e = b.estados || {};
  const d = function (v, x) { return v === undefined || v === null || v === '' ? x : v; };
  let horas = (Array.isArray(e.horas) ? e.horas : ['11:00']).filter(function (h) { return /^\d{2}:\d{2}$/.test(String(h)); }).slice(0, 2);   // máximo 2 estados al día
  if (!horas.length) horas = ['11:00'];
  return {
    activo: d(b.activo, true) !== false, agendar: d(b.agendar, true) !== false, cupos: d(b.cupos, true) !== false, audios: d(b.audios, true) !== false,
    saludoDiario: d(b.saludoDiario, true) !== false, pedirNombre: d(b.pedirNombre, true) !== false, pedirCorreo: d(b.pedirCorreo, true) !== false,
    loDeSiempre: d(b.loDeSiempre, true) !== false, recordatorioMin: Math.max(0, Number(d(b.recordatorioMin, d(st.maryReminderMinutes, 120)))),
    recordatorioConfirmar: d(b.recordatorioConfirmar, true) !== false, cambios: d(b.cambios, true) !== false, pausaMin: Math.max(5, Number(d(b.pausaMin, 30))),
    estados: { activo: d(e.activo, true) !== false, horas: horas, manana: d(e.manana, true) !== false, semanal: d(e.semanal, false) === true }
  };
}
// 3.1 · el cliente queda en los CLIENTES del negocio (panel › Clientes) con su nombre, WhatsApp y correo
function maryGuardarCliente_(nombre, phone, email) {
  const d10 = maryLast10_(phone); if (d10.length < 10) return;
  try {
    const id = 'wa' + d10, path = bp('customers/' + id), ya = fsGet(path);
    const n = String(nombre || '').trim().split(/\s+/);
    const datos = { whatsapp: String(phone || '').replace(/\D/g, ''), source: ya && ya.source ? ya.source : 'whatsapp', updatedAt: new Date() };
    if (n[0] && n[0] !== 'Cliente') { datos.firstName = n[0]; datos.lastName = n.slice(1).join(' '); }
    if (email) datos.email = String(email).toLowerCase();
    if (ya) commit([wPatch(path, datos)]);
    else commit([wSet(path, Object.assign({ firstName: n[0] || 'Cliente', lastName: n.slice(1).join(' '), email: '', paymentMode: 'deposit', blocked: false, noShowCount: 0, totalAppointments: 0, createdAt: new Date() }, datos))]);
  } catch (e) { console.error('Cliente: ' + e); }
}
// tarjeta de contacto (.vcf) para guardarlo en el celular con un toque
function maryVcard_(nombre, phone, email, negocio) {
  const n = String(nombre || 'Cliente').trim(), tel = '+' + String(phone || '').replace(/\D/g, '');
  const L = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + n, 'N:' + n.split(/\s+/).slice(1).join(' ') + ';' + n.split(/\s+/)[0] + ';;;', 'TEL;TYPE=CELL:' + tel];
  if (email) L.push('EMAIL:' + email);
  L.push('NOTE:Cliente de ' + negocio + ' (Tu Agenda)', 'END:VCARD');
  return Utilities.newBlob(L.join('\r\n') + '\r\n', 'text/vcard', n.replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '-') + '.vcf');
}
function maryCitaDelNumero_(b) {
  const a = fsGet(bp('appointments/' + String(b.code || '').toUpperCase().trim()));
  if (!a || maryLast10_((a.customer || {}).whatsapp) !== maryLast10_(b.phone)) return null;
  a.history = a.history || []; a.lockIds = a.lockIds || []; a.payment = a.payment || {};
  return a;
}
// «sí» al recordatorio → asistencia confirmada + aviso al dueño por Telegram con sus datos y la tarjeta de contacto
function maryAsistencia_(st, b) {
  const a = maryCitaDelNumero_(b);
  if (!a || ACTIVE.indexOf(a.status) < 0) return { ok: false, motivo: 'No encontré tu cita activa.' };
  if (!a.clientConfirmed) commit([wPatch(bp('appointments/' + a.code), { clientConfirmed: true, clientConfirmedAt: new Date(), history: hist(a, 'client_confirmed', 'whatsapp') })]);
  const c = a.customer || {}, nom = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Cliente', biz = st.businessName || BIZ.name || '';
  maryGuardarCliente_(nom, c.whatsapp, c.email);
  const txt = '✅ <b>CITA CONFIRMADA POR EL CLIENTE</b>\n🙋 ' + esc(nom) + '\n📱 wa.me/' + String(c.whatsapp || '').replace(/\D/g, '') + (c.email ? '\n📧 ' + esc(c.email) : '') + '\n\n' + aptText(a);
  try {
    recipients([a.staffId]).forEach(function (chat) {
      tgSend(chat, bizTag() + txt);
      try { tg('sendDocument', { chat_id: String(chat), document: maryVcard_(nom, c.whatsapp, c.email, biz), caption: '📇 Toca para guardar a ' + nom + ' en tus contactos' }); } catch (e) { console.error(e); }
    });
  } catch (e) { console.error('Telegram: ' + e); }
  return { ok: true, cita: maryCitaOut_(a) };
}
function maryCancelar_(st, b) {
  if (!maryBotCfg_(st).cambios) return { ok: false, motivo: 'Para cancelar, usa el link de tu cita o escríbele al negocio.' };
  const a0 = maryCitaDelNumero_(b);
  if (!a0 || ACTIVE.indexOf(a0.status) < 0) return { ok: false, motivo: 'No encontré tu cita activa.' };
  const minH = Number(st.rescheduleMinHours != null ? st.rescheduleMinHours : 2);
  // 3.14: si es una cita DOBLE (el mismo cliente tiene otra activa que se cruza), puede quitar la de sobra aunque falte poco
  const esDoble = maryCitasDe_(b.phone).some(function (x) { return x.code !== a0.code && x.date === a0.date && tmin(x.startTime) < tmin(a0.endTime || a0.startTime) && tmin(a0.startTime) < tmin(x.endTime || x.startTime); });
  if (!esDoble && a0.status !== 'pending_payment' && a0.startAt.getTime() - Date.now() < minH * 3600000) return { ok: false, motivo: 'Solo se puede cancelar con al menos ' + minH + ' horas de anticipación. Escríbele directamente al negocio.' };
  const apt = withLock(function () {
    const a = maryCitaDelNumero_(b);
    if (!a || ACTIVE.indexOf(a.status) < 0) fail('Esta reserva ya no está activa.');
    commit([wPatch(bp('appointments/' + a.code), { status: 'cancelled', cancelReason: 'Cancelada por el cliente (WhatsApp)', updatedAt: new Date(), holdExpiresAt: null, history: hist(a, 'cancelled', 'whatsapp', { reason: 'whatsapp' }) })].concat(freeLockWrites(a)));
    a.status = 'cancelled';
    return a;
  });
  try { if (tgEventOn('cancel')) tgNotify([apt.staffId], '🚫 <b>CITA CANCELADA</b> por el cliente (WhatsApp)\n' + aptText(apt) + '\nEl cupo quedó libre.'); } catch (e) { console.error(e); }
  if ((apt.customer || {}).email) emailClient(apt, 'Tu cita fue cancelada', 'Cancelaste tu cita. La quitamos de tu calendario. Escríbenos si quieres agendar de nuevo.');
  return { ok: true, cita: maryCitaOut_(apt), link: maryLinkAgenda_() };
}
function maryReagendar_(st, b) {
  if (!maryBotCfg_(st).cambios) return { ok: false, motivo: 'Para cambiarla, usa el link de tu cita.' };
  const a0 = maryCitaDelNumero_(b);
  if (!a0 || ACTIVE.indexOf(a0.status) < 0) return { ok: false, motivo: 'No encontré tu cita activa.' };
  if (a0.status === 'pending_payment') return { ok: false, motivo: 'Primero envía el abono de esta cita; después la puedes cambiar.' };
  const minH = Number(st.rescheduleMinHours != null ? st.rescheduleMinHours : 2);
  if (a0.startAt.getTime() - Date.now() < minH * 3600000) return { ok: false, motivo: 'Solo se puede cambiar con al menos ' + minH + ' horas de anticipación. Escríbele directamente al negocio.' };
  if ((a0.rescheduleCount || 0) >= Number(st.maxReschedules != null ? st.maxReschedules : 2)) return { ok: false, motivo: 'Ya hiciste el máximo de cambios permitidos para esta cita.' };
  let old;
  try {
    const apt = withLock(function () {
      const a = maryCitaDelNumero_(b);
      const staffId = b.staffId || a.staffId, staff = loadStaff().filter(function (x) { return x._id === staffId && x.active !== false; })[0];
      if (!staff) fail('Ese profesional no está disponible.');
      if (b.date === a.date && b.time === a.startTime && staffId === a.staffId) fail('Elegiste el mismo horario que ya tenías.');
      checkSlot(st, b.date, b.time, a.occupiedMinutes, true, staff);
      const own = (staffId === a.staffId && b.date === a.date) ? a.lockIds : [];
      const r = reserveLocks(staffId, b.date, b.time, a.occupiedMinutes, { own: own });
      const toDelete = a.lockIds.filter(function (id) { return r.all.indexOf(id) < 0; });
      const delta = {}; addDelta(delta, a.date, a.staffId, -toDelete.length); addDelta(delta, b.date, staffId, r.create.length);
      old = { date: a.date, startTime: a.startTime, staffId: a.staffId, staffName: a.staffName };
      const patch = { staffId: staffId, staffName: staff.name, date: b.date, startTime: b.time, endTime: mstr(tmin(b.time) + a.occupiedMinutes), startAt: mkDate(b.date, b.time), lockIds: r.all,
        rescheduleCount: (a.rescheduleCount || 0) + 1, history: hist(a, 'rescheduled', 'whatsapp', { from: a.date + ' ' + a.startTime, to: b.date + ' ' + b.time, byCustomer: true }), updatedAt: new Date(), reminderSent: false, maryReminded: false, clientConfirmed: false };
      commit(toDelete.map(function (id) { return wDelete(bp('slotLocks/' + id)); }).concat(lockWrites(r, staffId, b.date, 'booked', a.code, null)).concat([wPatch(bp('appointments/' + a.code), patch)]).concat(incWrites(delta)));
      Object.assign(a, patch);
      return a;
    });
    try { if (tgEventOn('reschedule')) tgNotify([old.staffId, apt.staffId], '🔄 <b>CITA REAGENDADA</b> por el cliente (WhatsApp)\n' + esc(apt.customer.firstName + ' ' + (apt.customer.lastName || '')) + ' · ' + apt.code + '\n❌ Antes: ' + fechaTxt(old.date) + ', ' + hora12(old.startTime) + '\n✅ Ahora: ' + fechaTxt(apt.date) + ', ' + hora12(apt.startTime) + ' (' + esc(apt.staffName) + ')'); } catch (e) { console.error(e); }
    if ((apt.customer || {}).email) emailClient(apt, 'Tu cita cambió de horario', 'Tu cita quedó para el ' + fechaTxt(apt.date) + ' a las ' + hora12(apt.startTime) + '. Ya la movimos en tu calendario.');
    return { ok: true, cita: maryCitaOut_(apt) };
  } catch (e) {
    const m = String((e && (e.userMessage || e.message)) || e);
    return { ok: false, motivo: /tomado|ya no está disponible|fuera del horario|no alcanza/i.test(m) ? 'ocupada' : m };
  }
}
// números de los clientes del negocio: para que los estados les lleguen a ELLOS (WAHA solo conoce a quien escribió hace poco)
function maryContactos_() {
  const L = {};
  fsListAll(bp('customers')).forEach(function (c) { const n = String(c.whatsapp || '').replace(/\D/g, ''); if (n.length >= 10 && !c.blocked) L[n.length === 10 ? '57' + n : n] = true; });
  return { numeros: Object.keys(L).slice(0, 3000) };
}
// Nombres de las categorías (o de los servicios principales si no hay categorías) para los estados
function maryCategorias_() {
  const sv = loadServices().filter(function (s) { return s.active !== false && s.type !== 'addon'; });
  const cats = []; sv.forEach(function (s) { const c = String(s.category || '').trim(); if (c && cats.indexOf(c) < 0) cats.push(c); });
  return (cats.length ? cats : sv.map(function (s) { return s.name; })).slice(0, 6);
}

// ---------- chat: ¿tiene cita? ----------
function maryChat_(st, b) {
  const citas = maryCitasDe_(b.phone).map(maryCitaOut_);
  const out = maryInfo_(st);
  out.citas = citas;
  if (!citas.length) { const c = maryCupos_(st, { dias: 1 }); out.cuposHoy = c.dias.length ? c.dias[0].libres.length : 0; }
  if (b.conNombre) out.cliente = maryNombreCliente_(b.phone);   // 3.30: para saludarlo por su nombre
  return out;
}
// 3.30 · el nombre del cliente en ESTE negocio (registrado en la página o guardado por WhatsApp)
function maryNombreCliente_(phone) {
  const d10 = maryLast10_(phone); if (d10.length < 10) return '';
  const bueno = function (n) { n = String(n || '').trim(); return n && n !== 'Cliente' ? n.split(/\s+/).slice(0, 2).join(' ') : ''; };
  try {
    const wa = fsGet(bp('customers/wa' + d10)); if (wa && bueno(wa.firstName)) return bueno(wa.firstName + ' ' + (wa.lastName || ''));
    const formas = ['+57' + d10, '57' + d10, d10];
    for (let i = 0; i < formas.length; i++) { const L = fsQuery('customers', [['whatsapp', 'EQUAL', formas[i]]]); if (L.length && bueno(L[0].firstName)) return bueno(L[0].firstName + ' ' + (L[0].lastName || '')); }
  } catch (e) { console.error('nombre: ' + e); }
  return '';
}

// ---------- foto del pago por WhatsApp ----------
function maryProof_(st, b) {
  const mias = maryCitasDe_(b.phone);
  const pend = mias.filter(function (a) { return a.status === 'pending_payment'; })[0];
  if (!pend) {   // 1.1: varias fotos del mismo pago: la primera ya la dejó en revisión → no se le dice «no tienes cita»
    const ya = mias.filter(function (a) { return (a.payment || {}).status === 'submitted' && Date.now() - toMillisSrv((a.payment || {}).submittedAt) < 2 * 3600000; })[0];
    return ya ? { ok: true, ya: true, cita: maryCitaOut_(ya) } : { ok: false, motivo: 'sin_cita_pendiente' };
  }
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(b.image || '');
  if (!m) fail('La imagen no es válida.');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], BID + '_' + pend.code + '_' + Date.now() + (/pdf/.test(m[1]) ? '.pdf' : '.jpg'));
  // 🧾 La captura NO confirma sola: queda «en revisión» y le llega al dueño por Telegram con ✅ Aprobar / ❌ Rechazar.
  //    (Si el negocio prefiere confirmar al instante y revisar después: settings.maryAutoCaptura = true.)
  //    Si después llega el correo del banco con ese monto, la cita se confirma sola igual (maryPago_).
  const st2 = Object.assign({}, st, { autoConfirmProof: st.maryAutoCaptura === true });
  const apt = waApplyProof(pend.code, blob, st2);
  commit([wPatch(bp('appointments/' + apt.code), { payment: Object.assign({}, apt.payment, { viaMary: true }), maryAvisado: false })]);
  if (!tgEventOn('proof')) {   // el plan o el dueño apagó ese aviso: con Mary la captura igual le llega (si no, nadie la aprobaría)
    const cap = '🧾 <b>CAPTURA DE PAGO POR WHATSAPP</b> (Mary)\nLa cita queda en revisión hasta que la apruebes.\n\n' + aptText(apt);
    const kb = JSON.stringify({ inline_keyboard: [[{ text: '✅ Aprobar pago', callback_data: 'ap|' + BID + '|' + apt.code }, { text: '❌ Rechazar', callback_data: 'rj|' + BID + '|' + apt.code }]] });
    recipients([apt.staffId]).forEach(function (c) { const r = tg('sendPhoto', { chat_id: c, photo: blob, caption: bizTag() + cap, parse_mode: 'HTML', reply_markup: kb }); if (!r || !r.ok) tgSend(c, bizTag() + cap, JSON.parse(kb).inline_keyboard); });
  }
  return { ok: true, cita: maryCitaOut_(apt) };
}

// ---------- el dueño aprobó o rechazó una captura (Telegram o panel): Mary le avisa al cliente por WhatsApp ----------
function maryRevisadas_(st) {
  const T = fsQuery('appointments', [['payment.viaMary', 'EQUAL', true]]);
  const pendientes = T.filter(function (a) { return (a.payment || {}).status === 'submitted'; }).length;
  const L = T.filter(function (a) {
    return a.maryAvisado === false && ['approved', 'rejected'].indexOf((a.payment || {}).status) >= 0;
  });
  return { pendientes: pendientes, citas: L.map(function (a) { const o = maryCitaOut_(a); o.whatsapp = (a.customer || {}).whatsapp || ''; o.nombre = (a.customer || {}).firstName || ''; o.decision = a.payment.status; o.motivo = a.payment.rejectReason || ''; return o; }), info: maryInfo_(st) };
}
function maryAvisada_(b) { const a = getApt(b.code); commit([wPatch(bp('appointments/' + a.code), { maryAvisado: true })]); return { ok: true }; }

// ---------- pago leído del correo del negocio ----------
// b.amount = monto del aviso, b.payer = nombre del pagador (si el banco lo trae), b.at = hora del correo (ISO), b.ref = id del correo
// Confirma solo si hay UNA cita esperando ese monto. Si hay varias, desempata por el nombre; si sigue empatado, avisa al dueño.
function maryPago_(st, b) {
  const amount = Math.round(Number(b.amount || 0));
  if (!(amount > 0)) fail('Monto inválido.');
  const ref = String(b.ref || '').replace(/[^A-Za-z0-9._@<>-]/g, '').slice(0, 120);
  const refKey = ref ? Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, BID + '|' + ref)).replace(/=+$/, '') : '';
  if (refKey && fsGet('maryPagos/' + refKey)) return { ok: true, repetido: true };
  const at = b.at ? new Date(b.at).getTime() : Date.now();
  const graceMs = 3 * 3600000;
  // esperando pago, o con foto ya enviada pero sin verificar (se marca verificada por el banco)
  let cands = fsQuery('appointments', [['status', 'EQUAL', 'pending_payment']])
    .concat(fsQuery('appointments', [['status', 'EQUAL', 'pending_verification']]))
    .concat(fsQuery('appointments', [['status', 'EQUAL', 'confirmed']]).filter(function (a) { return (a.payment || {}).status === 'submitted'; }));
  // 🧪 1.1: en modo prueba Mary solo toca citas de tus números de prueba (nunca las de clientes reales)
  const prueba = Array.isArray(b.prueba) ? b.prueba.map(maryLast10_).filter(function (x) { return x.length === 10; }) : null;
  if (prueba) cands = cands.filter(function (a) { return prueba.indexOf(maryLast10_((a.customer || {}).whatsapp)) >= 0; });
  cands = cands.filter(function (a) {
    const created = toMillisSrv(a.createdAt);
    return Number(a.depositCOP || 0) === amount && at >= created - 120000 && at <= created + Math.max(5, Number(st.holdMinutes || 30)) * 60000 + graceMs;
  });
  // 🔎 1.1: el nombre del pagador se compara por PALABRAS COMPLETAS («Ana» ya no coincide con «Juliana»).
  //    Si el banco trae el pagador y no coincide con NINGUNA de las citas posibles, no se confirma sola: decide el dueño.
  const palabras = function (t) { return waNorm(t || '').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; }); };
  const pw = palabras(b.payer);
  if (pw.length && cands.length) {
    const byName = cands.filter(function (a) { const n = palabras(((a.customer || {}).firstName || '') + ' ' + ((a.customer || {}).lastName || '')); return pw.some(function (w) { return n.indexOf(w) >= 0; }); });
    if (!byName.length) {
      tgNotify([], '💳 Llegó un pago de <b>' + cop(amount) + '</b> de <b>' + esc(b.payer) + '</b>, pero ninguna cita con ese valor está a ese nombre:\n' +
        cands.map(function (a) { return '• ' + a.code + ' · ' + esc(((a.customer || {}).firstName || '') + ' ' + ((a.customer || {}).lastName || '')) + ' · ' + hora12(a.startTime); }).join('\n') + '\nSi es de alguno, apruébalo desde el panel.', false, true);
      return fin({ ok: false, motivo: 'nombre_no_coincide' });
    }
    cands = byName;
  }
  const fin = function (res) { if (refKey) commit([wSet('maryPagos/' + refKey, { bid: BID, amount: amount, payer: String(b.payer || '').slice(0, 80), at: new Date(at), result: res.code || res.motivo || '', createdAt: new Date() })]); return res; };
  if (!cands.length) return fin({ ok: false, motivo: 'sin_coincidencia' });
  if (cands.length > 1) {
    tgNotify([], '💳 Llegó un pago de <b>' + cop(amount) + '</b>' + (b.payer ? ' de ' + esc(b.payer) : '') + ' y hay ' + cands.length + ' citas esperando ese valor:\n' +
      cands.map(function (a) { return '• ' + a.code + ' · ' + esc(a.customer.firstName) + ' · ' + hora12(a.startTime); }).join('\n') + '\nAprueba la correcta desde el panel.', false, true);   // aviso del sistema: llega aunque el plan no tenga Telegram
    return fin({ ok: false, motivo: 'varias', codes: cands.map(function (a) { return a.code; }) });
  }
  const code = cands[0].code;
  let apt;
  try {
  apt = withLock(function () {
    const a = getApt(code), now = new Date();
    if (['pending_payment', 'pending_verification', 'confirmed'].indexOf(a.status) < 0) fail('La cita ya no está activa.');
    a.payment = a.payment || {}; a.lockIds = a.lockIds || [];
    const payment = Object.assign({}, a.payment, { status: 'approved', method: a.payment.method || 'bre-b', verifiedBy: 'banco', payer: String(b.payer || '').slice(0, 80), reviewedAt: now, reviewedBy: 'mary (correo del banco)' });
    const writes = [wPatch(bp('appointments/' + a.code), { status: 'confirmed', payment: payment, holdExpiresAt: null, updatedAt: now, maryAvisado: true, history: hist(a, 'payment_bank_verified', 'mary', { amount: amount }) })];
    a.lockIds.forEach(function (id) { writes.push(wPatch(bp('slotLocks/' + id), { state: 'booked', expiresAt: null })); });
    commit(writes);
    a._was = a.status; a.status = 'confirmed'; a.payment = payment;
    return a;
  });
  } catch (err) { return fin({ ok: false, motivo: 'error: ' + String(err.userMessage || err.message).slice(0, 120) }); }   // 1.1: el correo queda anotado y no se reintenta cada minuto
  if (apt._was !== 'confirmed') {
    clientNotify(apt, '✅ <b>Recibimos tu pago. Tu cita quedó confirmada</b>\n' + clientAptText(apt));
    emailClient(apt, 'Tu cita está confirmada', 'Recibimos tu abono y tu cupo quedó confirmado. Presenta tu número de reserva al llegar.');
  }
  if (tgEventOn('proof')) tgNotify([apt.staffId], '⚡ <b>PAGO VERIFICADO CON EL BANCO</b> (Mary)\n' + aptText(apt));
  const co = maryCitaOut_(apt); co.whatsapp = (apt.customer || {}).whatsapp || ''; co.nombre = (apt.customer || {}).firstName || '';
  return fin({ ok: true, code: apt.code, antes: apt._was, cita: co });
}

// ---------- cupos libres (para los estados) ----------
// Un cupo = una hora de inicio (cada "duración del turno") en la que al menos un profesional está libre.
function maryCupos_(st, b) {
  const dias = Math.max(1, Math.min(14, Number(b.dias || 1)));
  const slot = Number(st.slotDurationMinutes || 30);
  const staff = loadStaff().filter(function (s) { return s.active !== false; });
  const now = Date.now() + Number(st.minAdvanceMinutes || 0) * 60000;
  const out = [];
  for (let i = 0; i < dias; i++) {
    const date = toDateStr(new Date(Date.now() + i * 86400000));
    const libres = {};
    let abierto = false;
    if ((st.closedDates || []).indexOf(date) < 0) {
      const taken = {};
      fsQuery('slotLocks', [['date', 'EQUAL', date]]).forEach(function (l) { taken[l.staffId + '_' + l.time] = true; });
      staff.forEach(function (sf) {
        staffHoursFor(st, sf, date).forEach(function (h) {
          abierto = true;
          for (let t = tmin(h.open); t + slot <= tmin(h.close); t += slot) {
            const time = mstr(t);
            if (mkDate(date, time).getTime() < now) continue;
            if (unitTimes(time, slot).some(function (u) { return taken[sf._id + '_' + u]; })) continue;
            libres[time] = true;
          }
        });
      });
    }
    const L = Object.keys(libres).sort();
    out.push({ date: date, dia: waDayLabel(date), dow: dow(date), abierto: abierto, libres: L, horas: L.map(hora12) });
  }
  const info = maryInfo_(st);
  info.dias = out;
  return info;
}

// ---------- recordatorio por WhatsApp ----------
function maryProximas_(st, b) {
  // 3.0: lo decide el dueño en su panel (Ajustes › «Recordatorio al cliente por WhatsApp»). 0 = sin recordatorio.
  const conf = maryBotCfg_(st).recordatorioMin;   // 3.1: panel › WhatsApp Bot › Recordatorio (0 = sin recordatorio)
  if (!maryBotCfg_(st).activo) return { citas: [], dobles: [], info: Object.assign(maryInfo_(st), { recordatorioMin: 0 }) };
  if (!conf) { const h0 = toDateStr(new Date()), m0 = toDateStr(new Date(Date.now() + 86400000)); return { citas: [], dobles: maryDobles_(fsQuery('appointments', [['date', 'EQUAL', h0]]).concat(fsQuery('appointments', [['date', 'EQUAL', m0]]))), info: Object.assign(maryInfo_(st), { recordatorioMin: 0 }) }; }
  const min = Math.max(10, Math.min(24 * 60, Number(conf)));
  const now = Date.now(), hoy = toDateStr(new Date()), man = toDateStr(new Date(now + 86400000));
  let L = fsQuery('appointments', [['date', 'EQUAL', hoy]]).concat(hoy === man ? [] : fsQuery('appointments', [['date', 'EQUAL', man]]));
  const dobles = maryDobles_(L);   // 3.14: el mismo cliente con 2 citas que se cruzan (el mismo día a la misma hora)
  L = L.filter(function (a) {
    if (a.status !== 'confirmed' || a.maryReminded) return false;
    const m = (a.startAt.getTime() - now) / 60000;
    return m > 0 && m <= min && maryLast10_((a.customer || {}).whatsapp).length === 10;
  });
  return { citas: L.map(function (a) { const o = maryCitaOut_(a); o.whatsapp = (a.customer || {}).whatsapp || ''; o.nombre = (a.customer || {}).firstName || ''; return o; }), dobles: dobles, info: Object.assign(maryInfo_(st), { recordatorioMin: min }) };
}
// 3.14 · citas que se cruzan del mismo WhatsApp (aún no se le preguntó): [{ whatsapp, nombre, citas: [...] }]
function maryDobles_(L) {
  const por = {};
  L.filter(function (a) { return ACTIVE.indexOf(a.status) >= 0 && maryLast10_((a.customer || {}).whatsapp).length === 10 && a.startAt && a.startAt.getTime() > Date.now(); })
    .forEach(function (a) { const k = maryLast10_(a.customer.whatsapp); (por[k] = por[k] || []).push(a); });
  const out = [];
  Object.keys(por).forEach(function (k) {
    const C = por[k].sort(function (x, y) { return x.startAt.getTime() - y.startAt.getTime(); });
    const cruce = C.filter(function (a, i) { return C.some(function (b, j) { return j !== i && a.date === b.date && tmin(a.startTime) < tmin(b.endTime || b.startTime) + 0 && tmin(b.startTime) < tmin(a.endTime || a.startTime); }); });
    if (cruce.length >= 2 && cruce.some(function (a) { return !a.maryDobleAvisado; }))
      out.push({ whatsapp: cruce[0].customer.whatsapp, nombre: cruce[0].customer.firstName || '', citas: cruce.map(maryCitaOut_) });
  });
  return out;
}
function maryDobleAvisado_(b) {
  commit((b.codes || []).slice(0, 10).map(function (c) { return wPatch(bp('appointments/' + String(c).toUpperCase()), { maryDobleAvisado: true }); }));
  return { ok: true };
}
function maryRecordada_(b) {
  const a = getApt(b.code);
  commit([wPatch(bp('appointments/' + a.code), { maryReminded: true })]);
  return { ok: true };
}

// =====================================================================
//  3.0 · AGENDAR POR WHATSAPP CON LISTAS (categorías → servicios → días → horas → profesional → confirmar)
//  Usa las MISMAS reglas que la página: horario, profesionales, bloqueos de 15 min, anticipación, ventana de días y abono del dueño.
//  Diferencia: se pueden juntar varios servicios principales en una cita (corte + barba + cejas): se suman tiempo y precio.
// =====================================================================
function maryServicios_() {
  return loadServices().filter(function (s) { return s.active !== false; })
    .sort(function (a, b) { return (a.order || 99) - (b.order || 99) || String(a.name).localeCompare(String(b.name)); });
}
// 3.4: si el dueño no le puso categoría a un servicio, se le sugiere una por su nombre (misma regla que el panel: categoriaAuto)
function maryCatAuto_(nombre) {
  const n = String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\+|\bcombo\b|\by\b.*\b(barba|ceja|corte)/.test(n)) return 'Combos';
  if (/barba/.test(n)) return 'Barba';
  if (/ceja/.test(n)) return 'Cejas';
  if (/pestan|lifting/.test(n)) return 'Pestañas';
  if (/disen|linea|tatuaje capilar/.test(n)) return 'Diseños';
  if (/una|manicur|pedicur|semiperman|acril|gel|esmalt|press on/.test(n)) return 'Uñas';
  if (/masaj|facial|limpieza|spa|depil|cera/.test(n)) return 'Spa';
  if (/tinte|color|mechas|balayage|keratin|alisad|cepillad|peinad|tratamiento|ondul/.test(n)) return 'Cabello';
  if (/corte|tijera|degrad|fade|motil|rapad|cabello|pelo|nino/.test(n)) return 'Cortes';
  return 'Otros';
}
function maryCatalogo_(st) {
  const cats = {}, orden = [];
  maryServicios_().forEach(function (s) {
    const c = String(s.category || '').trim() || maryCatAuto_(s.name);
    if (!cats[c]) { cats[c] = []; orden.push(c); }
    cats[c].push({ id: s._id, nombre: s.name, precio: Number(s.priceCOP || 0), min: Number(s.minutes || 0), tipo: s.type || '' });
  });
  const staff = loadStaff().filter(function (x) { return x.active !== false; }).map(function (x) { return { id: x._id, nombre: x.name, servicios: x.serviceIds || [] }; });
  const out = maryInfo_(st);
  out.categorias = orden.map(function (c) { return { nombre: c, desde: Math.min.apply(null, cats[c].map(function (x) { return x.precio; })), servicios: cats[c] }; });
  out.staff = staff; out.staffLabel = st.staffLabel || 'Profesional';
  out.abono = Number(st.depositAmountCOP || 0);
  return out;
}
function maryCompute_(ids) {
  const by = {}; maryServicios_().forEach(function (s) { by[s._id] = s; });
  const items = [];
  (ids || []).forEach(function (id) { const s = by[id]; if (s && items.indexOf(s) < 0) items.push(s); });
  if (!items.length) fail('Elige un servicio válido.');
  return {
    items: items.map(function (s) { return { id: s._id, name: s.name, type: s.type, priceCOP: Number(s.priceCOP || 0), minutes: Number(s.minutes || 0) }; }),
    totalMinutes: items.reduce(function (a, s) { return a + Number(s.minutes || 0); }, 0),
    totalCOP: items.reduce(function (a, s) { return a + Number(s.priceCOP || 0); }, 0)
  };
}
function maryStaffPara_(ids) {
  return loadStaff().filter(function (x) { return x.active !== false && (!x.serviceIds || !x.serviceIds.length || (ids || []).every(function (id) { return x.serviceIds.indexOf(id) >= 0; })); });
}
// Horas libres de un día para esos servicios juntos: [{ time, staffIds }]
function maryLibres_(st, date, ids, staffId, locks, pre) {
  const sel = (pre && pre.sel) || maryCompute_(ids);
  const slot = Number(st.slotDurationMinutes || 30), occ = occupiedFor(sel.totalMinutes, slot);
  if ((st.closedDates || []).indexOf(date) >= 0) return [];
  // 3.28: si nadie atiende ese día no se consulta la base (antes 1 consulta por día aunque estuviera cerrado)
  const quienes = ((pre && pre.staff) || maryStaffPara_(ids)).filter(function (x) { return (!staffId || x._id === staffId) && staffHoursFor(st, x, date).length; });
  if (!quienes.length) return [];
  const taken = {}; (locks || fsQuery('slotLocks', [['date', 'EQUAL', date]])).forEach(function (l) { if (l.date === date) taken[l.staffId + '_' + l.time] = true; });
  const now = Date.now() + Number(st.minAdvanceMinutes || 0) * 60000, out = {};
  quienes.forEach(function (sf) {
    staffHoursFor(st, sf, date).forEach(function (h) {
      for (let t = tmin(h.open); t + occ <= tmin(h.close); t += slot) {
        const time = mstr(t);
        if (mkDate(date, time).getTime() < now) continue;
        if (unitTimes(time, occ).some(function (u) { return taken[sf._id + '_' + u]; })) continue;
        (out[time] = out[time] || []).push(sf._id);
      }
    });
  });
  return Object.keys(out).sort().map(function (k) { return { time: k, staffIds: out[k] }; });
}
function maryVentana_(st) { return Math.min(Number(plansCfg()[bizPlan()].daysAhead || 30), Number(st.bookingWindowDays || 30), 21); }
function maryDias_(st, b) {
  // 3.28: los servicios y el equipo se leen UNA vez (antes se leían de nuevo por cada día: con 21 días tardaba tanto que el bot se quedaba mudo)
  const win = maryVentana_(st), dias = [], pre = { sel: maryCompute_(b.ids), staff: maryStaffPara_(b.ids) }, t0 = Date.now();
  for (let i = 0; i <= win && dias.length < 10 && (Date.now() - t0 < 20000 || !dias.length); i++) {
    const date = toDateStr(new Date(Date.now() + i * 86400000));
    const n = maryLibres_(st, date, b.ids, b.staffId, null, pre).length;
    if (n) dias.push({ date: date, dia: waDayLabel(date), n: n });
  }
  return { dias: dias, link: maryLinkAgenda_() };
}
function maryHoras_(st, b) {
  const L = maryLibres_(st, String(b.date || ''), b.ids, b.staffId);
  const nombres = {}; loadStaff().forEach(function (x) { nombres[x._id] = x.name; });
  return { date: b.date, dia: waDayLabel(String(b.date || '')), horas: L.map(function (x) { return { time: x.time, hora: hora12(x.time), staff: x.staffIds.map(function (id) { return { id: id, nombre: nombres[id] || '' }; }) }; }), link: maryLinkAgenda_() };
}
function maryCrear_(st, b) {
  try {
    if (BIZ.status !== 'active') return { ok: false, motivo: 'La agenda no está recibiendo citas en este momento.' };
    const phone = String(b.phone || '').replace(/\D/g, '');
    if (maryLast10_(phone).length < 10) return { ok: false, motivo: 'número inválido' };
    if (maryCitasDe_(phone).filter(function (a) { return a.status === 'pending_payment'; }).length >= 2) return { ok: false, motivo: 'Tienes 2 citas esperando pago. Paga o cancela una antes de apartar otra.' };
    const sel = maryCompute_(b.ids), slot = Number(st.slotDurationMinutes || 30), occ = occupiedFor(sel.totalMinutes, slot);
    const libres = maryLibres_(st, b.date, b.ids, b.staffId).filter(function (x) { return x.time === b.time; })[0];
    if (!libres) return { ok: false, motivo: 'ocupada' };
    const staffId = b.staffId && libres.staffIds.indexOf(b.staffId) >= 0 ? b.staffId : libres.staffIds[0];
    const staff = loadStaff().filter(function (x) { return x._id === staffId; })[0];
    checkSlot(st, b.date, b.time, occ, true, staff);
    const deposit = Math.min(Number(st.depositAmountCOP || 0), sel.totalCOP);   // el abono que configuró el dueño (0 = sin abono)
    const nombre = String(b.nombre || '').trim().slice(0, 60) || 'Cliente', email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.email || '')) ? String(b.email).trim().toLowerCase() : '';
    const apt = withLock(function () {
      const r = reserveLocks(staff._id, b.date, b.time, occ, {});
      const code = newCode(), now = new Date(), confirmedNow = deposit === 0;
      const holdExp = confirmedNow ? null : new Date(now.getTime() + Math.max(10, Number(st.holdMinutes || 30)) * 60000);
      const a = {
        code: code, customerUid: null,
        customer: { firstName: nombre.split(/\s+/)[0], lastName: nombre.split(/\s+/).slice(1).join(' '), whatsapp: phone, email: email },
        staffId: staff._id, staffName: staff.name, items: sel.items, totalCOP: sel.totalCOP, totalMinutes: sel.totalMinutes,
        occupiedMinutes: occ, depositCOP: deposit, balanceDueCOP: sel.totalCOP - deposit,
        date: b.date, startTime: b.time, endTime: mstr(tmin(b.time) + occ), startAt: mkDate(b.date, b.time), lockIds: r.all,
        status: confirmedNow ? 'confirmed' : 'pending_payment',
        payment: { mode: 'deposit', method: '', amountCOP: deposit, status: confirmedNow ? 'none' : 'awaiting', proofFileId: '', proofUrl: '', reference: '' },
        holdExpiresAt: holdExp, rescheduleCount: 0, history: [{ action: 'created_whatsapp', at: now.toISOString(), by: 'asistente' }],
        source: 'whatsapp', waChannel: 'asistente', waChat: waChatId(phone), waToken: randKey(20), createdAt: now, updatedAt: now, reminderSent: false
      };
      commit([wCreate(bp('appointments/' + code), a)].concat(lockWrites(r, staff._id, b.date, confirmedNow ? 'booked' : 'hold', code, holdExp)).concat(incWrites(addDelta({}, b.date, staff._id, r.create.length))));
      return a;
    });
    try { if (tgEventOn('newBooking')) tgNotify([apt.staffId], '💬 <b>NUEVA CITA POR WHATSAPP</b> (asistente)' + (apt.status === 'pending_payment' ? ' · esperando abono' : '') + '\n' + aptText(apt)); } catch (e) { console.error(e); }
    if (apt.customer.email) emailClient(apt, apt.status === 'confirmed' ? 'Tu cita está confirmada' : 'Apartamos tu cupo', apt.status === 'confirmed' ? 'Agendamos tu cita. Presenta tu número de reserva al llegar.' : 'Apartamos tu cupo. Envía el abono para confirmarlo.');
    maryGuardarCliente_(nombre, phone, email);   // 3.1: queda en Clientes del panel
    return { ok: true, cita: maryCitaOut_(apt), medios: maryMedios_(st), holdMinutes: Math.max(10, Number(st.holdMinutes || 30)) };
  } catch (e) {
    const m = String((e && (e.userMessage || e.message)) || e);
    return { ok: false, motivo: /tomado|ya no está disponible|fuera del horario|no alcanza/i.test(m) ? 'ocupada' : m };
  }
}

// =====================================================================
//  3.7 · CITA RÁPIDA SIN WHATSAPP (para pasar las citas de antes): basta el nombre. Sin WhatsApp no se manda nada
//  (ni confirmación ni recordatorio). Con WhatsApp sigue funcionando EXACTAMENTE como siempre (la función original).
// =====================================================================
try {
  const maryCitaManualOriginal_ = ACTIONS.createManualAppointment;
  ACTIONS.createManualAppointment = function (b, auth) {
    const tel = String(((b || {}).customer || {}).whatsapp || '').replace(/\D/g, '');
    if (tel.length >= 10) return maryCitaManualOriginal_(b, auth);
    return maryCitaManualSinWa_(b, auth);
  };
} catch (e) { console.error('Mary: el archivo "mary" quedó ANTES del principal.'); }
function maryCitaManualSinWa_(b, auth) {
  const admin = getAdmin(auth);
  if (admin.role !== 'owner' && b.staffId !== admin.staffId) fail('Solo puedes agendar citas en tu propia agenda.');
  const c = b.customer || {}, nombre = String(c.firstName || '').trim();
  if (nombre.length < 2) fail('Escribe el nombre o el WhatsApp del cliente.');
  const st = loadSettings();
  const sel = computeItems(loadServices(), b.mainId, b.extraIds);
  const occ = occupiedFor(sel.totalMinutes, Number(st.slotDurationMinutes || 30));
  const staff = loadStaff().filter(function (s) { return s._id === b.staffId; })[0];
  if (!staff) fail('Profesional no válido.');
  checkSlot(st, b.date, b.time, occ, false, staff);
  const paid = b.paymentMethod === 'local' ? 0 : Math.max(0, Math.min(Number(b.depositPaidCOP || 0), sel.totalCOP));
  const apt = withLock(function () {
    const r = reserveLocks(staff._id, b.date, b.time, occ, { allowBreak: !!b.force });
    const code = newCode(), now = new Date();
    const a = {
      code: code, customerUid: null,
      customer: { firstName: nombre, lastName: String(c.lastName || '').trim(), whatsapp: '', email: String(c.email || '').trim() },
      staffId: staff._id, staffName: staff.name, items: sel.items, totalCOP: sel.totalCOP, totalMinutes: sel.totalMinutes,
      occupiedMinutes: occ, depositCOP: paid, balanceDueCOP: sel.totalCOP - paid,
      date: b.date, startTime: b.time, endTime: mstr(tmin(b.time) + occ), startAt: mkDate(b.date, b.time), lockIds: r.all,
      status: 'confirmed',
      payment: { mode: 'manual', method: b.paymentMethod || 'local', amountCOP: paid, status: paid > 0 ? 'approved' : 'none', proofFileId: '', proofUrl: '', reference: '' },
      holdExpiresAt: null, rescheduleCount: 0, history: [{ action: 'created_manual', at: now.toISOString(), by: auth.uid, sinWhatsapp: true }],
      source: 'manual', createdBy: auth.uid, createdAt: now, updatedAt: now, reminderSent: false
    };
    commit([wCreate(bp('appointments/' + code), a)].concat(lockWrites(r, staff._id, b.date, 'booked', code, null)).concat(incWrites(addDelta({}, b.date, staff._id, r.create.length))));
    return a;
  });
  try { if (tgEventOn('panelApt')) tgNotify([apt.staffId], '📝 <b>CITA AGENDADA DESDE EL PANEL</b> (sin WhatsApp)\n' + aptText(apt)); } catch (e) { console.error(e); }
  if (apt.customer.email) emailClient(apt, 'Tu cita está confirmada', 'Agendamos tu cita. Presenta tu número de reserva al llegar.');
  return { appointment: aptPublic(apt) };
}

// =====================================================================
//  3.20 · 🔒 BLOQUEAR CUPOS desde el panel: el dueño toca una hora y nadie la ve (página, asistente, estados).
//  Son bloqueos de 15 min (state 'block') para TODO el equipo (o un profesional), con la hora del cupo en «bloqueo».
//  Las citas que ya estén en esa hora NO se tocan. Desbloquear borra solo los bloqueos de ese cupo.
// =====================================================================
try { ACTIONS.bloquearCupo = maryBloquearCupo_; } catch (e) { console.error('Mary: el archivo "mary" quedó ANTES del principal.'); }
function maryBloquearCupo_(b, auth) {
  const admin = getAdmin(auth);
  const st = loadSettings(), date = String(b.date || ''), slot = Number(st.slotDurationMinutes || 30);
  const horas = (Array.isArray(b.times) ? b.times : [b.time]).map(String).filter(function (t) { return /^\d{2}:\d{2}$/.test(t); }).slice(0, 96);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !horas.length) fail('Fecha u hora inválida.');
  if (date < toDateStr(new Date())) fail('No se pueden bloquear días que ya pasaron.');
  let staff = loadStaff().filter(function (x) { return x.active !== false; });
  if (admin.role !== 'owner') staff = staff.filter(function (x) { return x._id === admin.staffId; });   // un profesional solo bloquea lo suyo
  else if (b.staffId) staff = staff.filter(function (x) { return x._id === b.staffId; });
  if (!staff.length) fail('No hay a quién bloquear.');
  const ids = function (x, time) { return unitTimes(time, slot).map(function (t) { return { id: lockId(x._id, date, t), t: t }; }); };
  return withLock(function () {
    if (b.accion === 'desbloquear') {
      const L = fsQuery('slotLocks', [['date', 'EQUAL', date]]).filter(function (l) { return l.state === 'block' && horas.indexOf(l.bloqueo) >= 0 && staff.some(function (x) { return x._id === l.staffId; }); });
      const delta = {}; L.forEach(function (l) { addDelta(delta, date, l.staffId, -1); });
      if (L.length) commit(L.map(function (l) { return wDelete(bp('slotLocks/' + l._id)); }).concat(incWrites(delta)));
      return { ok: true, liberados: L.length };
    }
    let n = 0; const w = [], delta = {};
    const vistos = {};
    horas.forEach(function (time) {
      staff.forEach(function (x) {
        const U = ids(x, time).filter(function (u) { return !vistos[u.id]; }), got = fsBatchGet(U.map(function (u) { return bp('slotLocks/' + u.id); }));
        U.forEach(function (u) {
          vistos[u.id] = true;
          if (got[bp('slotLocks/' + u.id)]) return;   // ya ocupado (cita, descanso u otro bloqueo): se deja como está
          w.push(wCreate(bp('slotLocks/' + u.id), { staffId: x._id, date: date, time: u.t, state: 'block', appointmentId: null, breakId: null, expiresAt: null, bloqueo: time, by: auth.uid }));
          addDelta(delta, date, x._id, 1); n++;
        });
      });
    });
    if (w.length) commit(w.concat(incWrites(delta)));
    return { ok: true, bloqueados: n };
  });
}

// =====================================================================
//  CONECTAR EL WHATSAPP DESDE EL PANEL (sin abrir el VPS a internet)
//  Panel (dueño) → maryWa {op:'conectar', numero}  → queda un pedido aquí (caché + aviso en platform/public.maryWaPend)
//  VPS (cada 5 s lee platform/public) → mary {op:'waPedido'} → crea la conexión en SU Evolution → mary {op:'waResultado', codigo, qr}
//  Panel pregunta maryWa {op:'estado'} cada 3 s y muestra el código de 8 letras (o el QR). Al vincular, el VPS avisa 'conectado'.
// =====================================================================
try { ACTIONS.maryWa = maryWaPanel; } catch (e) { console.error('Mary: el archivo "mary" quedó ANTES del principal.'); }

function maryWaPanel(b, auth) {
  const admin = getAdmin(auth);
  if (admin.role !== 'owner') fail('Solo el dueño puede conectar el WhatsApp.');
  const ca = CacheService.getScriptCache(), op = String(b.op || '');
  if (op === 'estado') {
    let r = null; try { r = JSON.parse(ca.get('mwa_res_' + BID) || 'null'); } catch (e) { r = null; }
    const st = loadSettings();
    return { res: r, wa: st.maryWa || null };
  }
  if (!planHas('whatsapp')) fail('🔒 La atención por WhatsApp no viene en tu plan.');
  if (op === 'conectar') {
    if ((loadSettings().maryWa || {}).conectado) fail('Ya tienes un WhatsApp vinculado. Desvincúlalo primero para vincular otro.');   // 3.1: uno por negocio
    let num = String(b.numero || '').replace(/\D/g, '');
    if (num.length === 10 && /^3/.test(num)) num = '57' + num;
    if (num.length < 11 || num.length > 15) fail('Escribe el número de WhatsApp del negocio con el indicativo del país (ej. 57 300 123 4567).');
    maryWaPedir_({ accion: 'conectar', numero: num });
    ca.put('mwa_res_' + BID, JSON.stringify({ estado: 'pidiendo', t: Date.now() }), 600);
    return { ok: true };
  }
  if (op === 'desconectar') {
    maryWaPedir_({ accion: 'desconectar' });
    ca.put('mwa_res_' + BID, JSON.stringify({ estado: 'desconectando', t: Date.now() }), 600);
    return { ok: true };
  }
  fail('Operación no válida.');
}
function maryWaPedir_(p) {
  p.t = Date.now();
  CacheService.getScriptCache().put('mwa_req_' + BID, JSON.stringify(p), 900);
  PropertiesService.getScriptProperties().setProperty('mwa_req_' + BID, JSON.stringify(p));   // por si la caché se borra
  // aviso liviano y público para el VPS: solo «este negocio tiene un pedido» (sin números ni datos)
  commit([{ update: { name: docName('platform/public'), fields: encFields({ maryWaPend: (function () { const o = {}; o[BID] = p.t; return o; })() }) }, updateMask: { fieldPaths: [fp(['maryWaPend', BID])] } }]);
}
// ---- lado del VPS (clave de Mary) ----
function maryWaPedido_() {
  const ca = CacheService.getScriptCache();
  let p = null; try { p = JSON.parse(ca.get('mwa_req_' + BID) || PropertiesService.getScriptProperties().getProperty('mwa_req_' + BID) || 'null'); } catch (e) { p = null; }
  if (p && Date.now() - p.t > 15 * 60000) p = null;
  return { pedido: p, negocio: (loadSettings().businessName || BIZ.name || '') };
}
function maryWaResultado_(b) {
  const ca = CacheService.getScriptCache(), estado = String(b.estado || '');
  const r = { estado: estado, codigo: String(b.codigo || '').slice(0, 20), qr: String(b.qr || '').slice(0, 20000), numero: String(b.numero || '').replace(/\D/g, ''), error: String(b.error || '').slice(0, 200), vence: Number(b.vence) || 0, t: Date.now() };
  ca.put('mwa_res_' + BID, JSON.stringify(r), 900);
  const fin = ['codigo', 'conectado', 'desconectado', 'error', 'vencido'].indexOf(estado) >= 0;
  // 3.30: «✅ WhatsApp vinculado» SOLO si de verdad cambió (antes salía en cada reinicio del VPS y los dueños creían que los hackeaban)
  const antes = estado === 'conectado' ? (loadSettings().maryWa || {}) : {};
  const nuevo = estado === 'conectado' && !(antes.conectado && String(antes.numero || '') === r.numero);
  const w = [];
  if (fin) {   // el pedido ya se atendió: se quita (el VPS deja de revisarlo)
    ca.remove('mwa_req_' + BID); PropertiesService.getScriptProperties().deleteProperty('mwa_req_' + BID);
    w.push({ update: { name: docName('platform/public'), fields: {} }, updateMask: { fieldPaths: [fp(['maryWaPend', BID])] } });
  }
  if (nuevo) w.push(wPatch(bp('settings/general'), { maryWa: { conectado: true, numero: r.numero, at: new Date() } }));
  if (estado === 'desconectado') w.push(wPatch(bp('settings/general'), { maryWa: { conectado: false, numero: '', at: new Date() } }));
  if (w.length) commit(w);
  if (nuevo) tgSys('✅ <b>WhatsApp vinculado</b>\nTu asistente ya atiende en +' + esc(r.numero) + '.');
  return { ok: true };
}
