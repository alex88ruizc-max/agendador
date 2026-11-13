// 🚫 BANCO DE LA REGLA N.º 1: EPIC NO SE TOCA. Revisa TODOS los scripts del paquete y falla si alguno ACTÚA sobre un contenedor
//    que no sea del agendador (conectar/desconectar redes, reiniciar, detener, borrar, ejecutar dentro, cambiarle avisos…).
//    Leer (docker ps, docker inspect, docker logs) sí se permite: es copiar, no modificar.
//    Uso: node --test banco/reglas.js   (en el VPS no hay .sh dentro de la imagen: ahí se salta sola)
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..');
const NUESTROS = ['agendador-ia', 'evolution-agendador', 'postgres-agendador', 'waha-agendador', 'oido-agendador'];
const scripts = fs.readdirSync(RAIZ).filter((f) => /\.(sh|py)$/.test(f));

test('Regla N.º 1: ningún script actúa sobre contenedores ajenos (Epic ni ningún otro)', { skip: scripts.length === 0 && 'sin scripts aquí' }, () => {
  const malas = [];
  for (const f of scripts) {
    fs.readFileSync(path.join(RAIZ, f), 'utf8').split('\n').forEach((l, i) => {
      if (/^\s*#/.test(l)) return;
      // acciones que MODIFICAN un contenedor o su red
      const m = l.match(/docker\s+(network\s+(?:connect|disconnect)|restart|stop|kill|rm|pause|update|rename|exec|cp)\b([^;&|]*)/);
      if (!m) return;
      const resto = m[2];
      let propio = NUESTROS.some((n) => new RegExp('(^|[\\s"\'])' + n + '([\\s"\']|$)').test(resto));   // la acción nombra un contenedor del agendador
      if (/--filter name=\^agendador-(tmp|tarea)-/.test(l)) propio = true;   // 3.33: limpieza de los temporales del agendador (solo «agendador-tmp-…»)
      if (!propio) malas.push(f + ':' + (i + 1) + ' → ' + l.trim().slice(0, 140));
    });
    // nada de nombres de Epic junto a una acción
    if (/docker\s+(network\s+(?:connect|disconnect)|restart|stop|kill|rm)\b[^\n]*epic/i.test(fs.readFileSync(path.join(RAIZ, f), 'utf8'))) malas.push(f + ': acción sobre algo de Epic');
  }
  assert.deepEqual(malas, [], 'Scripts que tocarían otro proyecto:\n' + malas.join('\n'));
});

test('3.35 · REGLAS DEL SERVIDOR: nada de «docker run» suelto; las tareas van con «docker compose run --rm --name agendador-tarea-…» y tiempo límite', { skip: scripts.length === 0 && 'sin scripts aquí' }, () => {
  const malas = [];
  for (const f of scripts) fs.readFileSync(path.join(RAIZ, f), 'utf8').split('\n').forEach((l, i) => {
    if (/^\s*#/.test(l)) return;
    if (/docker\s+run\b/.test(l)) malas.push(f + ':' + (i + 1) + ' usa «docker run» (debe ser «docker compose run»)');
    if (!/docker\s+compose\s+run\b/.test(l)) return;
    if (!/\s--rm\b/.test(l)) malas.push(f + ':' + (i + 1) + ' sin --rm');
    if (!/--name\s+agendador-tarea-/.test(l)) malas.push(f + ':' + (i + 1) + ' sin --name agendador-tarea-…');
    if (!/\btimeout\s+\d+/.test(l)) malas.push(f + ':' + (i + 1) + ' sin tiempo límite');
  });
  assert.deepEqual(malas, [], malas.join('\n'));
});
test('3.35 · REGLAS DEL SERVIDOR: nunca «prune», y nada sobre los contenedores de Epic ni de otros (evolution, evo_postgres, luisa-fotos, mary-oido, n8n…)', { skip: scripts.length === 0 && 'sin scripts aquí' }, () => {
  const AJENOS = /\b(epic-[\w-]+|evolution|evolution-estados|evo_postgres|evo_redis|luisa-fotos|mary-oido|n8n_db|epic-n8n|tunel-pc)\b(?!-agendador)/;
  const malas = [];
  for (const f of scripts) fs.readFileSync(path.join(RAIZ, f), 'utf8').split('\n').forEach((l, i) => {
    if (/^\s*#/.test(l)) return;
    if (/docker\s+(system|volume|image|container|network|builder)\s+prune|docker\s+prune/.test(l)) malas.push(f + ':' + (i + 1) + ' usa prune');
    const m = l.match(/docker\s+(network\s+(?:connect|disconnect)|restart|stop|kill|rm|pause|update|rename|exec|cp|start)\b([^;&|]*)/);
    if (m && AJENOS.test(m[2])) malas.push(f + ':' + (i + 1) + ' actúa sobre algo ajeno');
  });
  assert.deepEqual(malas, [], malas.join('\n'));
});
test('3.33 · El cartero solo BORRA contenedores en /limpiar, y solo los probados como del agendador (sueltos())', { skip: !fs.existsSync(path.join(RAIZ, 'cartero.py')) && 'sin cartero aquí' }, () => {
  const src = fs.readFileSync(path.join(RAIZ, 'cartero.py'), 'utf8');
  const borra = src.split('\n').filter((l) => /dk\(\s*'(rm|stop|kill|restart)'/.test(l) && !/^\s*#/.test(l));
  assert.equal(borra.length, 1, 'un solo sitio que borra: ' + borra.join(' | '));
  assert.match(borra[0], /x\['id'\]/); assert.match(src, /def limpiar\(\):\n    L = sueltos\(\)/);
  const s = src.slice(src.indexOf('def sueltos'), src.indexOf('def limpiar():'));
  assert.match(s, /in NUESTROS or 'epic' in nombre\.lower\(\): continue/); assert.match(s, /com\.docker\.compose\.project/); assert.match(s, /m == AQUI or m\.startswith\(AQUI \+ '\/'\)/);
});
test('3.40 · /servidor manda el código del servidor de Google SIN claves (llaves privadas, tokens, Wompi, contraseñas, clave de Mary)', { skip: (!fs.existsSync(path.join(RAIZ, 'cartero.py')) || require('child_process').spawnSync('python3', ['--version']).status !== 0) && 'sin cartero o sin python aquí' }, () => {
  const os = require('os'), d = fs.mkdtempSync(path.join(os.tmpdir(), 'srv-'));
  fs.copyFileSync(path.join(RAIZ, 'cartero.py'), path.join(d, 'cartero.py')); fs.writeFileSync(path.join(d, 'cartero.env'), ''); fs.mkdirSync(path.join(d, 'google'));
  fs.writeFileSync(path.join(d, 'google', 'Codigo.gs'), 'const SA = { "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEsecreto\\n-----END PRIVATE KEY-----\\n" };\nconst T = \'8454986905:AAHk-abcdefghijklmnopqrstuvwxyz1234\';\nconst W = \'prv_prod_ABCDEFGHIJ1234567890\';\nvar password = "superclave123";\nfunction superApproveOrder(b, auth) {}\n');
  fs.writeFileSync(path.join(d, 'google', 'mary-clave.gs'), 'const MARY_CLAVE = "no-debe-salir";');
  const py = 'import importlib.util,sys,zipfile,io\ns=importlib.util.spec_from_file_location("c",sys.argv[1]);c=importlib.util.module_from_spec(s);s.loader.exec_module(c)\nd,m=c.servidor();z=zipfile.ZipFile(io.BytesIO(d))\nprint("\\n".join(z.read(n).decode() for n in z.namelist()))';
  const r = require('child_process').spawnSync('python3', ['-c', py, path.join(d, 'cartero.py')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const malo of ['MIIEsecreto', 'AAHk-abc', 'prv_prod_ABC', 'superclave123', 'no-debe-salir']) assert.ok(!r.stdout.includes(malo), 'se coló: ' + malo);
  assert.match(r.stdout, /function superApproveOrder/, 'el código sí va');
});
