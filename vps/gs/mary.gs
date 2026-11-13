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
const MARY_VERSION = 'agendador-ia-3.56';

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
    case 'volver': return maryVolver_(st, b);           // 3.32 · recordatorio de servicio
    case 'volverAvisado': return maryVolverAvisado_(b);
    case 'citaCodigo': { const ac = maryCitaDelNumero_({ code: b.code, phone: b.phone, conCodigo: true }); return ac && ACTIVE.indexOf(ac.status) >= 0 ? { ok: true, cita: maryCitaOut_(ac) } : { ok: false }; }   // 3.53 · el cliente escribió su número de reserva
    case 'reconocer': return maryReconocer_(b);         // 3.52 · el cliente dio su correo: ¿está en los clientes del negocio?
    case 'guardarContacto': return maryGuardarContacto_(b);   // 3.52 · guardado inteligente (si el dueño lo activó)
    case 'historia': return maryHistoria_(b);           // 3.51 · el estado que publicó el bot también va a los estados de la página
    case 'avisos': return maryAvisos_();
    case 'pushBaja': return maryPushBaja_(b);           // 3.55 · suscripción que ya no existe
    case 'pushLlave': return maryPushLlave_(b);         // 3.55 · la llave pública de notificaciones del VPS                // 3.47 · avisos al dueño por WhatsApp (el VPS los recoge solo cuando hay)
    case 'revisarPago': return maryRevisarPago_(b);     // 3.47 · el dueño respondió 1 (aprobar) o 2 (rechazar) por WhatsApp
    case 'estadisticas': return maryEstadisticas_(b);   // 3.37 · reporte del bot (el VPS lo manda una vez por hora)
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
  // 3.52: también las citas del CLIENTE que hoy tiene ese número en «Clientes» (aunque la cita se haya creado con el número mal escrito)
  const uids = {}; maryClientesPorNumero_(phone).forEach(function (c) { uids[c._id] = true; });
  return all.filter(function (a) { return (maryLast10_((a.customer || {}).whatsapp) === d10 || (a.customerUid && uids[a.customerUid])) && a.startAt && a.startAt.getTime() >= desde; })
    .sort(function (x, y) { return x.startAt.getTime() - y.startAt.getTime(); });
}
// 3.52 · clientes del negocio que tienen ese WhatsApp (registrados en la página o guardados por el bot). Cada uno trae su id en _id.
function maryClientesPorNumero_(phone) {
  const d10 = maryLast10_(phone), out = [], vistos = {}; if (d10.length < 10) return out;
  const meter = function (id, c) { if (c && !vistos[id]) { vistos[id] = true; out.push(Object.assign({ _id: id }, c)); } };
  try {
    meter('wa' + d10, fsGet(bp('customers/wa' + d10)));
    fsQuery('customers', [['whatsapp', 'IN', ['+57' + d10, '57' + d10, d10]]]).forEach(function (c) { meter(String(c._id || ''), c); });   // una sola consulta para las 3 formas de escribirlo
  } catch (e) { console.error('clientes por número: ' + e); }
  return out.filter(function (c) { return c._id; });
}
// 3.52 · si una cita pendiente del cliente quedó con otro WhatsApp (se escribió mal al registrarse), se corrige: así el recordatorio le llega al número bueno
function maryCorregirWa_(citas, phone) {
  const d10 = maryLast10_(phone), tel = String(phone || '').replace(/\D/g, ''), w = [];
  citas.forEach(function (a) { if (maryLast10_((a.customer || {}).whatsapp) !== d10) w.push(wPatch(bp('appointments/' + a.code), { customer: Object.assign({}, a.customer || {}, { whatsapp: '+' + (tel.length === 10 ? '57' + tel : tel) }), updatedAt: new Date() })); });
  if (w.length) { try { commit(w); } catch (e) { console.error('corregir WhatsApp: ' + e); } }
  return w.length;
}
// 3.52 · el cliente escribió su CORREO: se busca en los clientes del negocio. Si está, se le reconoce y su WhatsApp queda al día (en su ficha y en sus citas pendientes).
function maryReconocer_(b) {
  const email = String(b.email || '').trim().toLowerCase(), tel = String(b.phone || '').replace(/\D/g, '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || maryLast10_(tel).length < 10) return { ok: false };
  let L = []; try { L = fsQuery('customers', [['email', 'EQUAL', email]]); } catch (e) { L = []; }
  const c = L.filter(function (x) { return !x.blocked; })[0]; if (!c) return { ok: false };
  const id = String(c._id || c.id || c.uid || ''), wa = '+' + (tel.length === 10 ? '57' + tel : tel);
  const w = [];
  if (id && maryLast10_(c.whatsapp) !== maryLast10_(tel)) w.push(wPatch(bp('customers/' + id), { whatsapp: wa, updatedAt: new Date() }));
  let citas = [];
  try {
    ACTIVE.forEach(function (s) { citas = citas.concat(fsQuery('appointments', [['status', 'EQUAL', s]])); });
    citas = citas.filter(function (a) { return a.startAt && a.startAt.getTime() >= Date.now() - 2 * 3600000 && ((id && a.customerUid === id) || String((a.customer || {}).email || '').toLowerCase() === email); });
  } catch (e) { citas = []; }
  if (w.length) { try { commit(w); } catch (e) { console.error('reconocer: ' + e); } }
  maryCorregirWa_(citas, tel);
  const nombre = String(c.firstName || '').trim() !== 'Cliente' ? String((c.firstName || '') + ' ' + (c.lastName || '')).trim().split(/\s+/).slice(0, 2).join(' ') : '';
  return { ok: true, nombre: nombre, citas: citas.sort(function (x, y) { return x.startAt.getTime() - y.startAt.getTime(); }).map(maryCitaOut_) };
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
    holdMinutes: Math.max(5, Number(st.holdMinutes || 30)), bot: maryBotCfg_(st),
    marca: !((BIZ.addons || {}).sinMarca), prueba: !!BIZ.trial   // 3.38: marca de agua (salvo el adicional) · prueba gratis
  };
}
// 3.1 · «💬 WhatsApp Bot» del panel del dueño (settings.maryBot). Todo tiene un valor por defecto.
function maryBotCfg_(st) {
  const b = st.maryBot || {}, e = b.estados || {};
  const d = function (v, x) { return v === undefined || v === null || v === '' ? x : v; };
  let horas = (Array.isArray(e.horas) ? e.horas : ['11:00']).filter(function (h) { return /^\d{2}:\d{2}$/.test(String(h)); }).slice(0, 2);   // máximo 2 estados al día
  if (!horas.length) horas = ['11:00'];
  const c = {
    activo: d(b.activo, true) !== false, agendar: d(b.agendar, true) !== false, cupos: d(b.cupos, true) !== false, audios: d(b.audios, true) !== false,
    saludoDiario: d(b.saludoDiario, true) !== false, pedirNombre: d(b.pedirNombre, true) !== false, pedirCorreo: d(b.pedirCorreo, true) !== false,
    loDeSiempre: d(b.loDeSiempre, true) !== false, recordatorioMin: Math.max(0, Number(d(b.recordatorioMin, d(st.maryReminderMinutes, 120)))),
    recordatorioConfirmar: d(b.recordatorioConfirmar, true) !== false, cambios: d(b.cambios, true) !== false, pausaMin: Math.max(5, Number(d(b.pausaMin, 30))),
    estados: { activo: d(e.activo, true) !== false, horas: horas, manana: d(e.manana, true) !== false, semanal: d(e.semanal, false) === true, todos: d(e.todos, true) !== false, pagina: d(e.pagina, true) !== false },
    guardado: b.guardado === true,   // 3.52: guardado inteligente de contactos (lo activa el dueño; apagado por defecto)
    volver: { activo: (b.volver || {}).activo === true, dias: Math.max(0, Math.min(60, Number((b.volver || {}).dias || 0))) },   // 3.32: lo elige el dueño (0 = no elegido: no sale)
    guia: { activo: (b.guia || {}).activo !== false, hora: /^\d{2}:\d{2}$/.test(String((b.guia || {}).hora || '')) ? b.guia.hora : '08:00', cadaDias: Math.max(1, Math.min(30, Number((b.guia || {}).cadaDias || 3))) }   // 3.43: estado «Cómo agendar»
  };
  c.avisos = maryAvisosCfg_(st);   // 3.47: avisos al WhatsApp personal del dueño
  // 🤖 3.45 · lo que el superusuario apagó para TODAS las tiendas manda (platform/public.botOff)
  let off = []; try { off = (typeof platformPublic === 'function' ? platformPublic().botOff : null) || []; } catch (e) { off = []; }
  off.forEach(function (k) {
    if (k === 'recordatorio') c.recordatorioMin = 0;
    else if (k === 'estados') c.estados.activo = false;
    else if (k === 'guia') c.guia.activo = false;
    else if (k === 'volver') c.volver.activo = false;
    else if (k === 'avisosWa') c.avisos.activo = false;
    else if (typeof c[k] === 'boolean') c[k] = false;
  });
  return c;
}
// 3.1 · el cliente queda en los CLIENTES del negocio (panel › Clientes) con su nombre, WhatsApp y correo
function maryGuardarCliente_(nombre, phone, email) {
  const d10 = maryLast10_(phone); if (d10.length < 10) return;
  try {
    const id = 'wa' + d10, path = bp('customers/' + id), ya = fsGet(path);
    const n = String(nombre || '').trim().split(/\s+/);
    const datos = { whatsapp: String(phone || '').replace(/\D/g, ''), source: ya && ya.source ? ya.source : 'whatsapp', updatedAt: new Date(), prospecto: false };   // 3.52: ya agendó: deja de ser «solo escribió»
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
  if (!a) return null;
  // 3.53: la cita es suya si (1) tiene su WhatsApp, (2) es del cliente que HOY tiene ese WhatsApp en «Clientes», o (3) él mismo escribió el número de reserva (solo lo tiene quien apartó)
  const suya = maryLast10_((a.customer || {}).whatsapp) === maryLast10_(b.phone) || b.conCodigo === true
    || (a.customerUid && maryClientesPorNumero_(b.phone).some(function (c) { return c._id === a.customerUid; }));
  if (!suya) return null;
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
  // 3.53: falta poco para la cita → SÍ se puede cancelar, pero diciendo el motivo (le llega al negocio). El dueño lo puede apagar (lateCancel: false).
  const tarde = !esDoble && a0.status !== 'pending_payment' && a0.startAt.getTime() - Date.now() < minH * 3600000;
  const motivoCli = String(b.motivo || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (tarde && st.lateCancel !== false && motivoCli.length < 3) return { ok: false, tarde: true, motivo: 'Falta poco para tu cita. Cuéntame el motivo y la cancelo.' };
  if (tarde && st.lateCancel === false) return { ok: false, motivo: 'Solo se puede cancelar con al menos ' + minH + ' horas de anticipación. Escríbele directamente al negocio.' };
  const apt = withLock(function () {
    const a = maryCitaDelNumero_(b);
    if (!a || ACTIVE.indexOf(a.status) < 0) fail('Esta reserva ya no está activa.');
    commit([wPatch(bp('appointments/' + a.code), { status: 'cancelled', cancelReason: 'Cancelada por el cliente (WhatsApp)' + (motivoCli ? ': ' + motivoCli : ''), lateCancel: tarde, updatedAt: new Date(), holdExpiresAt: null, history: hist(a, 'cancelled', 'whatsapp', { reason: 'whatsapp' }) })].concat(freeLockWrites(a)));
    a.status = 'cancelled';
    return a;
  });
  try { if (tgEventOn('cancel')) tgNotify([apt.staffId], '🚫 <b>CITA CANCELADA</b> por el cliente (WhatsApp)' + (tarde ? ' ⚠️ faltando poco' : '') + '\n' + aptText(apt) + (motivoCli ? '\nMotivo: ' + esc(motivoCli) : '') + '\nEl cupo quedó libre.'); } catch (e) { console.error(e); }
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
  const B = {};   // 3.51: los bloqueados también se le dicen al VPS, para sacarlos de las otras fuentes (chats y libreta)
  fsListAll(bp('customers')).forEach(function (c) { const n = String(c.whatsapp || '').replace(/\D/g, ''); if (n.length < 10) return; const t = n.length === 10 ? '57' + n : n; if (c.blocked) B[t] = true; else L[t] = true; });
  return { numeros: Object.keys(L).slice(0, 3000), bloqueados: Object.keys(B).slice(0, 1000) };
}
// Nombres de las categorías (o de los servicios principales si no hay categorías) para los estados
function maryCategorias_() {
  const sv = loadServices().filter(function (s) { return s.active !== false && s.type !== 'addon'; });
  const cats = []; sv.forEach(function (s) { const c = String(s.category || '').trim(); if (c && cats.indexOf(c) < 0) cats.push(c); });
  return (cats.length ? cats : sv.map(function (s) { return s.name; })).slice(0, 6);
}

// ---------- chat: ¿tiene cita? ----------
function maryChat_(st, b) {
  const crudas = maryCitasDe_(b.phone);
  maryCorregirWa_(crudas, b.phone);   // 3.52: la cita con el número mal escrito se corrige sola
  const citas = crudas.map(maryCitaOut_);
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
// ---------- 3.32 · 🔁 recordatorio de servicio: «Ya van 3 semanas desde tu último corte. ¿Te agendo de nuevo?» ----------
// Clientes cuya ÚLTIMA visita fue hace «dias» días (con 6 días de margen por si un día no salió), sin cita próxima,
// y a los que no se les ha escrito por esa visita. Máximo 20 por día. Se leen los días por fecha (sin índices nuevos).
function maryVolver_(st, b) {
  const cfg = maryBotCfg_(st).volver;
  if (!maryBotCfg_(st).activo || !cfg.activo || !cfg.dias) return { clientes: [] };
  const max = Math.max(1, Math.min(20, Number(b.max || 20))), ahora = Date.now(), hoy = toDateStr(new Date(ahora));
  const desde = toDateStr(new Date(ahora - (cfg.dias + 6) * 86400000)), hasta = toDateStr(new Date(ahora - cfg.dias * 86400000));
  const ultima = {}, futuras = {};
  ACTIVE.forEach(function (s) { fsQuery('appointments', [['status', 'EQUAL', s]]).forEach(function (a) { if (a.startAt && a.startAt.getTime() > ahora) futuras[maryLast10_((a.customer || {}).whatsapp)] = true; }); });
  for (let i = cfg.dias + 6; i >= 1; i--) {
    const f = toDateStr(new Date(ahora - i * 86400000));
    if (f >= hoy) continue;
    fsQuery('appointments', [['date', 'EQUAL', f]]).forEach(function (a) {
      if (['attended', 'confirmed'].indexOf(a.status) < 0) return;
      const k = maryLast10_((a.customer || {}).whatsapp); if (k.length !== 10) return;
      if (!ultima[k] || a.date + a.startTime > ultima[k].date + ultima[k].startTime) ultima[k] = a;
    });
  }
  const out = Object.keys(ultima).map(function (k) { return ultima[k]; })
    .filter(function (a) { return a.date >= desde && a.date <= hasta && !a.maryVolver && !futuras[maryLast10_(a.customer.whatsapp)]; })
    .sort(function (x, y) { return (x.date + x.startTime).localeCompare(y.date + y.startTime); }).slice(0, max)
    .map(function (a) { const o = maryCitaOut_(a); o.whatsapp = a.customer.whatsapp; o.nombre = String(a.customer.firstName || '').trim(); o.diasDesde = Math.round((Date.parse(hoy) - Date.parse(a.date)) / 86400000); return o; });
  return { clientes: out, negocio: st.businessName || BIZ.name || '', link: maryLinkAgenda_() };
}
function maryVolverAvisado_(b) {
  const L = (b.codes || []).slice(0, 20).map(function (c) { return wPatch(bp('appointments/' + String(c).toUpperCase()), { maryVolver: true }); });
  if (L.length) commit(L);
  return { ok: true };
}
// ---------- 3.41 · 💳 PAGO DE LA SUSCRIPCIÓN DE LAS TIENDAS (solo el plan que le pagan a la plataforma; nada de los cobros de cada tienda) ----------
// Copia del cobro automático que ya tiene el servidor (y Epic): pedido con MONTO ÚNICO + lector del Gmail del servidor.
// Formas de pago: 'breb' (llave de negocios, sin comisión) · 'nequi' (link de Nequi Negocios pagando desde Nequi o Bancolombia:
// 1,5 % + IVA) · 'banco' (link pagando desde otros bancos: 2,69 % + IVA). Con link se suma la comisión para que llegue el precio completo.
const PAGO_COMISION = { breb: 0, nequi: 0.015 * 1.19, banco: 0.0269 * 1.19 };
function pagoConComision_(base, metodo) {
  const f = PAGO_COMISION[metodo] || 0;
  return f ? Math.ceil(base / (1 - f) / 10) * 10 : base;
}
try {
  const _crearOrden = ACTIONS.createPlanOrder;
  if (_crearOrden) ACTIONS.createPlanOrder = function (b, auth) {
    const metodo = Object.prototype.hasOwnProperty.call(PAGO_COMISION, String(b && b.metodo || '')) ? String(b.metodo) : 'breb';
    const pp = fsGet('platform/public') || {};
    if (metodo !== 'breb' && !pp.nequiLink) fail('El pago por link no está disponible. Paga por Bre-B.');
    const o = _crearOrden(b, auth);
    if (!o || o.free || !o.id) return o;
    if ((o.metodo || 'breb') === metodo && o.metodoListo) return o;   // el mismo pedido vigente, ya con su forma de pago
    const bruto = pagoConComision_(Number(o.baseCOP || o.amountCOP), metodo);
    const usados = {};
    fsQueryAt('', 'platformOrders', [['status', 'EQUAL', 'pending']]).forEach(function (x) { if (x.id !== o.id && toMillis(x.expiresAt) > Date.now() - ORDER_GRACE_HOURS * 3600000) usados[Number(x.amountCOP)] = true; });
    let amount = 0;
    for (let k = 0; k < 100000; k++) { if (!usados[bruto + k]) { amount = bruto + k; break; } }   // como el original: el menor excedente libre
    if (!amount) fail('Intenta de nuevo en unos minutos.');
    const extra = { amountCOP: amount, metodo: metodo, comisionCOP: bruto - Number(o.baseCOP || 0), metodoListo: true };
    commit([wPatch('platformOrders/' + o.id, extra), wPatch(bp('private/billing'), { pendingOrder: Object.assign({}, o, extra) })]);
    return Object.assign({}, o, extra);
  };
} catch (e) { console.error('Pago con link: ' + e); }
// 3.41 · el lector de pagos del servidor (copia de revisarPagosBreb del principal) que además entiende el correo de Nequi Negocios /
//        Wompi («Transacción APROBADA · Venta exitosa por $35,640») y descarta los rechazados. Lee SOLO el Gmail de la cuenta del
//        servidor (tuagenda.servidor), al que Alex reenvía con un filtro las copias de los avisos de Nequi. Nunca su Gmail personal.
const PAGO_SI = /(recib|te envi|te lleg|abono|bre-?b|transferencia|transacci[oó]n aprobada|venta exitosa)/i;
const PAGO_NO = /(rechazad|declinad|fallid|anulad|reversad|no fue aprobada)/i;
function montosPago_(txt) {
  return (txt.match(/\$\s?\d{1,3}(?:[.,]\d{3})+(?:,\d{2})?|\$\s?\d{4,9}/g) || []).map(function (m) {
    return Number(m.replace(/[$\s]/g, '').replace(/,\d{2}$/, '').replace(/[.,]/g, ''));
  });
}
function revisarPagosBreb() {
  const pp = fsGet('platform/public') || {};
  if (!pp.brebEnabled) return;
  BID = '';
  const pend = fsQueryAt('', 'platformOrders', [['status', 'EQUAL', 'pending']]);
  if (!pend.length) return;
  const label = GmailApp.getUserLabelByName('agendador-ok') || GmailApp.createLabel('agendador-ok');
  const sender = String(pp.brebSender || 'nequi').replace(/[^a-z0-9@._-]/gi, '');
  const threads = GmailApp.search('from:(' + sender + ') newer_than:2d -label:agendador-ok', 0, 100);
  threads.forEach(function (th) {
    let matched = false;
    th.getMessages().forEach(function (msg) {
      const txt = (msg.getSubject() + ' ' + msg.getPlainBody()).replace(/\s+/g, ' ');
      if (!PAGO_SI.test(txt) || PAGO_NO.test(txt)) return;
      const amounts = montosPago_(txt), at = msg.getDate().getTime();
      const cands = pend.filter(function (o) {
        return o.status === 'pending' && amounts.indexOf(Number(o.amountCOP)) >= 0
          && at >= toMillis(o.createdAt) - 120000 && at <= toMillis(o.expiresAt) + ORDER_GRACE_HOURS * 3600000;
      }).sort(function (x, y) {
        const ax = at <= toMillis(x.expiresAt) ? 0 : 1, ay = at <= toMillis(y.expiresAt) ? 0 : 1;
        return ax - ay || toMillis(y.createdAt) - toMillis(x.createdAt);
      });
      [cands[0]].filter(Boolean).forEach(function (o) {
        try {
          setBusiness(o.businessId);
          const como = { nequi: 'link de Nequi', banco: 'link (otro banco)' }[o.metodo] || 'Bre-B';
          const r = registerPlanPayment(o.months, o.amountCOP, como + ' automático', 'breb', o.creditCOP, o.plan);
          commit([wPatch('platformOrders/' + o.id, { status: 'paid', paidAt: new Date() }), wPatch(bp('private/billing'), { pendingOrder: null })]);
          o.status = 'paid'; matched = true;
          superNotify('⚡ <b>Pago de plan recibido</b> (' + como + ')\n' + esc(o.businessName) + ' · ' + cop(o.amountCOP) + ' · ' + o.months + ' mes(es)' + (o.comisionCOP ? '\nIncluye ' + cop(o.comisionCOP) + ' de comisión de Wompi' : '') + (r.paidUntil ? '\nActivo hasta ' + fechaLarga(r.paidUntil) : ''));
        } catch (e) { console.error(e); }
      });
    });
    if (matched) th.addLabel(label);
  });
  pend.forEach(function (o) {   // las órdenes vencidas se cierran (igual que el original)
    if (o.status === 'pending' && toMillis(o.expiresAt) + ORDER_GRACE_HOURS * 3600000 < Date.now()) {
      try { setBusiness(o.businessId); commit([wPatch('platformOrders/' + o.id, { status: 'expired' }), wPatch(bp('private/billing'), { pendingOrder: null })]); } catch (e) { console.error(e); }
    }
  });
}
// ---------- 3.38 · 🏷️ ADICIONAL «SIN MARCA DE AGUA» (+$20.000/mes): lo activa el superusuario al editar el negocio ----------
// Se envuelve la acción del superusuario: la de siempre revisa que sea el superusuario y guarda; después se guarda el adicional.
try {
  const _superEditar = ACTIONS.superUpdateBusiness;
  if (_superEditar) ACTIONS.superUpdateBusiness = function (b, auth) {
    const r = _superEditar(b, auth);
    if (b && b.businessId && b.sinMarca !== undefined) {
      const ruta = 'businesses/' + String(b.businessId).replace(/[^\w-]/g, ''), ya = fsGet(ruta) || {};
      commit([wPatch(ruta, { addons: Object.assign({}, ya.addons || {}, { sinMarca: b.sinMarca === true }) })]);
    }
    return r;
  };
} catch (e) { console.error('Adicional sin marca: ' + e); }
// ---------- 3.37 · 📊 REPORTE DEL BOT ----------
// El VPS manda el resumen del día (cuentas + huellas cortas de las personas, nunca el número) → businesses/<bid>/stats/<fecha>
function maryEstadisticas_(b) {
  const f = String(b.fecha || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) fail('Fecha inválida.');
  const n = {}; Object.keys(b.n || {}).forEach(function (k) { if (/^[a-zA-Z]{1,20}$/.test(k)) n[k] = Math.max(0, Math.floor(Number(b.n[k]) || 0)); });
  const h = function (L) { return (Array.isArray(L) ? L : []).map(String).filter(function (x) { return /^[0-9a-f]{10}$/.test(x); }).slice(0, 3000); };
  commit([wSet(bp('stats/' + f), { fecha: f, wa: n, personas: h(b.personas), listas: h(b.listas), at: new Date() })]);
  return { ok: true };
}
// Panel (dueño): el reporte de un rango de fechas (máximo 400 días)
try { ACTIONS.maryReporte = maryReportePanel_; } catch (e) { /* el principal aún no cargó */ }
function maryReportePanel_(b, auth) {
  const admin = getAdmin(auth); if (admin.role !== 'owner') fail('Solo el dueño puede ver el reporte.');
  const desde = String(b.desde || ''), hasta = String(b.hasta || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta) || desde > hasta) fail('Revisa las fechas.');
  const dias = []; let d = desde;
  while (d <= hasta && dias.length < 400) { dias.push(d); d = toDateStr(new Date(Date.parse(d + 'T12:00:00Z') + 86400000)); }
  const got = fsBatchGet(dias.map(function (x) { return bp('stats/' + x); }));
  const tot = {}, personas = {}, listas = {}, serie = [];
  dias.forEach(function (x) {
    const s = got[bp('stats/' + x)]; if (!s) return;
    Object.keys(s.wa || {}).forEach(function (k) { tot[k] = (tot[k] || 0) + Number(s.wa[k] || 0); });
    (s.personas || []).forEach(function (p) { personas[p] = 1; }); (s.listas || []).forEach(function (p) { listas[p] = 1; });
    serie.push({ fecha: x, mensajes: Number((s.wa || {}).mensajes || 0) });
  });
  return { tot: tot, personas: Object.keys(personas).length, listas: Object.keys(listas).length, dias: serie };
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
  // 3.56 · el dueño eligió «una sola lista» en Servicios: el bot no pregunta la categoría; muestra todos juntos (principales primero, luego agregados)
  if (st.serviceView === 'lista' && out.categorias.length > 1) {
    let todos = []; out.categorias.forEach(function (c) { todos = todos.concat(c.servicios); });
    todos = todos.filter(function (x) { return x.tipo !== 'addon'; }).concat(todos.filter(function (x) { return x.tipo === 'addon'; }));
    out.categorias = [{ nombre: 'Servicios', desde: Math.min.apply(null, todos.map(function (x) { return x.precio; })), servicios: todos }];
  }
  out.vista = st.serviceView === 'lista' ? 'lista' : 'categorias';
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
function maryVentana_(st) { return Math.min(Number(plansCfg()[bizPlan()].daysAhead || 30), Number(st.bookingWindowDays || 30)); }   // 3.44: sin tope escondido de 21 días
// ---------- 📅 3.44 · DÍAS PARA RESERVAR: MANDA EL SÚPER PANEL ----------
// Al crear la tienda de prueba, el servidor guardaba en su configuración los días del plan de ESE momento (ej. 5) y después
// siempre ganaba el número menor: aunque el súper panel diera más días (o la tienda subiera a Gold), seguía en 5.
// Ahora los días son los del plan (súper panel). El dueño solo puede poner MENOS si él mismo lo eligió (bookingWindowOwner).
// Se envuelve loadSettings (nuestro archivo carga de último): la misma lectura de siempre + la ventana correcta en memoria.
try {
  const _cargarAjustes = loadSettings;
  loadSettings = function () {
    const s = _cargarAjustes.apply(this, arguments);
    try {
      if (s && typeof BIZ !== 'undefined' && BIZ && typeof plansCfg === 'function') {
        const plan = Math.max(1, Number(plansCfg()[bizPlan()].daysAhead || 30));
        s.bookingWindowDays = s.bookingWindowOwner === true ? Math.max(1, Math.min(plan, Number(s.bookingWindowDays || plan))) : plan;
      }
    } catch (e) { /* si algo falla, queda lo guardado */ }
    return s;
  };
} catch (e) { console.error('Días para reservar: ' + e); }
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

// ---------- 🔄 3.46 · REACTIVAR UN APARTADO VENCIDO (no subió el comprobante del abono a tiempo) ----------
// Lo hace el dueño (o el profesional de esa cita) desde la agenda. Solo si la hora no ha pasado y SIGUE LIBRE (reserveLocks falla si alguien la tomó).
//   modo 'pagada' → la cita queda confirmada (el dueño ya vio el pago) · modo 'tiempo' → vuelve a esperar el comprobante otro rato (holdMinutes).
ACTIONS.maryReactivar = function (b, auth) {
  const adm = getAdmin(auth);
  return withLock(function () {
    const a = getApt(String((b && b.code) || ''));
    if (a.status !== 'expired') fail('Esta cita no está vencida.');
    if (adm.role !== 'owner' && adm.staffId !== a.staffId) fail('Solo el dueño o quien atiende esa cita puede reactivarla.');
    if (mkDate(a.date, a.startTime).getTime() < Date.now()) fail('Esa hora ya pasó. Agenda una cita nueva.');
    const st = loadSettings(), pagada = b.modo === 'pagada';
    const occ = Number(a.occupiedMinutes || 0) || Math.max(15, tmin(a.endTime) - tmin(a.startTime));
    const r = reserveLocks(a.staffId, a.date, a.startTime, occ);   // si ya la tomó otro: «Ese horario ya fue tomado»
    const now = new Date(), exp = pagada ? null : new Date(Date.now() + Math.max(5, Number(st.holdMinutes || 30)) * 60000);
    const patch = { status: pagada ? 'confirmed' : 'pending_payment', lockIds: r.all, holdExpiresAt: exp, updatedAt: now,
      history: hist(a, pagada ? 'reactivated_paid' : 'reactivated', auth.uid) };
    if (pagada) patch.payment = Object.assign({}, a.payment, { status: 'approved', mode: a.payment.mode || 'manual', method: a.payment.method || 'transferencia', verifiedAt: now });
    else patch.payment = Object.assign({}, a.payment, { status: 'awaiting' });
    commit([wPatch(bp('appointments/' + a.code), patch)].concat(lockWrites(r, a.staffId, a.date, pagada ? 'booked' : 'hold', a.code, exp)).concat(incWrites(addDelta({}, a.date, a.staffId, r.create.length))));
    return { ok: true, status: patch.status, code: a.code };
  });
};

// ---------- 🔔 3.47 · AVISOS AL DUEÑO POR WHATSAPP (para no obligar a instalar Telegram) ----------
// El dueño pone SU número personal en el panel (WhatsApp Bot › Avisos a tu WhatsApp). Cada aviso que hoy va a Telegram (reserva nueva,
// comprobante, cancelación…) queda en una cola; el VPS la recoge SOLO cuando hay algo (bandera pública platform/public.maryAvisoPend,
// la misma idea de maryWaPend: no gasta llamadas de Google cuando no hay nada) y se lo escribe desde el WhatsApp del negocio.
// Si el aviso es un comprobante por revisar, el dueño responde 1 (aprobar) o 2 (rechazar). Siguen las reglas de avisos del plan (las mismas de Telegram).
function maryAvisosCfg_(st) {
  const a = ((st.maryBot || {}).avisos) || {}; let n = String(a.numero || '').replace(/\D/g, ''); if (n.length === 10) n = '57' + n;
  const negocio = String(((st.maryWa || {}).numero) || '').replace(/\D/g, '');
  return { activo: a.activo === true && n.length >= 11 && n !== negocio, numero: n };
}
// 🔔 3.55 · Un aviso sale por DOS caminos además de Telegram: el WhatsApp personal del dueño (si lo activó) y las NOTIFICACIONES DE LA APP
//    (si alguien del negocio las activó en su celular). `siempre` = reserva nueva o cancelación: llegan sin importar el plan (orden de Alex).
function maryPushSubs_() { try { return ((fsGet(bp('private/maryPush')) || {}).subs) || {}; } catch (e) { return {}; } }
function maryAvisoWa_(texto, code, siempre) {
  try {
    const st = loadSettings(), cfg = maryBotCfg_(st).avisos;
    const wa = cfg.activo && planHas('whatsapp') && !!((st.maryWa || {}).conectado);
    const push = Object.keys(maryPushSubs_()).length > 0;
    if (!wa && !push) return;
    const limpio = String(texto || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim().slice(0, 900);
    if (!limpio) return;
    const ruta = bp('private/maryAvisos'), ya = fsGet(ruta) || {}, ahora = Date.now();
    const cola = (ya.cola || []).filter(function (x) { return ahora - Number(x.t || 0) < 6 * 3600000; }).slice(-19);
    cola.push({ t: ahora, texto: limpio, code: String(code || ''), wa: wa, push: push });
    commit([wPatch(ruta, { cola: cola }),
      { update: { name: docName('platform/public'), fields: encFields({ maryAvisoPend: (function () { const o = {}; o[BID] = ahora; return o; })() }) }, updateMask: { fieldPaths: [fp(['maryAvisoPend', BID])] } }]);
  } catch (e) { console.error('Aviso: ' + e); }
}
// Reserva nueva y cancelación avisan SIEMPRE (sin importar el plan). El código principal pregunta `tgEventOn('newBooking')` justo antes de avisar:
// aquí se responde «sí» para esos dos, y se recuerda si el plan de verdad los traía; si no los traía, NO se manda a Telegram (eso sigue siendo del plan),
// pero sí salen la notificación de la app y el WhatsApp del dueño.
let MARY_EV = null;
const MARY_SIEMPRE = { newBooking: true, cancel: true };
try {
  const _tgEventOn = tgEventOn, _tgNotify = tgNotify, _tgPhoto = tgPhoto;
  tgEventOn = function (ev) { let real = false; try { real = !!_tgEventOn.apply(this, arguments); } catch (e) { real = false; } const si = real || MARY_SIEMPRE[ev] === true; MARY_EV = si ? { ev: ev, real: real } : null; return si; };   // si responde «no», no queda nada pendiente (el siguiente aviso no se confunde)
  tgNotify = function (staffIds, text, onlyStaff, system) {
    const E = MARY_EV; MARY_EV = null;
    const forzado = !!(E && !E.real);   // el plan no trae este aviso: Telegram no; app y WhatsApp sí
    const r = forzado ? undefined : _tgNotify.apply(this, arguments);
    if (!onlyStaff) maryAvisoWa_(text, '', !!(E && MARY_SIEMPRE[E.ev])); return r;
  };
  tgPhoto = function (staffIds, blob, caption, buttons) {
    const E = MARY_EV; MARY_EV = null;
    const r = E && !E.real ? undefined : _tgPhoto.apply(this, arguments);
    let code = ''; try { code = String((((buttons || [])[0] || [])[0] || {}).callback_data || '').split('|')[2] || ''; } catch (e) { code = ''; }
    maryAvisoWa_(caption, code); return r;
  };
} catch (e) { console.error('Avisos: ' + e); }
// el VPS recoge la cola (y se vacía). También le entrega las suscripciones de la app para mandar las notificaciones.
function maryAvisos_() {
  const ruta = bp('private/maryAvisos'), ya = fsGet(ruta) || {}, cfg = maryBotCfg_(loadSettings()).avisos, subs = maryPushSubs_();
  const cola = (ya.cola || []).filter(function (x) { return Date.now() - Number(x.t || 0) < 6 * 3600000; });
  commit([wPatch(ruta, { cola: [] }), { update: { name: docName('platform/public'), fields: {} }, updateMask: { fieldPaths: [fp(['maryAvisoPend', BID])] } }]);
  return { avisos: cola, numero: cfg.activo ? cfg.numero : '', negocio: String(loadSettings().businessName || (BIZ && BIZ.name) || ''),
    subs: Object.keys(subs).map(function (k) { return { id: k, endpoint: subs[k].endpoint, p256dh: subs[k].p256dh, auth: subs[k].auth }; }) };
}
// la suscripción de un celular ya no existe (desinstaló la app o quitó el permiso): se borra
function maryPushBaja_(b) {
  const ids = (b.ids || []).map(function (x) { return String(x).replace(/[^a-f0-9]/g, ''); }).filter(Boolean); if (!ids.length) return { ok: true };
  const subs = maryPushSubs_(); ids.forEach(function (k) { delete subs[k]; });
  commit([wSet(bp('private/maryPush'), { subs: subs, updatedAt: new Date() })]); return { ok: true, quedan: Object.keys(subs).length };
}
// el VPS publica su llave pública de notificaciones (la necesita la página para pedir el permiso)
function maryPushLlave_(b) {
  const k = String(b.publica || ''); if (!/^[A-Za-z0-9_-]{80,100}$/.test(k)) return { ok: false };
  if (platformPublic().pushKey !== k) commit([{ update: { name: docName('platform/public'), fields: encFields({ pushKey: k }) }, updateMask: { fieldPaths: ['pushKey'] } }]);
  return { ok: true };
}
// 📱 el dueño (o alguien de su equipo) activa o quita las notificaciones en ESTE celular, desde el panel
ACTIONS.maryPushSub = function (b, auth) {
  const adm = getAdmin(auth), sub = (b && b.sub) || {}, keys = sub.keys || {};
  const ep = String(sub.endpoint || '');
  if (!/^https:\/\/[^\s]{20,500}$/.test(ep)) fail('Suscripción inválida.');
  const id = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ep).map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join('').slice(0, 24);
  const subs = maryPushSubs_();
  if (b.quitar) delete subs[id];
  else {
    if (!/^[A-Za-z0-9_-]{80,100}$/.test(String(keys.p256dh || '')) || !/^[A-Za-z0-9_-]{16,40}$/.test(String(keys.auth || ''))) fail('Suscripción inválida.');
    const ids = Object.keys(subs); if (ids.length >= 20 && !subs[id]) delete subs[ids.sort(function (x, y) { return Number(subs[x].t || 0) - Number(subs[y].t || 0); })[0]];   // máximo 20 celulares por negocio
    subs[id] = { endpoint: ep, p256dh: String(keys.p256dh), auth: String(keys.auth), uid: auth.uid, rol: adm.role || '', t: Date.now() };
  }
  commit([wSet(bp('private/maryPush'), { subs: subs, updatedAt: new Date() })]);
  return { ok: true, activos: Object.keys(subs).length, id: id };
};
// el dueño respondió por WhatsApp: 1 = aprobar el pago, 2 = rechazarlo (la misma revisión del panel)
function maryRevisarPago_(b) {
  const cfg = maryBotCfg_(loadSettings()).avisos;
  if (!cfg.activo || String(b.de || '').replace(/\D/g, '') !== cfg.numero) return { ok: false, motivo: 'Ese número no es el del dueño.' };
  try { doReview(String(b.code || ''), b.aprobar === true, b.aprobar === true ? '' : 'No encontramos la transferencia', 'whatsapp del dueño'); return { ok: true, aprobado: b.aprobar === true }; }
  catch (e) { return { ok: false, motivo: String(e.message || e) }; }
}

// ---------- 🖼️ 3.51 · LOS ESTADOS DEL BOT TAMBIÉN EN LA PÁGINA (el círculo del logo) ----------
// Cada tipo (cupos de hoy, semana, cómo agendar 1 y 2) usa SIEMPRE el mismo documento: el nuevo reemplaza al anterior, así no se acumulan
// ni gastan el cupo de estados que el dueño sube a mano. Duran lo que diga el VPS (cupos: hasta el final del día; cómo agendar: 24 horas).
function maryHistoria_(b) {
  const id = String(b.id || '').replace(/[^a-z0-9-]/g, '').slice(0, 20), img = String(b.img || '');
  if (!id || !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(img) || img.length > 900000) return { ok: false, motivo: 'imagen no válida' };
  if (maryBotCfg_(loadSettings()).estados.pagina === false) return { ok: false, motivo: 'el dueño lo apagó' };
  const horas = Math.max(1, Math.min(48, Number(b.horas || 24)));
  commit([wSet(bp('stories/bot-' + id), { img: img, bg: '#FFFFFF', text: '', label: String(b.label || 'Estado').slice(0, 30), bot: true, createdAt: new Date(), expiresAt: new Date(Date.now() + horas * 3600000) })]);
  return { ok: true };
}

// ---------- 🧠 3.52 · GUARDADO INTELIGENTE DE CONTACTOS (lo activa el dueño en WhatsApp Bot; viene apagado) ----------
// Quien le escribe al negocio queda en «Clientes» con su número y el nombre que trae en WhatsApp, aunque no agende.
// Queda marcado como prospecto («💬 Escribió, aún no agenda») hasta que agende. Si ya existe con ese número, no se toca.
function maryGuardarContacto_(b) {
  if (!maryBotCfg_(loadSettings()).guardado) return { ok: false, motivo: 'apagado' };
  const tel = String(b.phone || '').replace(/\D/g, ''), d10 = maryLast10_(tel); if (d10.length < 10) return { ok: false, motivo: 'sin número' };
  if (maryClientesPorNumero_(tel).length) return { ok: true, existia: true };
  const limpio = String(b.nombre || '').replace(/[^\p{L}\p{N} .'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40), n = limpio.split(' ');
  commit([wSet(bp('customers/wa' + d10), { firstName: n[0] || 'Cliente', lastName: n.slice(1).join(' '), email: '', whatsapp: tel.length === 10 ? '57' + tel : tel, source: 'whatsapp', prospecto: true,
    paymentMode: 'deposit', blocked: false, noShowCount: 0, totalAppointments: 0, createdAt: new Date(), updatedAt: new Date() })]);
  return { ok: true, nuevo: true };
}

// ---------- 🚫 3.53 · CANCELAR TARDE DESDE LA PÁGINA, CON MOTIVO ----------
// La página no dejaba cancelar si faltaba menos de N horas («escríbele al negocio»). Si el cliente no puede ir, es mejor que lo diga:
// ahora puede cancelar escribiendo el motivo, que le llega al negocio (Telegram / WhatsApp del dueño). El dueño lo puede apagar (lateCancel: false).
// Se envuelve la acción de siempre: solo se le quita el límite de horas cuando el cliente manda motivo; todo lo demás es igual.
try {
  const _cancelar = ACTIONS.cancelAppointment;
  if (_cancelar) ACTIONS.cancelAppointment = function (b, auth) {
    const st = loadSettings(), motivo = String((b && b.reason) || '').trim();
    const quitar = !!(b && b.tarde === true && motivo.length >= 3 && st.lateCancel !== false);
    const antes = st.rescheduleMinHours;
    if (quitar) { st.rescheduleMinHours = 0; b.reason = '⚠️ Faltando poco: ' + motivo; }
    try { return _cancelar.apply(this, arguments); } finally { st.rescheduleMinHours = antes; }
  };
} catch (e) { console.error('Cancelar tarde: ' + e); }
