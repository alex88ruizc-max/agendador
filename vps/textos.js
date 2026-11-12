// 💬 TEXTOS DE MARY (sin IA): siempre los mismos, claros y cortos. Todo lo que dice Mary sale de aquí.
'use strict';
const cop = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('es-CO');
const nombre1 = (n) => { const w = String(n || '').trim().split(/\s+/)[0] || ''; return /^[\p{L}]{2,}$/u.test(w) ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''; };

// Cliente SIN cita: saludo + link para agendar
function sinCita(info, quien) {
  const n = nombre1(quien), hoy = Number(info.cuposHoy || 0);
  return `Hola${n ? ' ' + n : ''} 👋 Soy Mary, de *${info.negocio}*.\n` +
    (hoy > 0 ? `Hoy quedan *${hoy} ${hoy === 1 ? 'cupo' : 'cupos'}*. ` : '') +
    `Elige tu servicio y tu hora aquí y apártala en 1 minuto:\n${info.link}`;
}
// Cliente CON cita (una o varias)
function conCita(info, quien) {
  const n = nombre1(quien), L = info.citas || [];
  const una = (c) => `📅 *${c.dia} · ${c.hora}*\n${c.servicio}${c.con ? ' · con ' + c.con : ''}\n${estadoTxt(c)}`;
  let t = `Hola${n ? ' ' + n : ''} 👋 Soy Mary, de *${info.negocio}*.\n`;
  t += L.length === 1 ? `Tienes esta cita:\n\n${una(L[0])}` : `Tienes ${L.length} citas:\n\n` + L.map(una).join('\n\n');
  const pend = L.find((c) => c.status === 'pending_payment');
  if (pend) t += '\n\n' + pagoTxt(info, pend);
  t += `\n\nPara verla, cambiar la hora o cancelar:\n${L[0].link}`;
  if (L.length === 1) t += `\n\n¿Quieres otra cita? ${info.link}`;
  return t;
}
function estadoTxt(c) {
  if (c.status === 'confirmed') return '✅ Confirmada' + (c.saldo > 0 ? ` · saldo en el local ${cop(c.saldo)}` : '');
  if (c.status === 'pending_verification') return '🧾 Pago en revisión';
  if (c.status === 'pending_payment') return `⏳ Falta el abono de ${cop(c.abono)}`;
  return '';
}
function pagoTxt(info, c) {
  const m = (info.medios || []).map((x) => `• ${x.label}: *${x.account}*${x.holder ? ' (' + x.holder + ')' : ''}`).join('\n');
  return `💳 Para confirmarla envía *exactamente ${cop(c.abono)}*${m ? ' a:\n' + m : '.'}\nApenas llegue el pago te confirmo sola. Si quieres, mándame aquí la foto del pago.`;
}
const fotoRecibida = (c) => c.status === 'confirmed'
  ? `🎉 *¡Recibido! Tu cita quedó confirmada.*\n📅 ${c.dia} · ${c.hora}\n${c.servicio}\n\nTe esperamos ✨`
  : '🧾 *¡Recibido!* El negocio revisa tu pago y te aviso aquí apenas quede confirmada.';
const fotoSinCita = (info) => `📸 Recibí tu imagen, pero no tienes una cita esperando pago. Para agendar: ${info.link}`;
const pagoConfirmado = (c) => `✅ *Recibimos tu pago de ${cop(c.abono)}.* Tu cita quedó confirmada.\n📅 ${c.dia} · ${c.hora}\n${c.servicio}${c.con ? ' · con ' + c.con : ''}\n\nPara verla o cambiarla: ${c.link}`;
const recordatorio = (c, info) => `⏰ Hola${nombre1(c.nombre) ? ' ' + nombre1(c.nombre) : ''}, te recordamos tu cita en *${info.negocio}*:\n📅 ${c.dia} · ${c.hora}\n${c.servicio}` +
  (info.direccion ? `\n📍 ${info.direccion}` : '') + (c.saldo > 0 ? `\n💵 Saldo en el local: ${cop(c.saldo)}` : '') + `\n\n¿Necesitas cambiarla? ${c.link}`;
const decision = (c) => c.decision === 'approved'
  ? `✅ *Tu pago fue aprobado.* Tu cita quedó confirmada.\n📅 ${c.dia} · ${c.hora}\n${c.servicio}${c.con ? ' · con ' + c.con : ''}\n\nPara verla o cambiarla: ${c.link}`
  : `❌ *No pudimos verificar tu pago*${c.motivo && !/telegram/i.test(c.motivo) ? ' (' + c.motivo + ')' : ''}, así que el cupo quedó libre.\nSi ya pagaste, escríbenos aquí y lo revisamos. Para agendar de nuevo: ${c.linkAgenda || ''}`.trim();
const problema = (info) => `😅 Tuve un problema para revisar tu cita. Aquí puedes verla o agendar: ${info && info.link ? info.link : ''}`.trim();

module.exports = { cop, nombre1, sinCita, conCita, estadoTxt, pagoTxt, fotoRecibida, fotoSinCita, pagoConfirmado, recordatorio, decision, problema };
