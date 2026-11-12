// 📧 PAGOS DEL CORREO DE CADA NEGOCIO (IMAP: Gmail, Outlook, Hostinger…)
// Lee los avisos del banco (Nequi, Bancolombia, Daviplata, Bre-B) y saca el MONTO y el PAGADOR.
// REGLA: nunca borra, archiva ni marca nada en el buzón del dueño. Solo lee. Lo ya visto se recuerda en /datos/vistos.json.
'use strict';
const fs = require('fs'), path = require('path');

// ¿Este correo es un pago RECIBIDO? (no compras, no envíos, no promociones)
const RE_RECIBIDO = /(te (envi[oó]|lleg[oó]|transfiri[oó]|pag[oó]|consign[oó])|recibiste|recibimos (tu|un) pago|abono a tu|te consignaron|transferencia recibida|pago recibido|dinero recibido|te llegaron)/i;
// 🛑 1.1: pagos que TÚ hiciste, avisos a terceros y promociones NUNCA cuentan (el revisor encontró «Transferiste…», «Realizaste…», «recibió tu transferencia», «gana hasta $…»)
const RE_NO = /(compraste|pagaste|enviaste|retiraste|transferiste|realizaste|hiciste|debitamos|recibi[oó] tu|tu transferencia|rechazad|no fue posible|fallid|c[oó]digo de verificaci[oó]n|inicio de sesi[oó]n|\bgana\b|hasta \$|premio|sorteo|promo|descuento|cashback)/i;

// "$15.000" "$ 15,000.00" "$15000" "COP 15.000" → 15000
function montos(txt) {
  const out = [], re = /(?:\$|cop\s?)\s?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,9}(?:[.,]\d{2})?)/gi; let m;
  while ((m = re.exec(txt))) {
    let s = m[1];
    if (/[.,]\d{2}$/.test(s) && !/[.,]\d{3}[.,]\d{2}$/.test(s) && /^\d{4,9}[.,]\d{2}$/.test(s)) s = s.slice(0, -3);   // 15000,00
    else if (/[.,]\d{3}[.,]\d{2}$/.test(s)) s = s.slice(0, -3);                                                   // 15.000,00
    const n = Number(s.replace(/[.,]/g, ''));
    if (n >= 1000 && n <= 20000000 && out.indexOf(n) < 0) out.push(n);
  }
  return out;
}
function pagador(txt) {
  const N = '([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\\s+[A-ZÁÉÍÓÚÑ*][A-Za-zÁÉÍÓÚÑáéíóúñ*]+){0,3})';
  const antes = new RegExp(N + '\\s+te\\s+(?:envi[oó]|transfiri[oó]|pag[oó]|consign[oó])').exec(txt);   // «Laura Gómez te envió $15.000»
  if (antes && !/^(nequi|bancolombia|daviplata|alguien|tu|la|el)\b/i.test(antes[1])) return antes[1].replace(/\*+/g, '').trim();
  const m = /(?:de|desde|pagador|remitente|enviado por|te envi[oó])\s*:?\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ*][A-Za-zÁÉÍÓÚÑáéíóúñ*]+){0,3})/.exec(txt);
  const n = m ? m[1].replace(/\*+/g, '').trim() : '';
  return /^(nequi|bancolombia|daviplata|tu|la|el|cuenta|llave|bre)/i.test(n) ? '' : n;
}
// Devuelve { amount, payer } o null si no es un pago recibido
function leerPago(asunto, texto) {
  const txt = (String(asunto || '') + ' \n ' + String(texto || '')).replace(/\s+/g, ' ');
  if (!RE_RECIBIDO.test(txt) || RE_NO.test(txt)) return null;
  const L = montos(txt);
  if (!L.length) return null;
  return { amount: L[0], payer: pagador(txt) };
}

// ---------- recuerdo de correos ya procesados (por negocio) ----------
function Vistos(dir) {
  const f = path.join(dir, 'vistos.json'); let V = {};
  try { V = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (e) { V = {}; }
  const guardar = () => { try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(V)); fs.renameSync(f + '.tmp', f); } catch (e) { console.error('vistos:', e.message); } };
  return {
    ya: (bid, id) => !!(V[bid] && V[bid][id]),
    poner: (bid, id) => { V[bid] = V[bid] || {}; V[bid][id] = Date.now(); const lim = Date.now() - 5 * 86400000; for (const k of Object.keys(V[bid])) if (V[bid][k] < lim) delete V[bid][k]; guardar(); }
  };
}

// ---------- lector IMAP (solo lectura) ----------
// neg.correo = { host, port, user, pass, secure, remitentes: ["nequi", "bancolombia"] }
async function revisarBuzon(neg, vistos, alPago, log) {
  const c = neg.correo; if (!c || !c.host || !c.user || !c.pass) return 0;
  const { ImapFlow } = require('imapflow');
  const { simpleParser } = require('mailparser');
  const cli = new ImapFlow({ host: c.host, port: Number(c.port || 993), secure: c.secure !== false, auth: { user: c.user, pass: c.pass }, logger: false });
  cli.on('error', (e) => log('⚠️ correo ' + neg.bid + ': ' + e.message));   // 🛟 1.1: un corte del buzón ya no tumba a Mary
  let n = 0;
  await cli.connect();
  try {
    const lock = await cli.getMailboxLock('INBOX', { readOnly: true });
    try {
      const desde = new Date(Date.now() - 36 * 3600000);
      const rem = (c.remitentes && c.remitentes.length ? c.remitentes : ['nequi', 'bancolombia', 'daviplata', 'davivienda', 'bre-b', 'breb']).map((x) => String(x).toLowerCase());
      const uids = await cli.search({ since: desde }, { uid: true }) || [];
      for (const uid of uids.slice(-150)) {
        const msg = await cli.fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
        if (!msg) continue;
        const id = (msg.envelope && msg.envelope.messageId) || ('uid' + uid + '@' + c.user);
        if (vistos.ya(neg.bid, id)) continue;
        const de = ((msg.envelope && msg.envelope.from) || []).map((x) => (x.address || '') + ' ' + (x.name || '')).join(' ').toLowerCase();
        if (!rem.some((r) => de.indexOf(r) >= 0)) { vistos.poner(neg.bid, id); continue; }
        const p = await simpleParser(msg.source);
        const pago = leerPago(p.subject, p.text || String(p.html || '').replace(/<[^>]+>/g, ' '));
        if (pago) { n++; try { await alPago(Object.assign({ at: (p.date || new Date()).toISOString(), ref: id }, pago)); } catch (e) { log('❌ pago ' + neg.bid + ': ' + e.message); continue; } }
        vistos.poner(neg.bid, id);
      }
    } finally { lock.release(); }
  } finally { await cli.logout().catch(() => {}); }
  return n;
}

module.exports = { montos, pagador, leerPago, Vistos, revisarBuzon };
