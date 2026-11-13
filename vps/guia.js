// 📲 3.43 · ESTADO «CÓMO AGENDAR» (2 imágenes 1080×1920, 2 pasos cada una: 1-2 y 3-4), con el nombre, los servicios, el equipo y las
//    horas REALES del negocio. Todo sale de la base (Firestore) igual que los cupos: NO gasta llamadas de Google.
//    Diseño propio de Tu Agenda (fondo blanco · tinta, azul y rojo del poste). Nada del diseño de Epic.
//    Se dibuja en SVG y se pasa a PNG con resvg (como estado.js). Sin emojis dentro de la imagen (resvg no los dibuja).
'use strict';
const X = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = "Inter, 'Inter Display', 'DejaVu Sans', sans-serif";
const C = { ink: '#17222E', paper: '#EEF1EF', line: '#D3DAD6', red: '#B3202A', blue: '#24508A', brass: '#A9844E', mut: '#5B6670', claro: '#F4F7FB' };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DLARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DCORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// tipo de negocio → nombre, palabra para el equipo y servicios de ejemplo (solo si el negocio aún no tiene servicios)
const TIPOS = {
  barberia: ['Barbería', 'Barbero', [['Corte clásico', 30, 25000], ['Corte + barba', 45, 35000], ['Barba', 20, 15000]]],
  peluqueria: ['Peluquería', 'Estilista', [['Corte', 45, 35000], ['Cepillado', 40, 30000], ['Tinte', 120, 90000]]],
  salon: ['Salón de belleza', 'Estilista', [['Corte y peinado', 60, 45000], ['Cepillado', 40, 30000], ['Manicure', 45, 25000]]],
  unas: ['Uñas', 'Manicurista', [['Manicure', 45, 25000], ['Semipermanente', 60, 40000], ['Pedicure', 50, 30000]]],
  pestanas: ['Cejas y pestañas', 'Especialista', [['Diseño de cejas', 30, 25000], ['Lifting de pestañas', 60, 70000], ['Pestañas pelo a pelo', 90, 90000]]],
  estetica: ['Estética', 'Esteticista', [['Limpieza facial', 60, 80000], ['Hidratación', 45, 60000], ['Depilación', 30, 35000]]],
  spa: ['Spa', 'Terapeuta', [['Masaje relajante', 60, 90000], ['Facial', 50, 80000], ['Día de spa', 120, 180000]]],
  masajes: ['Masajes', 'Masajista', [['Masaje relajante', 60, 80000], ['Descontracturante', 60, 90000], ['Piedras calientes', 75, 110000]]],
  maquillaje: ['Maquillaje', 'Maquillador(a)', [['Maquillaje social', 60, 90000], ['Maquillaje de novia', 120, 250000], ['Peinado', 45, 60000]]],
  tatuajes: ['Tatuajes', 'Tatuador(a)', [['Tatuaje pequeño', 60, 150000], ['Piercing', 30, 60000], ['Sesión completa', 180, 450000]]],
  mascotas: ['Mascotas', 'Groomer', [['Baño', 60, 45000], ['Baño y corte', 90, 70000], ['Corte de uñas', 20, 15000]]],
  otro: ['Tu negocio', 'Profesional', [['Servicio 1', 30, 30000], ['Servicio 2', 45, 45000], ['Servicio 3', 60, 60000]]]
};
const cop = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('es-CO').replace(/,/g, '.');
const durTxt = (m) => (m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min');
function sumarDias(f, n) { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }
function dow(f) { const [y, m, d] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
const hoyMas = (f, hoy) => (f === hoy ? 'Hoy' : f === sumarDias(hoy, 1) ? 'Mañana' : DLARGO[dow(f)] + ' ' + Number(f.slice(8)));
const corto = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

// ---------- 1 · los datos (función pura, con pruebas) ----------
//  st = settings/general · servicios y staff de la base · cupos = respuesta de cuposLocal.cupos (14 días) · biz = businesses/<bid>
function datosGuia({ st, servicios, staff, cupos, biz, hoy, link }) {
  st = st || {}; biz = biz || {};
  const T = TIPOS[st.businessType] || TIPOS.barberia;
  const tipo = st.businessType === 'otro' ? (st.businessTypeLabel || 'Tu negocio') : T[0];
  const activos = (servicios || []).filter((s) => s.active !== false && String(s.name || '').trim());
  const base = activos.filter((s) => s.type === 'base' || !s.type);
  const lista = (base.length ? base : activos).slice(0, 3).map((s) => ({ nombre: s.name, min: Number(s.minutes || 0), precio: Number(s.priceCOP || 0) }));
  const ejemplo = !lista.length;
  const serv = ejemplo ? T[2].map(([nombre, min, precio]) => ({ nombre, min, precio })) : lista;
  const extra = activos.find((s) => s.type && s.type !== 'base');
  const gente = (staff || []).filter((x) => x.active !== false && String(x.name || '').trim()).map((x) => x.name);
  const dias = ((cupos && cupos.dias) || []);
  const dia = dias.find((d) => d.abierto && (d.libres || []).length && d.date !== hoy) || dias.find((d) => d.abierto && (d.libres || []).length) || null;
  const horas = dia ? dia.horas.slice(0, 12) : ['9:00 a. m.', '9:30 a. m.', '10:00 a. m.', '10:30 a. m.', '11:00 a. m.', '2:00 p. m.', '2:30 p. m.', '3:00 p. m.', '4:00 p. m.'];
  const fecha = dia ? dia.date : sumarDias(hoy, 1);
  const elegida = horas[Math.min(2, horas.length - 1)];
  const abono = Number(st.depositAmountCOP || 0);
  return {
    negocio: String(st.businessName || biz.name || tipo).trim(), tipo, staffWord: st.staffLabel || T[1],
    color: /^#[0-9a-f]{6}$/i.test(String(((st.appearance || {}).colors || {}).primary || '')) ? st.appearance.colors.primary : C.ink,
    servicios: serv, ejemplo, extra: extra ? { nombre: extra.name, min: Number(extra.minutes || 0), precio: Number(extra.priceCOP || 0) } : null,
    gente: gente.slice(0, 2), conQuien: gente.length ? gente[0] : '',
    hoy, fecha, diaTxt: hoyMas(fecha, hoy), horas, elegida,
    cerrados: dias.filter((d) => !d.abierto || !(d.libres || []).length).map((d) => d.date),
    abono, mapa: !!(st.address && st.showLocation !== false), link: link || '',
    marca: !((biz.addons || {}).sinMarca)
  };
}

// ---------- 2 · el dibujo ----------
const t = (x, y, s, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${FONT}" font-weight="${o.w || 500}" font-size="${o.z || 30}" fill="${o.c || C.ink}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.d ? ' text-decoration="line-through"' : ''}>${X(s)}</text>`; };
const r = (x, y, w, h, o) => { o = o || {}; return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx == null ? 18 : o.rx}" fill="${o.f || '#FFFFFF'}"${o.s ? ` stroke="${o.s}" stroke-width="${o.sw || 2}"` : ''}${o.da ? ` stroke-dasharray="${o.da}"` : ''}/>`; };
// parte un texto en renglones de hasta n letras
function renglones(s, n) { const out = []; let l = ''; String(s).split(' ').forEach((p) => { if ((l + ' ' + p).trim().length > n) { out.push(l.trim()); l = p; } else l += ' ' + p; }); if (l.trim()) out.push(l.trim()); return out; }

// pantalla del celular: (x, y) arriba a la izquierda, 470 × 900
function celular(info, x, y, cuerpo) {
  const W = 470, H = 900, ini = (String(info.negocio).trim().charAt(0) || 'T').toUpperCase();
  return `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="58" fill="#1B1F24"/>` +
    `<rect x="${x + 14}" y="${y + 14}" width="${W - 28}" height="${H - 28}" rx="46" fill="#FFFFFF"/>` +
    r(x + 40, y + 42, 62, 62, { f: info.color, rx: 18 }) + t(x + 71, y + 85, ini, { w: 800, z: 30, c: '#FFFFFF', a: 'middle' }) +
    t(x + 118, y + 70, corto(info.negocio, 17), { w: 700, z: 28 }) +
    `<circle cx="${x + 124}" cy="${y + 89}" r="6" fill="#10B981"/>` + t(x + 138, y + 97, corto(info.tipo, 18) + ' · Abierto', { z: 20, c: C.mut }) +
    `<rect x="${x + 14}" y="${y + 128}" width="${W - 28}" height="2" fill="${C.line}"/>` + cuerpo(x + 38, y + 160, W - 76);
}
const btn = (x, y, w, txt, f, c) => r(x, y, w, 70, { f, rx: 18 }) + t(x + w / 2, y + 45, txt, { w: 800, z: 25, c: c || '#FFFFFF', a: 'middle' });
const fila = (x, y, w, k, v) => t(x, y, k, { z: 22, c: C.mut }) + t(x + w, y, corto(v, 18), { w: 700, z: 22, a: 'end' }) + `<rect x="${x}" y="${y + 16}" width="${w}" height="1.5" fill="${C.line}"/>`;

const PASOS = [
  { titulo: 'Abre el link y entra', texto: 'Toca el link del negocio. La primera vez creas tu cuenta: con Google es un toque.',
    cuerpo: (info) => (x, y, w) => t(x, y + 30, 'Crea tu cuenta', { w: 700, z: 34 }) + t(x, y + 66, 'Una sola vez, para apartar tus citas.', { z: 20, c: C.mut }) +
      r(x, y + 96, w, 70, { s: C.line, rx: 18 }) + t(x + w / 2 - 158, y + 141, 'G', { w: 800, z: 30, c: '#4285F4' }) + t(x + w / 2 + 14, y + 140, 'Continuar con Google', { w: 700, z: 23, a: 'middle' }) +
      t(x + w / 2, y + 206, 'o con tu correo', { z: 19, c: '#9AA3AB', a: 'middle' }) +
      ['Nombre', 'WhatsApp', 'Correo'].map((k, i) => t(x, y + 252 + i * 112, k, { w: 700, z: 20, c: C.mut }) + r(x, y + 266 + i * 112, w, 64, { s: C.line, rx: 16 }) +
        t(x + 20, y + 307 + i * 112, ['Tu nombre', '+57 300 123 4567', 'tucorreo@gmail.com'][i], { z: 22, c: '#9AA3AB' })).join('') +
      btn(x, y + 610, w, 'Crear cuenta y ver la agenda', C.red) },
  { titulo: 'Elige día y hora', texto: 'Toca el día y una hora libre. Si quieres, elige también con quién.',
    cuerpo: (info) => (x, y, w) => {
      let s = '';
      let cx = x; ['Cualquiera'].concat(info.gente).slice(0, 3).forEach((n, i) => { const nn = corto(n, 10), cw = 30 + nn.length * 12; s += r(cx, y, cw, 48, { f: i ? '#FFFFFF' : C.ink, s: i ? C.line : C.ink, rx: 24 }) + t(cx + cw / 2, y + 32, nn, { w: 700, z: 19, c: i ? C.ink : '#FFFFFF', a: 'middle' }); cx += cw + 10; });
      const [yy, mm] = info.fecha.split('-').map(Number);
      s += t(x, y + 96, MESES[mm - 1].charAt(0).toUpperCase() + MESES[mm - 1].slice(1) + ' ' + yy, { w: 700, z: 24 });
      const cw = w / 7, ini0 = sumarDias(info.hoy, -dow(info.hoy)), ini = info.fecha >= sumarDias(ini0, 14) ? sumarDias(info.fecha, -dow(info.fecha)) : ini0;
      ['D', 'L', 'M', 'M', 'J', 'V', 'S'].forEach((d, i) => { s += t(x + cw * i + cw / 2, y + 136, d, { w: 700, z: 17, c: C.mut, a: 'middle' }); });
      const filas = 2;   // 2 semanas: deja espacio para las horas
      for (let k = 0; k < 7 * filas; k++) {
        const f = sumarDias(ini, k), cxx = x + cw * (k % 7), cyy = y + 154 + Math.floor(k / 7) * 62, sel = f === info.fecha;
        const gris = f < info.hoy || info.cerrados.includes(f);
        if (sel) s += r(cxx + 4, cyy, cw - 8, 52, { f: C.blue, rx: 14 });
        s += t(cxx + cw / 2, cyy + 35, String(Number(f.slice(8))), { w: sel ? 800 : 600, z: 21, c: sel ? '#FFFFFF' : gris ? '#C3C9CE' : C.ink, a: 'middle' });
      }
      s += `<rect x="${x}" y="${y + 296}" width="${w}" height="2" fill="${C.line}"/>`;
      s += t(x, y + 346, 'Horas libres · ' + info.diaTxt + ' ' + Number(info.fecha.slice(8)), { w: 700, z: 23 });
      const hw = (w - 20) / 3;
      info.horas.slice(0, 9).forEach((h, i) => { const hx = x + (i % 3) * (hw + 10), hy = y + 372 + Math.floor(i / 3) * 74, on = h === info.elegida;
        s += r(hx, hy, hw, 62, { f: on ? C.blue : '#FFFFFF', s: on ? C.blue : C.line, rx: 14 }) + t(hx + hw / 2, hy + 40, h.replace(' a. m.', ' am').replace(' p. m.', ' pm'), { w: 700, z: 21, c: on ? '#FFFFFF' : C.ink, a: 'middle' }); });
      return s;
    } },
  { titulo: '¿Qué te vas a hacer?', texto: 'Marca el servicio. Si le sumas algo, el precio y el tiempo se suman solos.',
    cuerpo: (info) => (x, y, w) => {
      let s = t(x, y + 28, '¿Qué te vas a hacer?', { w: 700, z: 28 });
      info.servicios.forEach((sv, i) => { const cy = y + 58 + i * 112, on = i === Math.min(1, info.servicios.length - 1);
        s += r(x, cy, w, 96, { f: on ? C.claro : '#FFFFFF', s: on ? C.blue : C.line, sw: on ? 4 : 2, rx: 18 }) +
          r(x + 20, cy + 30, 30, 30, { f: on ? C.blue : '#FFFFFF', s: on ? C.blue : C.line, rx: 8 }) +
          t(x + 66, cy + 44, corto(sv.nombre, 17), { w: 600, z: 22 }) + t(x + 66, cy + 74, durTxt(sv.min), { z: 18, c: C.mut }) +
          t(x + w - 18, cy + 58, cop(sv.precio), { w: 800, z: 22, c: C.blue, a: 'end' }); });
      if (info.extra) { const cy = y + 58 + info.servicios.length * 112;
        s += t(x, cy + 24, '¿Le agregas algo?', { z: 19, c: C.mut }) + r(x, cy + 40, w, 80, { s: C.line, rx: 18 }) + r(x + 20, cy + 65, 30, 30, { s: C.line, rx: 8 }) +
          t(x + 66, cy + 90, corto(info.extra.nombre, 17), { w: 600, z: 22 }) + t(x + w - 18, cy + 90, '+' + cop(info.extra.precio), { w: 800, z: 22, c: C.blue, a: 'end' }); }
      return s;
    } },
  { titulo: 'Aparta y ¡listo!', texto: (info) => info.abono > 0 ? 'Toca «Apartar cupo», sube la captura del abono y ¡listo!' : 'Toca «Apartar cupo» y te sale tu número de reserva. ¡Listo!',
    cuerpo: (info) => (x, y, w) => {
      const sv = info.servicios[Math.min(1, info.servicios.length - 1)], y0 = y + 92;
      let s = btn(x, y, w, 'Apartar cupo · ' + cop(sv.precio), C.red);
      s += `<rect x="${x}" y="${y0}" width="${w}" height="490" rx="22" fill="#FFFFFF" stroke="${C.line}" stroke-width="2"/>` +
        `<path d="M${x} ${y0 + 22}a22 22 0 0 1 22 -22h${w - 44}a22 22 0 0 1 22 22v186h-${w}z" fill="${C.ink}"/>` +
        `<circle cx="${x + w / 2}" cy="${y0 + 52}" r="28" fill="#10B981"/><path d="M${x + w / 2 - 13} ${y0 + 52}l9 9l17 -18" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
        t(x + w / 2, y0 + 122, 'CITA CONFIRMADA', { w: 800, z: 23, c: '#FFFFFF', a: 'middle', ls: 2 }) + t(x + w / 2, y0 + 180, 'K7P2Q', { w: 800, z: 46, c: '#FFFFFF', a: 'middle', ls: 6 });
      for (let k = 0; k * 28 + 14 <= w; k++) s += `<rect x="${x + k * 28}" y="${y0 + 202}" width="14" height="6" fill="${k % 2 ? C.blue : C.red}"/>`;
      [['Fecha', info.diaTxt + ' ' + Number(info.fecha.slice(8))], ['Hora', info.elegida], ['Con', info.conQuien || 'Quien esté libre'], ['Servicio', sv.nombre]]
        .forEach(([k, v], i) => { s += fila(x + 22, y0 + 262 + i * 58, w - 44, k, v); });
      const half = (w - 12) / 2, yb = y0 + 510;
      if (info.mapa) s += btn(x, yb, half, 'Ir con Waze', '#33CCFF', '#0B2540') + r(x + half + 12, yb, half, 70, { s: C.line, rx: 18 }) + t(x + half + 12 + half / 2, yb + 45, 'Google Maps', { w: 800, z: 23, a: 'middle' });
      else s += r(x, yb, w, 70, { s: C.line, rx: 18 }) + t(x + w / 2, yb + 45, 'Enviar a WhatsApp', { w: 800, z: 23, a: 'middle' });
      return s;
    } }
];
const TITULOS = ['Cómo agendar tu cita', 'Elige y ¡listo!'];
const PIES = [
  ['Sigue en el siguiente estado', 'Ya casi: eliges el servicio y apartas.'],
  ['Agenda tu cita aquí', '']
];
const PARTES = 2;

// parte = 1 o 2 (pasos 1-2 y 3-4)
function svgGuia(info, parte, marcaAgua) {
  const p = Math.max(1, Math.min(PARTES, Number(parte) || 1)), a = PASOS[(p - 1) * 2], b = PASOS[(p - 1) * 2 + 1];
  const col = (paso, n, x) => {
    const L = renglones(typeof paso.texto === 'function' ? paso.texto(info) : paso.texto, 29).slice(0, 3);
    return `<circle cx="${x + 34}" cy="${520}" r="34" fill="${C.ink}"/>` + t(x + 34, 532, String(n), { w: 800, z: 34, c: '#FFFFFF', a: 'middle' }) +
      t(x + 84, 534, corto(paso.titulo, 20), { w: 800, z: 38 }) + L.map((l, i) => t(x, 600 + i * 40, l, { z: 27, c: C.mut })).join('') +
      celular(info, x, 720, paso.cuerpo(info));
  };
  const barras = Array.from({ length: PARTES }, (_, i) => `<rect x="${56 + i * 86}" y="426" width="72" height="12" rx="6" fill="${i === p - 1 ? C.blue : C.line}"/>`).join('');
  const pie = PIES[p - 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<rect width="1080" height="1920" fill="#FFFFFF"/>
${r(56, 96, 430, 64, { f: C.paper, rx: 32 })}${t(86, 138, 'Cómo agendar · ' + p + ' de ' + PARTES, { w: 700, z: 26, c: C.blue })}
${t(56, 250, corto(info.negocio, 22), { w: 700, z: 40, c: C.mut })}
${t(52, 380, TITULOS[p - 1], { w: 800, z: 86, ls: -2 })}
${barras}
${col(a, (p - 1) * 2 + 1, 56)}${col(b, (p - 1) * 2 + 2, 554)}
${r(56, 1660, 968, 140, { f: C.paper, rx: 32 })}
${t(92, 1716, pie[0], { w: 800, z: 34 })}${t(92, 1764, p === PARTES && info.link ? String(info.link).replace(/^https?:\/\//, '').replace('/index.html?b=', '/?b=') : pie[1], { z: 28, c: C.mut })}
${info.marca ? t(540, 1866, 'Hecho con tuagenda.vip', { w: 600, z: 26, c: C.mut, a: 'middle' }) : ''}
${marcaAgua ? marcaAgua(info, false) : ''}
</svg>`;
}
const textoGuia = (info, parte) => [
  `📲 Así agendas tu cita en ${info.negocio}, en 1 minuto (1 de 2)`,
  `✅ Eliges el servicio, apartas ¡y listo! Agenda aquí: ${info.link}`
][Math.max(1, Math.min(PARTES, Number(parte) || 1)) - 1];

// ---------- 3 · ¿toca hoy? (función pura): a la hora elegida, cada N días, una sola vez ----------
function guiaToca(cfg, a, ultima) {
  const g = cfg || {};
  if (g.activo === false) return false;
  const hora = /^\d{2}:\d{2}$/.test(String(g.hora || '')) ? g.hora : '08:00', cada = Math.max(1, Math.min(30, Number(g.cadaDias || 3)));
  if (a.hm < hora || a.hm > '20:00') return false;
  if (!ultima) return true;
  if (ultima >= a.fecha) return false;
  const dias = Math.round((Date.parse(a.fecha + 'T00:00:00Z') - Date.parse(ultima + 'T00:00:00Z')) / 86400000);
  return dias >= cada;
}

module.exports = { PARTES, TIPOS, datosGuia, svgGuia, textoGuia, guiaToca };
