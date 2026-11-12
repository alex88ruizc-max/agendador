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
const MARY_VERSION = 'agendador-ia-2.5';

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
    link: maryLinkCita_(a.code)
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
    holdMinutes: Math.max(5, Number(st.holdMinutes || 30))
  };
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
  return out;
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
  const dias = Math.max(1, Math.min(7, Number(b.dias || 1)));
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
  const min = Math.max(10, Math.min(24 * 60, Number(b.minutos || 120)));
  const now = Date.now(), hoy = toDateStr(new Date()), man = toDateStr(new Date(now + 86400000));
  let L = fsQuery('appointments', [['date', 'EQUAL', hoy]]).concat(hoy === man ? [] : fsQuery('appointments', [['date', 'EQUAL', man]]));
  L = L.filter(function (a) {
    if (a.status !== 'confirmed' || a.maryReminded) return false;
    const m = (a.startAt.getTime() - now) / 60000;
    return m > 0 && m <= min && maryLast10_((a.customer || {}).whatsapp).length === 10;
  });
  return { citas: L.map(function (a) { const o = maryCitaOut_(a); o.whatsapp = (a.customer || {}).whatsapp || ''; o.nombre = (a.customer || {}).firstName || ''; return o; }), info: maryInfo_(st) };
}
function maryRecordada_(b) {
  const a = getApt(b.code);
  commit([wPatch(bp('appointments/' + a.code), { maryReminded: true })]);
  return { ok: true };
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
  const r = { estado: estado, codigo: String(b.codigo || '').slice(0, 20), qr: String(b.qr || '').slice(0, 20000), numero: String(b.numero || '').replace(/\D/g, ''), error: String(b.error || '').slice(0, 200), t: Date.now() };
  ca.put('mwa_res_' + BID, JSON.stringify(r), 900);
  const fin = ['codigo', 'conectado', 'desconectado', 'error', 'vencido'].indexOf(estado) >= 0;
  const w = [];
  if (fin) {   // el pedido ya se atendió: se quita (el VPS deja de revisarlo)
    ca.remove('mwa_req_' + BID); PropertiesService.getScriptProperties().deleteProperty('mwa_req_' + BID);
    w.push({ update: { name: docName('platform/public'), fields: {} }, updateMask: { fieldPaths: [fp(['maryWaPend', BID])] } });
  }
  if (estado === 'conectado') w.push(wPatch(bp('settings/general'), { maryWa: { conectado: true, numero: r.numero, at: new Date() } }));
  if (estado === 'desconectado') w.push(wPatch(bp('settings/general'), { maryWa: { conectado: false, numero: '', at: new Date() } }));
  if (w.length) commit(w);
  if (estado === 'conectado') tgSys('✅ <b>WhatsApp conectado a Mary</b>\nTu recepcionista ya atiende en +' + esc(r.numero) + '.');
  return { ok: true };
}
