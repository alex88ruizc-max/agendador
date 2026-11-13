// 🖼 ESTADOS DE WHATSAPP CON LOS CUPOS (1080×1920): «Cupos de hoy» y «Tu semana». Mismo diseño del lienzo premium.
// Se dibujan en SVG y se pasan a PNG con resvg (sin navegador: liviano). Letra: Inter (paquete fonts-inter del contenedor).
'use strict';
const X = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const DCORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FONT = "Inter, 'Inter Display', 'DejaVu Sans', sans-serif";

function color(hex, def) { return /^#[0-9a-f]{6}$/i.test(String(hex || '')) ? hex : def; }
function lum(hex) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
const sobre = (hex) => (lum(hex) > 0.45 ? '#121216' : '#FFFFFF');
function inicial(nombre) { return (String(nombre || '?').trim().charAt(0) || '?').toUpperCase(); }
function linkCorto(u) { return String(u || '').replace(/^https?:\/\//, '').replace(/\/index\.html\?b=/, '/?b=').slice(0, 44); }
function fechaLarga(date) { const p = date.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return DIAS[d.getUTCDay()] + ' ' + p[2] + ' DE ' + MESES[p[1] - 1].toUpperCase(); }
function marca(info, x, y, oscuro, ac) {
  const n = X(String(info.negocio || '').slice(0, 30));
  return `<rect x="${x}" y="${y}" width="100" height="100" rx="30" fill="${oscuro ? '#FFFFFF' : ac}"/>` +
    `<text x="${x + 50}" y="${y + 68}" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="50" fill="${oscuro ? '#121216' : sobre(ac)}">${X(inicial(info.negocio))}</text>` +
    `<text x="${x + 130}" y="${y + 64}" font-family="${FONT}" font-weight="700" font-size="40" fill="${oscuro ? '#FFFFFF' : '#121216'}">${n}</text>`;
}

// 🏷️ 3.38 · MARCA DE AGUA de la página en TODOS los estados (salvo el adicional «sin marca de agua»): pequeña, abajo al centro
function marcaAgua(info, oscuro) {
  if (info && info.marca === false) return '';
  // 3.39: ARRIBA a la derecha, grande y con fondo sólido (pedido de Alex: «que se vea»)
  const w = 380, h = 72, x = 1080 - 56 - w, y = 236, fg = oscuro ? '#121216' : '#FFFFFF', bg = oscuro ? '#FFFFFF' : '#121216';
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}" fill-opacity="0.94"/>` +
    `<rect x="${x + 26}" y="${y + 20}" width="34" height="32" rx="7" fill="none" stroke="${fg}" stroke-width="3.6"/><path d="M${x + 26} ${y + 30}h34M${x + 35} ${y + 14}v8M${x + 51} ${y + 14}v8" stroke="${fg}" stroke-width="3.6" stroke-linecap="round"/>` +
    `<text x="${x + 76}" y="${y + 48}" font-family="${FONT}" font-weight="800" font-size="36" fill="${fg}">tuagenda.vip</text></g>`;
}

// ---------- Cupos de hoy (fondo oscuro) ----------
function svgHoy(info, dia) {
  const ac = color(info.color, '#5B3FE0'), on = sobre(ac);
  const horas = (dia.horas || []).slice(0, 9), extra = Math.max(0, (dia.horas || []).length - horas.length);
  const cols = 3, w = 296, h = 168, gx = 24, x0 = 72, y0 = 860;
  let celdas = '';
  horas.forEach((hh, i) => {
    const [hm, ap] = hh.split(' ').length > 1 ? [hh.split(' ')[0], hh.split(' ').slice(1).join(' ')] : [hh, ''];
    const x = x0 + (i % cols) * (w + gx), y = y0 + Math.floor(i / cols) * (h + gx);
    celdas += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="40" fill="#FFFFFF"/>` +
      `<text x="${x + w / 2}" y="${y + 92}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="58" fill="#121216">${X(hm)}</text>` +
      `<text x="${x + w / 2}" y="${y + 134}" text-anchor="middle" font-family="${FONT}" font-weight="500" font-size="30" fill="#4A4A55">${X(ap)}</text>`;
  });
  const filas = Math.ceil(horas.length / cols), yFin = y0 + filas * (h + gx);
  const cats = (info.categorias || []).slice(0, 4).join(' · ');
  const vacio = !horas.length;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<rect width="1080" height="1920" fill="#121216"/>
<circle cx="980" cy="120" r="380" fill="${ac}" opacity="0.92"/>
${marca(info, 72, 110, true, ac)}
<text x="72" y="470" font-family="${FONT}" font-weight="600" font-size="34" letter-spacing="5" fill="#C9C9D1">${X(fechaLarga(dia.date))}</text>
<text x="66" y="610" font-family="${FONT}" font-weight="800" font-size="150" letter-spacing="-5" fill="#FFFFFF">${vacio ? 'Agenda' : 'Cupos'}</text>
<text x="66" y="760" font-family="${FONT}" font-weight="800" font-size="150" letter-spacing="-5" fill="#FFFFFF">${vacio ? 'llena hoy' : 'de hoy'}</text>
${vacio ? `<text x="72" y="900" font-family="${FONT}" font-weight="500" font-size="40" fill="#C9C9D1">Aparta desde ya para los próximos días</text>` : celdas}
${extra ? `<text x="72" y="${yFin + 30}" font-family="${FONT}" font-weight="600" font-size="34" fill="#C9C9D1">y ${extra} ${extra === 1 ? 'hora más' : 'horas más'} en la agenda</text>` : ''}
${cats ? `<text x="72" y="${extra ? yFin + 90 : yFin + 40}" font-family="${FONT}" font-weight="500" font-size="34" fill="#C9C9D1">${X(cats)}</text>` : ''}
<rect x="72" y="1580" width="936" height="190" rx="52" fill="${ac}"/>
<text x="124" y="1663" font-family="${FONT}" font-weight="700" font-size="50" fill="${on}">Aparta el tuyo</text>
<text x="124" y="1720" font-family="${FONT}" font-weight="500" font-size="32" fill="${on}" opacity="0.85">${X(linkCorto(info.link))}</text>
<text x="940" y="1695" text-anchor="end" font-family="${FONT}" font-weight="600" font-size="64" fill="${on}">→</text>
<text x="540" y="1840" text-anchor="middle" font-family="${FONT}" font-weight="500" font-size="30" fill="#9A9AA4">O respóndeme este estado y te paso el link</text>
${marcaAgua(info, true)}
</svg>`;
}

// ---------- Tu semana (fondo claro) ----------
function svgSemana(info, dias) {
  const ac = color(info.color, '#5B3FE0');
  const L = dias.filter((d) => d.abierto).slice(0, 7), hoy = dias.length ? dias[0].date : '';
  const max = Math.max(1, ...L.map((d) => d.libres.length));
  const p0 = L[0] ? L[0].date.split('-').map(Number) : [0, 1, 1], p1 = L.length ? L[L.length - 1].date.split('-').map(Number) : p0;
  const rango = p0[1] === p1[1] ? `${p0[2]} – ${p1[2]} DE ${MESES[p0[1] - 1].toUpperCase()}` : `${p0[2]} ${MESES[p0[1] - 1].slice(0, 3).toUpperCase()} – ${p1[2]} ${MESES[p1[1] - 1].slice(0, 3).toUpperCase()}`;
  let filas = '';
  L.forEach((d, i) => {
    const y = 760 + i * 128, n = d.libres.length, lleno = n === 0;
    const bw = 520, ocup = lleno ? bw : Math.round(bw * (1 - n / Math.max(max, 10)));
    const col = lleno ? '#8A8A93' : n <= 3 ? '#B45309' : '#1E7A4F';
    filas += `<rect x="72" y="${y}" width="936" height="108" rx="32" fill="#FFFFFF"/>` +
      `<text x="112" y="${y + 68}" font-family="${FONT}" font-weight="700" font-size="40" fill="#121216">${X(d.date === hoy ? 'Hoy' : DCORTO[d.dow])}</text>` +
      `<rect x="250" y="${y + 46}" width="${bw}" height="16" rx="8" fill="#ECEBE8"/>` +
      `<rect x="250" y="${y + 46}" width="${Math.max(16, ocup)}" height="16" rx="8" fill="${lleno ? '#8A8A93' : ac}"/>` +
      `<text x="968" y="${y + 68}" text-anchor="end" font-family="${FONT}" font-weight="700" font-size="34" fill="${col}">${lleno ? 'Lleno' : n + (n === 1 ? ' cupo' : ' cupos')}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<rect width="1080" height="1920" fill="#F4F1EC"/>
${marca(info, 72, 110, false, ac)}
<text x="72" y="420" font-family="${FONT}" font-weight="600" font-size="34" letter-spacing="5" fill="#4A4A55">${X(rango)}</text>
<text x="66" y="550" font-family="${FONT}" font-weight="800" font-size="130" letter-spacing="-4" fill="#121216">Tu semana</text>
<text x="66" y="680" font-family="${FONT}" font-weight="800" font-size="130" letter-spacing="-4" fill="${ac}">de cupos</text>
${filas}
<rect x="72" y="1660" width="936" height="170" rx="52" fill="#121216"/>
<text x="124" y="1735" font-family="${FONT}" font-weight="700" font-size="46" fill="#FFFFFF">Agenda con abono</text>
<text x="124" y="1790" font-family="${FONT}" font-weight="500" font-size="32" fill="#C9C9D1">${X(linkCorto(info.link))}</text>
<text x="940" y="1765" text-anchor="end" font-family="${FONT}" font-weight="600" font-size="64" fill="#FFFFFF">→</text>
${marcaAgua(info, false)}
</svg>`;
}

// 🔤 3.57 · LA LETRA VA DENTRO DEL BOT (carpeta fuentes/). Antes dependía de la letra instalada en el servidor: si faltaba, el estado salía
//    con las formas pero SIN NINGÚN TEXTO (le pasó a una tienda el 2026-11-13) y nadie se enteraba.
const FUENTES = (() => { try { const d = require('path').join(__dirname, 'fuentes'); return require('fs').readdirSync(d).filter((f) => /\.(otf|ttf)$/i.test(f)).map((f) => require('path').join(d, f)); } catch (e) { return []; } })();
const OPC_LETRA = { fontFiles: FUENTES, loadSystemFonts: true, defaultFontFamily: 'Inter' };
function png(svg) {
  const { Resvg } = require('@resvg/resvg-js');
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1080 }, font: OPC_LETRA }).render().asPng();
}
// ¿de verdad se dibujan las letras? Se dibuja el mismo recuadro con y sin texto: si pesan igual, no hay letra. Se revisa una vez.
let _letras = null;
function letras() {
  if (_letras !== null) return _letras;
  try {
    const { Resvg } = require('@resvg/resvg-js');
    const caja = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80"><rect width="300" height="80" fill="#fff"/>${t}</svg>`;
    const con = new Resvg(caja(`<text x="10" y="55" font-family="${FONT}" font-weight="800" font-size="40" fill="#000">Hola 123</text>`), { font: OPC_LETRA }).render().asPng().length;
    const sin = new Resvg(caja(''), { font: OPC_LETRA }).render().asPng().length;
    _letras = con > sin + 200;
  } catch (e) { _letras = false; }
  return _letras;
}
const textoHoy = (info, dia) => dia.horas.length ? `Cupos de hoy en ${info.negocio}: ${dia.horas.slice(0, 6).join(', ')}${dia.horas.length > 6 ? '…' : ''}. Aparta aquí: ${info.link}` : `Hoy estamos llenos ✨ Aparta para los próximos días: ${info.link}`;
const textoSemana = (info) => `Cupos de la semana en ${info.negocio}. Aparta aquí: ${info.link}`;

// 🚀 3.38 · en la PRUEBA GRATIS, debajo de un estado al día: la invitación a crear su agenda (en el texto, donde el link sí se toca)
const PIE_PRUEBA = '\n\n🚀 Regístrate gratis y crea tu agenda aquí: https://tuagenda.vip/';
module.exports = { PIE_PRUEBA, marcaAgua, svgHoy, svgSemana, png, letras, FUENTES, textoHoy, textoSemana, fechaLarga };
