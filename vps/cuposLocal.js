// 💰 3.30 · AHORRO DE GOOGLE: los cupos, los días y las horas libres se calculan AQUÍ (en el VPS), leyendo directo de la base
//    (Firestore) lo mismo que ya lee la página del cliente sin cuenta: configuración, equipo, servicios y cupos ocupados.
//    Google queda para ESCRIBIR (crear, cancelar, reagendar, pagos) y para lo privado (las citas del cliente).
//    Misma regla que el servidor (mary.gs: maryLibres_, maryCupos_, maryDias_) y que la página (common.js: computeSlots).
//    Si algo falla (la base no deja leer, no hay red…), quien llama usa Google como siempre: nada se rompe.
'use strict';

const tmin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const mstr = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const hora12 = (t) => { let [h, m] = String(t).split(':').map(Number); const ap = h >= 12 ? 'p. m.' : 'a. m.'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function sumarDias(f, n) { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }
function dow(f) { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
function diaTxt(f, hoy) {
  if (f === hoy) return 'Hoy';
  if (f === sumarDias(hoy, 1)) return 'Mañana';
  const [, m, d] = f.split('-').map(Number);
  return DIAS[dow(f)] + ' ' + d + ' de ' + MESES[m - 1];
}
// horario de un profesional ese día: el suyo o el del negocio, sin días libres ni días cerrados
function horario(st, sf, date) {
  if ((st.closedDates || []).includes(date)) return [];
  if ((sf.offDates || []).includes(date)) return [];
  const d = String(dow(date));
  if (sf.ownHours && sf.hours) return sf.hours[d] || [];
  return (st.businessHours || {})[d] || [];
}
const ocupa = (total, slot) => Math.max(slot, Math.ceil(total / slot) * slot);
// horas libres de un día: [{ time, staffIds }]  ·  ids = servicios elegidos (vacío = un turno, como «cupos»)
function libres({ st, staff, servicios, locks, date, ids, staffId, ahora }) {
  const slot = Number(st.slotDurationMinutes || 30);
  let total = slot;
  if (ids && ids.length) {
    const by = {}; servicios.forEach((s) => { by[s.id] = s; });
    const sel = ids.map((id) => by[id]).filter(Boolean);
    if (!sel.length) throw new Error('servicio desconocido');   // que lo resuelva Google
    total = sel.reduce((a, s) => a + Number(s.minutes || 0), 0);
  }
  const occ = ids && ids.length ? ocupa(total, slot) : slot;
  if ((st.closedDates || []).includes(date)) return [];
  const taken = new Set(locks.filter((l) => l.date === date).map((l) => l.staffId + '_' + l.time));
  const minStart = date === ahora.fecha ? ahora.min + Number(st.minAdvanceMinutes || 0) : date < ahora.fecha ? Infinity : -1;
  const capaces = staff.filter((x) => x.active !== false && (!staffId || x.id === staffId) && (!ids || !ids.length || !x.serviceIds || !x.serviceIds.length || ids.every((id) => x.serviceIds.includes(id))));
  const out = new Map();
  for (const sf of capaces) {
    for (const h of horario(st, sf, date)) {
      for (let t = tmin(h.open); t + occ <= tmin(h.close); t += slot) {
        if (t < minStart) continue;
        let libre = true;
        for (let u = t; u < t + occ; u += 15) if (taken.has(sf.id + '_' + mstr(u))) { libre = false; break; }
        if (libre) { if (!out.has(t)) out.set(t, []); out.get(t).push(sf.id); }
      }
    }
  }
  return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([t, s]) => ({ time: mstr(t), staffIds: s }));
}
const ventana = (st) => Math.min(Number(st.bookingWindowDays || 30), 21);

// ---------- lectura directa de la base (pública, como la página) ----------
function crear({ fetch: f, url, proyecto, llave, ahora, cacheMs = 60000, locksMs = 15000 }) {
  const base = (bid) => url + '/v1/projects/' + proyecto + '/databases/(default)/documents/businesses/' + encodeURIComponent(bid);
  const C = new Map();
  const deFs = (v) => {
    if (!v || typeof v !== 'object') return null;
    if ('booleanValue' in v) return v.booleanValue; if ('integerValue' in v) return Number(v.integerValue); if ('doubleValue' in v) return v.doubleValue;
    if ('stringValue' in v) return v.stringValue; if ('nullValue' in v) return null; if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return ((v.arrayValue || {}).values || []).map(deFs);
    if ('mapValue' in v) { const o = {}; Object.entries(((v.mapValue || {}).fields) || {}).forEach(([k, x]) => { o[k] = deFs(x); }); return o; }
    return null;
  };
  const doc = (d) => Object.assign({ id: String(d.name || '').split('/').pop() }, deFs({ mapValue: { fields: d.fields || {} } }));
  async function pedir(u, opts) {
    const r = await f(u, Object.assign({ signal: AbortSignal.timeout(8000) }, opts || {}));
    if (!r.ok) throw new Error('la base respondió ' + r.status);
    return r.json();
  }
  async function guardado(k, ms, fn) { const x = C.get(k); if (x && Date.now() - x.t < ms) return x.v; const v = await fn(); C.set(k, { t: Date.now(), v }); return v; }
  const ajustes = (bid) => guardado('st:' + bid, cacheMs, async () => doc(await pedir(base(bid) + '/settings/general?key=' + llave)));
  const lista = (bid, col) => guardado(col + ':' + bid, cacheMs, async () => ((await pedir(base(bid) + '/' + col + '?pageSize=300&key=' + llave)).documents || []).map(doc));
  const ocupados = (bid, date) => guardado('lk:' + bid + ':' + date, locksMs, async () => {
    const q = { structuredQuery: { from: [{ collectionId: 'slotLocks' }], where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: { stringValue: date } } } } };
    const r = await pedir(base(bid) + ':runQuery?key=' + llave, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
    return (Array.isArray(r) ? r : []).filter((x) => x.document).map((x) => doc(x.document));
  });
  async function datos(bid) {
    const [st, staff, servicios] = await Promise.all([ajustes(bid), lista(bid, 'staff'), lista(bid, 'services')]);
    return { st, staff: staff.map((x) => Object.assign({}, x, { nombre: x.name || '' })), servicios: servicios.filter((s) => s.active !== false) };
  }
  // mismas respuestas que el servidor de Google (ops 'horas', 'dias', 'cupos')
  async function horas(bid, b) {
    const a = ahora(), D = await datos(bid), locks = await ocupados(bid, b.date);
    const L = libres(Object.assign({}, D, { locks, date: b.date, ids: b.ids, staffId: b.staffId, ahora: a }));
    const nom = {}; D.staff.forEach((x) => { nom[x.id] = x.nombre; });
    return { date: b.date, dia: diaTxt(b.date, a.fecha), horas: L.map((x) => ({ time: x.time, hora: hora12(x.time), staff: x.staffIds.map((id) => ({ id, nombre: nom[id] || '' })) })) };
  }
  async function dias(bid, b) {
    const a = ahora(), D = await datos(bid), out = [];
    for (let i = 0; i <= ventana(D.st) && out.length < 10; i++) {
      const date = sumarDias(a.fecha, i);
      if (!D.staff.some((x) => x.active !== false && horario(D.st, x, date).length)) continue;   // nadie atiende: ni se consulta
      const n = libres(Object.assign({}, D, { locks: await ocupados(bid, date), date, ids: b.ids, staffId: b.staffId, ahora: a })).length;
      if (n) out.push({ date, dia: diaTxt(date, a.fecha), n });
    }
    return { dias: out };
  }
  async function cupos(bid, b) {
    const a = ahora(), D = await datos(bid), out = [];
    for (let i = 0; i < Math.max(1, Math.min(14, Number(b.dias || 1))); i++) {
      const date = sumarDias(a.fecha, i), abierto = D.staff.some((x) => x.active !== false && horario(D.st, x, date).length);
      const L = abierto ? libres(Object.assign({}, D, { locks: await ocupados(bid, date), date, ids: [], ahora: a })).map((x) => x.time) : [];
      out.push({ date, dia: diaTxt(date, a.fecha), dow: dow(date), abierto, libres: L, horas: L.map(hora12) });
    }
    return { dias: out };
  }
  return { horas, dias, cupos, olvidar: (bid, date) => { C.delete('lk:' + bid + ':' + date); } };
}

module.exports = { crear, libres, horario, diaTxt, hora12, ocupa };
