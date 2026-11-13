// 💬 TEXTOS DEL ASISTENTE (sin IA): siempre los mismos, claros y cortos. Todo lo que dice sale de aquí.
//    3.0: nunca dice «Mary». Saluda «Hola 👋 Soy el asistente de *Negocio*» una sola vez al día (lo decide asistente.js).
'use strict';
const cop = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('es-CO');
const nombre1 = (n) => { const w = String(n || '').trim().split(/\s+/)[0] || ''; return /^[\p{L}]{2,}$/u.test(w) ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''; };

const saludo = (negocio, quien) => { const n = nombre1(quien); return `Hola${n ? ' ' + n : ''} 👋 Soy el asistente de *${negocio}*.\n`; };
// Cliente SIN cita: (saludo) + cupos de hoy + link para agendar
function sinCita(info, sal, sinMenu) {
  const hoy = Number(info.cuposHoy || 0);
  return (sal || '') + (hoy > 0 ? `Hoy quedan *${hoy} ${hoy === 1 ? 'cupo' : 'cupos'}*. ` : '') +
    `Agenda tu cita aquí en 1 minuto:\n${info.link}` + (sinMenu ? '' : '\n\nO dime qué servicio necesitas 👇 o escríbeme el día y la hora que te sirven (ej. «mañana a las 4»).');
}
// Cliente CON cita (una o varias)
function conCita(info, sal) {
  const L = info.citas || [];
  const una = (c) => `📅 *${c.dia} · ${c.hora}*\n${c.servicio}${c.con ? ' · con ' + c.con : ''}\n${estadoTxt(c)}`;
  let t = sal || '';
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
  return `💳 Para confirmarla envía *exactamente ${cop(c.abono)}*${m ? ' a:\n' + m : '.'}\nApenas llegue el pago te la confirmo. Si quieres, mándame aquí la foto del pago 📸.`;
}
const fotoRecibida = (c) => c.status === 'confirmed'
  ? `🎉 *¡Recibido! Tu cita quedó confirmada.*\n📅 ${c.dia} · ${c.hora}\n${c.servicio}\n\nTe esperamos ✨`
  : '🧾 *¡Recibido!* El negocio revisa tu pago y te aviso aquí apenas quede confirmada.';
const fotoSinCita = (info) => `📸 Recibí tu imagen, pero no tienes una cita esperando pago. Para agendar: ${info.link}`;
const pagoConfirmado = (c) => `✅ *Recibimos tu pago de ${cop(c.abono)}.* Tu cita quedó confirmada.\n📅 ${c.dia} · ${c.hora}\n${c.servicio}${c.con ? ' · con ' + c.con : ''}\n\nPara verla o cambiarla: ${c.link}`;
// 3.0: «Hola Andrés 👋 Recuerda que tu cita en *El Barba* es en *1 hora*» (los minutos los pone el dueño en su panel)
const enTiempo = (min) => { min = Math.round(Number(min || 0)); const h = Math.floor(min / 60), m = min % 60;
  return h && m ? `${h} ${h === 1 ? 'hora' : 'horas'} y ${m} minutos` : h ? `${h} ${h === 1 ? 'hora' : 'horas'}` : `${m} minutos`; };
// 3.1: «¿Puedes continuar con tu cita? Responde sí y te esperamos. Si no, escribe cancelar o modificar» (según el panel del dueño)
const recordatorio = (c, info, bot) => { bot = bot || {};
  const pie = bot.recordatorioConfirmar !== false && bot.cambios !== false ? '\n\n¿Puedes continuar con tu cita? Responde *sí* y te esperamos ✨\nSi no, escribe *cancelar* o *modificar*.'
    : bot.recordatorioConfirmar !== false ? '\n\n¿Puedes continuar con tu cita? Responde *sí* y te esperamos ✨\n¿Necesitas cambiarla? ' + c.link
    : bot.cambios !== false ? '\n\nTe esperamos ✨ Si no puedes, escribe *cancelar* o *modificar*.' : '\n\nTe esperamos ✨ ¿Necesitas cambiarla? ' + c.link;
  return `⏰ Hola${nombre1(c.nombre) ? ' ' + nombre1(c.nombre) : ''} 👋 Recuerda que tu cita en *${info.negocio}* es en *${enTiempo(info.recordatorioMin || 120)}*.\n📅 ${c.dia} · ${c.hora}\n${c.servicio}${c.con ? ' · con ' + c.con : ''}` +
    (info.direccion ? `\n📍 ${info.direccion}` : '') + (c.saldo > 0 ? `\n💵 Saldo en el local: ${cop(c.saldo)}` : '') + pie; };
const asistio = (c, nombre) => `🙌 ¡Gracias${nombre1(nombre) ? ', ' + nombre1(nombre) : ''}! Tu cita quedó confirmada. Te esperamos ✨\n📅 ${c.dia} · ${c.hora}`;
const cancelada = (r) => `🚫 Listo, cancelé tu cita${r.cita && r.cita.dia ? ' del ' + String(r.cita.dia).toLowerCase() + ' a las ' + r.cita.hora : ''}. El cupo quedó libre.\n\nSi quieres agendar otra: ${r.link || ''}`.trim();
const reagendada = (c) => `🔄 *¡Listo! Tu cita quedó para ${c.dia.toLowerCase()} a las ${c.hora}.*\n✂️ ${c.servicio}${c.con ? ' · con ' + c.con : ''}\n\nPara verla: ${c.link}`;
const parafrasisCambio = (x) => `📝 *Entendí esto:* cambio tu cita de *${x.antes}* para *${x.dia} a las ${x.hora}*${x.con ? ' con ' + x.con : ''}.\n\n¿Lo confirmo?`;
const preguntaCancelar = (c) => `Listo, perfecto. 👌 Tu cita es el *${c.dia.toLowerCase()} a las ${c.hora}* (${c.servicio}).\n\n¿Deseas *cancelarla* o *reagendarla*?`;
const decision = (c) => c.decision === 'approved'
  ? `✅ *Tu pago fue aprobado.* Tu cita quedó confirmada.\n📅 ${c.dia} · ${c.hora}\n${c.servicio}${c.con ? ' · con ' + c.con : ''}\n\nPara verla o cambiarla: ${c.link}`
  : `❌ *No pudimos verificar tu pago*${c.motivo && !/telegram/i.test(c.motivo) ? ' (' + c.motivo + ')' : ''}, así que el cupo quedó libre.\nSi ya pagaste, escríbenos aquí y lo revisamos. Para agendar de nuevo: ${c.linkAgenda || ''}`.trim();
const problema = (info) => `😅 Tuve un problema para revisar tu cita. Aquí puedes verla o agendar: ${info && info.link ? info.link : ''}`.trim();

// ---------- 3.0 · agendar por WhatsApp ----------
const duracion = (m) => { m = Number(m || 0); return m < 60 ? m + ' min' : (m % 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : (m / 60) + ' h'); };
const listaHoras = (H) => { const L = H.slice(0, 8); const t = L.length > 1 ? L.slice(0, -1).join(', ') + ' y ' + L[L.length - 1] : L[0]; return t + (H.length > 8 ? ` (y ${H.length - 8} más)` : ''); };
const cuposDia = (d) => `📅 *${d.dia}* hay cupo a las ${listaHoras(d.horas)}.\n¿Te aparto una? Toca *Elegir día* 👇`;
const cuposOtros = (cual, D) => { const L = D.slice(0, 4).map((x) => x.dia.charAt(0).toLowerCase() + x.dia.slice(1)); const t = L.length > 1 ? L.slice(0, -1).join(', ') + ' y ' + L[L.length - 1] : L[0];
  return `😕 ${cual} ya no hay cupos, pero sí hay ${t}.\n¿Qué día te sirve? Toca *Elegir día* 👇`; };
const sinCupos = (info) => `😕 Por ahora no hay cupos libres en los próximos días.\nMira la agenda completa aquí: ${info.link}`;
const sinDias = (info) => `😕 No encontré horas libres en los próximos días para eso.\nMira la agenda completa aquí: ${info.link}`;
const sinServicios = (info) => `Por ahora no hay servicios para agendar por aquí 🙏\nMira aquí: ${info.link}`;
const pideCorreo = () => '📧 ¿Quieres que la cita te quede en tu *calendario*? Escríbeme tu correo (ej. *nombre@gmail.com*) o responde *no*.';
const parafrasis = (x) => `📝 *Entendí esto:*\n✂️ ${x.servicio || x.servicios} · *${cop(x.total)}* (${duracion(x.min)})\n📅 ${x.dia} a las *${x.hora}*${x.con ? '\n💈 Con ' + x.con : ''}\n🙋 A nombre de ${x.nombre}` +
  (x.abono > 0 ? `\n💳 Abono para apartar: *${cop(x.abono)}*` : '') + '\n\n¿Lo confirmo?';
// 3.30: al pie de la cita, la invitación a la plataforma (pedido de Alex)
const PIE_GRATIS = '\n\n💼 ¿Tienes un negocio con citas? Regístrate gratis en https://tuagenda.vip/';
// 3.29: sin «¿Lo confirmo?»: al final llega el resumen y «✅ Cita confirmada» (pedido de Alex: «con eso basta»)
function citaHecha(c, info, nombre, conCorreo) {
  const n = nombre1(nombre);
  const precio = info.total ? ' · *' + cop(info.total) + '*' + (info.min ? ' (' + duracion(info.min) + ')' : '') : '';
  const cab = `✂️ ${c.servicio}${precio}${info.comoSiempre ? ' · como siempre' : ''}\n📅 ${c.dia} a las *${c.hora}*${c.con ? '\n💈 Con ' + c.con : ''}${nombre ? '\n🙋 A nombre de ' + nombre : ''}\n🔖 Reserva *${c.code}*`;
  if (c.status === 'confirmed') return `✅ *¡Cita confirmada${n ? ', ' + n : ''}!*\n${cab}` + (conCorreo ? '\n📧 Te la mandé a tu correo para tu calendario.' : '') + `\n\nPara verla o cambiarla: ${c.link}\n¡Te esperamos! ✨` + PIE_GRATIS;
  return `🗓️ *¡Te aparté el cupo${n ? ', ' + n : ''}!*\n${cab}\n\n` + pagoTxt(info, c) + `\n⏳ Tienes ${info.holdMinutes || 30} minutos; si no, el cupo se libera.` + PIE_GRATIS;
}
const audio = () => '🎤 En este momento no puedo escuchar audios 🙏 ¿Me lo escribes, por favor?';

const demora = (link) => `😅 Se me demoró el sistema. Escríbeme *agendar* en un momento y seguimos, o aparta aquí en 1 minuto: ${link}`;
// 🕵️ 3.49 · WhatsApp no mostró el número del cliente: no se puede agendar por chat, pero SÍ se le responde con el link
const sinNumero = (negocio, link) => `¡Hola! 👋 Soy el asistente${negocio ? ' de *' + negocio + '*' : ''}.\n\nPara agendar tu cita entra aquí 👉 ${link}\n\nAhí ves las horas libres y apartas la tuya en 1 minuto. 🙌`;
// 📧 3.52 · el cliente dio su correo sin que se lo pidieran
const teEncontre = (nombre, citas) => {
  const c = (citas || [])[0];
  return `✅ ¡Listo${nombre ? ', ' + nombre.split(' ')[0] : ''}! Ya te encontré y dejé tu WhatsApp al día. 🙌` + (c ? `\n\n📅 Tu cita: *${c.dia}* a las *${c.hora}*${c.servicio ? ' · ' + c.servicio : ''}.` : '');
};
const correoNoEsta = () => '🔎 No encontré ese correo en nuestros clientes. No pasa nada, te atiendo igual. 😊';
const correoSigue = () => 'Escríbeme *agendar* para apartar una cita o *cupos* para ver las horas libres.';
// 🚫 3.53 · cancelar faltando poco: se pide el motivo · y cuando quiere cancelar pero no se le encuentra cita
const pideMotivo = (c) => `⏰ Falta poco para tu cita${c && c.hora ? ' de las *' + c.hora + '*' : ''}.\n\nSí te la cancelo. Solo cuéntame *por qué no puedes ir* (una frase) y le aviso al negocio. 🙏\n\nSi mejor la dejas, escribe *no*.`;
const sinCitaActiva = (link) => `🔎 No encontré una cita activa a tu nombre con este número.\n\nSi tienes tu *número de reserva* (empieza por R-), escríbemelo así: *cancelar R-ABC123*.${link ? '\n\nO mírala aquí: ' + link : ''}`;
module.exports = { pideMotivo, sinCitaActiva, teEncontre, correoNoEsta, correoSigue, sinNumero, demora, asistio, cancelada, reagendada, parafrasisCambio, preguntaCancelar, saludo, enTiempo, duracion, listaHoras, cuposDia, cuposOtros, sinCupos, sinDias, sinServicios, pideCorreo, parafrasis, citaHecha, audio, cop, nombre1, sinCita, conCita, estadoTxt, pagoTxt, fotoRecibida, fotoSinCita, pagoConfirmado, recordatorio, decision, problema };
