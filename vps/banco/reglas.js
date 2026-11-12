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
      const propio = NUESTROS.some((n) => new RegExp('(^|[\\s"\'])' + n + '([\\s"\']|$)').test(resto));   // la acción nombra un contenedor del agendador
      if (!propio) malas.push(f + ':' + (i + 1) + ' → ' + l.trim().slice(0, 140));
    });
    // nada de nombres de Epic junto a una acción
    if (/docker\s+(network\s+(?:connect|disconnect)|restart|stop|kill|rm)\b[^\n]*epic/i.test(fs.readFileSync(path.join(RAIZ, f), 'utf8'))) malas.push(f + ': acción sobre algo de Epic');
  }
  assert.deepEqual(malas, [], 'Scripts que tocarían otro proyecto:\n' + malas.join('\n'));
});
