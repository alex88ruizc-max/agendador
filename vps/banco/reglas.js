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
      if (/--filter name=\^agendador-tmp-/.test(l)) propio = true;   // 3.33: limpieza de los temporales del agendador (solo «agendador-tmp-…»)
      if (!propio) malas.push(f + ':' + (i + 1) + ' → ' + l.trim().slice(0, 140));
    });
    // nada de nombres de Epic junto a una acción
    if (/docker\s+(network\s+(?:connect|disconnect)|restart|stop|kill|rm)\b[^\n]*epic/i.test(fs.readFileSync(path.join(RAIZ, f), 'utf8'))) malas.push(f + ': acción sobre algo de Epic');
  }
  assert.deepEqual(malas, [], 'Scripts que tocarían otro proyecto:\n' + malas.join('\n'));
});

test('3.33 · Ningún «docker run» sin nombre: todos se llaman agendador-tmp-… y tienen tiempo límite (así no queda un «vigorous_burnell» colgado llenando el disco)', { skip: scripts.length === 0 && 'sin scripts aquí' }, () => {
  const malas = [];
  for (const f of scripts) fs.readFileSync(path.join(RAIZ, f), 'utf8').split('\n').forEach((l, i) => {
    if (/^\s*#/.test(l) || !/docker\s+run\b/.test(l)) return;
    if (!/--name\s+agendador-tmp-/.test(l)) malas.push(f + ':' + (i + 1) + ' sin --name agendador-tmp-…');
    if (!/\btimeout\s+\d+/.test(l)) malas.push(f + ':' + (i + 1) + ' sin tiempo límite');
  });
  assert.deepEqual(malas, [], malas.join('\n'));
});
test('3.33 · El cartero solo BORRA contenedores en /limpiar, y solo los probados como del agendador (sueltos())', { skip: !fs.existsSync(path.join(RAIZ, 'cartero.py')) && 'sin cartero aquí' }, () => {
  const src = fs.readFileSync(path.join(RAIZ, 'cartero.py'), 'utf8');
  const borra = src.split('\n').filter((l) => /dk\(\s*'(rm|stop|kill|restart)'/.test(l) && !/^\s*#/.test(l));
  assert.equal(borra.length, 1, 'un solo sitio que borra: ' + borra.join(' | '));
  assert.match(borra[0], /x\['id'\]/); assert.match(src, /def limpiar\(\):\n    L = sueltos\(\)/);
  const s = src.slice(src.indexOf('def sueltos'), src.indexOf('def limpiar'));
  assert.match(s, /in NUESTROS or 'epic' in nombre\.lower\(\): continue/); assert.match(s, /com\.docker\.compose\.project/); assert.match(s, /m == AQUI or m\.startswith\(AQUI \+ '\/'\)/);
});
