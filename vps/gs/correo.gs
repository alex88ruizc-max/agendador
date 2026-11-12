/**
 * CORREOS AL CLIENTE · diseño premium (complemento del servidor; lo sube el VPS)
 * Reemplaza a emailClient() del archivo principal (en Apps Script, el archivo que se carga de último gana).
 *  · Sin «������»: los emojis del nombre del negocio se quitan del remitente y del asunto (Gmail los rompe allí)
 *    y dentro del correo van como entidades HTML (se ven bien en todos los correos).
 *  · Texto ordenado: «Hola Luisa,» y el mensaje en su propio párrafo, con puntuación.
 *  · Etiqueta de estado de color, código grande, datos, botón «Ver mi cita», dirección y pie de Tu Agenda.
 */
const CORREO_VERSION = 'correo-premium-1';

function correoSinEmoji_(s) {
  return String(s == null ? '' : s)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[☀-➿️‍⃣]/g, '')
    .replace(/\s{2,}/g, ' ').trim();
}
function correoEntidades_(html) {
  return String(html || '').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) { return '&#' + c.codePointAt(0) + ';'; })
    .replace(/[☀-➿]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }).replace(/️/g, '');
}
// «Tu cita fue cancelada: Cancelada por el cliente antes de pagar Escríbenos…» → frases bien puntuadas
function correoFrase_(t) {
  let s = String(t || '').trim();
  s = s.replace(/:\s*([A-ZÁÉÍÓÚÑ])/g, function (m, l) { return ': ' + l.toLowerCase(); });
  s = s.replace(/([^.!?])\s+(Escríbenos|Presenta|Te esperamos|Envía|Estamos|Tu abono|Agendamos)/g, '$1. $2');
  if (s && !/[.!?]$/.test(s)) s += '.';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function correoEstado_(asunto, a) {
  const t = String(asunto || '').toLowerCase();
  if (/cancel/.test(t)) return ['Cancelada', '#FDE8EB', '#B42318'];
  if (/no pudimos/.test(t)) return ['Pago no verificado', '#FDE8EB', '#B42318'];
  if (/cambi[oó] de horario|reagend/.test(t)) return ['Nuevo horario', '#E6EEFF', '#2A4BB8'];
  if (/confirmad/.test(t)) return ['Confirmada', '#E4F6EC', '#1E7A4F'];
  if (/recibimos|apartamos|revis/.test(t)) return ['En revisión', '#FCEFD9', '#8A4B08'];
  return [a && a.status === 'confirmed' ? 'Confirmada' : 'Tu cita', '#EFEDF8', '#4B30C9'];
}

function emailClient(a, subject, intro) {
  const to = a.customer && a.customer.email;
  if (!to) return;
  try {
    const st = loadSettings();
    const bizRaw = st.businessName || (BIZ && BIZ.name) || 'Tu Agenda';
    const biz = correoSinEmoji_(bizRaw) || 'Tu Agenda';
    const acc = /^#[0-9a-f]{6}$/i.test(((st.appearance || {}).colors || {}).primary || '') ? st.appearance.colors.primary : '#5B3FE0';
    const est = correoEstado_(subject, a);
    const cancel = /cancel|no pudimos/i.test(subject);
    const link = siteUrl() + '/index.html?b=' + BID + (cancel ? '' : '&cita=' + encodeURIComponent(a.code));
    const dir = st.showLocation === false ? '' : [st.address, st.city].filter(Boolean).join(', ');
    const nombre = String((a.customer && a.customer.firstName) || '').split(/\s+/)[0];
    const fila = function (k, v, fuerte) {
      return '<tr><td style="padding:9px 0;border-top:1px solid #ECEBE8;color:#6B6B76;font-size:14px">' + k + '</td>' +
        '<td style="padding:9px 0;border-top:1px solid #ECEBE8;text-align:right;font-size:14px;font-weight:' + (fuerte ? '700' : '600') + ';color:#121216">' + v + '</td></tr>';
    };
    const html =
      '<div style="background:#F6F5F3;padding:24px 12px;font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#121216">' +
      '<div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #ECEBE8">' +
      // encabezado
      '<div style="background:#121216;padding:22px 24px 24px;color:#FFFFFF">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="vertical-align:middle"><div style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:14px;background:' + acc + ';color:#fff;text-align:center;font-weight:800;font-size:18px">' + esc((biz.charAt(0) || 'T').toUpperCase()) + '</div></td>' +
      '<td style="vertical-align:middle;padding-left:12px;width:100%;color:#FFFFFF"><div style="font-size:17px;font-weight:700;color:#FFFFFF">' + esc(bizRaw) + '</div></td>' +
      '</tr></table>' +
      '<div style="margin-top:18px"><span style="display:inline-block;padding:5px 11px;border-radius:999px;background:' + est[1] + ';color:' + est[2] + ';font-size:12px;font-weight:700">' + esc(est[0]) + '</span></div>' +
      '<div style="margin-top:10px;font-size:30px;font-weight:800;letter-spacing:3px">' + esc(a.code) + '</div>' +
      '</div>' +
      // cuerpo
      '<div style="padding:22px 24px 8px">' +
      '<p style="margin:0 0 6px;font-size:16px;font-weight:700">Hola' + (nombre ? ' ' + esc(nombre) : '') + ',</p>' +
      '<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#4A4A55">' + esc(correoFrase_(intro)) + '</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' +
      fila('Fecha', esc(fechaTxt(a.date).charAt(0).toUpperCase() + fechaTxt(a.date).slice(1))) +
      fila('Hora', hora12(a.startTime), true) +
      fila(esc(st.staffLabel || 'Profesional'), esc(a.staffName)) +
      fila('Servicio', esc((a.items || []).map(function (i) { return i.name; }).join(' + '))) +
      fila('Total', cop(a.totalCOP)) +
      (Number(a.depositCOP || 0) ? fila('Abono', cop(a.depositCOP)) : '') +
      fila('Saldo en el local', cop(a.balanceDueCOP), true) +
      '</table>' +
      '<div style="margin:22px 0 6px;text-align:center"><a href="' + link + '" style="display:inline-block;background:' + (cancel ? '#121216' : acc) + ';color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:14px">' +
      (cancel ? 'Agendar de nuevo' : 'Ver o cambiar mi cita') + '</a></div>' +
      (dir ? '<p style="margin:16px 0 0;font-size:13px;color:#6B6B76;text-align:center">📍 ' + esc(dir) + '</p>' : '') +
      '<p style="margin:14px 0 18px;font-size:12.5px;line-height:1.5;color:#8A8A93;text-align:center">Tolerancia de espera: ' + Number(st.toleranceMinutes || 10) +
      ' minutos. Para cancelar o cambiar tu cita, hazlo con al menos ' + Number(st.rescheduleMinHours != null ? st.rescheduleMinHours : 2) + ' horas de anticipación.</p>' +
      '</div></div>' +
      '<p style="max-width:520px;margin:14px auto 0;text-align:center;font-size:11.5px;color:#A3A3AB">Enviado con Tu Agenda · tuagenda.vip</p></div>';
    sendMail(to, correoSinEmoji_(subject + ' · ' + biz + ' · ' + a.code), correoEntidades_(html), biz, st.email || '');
  } catch (e) { console.error('Correo: ' + e); }
}
