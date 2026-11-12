// 🧪 BANCO DE PRUEBAS DE LA PÁGINA (tuagenda.vip). Lo corre el cartero ANTES de subir un agendador-web-*.zip:
//    si algo falla, NO se sube y la página sigue como estaba.  Uso: node banco/web.js <carpeta-con-los-archivos>
//    Revisa: 1) que cada .js se pueda leer (sin errores de escritura)  2) que todas las versiones ?v= coincidan con APP_VERSION
//    3) que lo que importa/enlaza una página exista  4) que config.js apunte a un servidor de Google válido
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const DIR = process.argv[2];
if (!DIR || !fs.existsSync(DIR)) { console.log('Uso: node banco/web.js <carpeta>'); process.exit(2); }
// archivos que ya viven en tuagenda.vip (un zip puede traer solo una parte)
const DEL_SITIO = ['index.html', 'admin.html', 'super.html', 'privacidad.html', '404.html', 'app.js', 'admin.js', 'super.js', 'common.js',
  'config.js', 'theme.js', 'styles.css', 'premium.css', 'panel-premium.css', 'sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'apple-touch-icon.png', 'tu-agenda.apk', 'CNAME'];
const fallas = [], avisos = [];
const archivos = fs.readdirSync(DIR).filter((f) => fs.statSync(path.join(DIR, f)).isFile());
const leer = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');

// 1) cada .js se puede leer (como módulo o como script normal)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'web-'));
for (const f of archivos.filter((x) => x.endsWith('.js'))) {
  const ok = ['.mjs', '.cjs'].some((ext) => { const t = path.join(TMP, f + ext); fs.copyFileSync(path.join(DIR, f), t); return spawnSync(process.execPath, ['--check', t], { encoding: 'utf8' }).status === 0; });
  if (!ok) { const r = spawnSync(process.execPath, ['--check', path.join(TMP, f + '.mjs')], { encoding: 'utf8' }); fallas.push(f + ': error de escritura → ' + String(r.stderr).split('\n').filter((l) => /Error/.test(l))[0]); }
}
// 2) versiones: todas las ?v= iguales a APP_VERSION (si no, el navegador mezcla archivos viejos y nuevos)
let VER = '';
if (archivos.includes('common.js')) { const m = leer('common.js').match(/APP_VERSION = '([^']+)'/); VER = m ? m[1] : ''; if (!VER) fallas.push('common.js: no encontré APP_VERSION'); }
const versiones = new Map();
for (const f of archivos.filter((x) => /\.(html|js)$/.test(x))) for (const m of leer(f).matchAll(/\?v=([\w.-]+)/g)) { if (!versiones.has(m[1])) versiones.set(m[1], new Set()); versiones.get(m[1]).add(f); }
if (VER) { for (const [v, fs_] of versiones) if (v !== VER) fallas.push('versión ?v=' + v + ' en ' + [...fs_].join(', ') + ' no coincide con APP_VERSION ' + VER); }
else if (versiones.size > 1) fallas.push('hay versiones distintas mezcladas: ' + [...versiones.keys()].join(', '));
// 3) lo que se importa o enlaza existe (en el zip o ya en el sitio)
const existe = (r) => archivos.includes(r) || DEL_SITIO.includes(r);
for (const f of archivos.filter((x) => /\.(html|js)$/.test(x))) {
  const t = leer(f), refs = new Set();
  for (const m of t.matchAll(/(?:import\s[^'"]*?from\s*|import\s*\(\s*|\b(?:src|href)\s*=\s*)["']\.?\/?([\w.-]+\.(?:js|css|webmanifest|png|html))(?:\?[^"']*)?["']/g)) refs.add(m[1]);
  for (const r of refs) if (!existe(r)) fallas.push(f + ' usa «' + r + '», que no existe ni en el zip ni en el sitio');
  for (const r of refs) if (!archivos.includes(r) && DEL_SITIO.includes(r) && /\.(js|css)$/.test(r) && VER) avisos.push(f + ' usa ' + r + ' del sitio (no viene en el zip)');
}
// 4) config.js
if (archivos.includes('config.js')) { const t = leer('config.js'); if (!/export const API_URL = "https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec";/.test(t)) fallas.push('config.js: API_URL no es una dirección válida de Google'); }
// 5) páginas completas
for (const f of archivos.filter((x) => /\.html$/.test(x))) { const t = leer(f); if (!/<\/html>\s*$/i.test(t.trim() + '\n') && !/<\/html>/i.test(t)) fallas.push(f + ': la página está cortada (no termina en </html>)'); }

console.log('🧪 Banco de la página: ' + archivos.length + ' archivos' + (VER ? ' · versión ' + VER : ''));
avisos.slice(0, 5).forEach((a) => console.log('   ⚠️ ' + a));
if (fallas.length) { fallas.forEach((x) => console.log('   ❌ ' + x)); console.log('# fail ' + fallas.length); process.exit(1); }
console.log('# fail 0');
