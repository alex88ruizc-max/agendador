// 🤖 ASISTENTE DEL AGENDADOR (3.0) · sin IA: reglas fijas, claras y probadas en el banco (banco/escenarios.js)
//   · Saluda UNA vez al día por cliente: «Hola 👋 Soy el asistente de *Negocio*» (nunca dice «Mary»).
//   · ¿Hay cupos? → los días/horas con cupo de verdad + el link (siempre) + la lista de días para elegir.
//   · Agendar por WhatsApp con LISTAS: categoría → servicio(s) (se pueden sumar varios) → día → hora → profesional
//     → nombre (una vez) → correo para su calendario (una vez) → «Entendí esto… ¿Lo confirmo?» → la cita queda en la agenda.
//   · Aprende de cada cliente: su nombre, su correo y su combinación habitual («¿Lo de siempre?»).
//   · Audios: por ahora no los escucha (lo dice amable y sigue).
'use strict';
const T = require('./textos');

const sinTilde = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const horaTxt = (t) => { let [H, M] = String(t).split(':').map(Number); const ap = H >= 12 ? 'p. m.' : 'a. m.'; H = H % 12 || 12; return H + ':' + String(M).padStart(2, '0') + ' ' + ap; };
const corto = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const VENCE_FLUJO = 30 * 60000;   // si el cliente se demora más de 30 min, el agendamiento empieza de nuevo
const VENCE_RECORDATORIO = 5 * 3600000;   // la respuesta al recordatorio («sí», «cancelar», «modificar») vale unas horas
const QUIERE_CANCELAR = /\bcancel/;
const QUIERE_MODIFICAR = /modific|reagend|reprogram|\bmover\b|\bmuev|cambi(ar|o|e)? (la |mi |de )?(cita|hora|dia|fecha|turno)|otra hora|otro dia|aplaz/;

// ---------- fechas (en la hora de Colombia) ----------
function hoyLocal(tz, ms) { const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); return p; }
function sumarDias(f, n) { const [y, m, d] = f.split('-').map(Number); const x = new Date(Date.UTC(y, m - 1, d + n)); return x.toISOString().slice(0, 10); }
function dowDe(f) { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
// «hoy», «mañana», «pasado mañana», «el viernes», «el 20», «20 de noviembre», «20/11» → AAAA-MM-DD (o null)
function fechaPedida(texto, hoy) {
  let t = sinTilde(texto).replace(/\b(en|por|de|a) la manana\b/g, ' ');
  if (/pasado manana/.test(t)) return sumarDias(hoy, 2);
  if (/\bmanana\b/.test(t)) return sumarDias(hoy, 1);
  if (/\bhoy\b|\besta (tarde|noche)\b/.test(t)) return hoy;
  for (let i = 0; i < 7; i++) if (new RegExp('\\b' + DIAS[i] + '\\b').test(t)) { const n = (i - dowDe(hoy) + 7) % 7; return sumarDias(hoy, n); }
  let m = t.match(/\b(\d{1,2})\s*(?:\/|-|de\s+)(\d{1,2}|[a-z]+)\b/);
  let dia = null, mes = null;
  if (m) { dia = Number(m[1]); mes = /^\d+$/.test(m[2]) ? Number(m[2]) : MESES.indexOf(m[2]) + 1; if (!mes) mes = null; }
  else { m = t.match(/\b(?:el|dia|para el)\s+(\d{1,2})\b/); if (m) dia = Number(m[1]); }
  if (!dia || dia > 31) return null;
  const [y, mh, dh] = hoy.split('-').map(Number);
  let yy = y, mm = mes || mh;
  if (!mes && dia < dh) mm += 1;
  if (mes && (mes < mh || (mes === mh && dia < dh))) yy += 1;
  if (mm > 12) { mm = 1; yy += 1; }
  return yy + '-' + String(mm).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}

// ---------- ¿qué quiere? ----------
const QUIERE_CUPOS = /cupo|disponib|espacio|\bhay (hora|turno|citas?|agenda)\b|tiene[ns]? (hora|turno|espacio|agenda|algo)|horario libre|(a )?que horas? (hay|tiene|tienen|quedan)|que (dias|dia) (hay|tienen)|quedan? (horas|turnos)/;
const QUIERE_AGENDAR = /agend|reserv|apart(ar|o|e)\b|separ(ar|o) (una |un )?(cita|hora|cupo|turno)|(quiero|quisiera|necesito|me gustaria|puedo|deseo|pedir|sacar|hacer)( una| un)? (cita|turno|hora)\b|nueva cita|otra cita|\b(quiero|quisiera|necesito)\b.*\b(corte|cortar|motilar|motilada|barba|unas|cejas|pestanas|manicure|pedicure|depil|masaje|tinte|cepillado|peinado|maquillaje)/;
const SALUDO = /^(hola+|holi|ola|buenas|buenos dias|buenas tardes|buenas noches|buen dia|hey|saludos|que tal)\b/;
const SALIR = /^(cancelar|salir|menu|inicio|empezar de nuevo|volver a empezar|dejalo asi|olvidalo)$/;
const SI = /^(si+|claro|dale|listo|ok|okey|okay|confirmo|confirmar|confirmado|de una|correcto|perfecto|va|hagale|hagamosle|asi esta bien|esta bien)\b/;
const NO = /^(no+|nop|nel|no gracias|mejor no|ninguno|ninguna|ahora no)\b/;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

function crear(dep) {
  // dep: { gas(neg, op, datos), texto(neg, tel, txt), lista(neg, tel, L), mem, guardar(), anotar(x), tz, ahora() }
  const ahora = dep.ahora || (() => Date.now());
  const catCache = new Map();
  const hoy = () => hoyLocal(dep.tz || 'America/Bogota', ahora());
  const mem = () => { const M = dep.mem; M.conv = M.conv || {}; M.clientes = M.clientes || {}; return M; };

  async function catalogo(neg) {
    const c = catCache.get(neg.bid);
    if (c && ahora() - c.t < 10 * 60000) return c.d;
    const d = await dep.gas(neg, 'catalogo');
    catCache.set(neg.bid, { t: ahora(), d });
    return d;
  }
  function cliente(k) { const M = mem(); return (M.clientes[k] = M.clientes[k] || {}); }
  // «Hola 👋 Soy el asistente de *Negocio*» solo la primera vez del día
  function saludo(k, negocio, nombreWa, siempre) {
    const cl = cliente(k), h = hoy();
    if (cl.saludo === h && !siempre) return '';
    cl.saludo = h; dep.guardar();
    return T.saludo(negocio, cl.nombre || nombreWa);
  }
  // Manda una lista y guarda sus opciones (para entender si tocan la lista, escriben el número o el nombre)
  async function lista(neg, c, conv, L) {
    conv.opciones = [].concat(...L.secciones.map((s) => s.filas)).map((f) => ({ id: f.id, titulo: f.titulo }));
    conv.t = ahora();
    mem().conv[c.k] = conv; dep.guardar();
    await dep.lista(neg, c.tel, L);
  }
  function elegir(conv, c) {
    const O = conv.opciones || [];
    if (c.rowId) { const o = O.find((x) => x.id === c.rowId); if (o) return o; }
    const t = sinTilde(c.texto);
    if (!t) return null;
    if (/^\d{1,2}$/.test(t) && O[Number(t) - 1]) return O[Number(t) - 1];
    const lim = (s) => sinTilde(s).replace(/[^\p{L}\p{N} ]/gu, '').trim();
    const tt = lim(t);
    let L = O.filter((o) => lim(o.titulo) === tt);
    if (!L.length && tt.length >= 3) L = O.filter((o) => { const x = lim(o.titulo); return x.startsWith(tt) || (x.length >= 4 && tt.includes(x)); });
    return L.length === 1 ? L[0] : null;
  }
  const fin = (k) => { delete mem().conv[k]; dep.guardar(); };
  const cfg = (neg, cat) => Object.assign({ agendar: true, cupos: true, saludoDiario: true, pedirNombre: true, pedirCorreo: true, loDeSiempre: true, cambios: true }, (cat && cat.bot) || (dep.bot ? dep.bot(neg) : {}));
  const pie = (cat) => cat.negocio + ' · asistente virtual';

  // ---------- pasos del agendamiento ----------
  async function pasoCategoria(neg, c, conv, pre) {
    const cat = await catalogo(neg);
    const C = (cat.categorias || []).filter((x) => x.servicios && x.servicios.length);
    if (!C.length) { fin(c.k); return dep.texto(neg, c.tel, (pre || '') + T.sinServicios(cat)); }
    if (C.length === 1) { conv.cat = C[0].nombre; return pasoServicio(neg, c, conv, pre); }
    conv.paso = 'cat';
    return lista(neg, c, conv, { texto: (pre || '') + (conv.ids && conv.ids.length ? '➕ ¿Qué más te agregamos?' : '✨ ¿Qué te quieres hacer?') + '\nToca *Ver opciones* y escoge.', boton: 'Ver opciones', pie: pie(cat),
      secciones: [{ titulo: 'Servicios', filas: C.slice(0, 10).map((x, i) => ({ id: 'cat:' + i, titulo: corto(x.nombre, 24), desc: 'desde ' + T.cop(x.desde) })) }] });
  }
  async function pasoServicio(neg, c, conv, pre) {
    const cat = await catalogo(neg);
    const C = (cat.categorias || []).find((x) => x.nombre === conv.cat) || (cat.categorias || [])[0];
    const S = C.servicios.filter((s) => !(conv.ids || []).includes(s.id));
    const pag = conv.pag || 0, por = 8, vista = S.slice(pag * por, pag * por + por);
    const filas = vista.map((s) => ({ id: 'svc:' + s.id, titulo: corto(s.nombre, 24), desc: T.cop(s.precio) + ' · ' + T.duracion(s.min) }));
    if (S.length > (pag + 1) * por) filas.push({ id: 'mas:svc', titulo: 'Ver más ➡️', desc: 'Más servicios de ' + corto(C.nombre, 40) });
    if ((cat.categorias || []).length > 1) filas.push({ id: 'otra:cat', titulo: '⬅️ Otra categoría', desc: '' });
    conv.paso = 'svc'; conv.cat = C.nombre;
    return lista(neg, c, conv, { texto: (pre || '') + '✂️ *' + C.nombre + '*\nToca *Ver opciones* y elige el tuyo.', boton: 'Ver opciones', pie: pie(cat), secciones: [{ titulo: corto(C.nombre, 24), filas }] });
  }
  async function pasoMas(neg, c, conv) {
    const cat = await catalogo(neg), sel = elegidos(cat, conv.ids);
    conv.paso = 'mas';
    return lista(neg, c, conv, { texto: '👍 Anotado: *' + sel.map((s) => s.nombre).join(' + ') + '* (' + T.cop(total(sel)) + ').\n¿Quieres agregar otro servicio?', boton: 'Ver opciones', pie: pie(cat),
      secciones: [{ titulo: 'Tu cita', filas: [{ id: 'mas:si', titulo: '➕ Agregar otro', desc: 'Corte + barba, uñas + cejas…' }, { id: 'mas:no', titulo: '✅ No, solo eso', desc: 'Seguimos con el día y la hora' }] }] });
  }
  async function pasoDia(neg, c, conv, pre) {
    const cat = await catalogo(neg);
    if (conv.date) {   // ya eligió el día (por ejemplo, desde «¿hay cupos?»)
      const h = await dep.gas(neg, 'horas', { ids: conv.ids, date: conv.date, staffId: conv.staffId || '' });
      if (conv.time && h.horas && h.horas.some((x) => x.time === conv.time)) { conv.horas = h.horas; conv.dia = conv.dia || h.dia; return pasoProfesional(neg, c, conv); }   // 3.10: la hora que eligió sí alcanza
      if (conv.time) { const ant = conv.time; delete conv.time; if (h.horas && h.horas.length) return pasoHora(neg, c, conv, (pre || '') + '😕 A las ' + horaTxt(ant) + ' no alcanza el tiempo para ' + (conv.ids.length > 1 ? 'esos servicios' : 'ese servicio') + '. Mira las horas que sí sirven 👇\n\n', h); }
      if (h.horas && h.horas.length) return pasoHora(neg, c, conv, pre, h);
      pre = (pre || '') + '😕 ' + (h.dia || 'Ese día') + ' ya no alcanza el tiempo para ' + (conv.ids.length > 1 ? 'esos servicios' : 'ese servicio') + '.\n\n';
      delete conv.date;
    }
    const d = await dep.gas(neg, 'dias', { ids: conv.ids, staffId: conv.staffId || '' });
    if (!d.dias || !d.dias.length) { fin(c.k); return dep.texto(neg, c.tel, (pre || '') + T.sinDias(cat)); }
    conv.paso = 'dia';
    return lista(neg, c, conv, { texto: (pre || '') + '📅 *¿Qué día te queda bien?*', boton: 'Elegir día', pie: pie(cat),
      secciones: [{ titulo: 'Días con cupo', filas: d.dias.slice(0, 10).map((x) => ({ id: 'dia:' + x.date, titulo: corto(x.dia, 24), desc: x.n + (x.n === 1 ? ' hora libre' : ' horas libres') })) }] });
  }
  async function pasoHora(neg, c, conv, pre, h) {
    const cat = await catalogo(neg);
    h = h || await dep.gas(neg, 'horas', { ids: conv.ids, date: conv.date, staffId: conv.staffId || '' });
    const H = h.horas || [];
    if (!H.length) { delete conv.date; return pasoDia(neg, c, conv, '😕 Ese día ya se llenó.\n\n'); }
    conv.horas = H;
    const pag = conv.pagH || 0, por = 8, vista = H.slice(pag * por, pag * por + por);
    const fila = (x) => ({ id: 'hora:' + x.time, titulo: x.hora, desc: x.staff.length === 1 && (cat.staff || []).length > 1 ? 'con ' + x.staff[0].nombre : '' });
    const man = vista.filter((x) => x.time < '12:00').map(fila), tar = vista.filter((x) => x.time >= '12:00').map(fila);
    const otras = [];
    if (H.length > (pag + 1) * por) otras.push({ id: 'mas:hora', titulo: 'Ver más horas ➡️', desc: 'Más tarde ese día' });
    otras.push({ id: 'otro:dia', titulo: '📅 Otro día', desc: '' });
    const secciones = [];
    if (man.length) secciones.push({ titulo: '🌅 Mañana', filas: man });
    if (tar.length) secciones.push({ titulo: '🌇 Tarde', filas: tar });
    secciones.push({ titulo: 'Más', filas: otras });
    conv.paso = 'hora';
    return lista(neg, c, conv, { texto: (pre || '') + '⏰ *Horas libres · ' + (h.dia || conv.date) + '*', boton: 'Elegir hora', pie: pie(cat), secciones });
  }
  async function pasoProfesional(neg, c, conv) {
    const cat = await catalogo(neg), x = (conv.horas || []).find((y) => y.time === conv.time);
    const S = (x && x.staff) || [];
    if (conv.staffId && S.some((s) => s.id === conv.staffId)) return pasoDatos(neg, c, conv);
    if (S.length <= 1) { conv.staffId = S[0] ? S[0].id : ''; return pasoDatos(neg, c, conv); }
    conv.paso = 'pro';
    return lista(neg, c, conv, { texto: '💈 ¿Con quién?', boton: 'Elegir', pie: pie(cat),
      secciones: [{ titulo: corto(cat.staffLabel || 'Profesional', 24), filas: S.slice(0, 9).map((s) => ({ id: 'pro:' + s.id, titulo: corto(s.nombre, 24), desc: '' })).concat([{ id: 'pro:', titulo: 'El que esté libre', desc: '' }]) }] });
  }
  async function pasoDatos(neg, c, conv) {
    const cl = cliente(c.k), cat = await catalogo(neg), b = cfg(neg, cat);
    if (conv.modo === 'reagendar') return pasoConfirmar(neg, c, conv);
    if (!cl.nombre && !b.pedirNombre) { const n = String(c.nombre || '').trim().split(/\s+/).slice(0, 2).join(' '); cl.nombre = /^[\p{L}][\p{L} .'-]{1,40}$/u.test(n) ? n : 'Cliente'; }
    if (cl.correo === undefined && !b.pedirCorreo) cl.correo = '';
    if (!cl.nombre) { conv.paso = 'nombre'; conv.t = ahora(); mem().conv[c.k] = conv; dep.guardar(); return dep.texto(neg, c.tel, '🙋 ¿A nombre de quién agendo la cita?'); }
    if (cl.correo === undefined) { conv.paso = 'correo'; conv.t = ahora(); mem().conv[c.k] = conv; dep.guardar(); return dep.texto(neg, c.tel, T.pideCorreo()); }
    return pasoConfirmar(neg, c, conv);
  }
  async function pasoConfirmar(neg, c, conv) {
    const cat = await catalogo(neg), sel = elegidos(cat, conv.ids), cl = cliente(c.k);
    const x = (conv.horas || []).find((y) => y.time === conv.time) || {};
    const con = conv.staffId ? ((x.staff || []).find((s) => s.id === conv.staffId) || {}).nombre : '';
    conv.paso = 'confirmar';
    if (conv.modo === 'reagendar') return lista(neg, c, conv, { texto: T.parafrasisCambio({ antes: conv.antes, dia: conv.dia || '', hora: x.hora || conv.time, con }), boton: 'Ver opciones', pie: pie(cat),
      secciones: [{ titulo: '¿Lo confirmo?', filas: [{ id: 'ok:si', titulo: '✅ Sí, cambiarla', desc: '' }, { id: 'ok:no', titulo: '↩️ Dejarla como estaba', desc: '' }] }] });
    return lista(neg, c, conv, { texto: T.parafrasis({ servicios: sel.map((s) => s.nombre).join(' + '), total: total(sel), min: sel.reduce((a, s) => a + s.min, 0), dia: conv.dia || '', hora: x.hora || conv.time, con, nombre: cl.nombre, abono: Math.min(Number(cat.abono || 0), total(sel)) }),
      boton: 'Ver opciones', pie: pie(cat), secciones: [{ titulo: '¿Lo confirmo?', filas: [{ id: 'ok:si', titulo: '✅ Sí, confirmar', desc: '' }, { id: 'ok:no', titulo: '✏️ Cambiar algo', desc: 'Empezamos de nuevo' }] }] });
  }
  async function crearCita(neg, c, conv) {
    const cat = await catalogo(neg), cl = cliente(c.k);
    if (conv.modo === 'reagendar') {
      const r = await dep.gas(neg, 'reagendar', { code: conv.code, phone: c.tel, date: conv.date, time: conv.time, staffId: conv.staffId || '' });
      if (!r.ok && r.motivo === 'ocupada') { delete conv.time; return pasoHora(neg, c, conv, '😕 Esa hora la acaban de tomar. Mira las que quedan 👇\n\n'); }
      fin(c.k);
      if (!r.ok) return dep.texto(neg, c.tel, '😕 ' + r.motivo);
      dep.anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'reagendó por WhatsApp ' + r.cita.code });
      return dep.texto(neg, c.tel, T.reagendada(r.cita));
    }
    const r = await dep.gas(neg, 'crear', { phone: c.tel, nombre: cl.nombre, email: cl.correo || '', ids: conv.ids, date: conv.date, time: conv.time, staffId: conv.staffId || '' });
    if (!r.ok) {
      if (r.motivo === 'ocupada') { delete conv.time; return pasoHora(neg, c, conv, '😕 Esa hora la acaban de tomar. Mira las que quedan 👇\n\n'); }
      fin(c.k); dep.anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'no se pudo agendar: ' + r.motivo });
      return dep.texto(neg, c.tel, '😕 ' + r.motivo + '\n\nTambién puedes agendar aquí: ' + cat.link);
    }
    fin(c.k);
    aprender(cl, conv, r.cita);
    dep.anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: 'agendó por WhatsApp ' + r.cita.code + ' (' + r.cita.status + ')' });
    return dep.texto(neg, c.tel, T.citaHecha(r.cita, { medios: r.medios, holdMinutes: r.holdMinutes, negocio: cat.negocio }, cl.nombre, !!cl.correo));
  }
  // 🧠 aprende la combinación habitual (servicios + profesional) para ofrecer «¿Lo de siempre?»
  function aprender(cl, conv, cita) {
    const key = conv.ids.slice().sort().join('+') + '|' + (cita.con || '');
    cl.combos = cl.combos || {};
    const x = cl.combos[key] = cl.combos[key] || { n: 0, ids: conv.ids.slice(), staffId: conv.staffId || '', servicio: cita.servicio, con: cita.con || '' };
    x.n++; x.t = ahora();
    cl.visitas = (cl.visitas || 0) + 1;
    dep.guardar();
  }
  function favorito(cl, cat) {
    const ids = new Set([].concat(...(cat.categorias || []).map((x) => x.servicios.map((s) => s.id))));
    const L = Object.values(cl.combos || {}).filter((x) => x.ids.every((id) => ids.has(id))).sort((a, b) => b.n - a.n || (b.t || 0) - (a.t || 0));
    return L[0] || null;
  }

  // ---------- ¿hay cupos? ----------
  // 3.10: «📅 Estos son los cupos de hoy. Elige tu hora 👇» + lista con las HORAS (mañana/tarde) + «📅 Mañana» + «🗓️ Otro día».
  //       Eligió hora → servicio → (con quién) → «¿Lo confirmo?». Otro día → días con cupo → horas de ese día → servicio…
  async function cupos(neg, c, pre, fecha) {
    const h = hoy(), pedida = fecha || fechaPedida(c.texto, h) || h;
    const lejos = Math.round((Date.parse(pedida) - Date.parse(h)) / 86400000);
    const r = await dep.gas(neg, 'cupos', { dias: lejos >= 6 ? 14 : 7 });
    const D = (r.dias || []).filter((x) => x.libres && x.libres.length);
    if (!D.length) { fin(c.k); return dep.texto(neg, c.tel, (pre || '') + T.sinCupos(r)); }
    let d = D.find((x) => x.date === pedida), aviso = '';
    if (!d) { const cual = pedida === h ? 'Hoy' : ((r.dias || []).find((x) => x.date === pedida) || {}).dia || 'Ese día'; d = D.find((x) => x.date > pedida) || D[0]; aviso = '😕 ' + cual + ' ya no hay cupos.\n'; }
    return horasCupos(neg, c, { paso: 'horaCupos', ids: [], dias: D.map((x) => ({ date: x.date, dia: x.dia, n: x.libres.length })), link: r.link, negocio: r.negocio }, d, (pre || '') + aviso);
  }
  async function horasCupos(neg, c, conv, d, pre) {
    conv.paso = 'horaCupos'; conv.date = d.date; conv.dia = d.dia;
    const pag = conv.pagHC || 0, por = 8, L = d.libres.map((t, i) => ({ t, hora: d.horas[i] })), vista = L.slice(pag * por, pag * por + por);
    const fila = (x) => ({ id: 'hc:' + x.t, titulo: x.hora });
    const sec = [];
    const man = vista.filter((x) => x.t < '12:00').map(fila), tar = vista.filter((x) => x.t >= '12:00').map(fila);
    if (man.length) sec.push({ titulo: '🌅 Mañana', filas: man });
    if (tar.length) sec.push({ titulo: '🌇 Tarde', filas: tar });
    const mas = [];
    if (L.length > (pag + 1) * por) mas.push({ id: 'hc:mas', titulo: 'Ver más horas ➡️', desc: 'Más tarde ese día' });
    const sig = (conv.dias || []).find((x) => x.date > d.date);
    if (sig && d.date === hoy()) mas.push({ id: 'hc:dia:' + sig.date, titulo: '📅 ' + corto(sig.dia, 22), desc: sig.n + (sig.n === 1 ? ' cupo' : ' cupos') });
    mas.push({ id: 'hc:otro', titulo: '🗓️ Otro día', desc: 'Elige la fecha' });
    sec.push({ titulo: 'Otro día', filas: mas });
    const cual = d.date === hoy() ? 'de hoy' : d.dia.toLowerCase() === 'mañana' ? 'de mañana' : 'del ' + d.dia.charAt(0).toLowerCase() + d.dia.slice(1);
    return lista(neg, c, conv, { texto: (pre || '') + '📅 *Estos son los cupos ' + cual + '.*\nElige tu hora 👇' + (conv.link ? '\n\nTambién puedes agendar aquí: ' + conv.link : ''), boton: 'Ver horas', pie: (conv.negocio || '') + ' · asistente virtual', secciones: sec });
  }
  async function diasCupos(neg, c, conv) {
    conv.paso = 'diaCupos';
    return lista(neg, c, conv, { texto: '🗓️ *¿Qué día te sirve?*', boton: 'Elegir día', pie: (conv.negocio || '') + ' · asistente virtual',
      secciones: [{ titulo: 'Días con cupo', filas: (conv.dias || []).slice(0, 10).map((x) => ({ id: 'dia:' + x.date, titulo: corto(x.dia, 24), desc: x.n + (x.n === 1 ? ' cupo' : ' cupos') })) }] });
  }

  // ---------- empezar a agendar ----------
  async function agendar(neg, c, pre, extra) {
    const cat = await catalogo(neg), cl = cliente(c.k);
    const conv = Object.assign({ ids: [] }, extra || {});
    // ¿escribió de una los servicios? («quiero corte y barba»)
    const t = sinTilde(c.texto), todos = [].concat(...(cat.categorias || []).map((x) => x.servicios));
    const dichos = todos.filter((s) => { const n = sinTilde(s.nombre); return n.length >= 4 && t.includes(n); });
    if (dichos.length) { conv.ids = dichos.map((s) => s.id); return pasoMas(neg, c, conv); }
    const fav = !extra && cfg(neg, cat).loDeSiempre && favorito(cl, cat);
    if (fav) {
      conv.paso = 'siempre'; conv.fav = fav;
      return lista(neg, c, conv, { texto: (pre || '') + '¿Lo de siempre? *' + fav.servicio + '*' + (fav.con ? ' con *' + fav.con + '*' : '') + ' 😊', boton: 'Ver opciones', pie: pie(cat),
        secciones: [{ titulo: 'Tu cita', filas: [{ id: 'fav:si', titulo: '✅ Sí, lo de siempre', desc: corto(fav.servicio, 70) }, { id: 'fav:no', titulo: '📋 Elegir otra cosa', desc: '' }] }] });
    }
    return pasoCategoria(neg, c, conv, pre);
  }

  // ---------- el cliente respondió dentro de un agendamiento ----------
  async function seguir(neg, c, conv) {
    const t = sinTilde(c.texto);
    const cat = await catalogo(neg), cl = cliente(c.k);
    if (conv.paso === 'recordatorio') {   // respuesta al recordatorio: sí / cancelar / modificar
      const b = cfg(neg, cat);
      if (QUIERE_CANCELAR.test(t) && b.cambios) return cancelarCita(neg, c, conv.cita);
      if (QUIERE_MODIFICAR.test(t) && b.cambios) return modificarCita(neg, c, conv.cita);
      if (SI.test(t) || /\b(voy|ahi estare|alla estare|confirm|asisto|llego)\b/.test(t)) {
        fin(c.k);
        const r = await dep.gas(neg, 'asistencia', { code: conv.cita.code, phone: c.tel });
        dep.anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: r.ok ? 'confirmó que viene ' + conv.cita.code : 'confirmar: ' + r.motivo });
        return dep.texto(neg, c.tel, r.ok ? T.asistio(conv.cita, cl.nombre || conv.cita.nombre) : '😕 ' + r.motivo);
      }
      if (NO.test(t)) return dep.texto(neg, c.tel, b.cambios ? '¿Qué prefieres? Escribe *cancelar* o *modificar* 🙏' : '¿Necesitas cambiarla? Aquí puedes: ' + conv.cita.link);
      fin(c.k); return null;   // habló de otra cosa: se atiende como mensaje normal
    }
    if (conv.paso === 'cancelarSeguro') {
      if (SI.test(t) || c.rowId === 'can:si') return cancelarCita(neg, c, conv.cita, true);
      fin(c.k); return dep.texto(neg, c.tel, '👌 Listo, tu cita sigue igual. ¡Te esperamos!');
    }
    if (SALIR.test(t)) { fin(c.k); return dep.texto(neg, c.tel, 'Listo, lo dejamos así 👌 Cuando quieras, escribe *agendar*.'); }
    if (conv.paso === 'nombre') {
      const n = String(c.texto || '').trim().replace(/^(a nombre de|soy|me llamo|mi nombre es)\s+/i, '').split(/\s+/).slice(0, 3).join(' ');
      if (!/^[\p{L}][\p{L} .'-]{1,40}$/u.test(n)) return dep.texto(neg, c.tel, '🙋 Escríbeme solo tu nombre, por favor (ej. *Andrés*).');
      cl.nombre = n.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); dep.guardar();
      return pasoDatos(neg, c, conv);
    }
    if (conv.paso === 'correo') {
      const e = String(c.texto || '').trim().toLowerCase();
      if (CORREO.test(e)) cl.correo = e;
      else if (NO.test(t)) cl.correo = '';
      else if (!conv.correoMal) { conv.correoMal = true; mem().conv[c.k] = conv; dep.guardar(); return dep.texto(neg, c.tel, '📧 Ese correo no parece válido. Escríbelo así: *nombre@gmail.com*, o responde *no*.'); }
      else cl.correo = '';
      dep.guardar();
      return pasoConfirmar(neg, c, conv);
    }
    // vuelve a preguntar por cupos («¿y mañana hay cupo?»): se responde la pregunta, no se toma como opción elegida
    if (!c.rowId && QUIERE_CUPOS.test(t) && conv.paso !== 'hora') {
      if (conv.paso === 'horaCupos') return cupos(neg, c, '', fechaPedida(c.texto, hoy()) || conv.date);
      const f = conv.paso === 'dia' && fechaPedida(c.texto, hoy());
      const op = f && (conv.opciones || []).find((x) => x.id === 'dia:' + f);
      if (op) return seguir(neg, Object.assign({}, c, { rowId: op.id, texto: op.titulo }), conv);
      return cupos(neg, c);
    }
    const o = elegir(conv, c);
    if (!o) {
      if (conv.paso === 'confirmar' && SI.test(t)) return crearCita(neg, c, conv);
      if (conv.paso === 'confirmar' && NO.test(t) && conv.modo === 'reagendar') { fin(c.k); return dep.texto(neg, c.tel, '👌 Listo, tu cita sigue igual. ¡Te esperamos!'); }
      if (conv.paso === 'confirmar' && NO.test(t)) return agendar(neg, c, '✏️ Listo, empecemos de nuevo.\n\n', { ids: [] });
      if (conv.paso === 'mas' && (NO.test(t) || /solo eso|nada mas|eso es todo/.test(t))) return pasoDia(neg, c, conv);
      if (conv.paso === 'mas' && SI.test(t)) return pasoCategoria(neg, c, conv);
      if (conv.paso === 'siempre' && SI.test(t)) { conv.ids = conv.fav.ids.slice(); conv.staffId = conv.fav.staffId; return pasoDia(neg, c, conv); }
      if (conv.paso === 'siempre' && NO.test(t)) return pasoCategoria(neg, c, { ids: [] });
      if ((conv.paso === 'diaCupos' || conv.paso === 'horaCupos') && (QUIERE_AGENDAR.test(t) || SI.test(t))) return agendar(neg, c, '', { ids: [] });
      const f = (conv.paso === 'dia' || conv.paso === 'diaCupos' || conv.paso === 'horaCupos') && fechaPedida(c.texto, hoy());
      if (f && conv.paso === 'horaCupos') return cupos(neg, c, '', f);
      if (f) { const op = (conv.opciones || []).find((x) => x.id === 'dia:' + f); if (op) return seguir(neg, Object.assign({}, c, { rowId: op.id }), conv); }
      return reenviar(neg, c, conv);
    }
    const [tipo, val] = o.id.split(/:(.*)/s);
    if (tipo === 'cat') { conv.cat = (cat.categorias || [])[Number(val)].nombre; conv.pag = 0; return pasoServicio(neg, c, conv); }
    if (tipo === 'otra') { conv.pag = 0; return pasoCategoria(neg, c, conv); }
    if (o.id === 'mas:svc') { conv.pag = (conv.pag || 0) + 1; return pasoServicio(neg, c, conv); }
    if (tipo === 'svc') { conv.ids = (conv.ids || []).concat(val); conv.pag = 0; return pasoMas(neg, c, conv); }
    if (o.id === 'mas:si') return pasoCategoria(neg, c, conv);
    if (o.id === 'mas:no') return pasoDia(neg, c, conv);
    if (o.id === 'fav:si') { conv.ids = conv.fav.ids.slice(); conv.staffId = conv.fav.staffId; return pasoDia(neg, c, conv); }
    if (o.id === 'fav:no') return pasoCategoria(neg, c, { ids: [] });
    if (o.id === 'hc:mas') { conv.pagHC = (conv.pagHC || 0) + 1; return cupos(neg, c, '', conv.date); }
    if (o.id === 'hc:otro') return diasCupos(neg, c, conv);
    if (o.id.startsWith('hc:dia:')) { conv.pagHC = 0; return cupos(neg, c, '', o.id.slice(7)); }
    if (tipo === 'hc') { return agendar(neg, c, '🕐 *' + o.titulo + '* · ' + (conv.dia || '') + '\n\n', { ids: [], date: conv.date, dia: conv.dia, time: val }); }
    if (tipo === 'dia') {
      if (conv.paso === 'diaCupos') { conv.pagHC = 0; return cupos(neg, c, '', val); }
      conv.date = val; conv.dia = o.titulo; conv.pagH = 0;
      if (!(conv.ids || []).length) { conv.ids = []; return agendar(neg, c, '', { ids: [], date: val, dia: o.titulo }); }
      return pasoHora(neg, c, conv);
    }
    if (o.id === 'otro:dia') { delete conv.date; return pasoDia(neg, c, conv); }
    if (o.id === 'mas:hora') { conv.pagH = (conv.pagH || 0) + 1; return pasoHora(neg, c, conv); }
    if (tipo === 'hora') { conv.time = val; return pasoProfesional(neg, c, conv); }
    if (tipo === 'pro') { conv.staffId = val || ((conv.horas || []).find((y) => y.time === conv.time) || { staff: [{}] }).staff[0].id || ''; return pasoDatos(neg, c, conv); }
    if (o.id === 'ok:si') return crearCita(neg, c, conv);
    if (o.id === 'ok:no' && conv.modo === 'reagendar') { fin(c.k); return dep.texto(neg, c.tel, '👌 Listo, tu cita sigue igual. ¡Te esperamos!'); }
    if (o.id === 'ok:no') return agendar(neg, c, '✏️ Listo, empecemos de nuevo.\n\n', { ids: [] });
    return reenviar(neg, c, conv);
  }
  async function reenviar(neg, c, conv) {
    const pre = 'No te entendí 🙈 Elige una opción de la lista 👇\n\n';
    if (conv.paso === 'cat') return pasoCategoria(neg, c, conv, pre);
    if (conv.paso === 'svc') return pasoServicio(neg, c, conv, pre);
    if (conv.paso === 'mas') return pasoMas(neg, c, conv);
    if (conv.paso === 'dia') return pasoDia(neg, c, conv, pre);
    if (conv.paso === 'hora') return pasoHora(neg, c, conv, pre);
    if (conv.paso === 'pro') return pasoProfesional(neg, c, conv);
    if (conv.paso === 'confirmar') return pasoConfirmar(neg, c, conv);
    if (conv.paso === 'diaCupos') return diasCupos(neg, c, conv);
    if (conv.paso === 'horaCupos') return cupos(neg, c, pre, conv.date);
    if (conv.paso === 'siempre') return agendar(neg, c, pre);
    fin(c.k); return null;
  }
  // ---------- cancelar / modificar desde WhatsApp ----------
  async function cancelarCita(neg, c, cita, yaSeguro) {
    fin(c.k);
    const r = await dep.gas(neg, 'cancelar', { code: cita.code, phone: c.tel });
    dep.anotar({ bid: neg.bid, chat: c.tel.slice(-4), que: r.ok ? 'canceló por WhatsApp ' + cita.code : 'cancelar: ' + r.motivo });
    return dep.texto(neg, c.tel, r.ok ? T.cancelada(Object.assign({}, r, { cita: r.cita || cita })) : '😕 ' + r.motivo + (cita.link ? '\n' + cita.link : ''));
  }
  async function modificarCita(neg, c, cita) {
    const conv = { modo: 'reagendar', code: cita.code, ids: (cita.ids || []).slice(), staffId: cita.staffId || '', antes: (cita.dia || '').toLowerCase() + ' a las ' + cita.hora };
    if (!conv.ids.length) { fin(c.k); return dep.texto(neg, c.tel, 'Para cambiarla, entra aquí: ' + cita.link); }
    return pasoDia(neg, c, conv, '🔄 Vamos a cambiar tu cita.\n\n');
  }
  // después de mandar el recordatorio: la próxima respuesta del cliente es sobre ESA cita
  function trasRecordatorio(neg, tel, cita) {
    mem().conv[neg.bid + ':' + tel] = { paso: 'recordatorio', cita, t: ahora(), vence: VENCE_RECORDATORIO }; dep.guardar();
  }
  function elegidos(cat, ids) { const todos = [].concat(...(cat.categorias || []).map((x) => x.servicios)); return (ids || []).map((id) => todos.find((s) => s.id === id)).filter(Boolean); }
  function total(sel) { return sel.reduce((a, s) => a + Number(s.precio || 0), 0); }

  // ---------- entrada: un mensaje de texto (o audio, o una opción de lista) ----------
  // Devuelve: 'flujo' | 'cupos' | 'agendar' | 'audio' | null (null = lo atiende la respuesta de siempre: su cita o el link)
  async function manejar(neg, c) {
    const M = mem(), conv = M.conv[c.k];
    if (conv && ahora() - (conv.t || 0) > (conv.vence || VENCE_FLUJO)) fin(c.k);
    const vivo = M.conv[c.k];
    const t = sinTilde(c.texto);
    if (c.audio) {
      const cat = await catalogo(neg).catch(() => ({ negocio: '' }));
      await dep.texto(neg, c.tel, saludo(c.k, cat.negocio, c.nombre) + T.audio());
      return 'audio';
    }
    // agenda suspendida por el dueño o la plataforma: no agenda ni muestra cupos (el catálogo queda en memoria 10 min: no gasta cupo)
    const cerrada = async () => { const cat = await catalogo(neg); if (cat.activo === false) { fin(c.k); return true; } return false; };
    if (vivo && vivo.paso === 'menu') {   // el menú del saludo: si no eligió nada de ahí, se atiende como mensaje nuevo
      const o = elegir(vivo, c); fin(c.k);
      if (o && await cerrada()) return 'suspendida';
      if (o && o.id === 'menu:agendar' && cfg(neg).agendar) { await agendar(neg, c, ''); return 'agendar'; }
      if (o && o.id === 'menu:cupos' && cfg(neg).cupos) { await cupos(neg, Object.assign({}, c, { texto: 'hoy' })); return 'cupos'; }
    } else if (vivo && (c.rowId || t)) { if (await cerrada()) return 'suspendida'; const r = await seguir(neg, c, vivo); if (r !== null) return 'flujo'; }
    const b = cfg(neg);
    // «quiero cancelar mi cita» / «necesito cambiar la hora» (si el dueño lo permite y tiene una cita activa)
    if (b.cambios && (QUIERE_CANCELAR.test(t) || QUIERE_MODIFICAR.test(t))) {
      if (await cerrada()) return 'suspendida';
      const info = await dep.gas(neg, 'chat', { phone: c.tel });
      const cita = (info.citas || [])[0];
      if (cita) {
        const sal = saludo(c.k, info.negocio, c.nombre, !b.saludoDiario);
        if (QUIERE_CANCELAR.test(t)) { const cv = { paso: 'cancelarSeguro', cita }; return (await lista(neg, c, cv, { texto: sal + T.preguntaCancelar(cita), boton: 'Ver opciones', pie: info.negocio + ' · asistente virtual', secciones: [{ titulo: 'Tu cita', filas: [{ id: 'can:si', titulo: '🚫 Sí, cancelarla', desc: '' }, { id: 'can:no', titulo: '↩️ No, la mantengo', desc: '' }] }] }), 'flujo'); }
        await modificarCita(neg, c, cita); return 'flujo';
      }
    }
    if (QUIERE_CUPOS.test(t) && b.cupos) { if (await cerrada()) return 'suspendida'; const cat = await catalogo(neg); await cupos(neg, c, saludo(c.k, cat.negocio, c.nombre, !cfg(neg, cat).saludoDiario)); return 'cupos'; }
    if (QUIERE_AGENDAR.test(t) && b.agendar) { if (await cerrada()) return 'suspendida'; const cat = await catalogo(neg); await agendar(neg, c, saludo(c.k, cat.negocio, c.nombre, !cfg(neg, cat).saludoDiario)); return 'agendar'; }
    return null;
  }
  // La respuesta de siempre (su cita o el link) va como LISTA con «Agendar por aquí» y «Ver cupos»
  async function menu(neg, c, texto, negocio) {
    const b = cfg(neg), filas = [];
    if (b.agendar) filas.push({ id: 'menu:agendar', titulo: '📅 Agendar por aquí', desc: 'Te ayudo paso a paso' });
    if (b.cupos) filas.push({ id: 'menu:cupos', titulo: '🕐 Ver cupos', desc: 'Días y horas disponibles' });
    return lista(neg, c, { paso: 'menu', ids: [] }, { texto, boton: 'Ver opciones', pie: (negocio || '') + ' · asistente virtual', secciones: [{ titulo: '¿Qué hacemos?', filas }] });
  }
  return { manejar, menu, saludo, trasRecordatorio, cliente, fechaPedida: (t) => fechaPedida(t, hoy()), _cat: catCache };
}

module.exports = { crear, fechaPedida, sinTilde, QUIERE_CUPOS, QUIERE_AGENDAR, SALUDO };
