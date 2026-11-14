# Reglas del proyecto Tu Agenda (agendador)

## 🚫 REGLA UNIVERSAL N.º 1 — EPIC NO SE TOCA (manda sobre todo lo demás)
> **Orden de Alex: no se puede modificar ningún contenedor fuera del agendador. Solo se puede copiar.** Texto completo en `LEEME-REGLA-UNIVERSAL.txt`.

**Epic** (Mary de Epic, Luisa, la tienda, epic-waha, epic-tiendas, Epic Channels y todo lo que sea de Epic) y **cualquier otro proyecto**:
- ✅ **Solo se puede COPIAR**: leer su código o su versión y hacer una copia propia del agendador, aparte y con su propio nombre.
- ❌ **JAMÁS se modifica**: ni sus contenedores, ni sus redes, ni sus webhooks, ni sus sesiones de WhatsApp, ni sus archivos, ni su base de datos, ni sus repositorios. Ni reiniciarlo, ni detenerlo, ni conectarlo o desconectarlo de nada.
- ❌ **Ni siquiera para «deshacer», «arreglar» o «limpiar»**. (El 2026-11-12 sacar `epic-waha` de una red «para deshacer» le cortó la conexión a la tienda de Epic.)
- ❌ Ningún script del agendador ejecuta comandos sobre contenedores o archivos que no sean del agendador (`agendador-ia`, `evolution-agendador`, `postgres-agendador`, `waha-agendador`, `oido-agendador`, `~/agendador`).
- 📖 **Única excepción, y es solo MIRAR** (autorizada por Alex el 2026-11-14): el comando `/epicmd` del cartero lee los `.md` de Epic y le manda una copia a Alex. Con esa copia (carpeta `epic-copia/`) se arma el mapa para copiar la lógica de Epic aquí. No escribe ni ejecuta nada.
- 🛑 Si algún paso pudiera afectar a Epic, **se para y se le pregunta a Alex**. Solo Alex, con palabras explícitas, puede autorizar algo sobre Epic.

## 🖥️ REGLAS DEL SERVIDOR (VPS compartido con Epic Streaming) — obligatorias (orden de Alex, 2026-11-12)
1. **Contenedores con nombre, siempre.**
   - Nunca «docker run» sin --name. Se usa docker compose dentro de la carpeta del agendador (proyecto `agendador-ia`).
   - Tarea de una sola vez: `docker compose run --rm --name agendador-tarea-<algo> <servicio> …` (el --rm es obligatorio).
   - Al terminar cada trabajo: «docker ps -a» y confirmar que no quedó ningún contenedor del agendador sin nombre ni detenido. Si quedó uno, se borra y se dice.
2. **Solo lo del agendador.**
   - Nuestros: agendador-ia, evolution-agendador, waha-agendador, oido-agendador, postgres-agendador (y las tareas agendador-tarea-…).
   - No se toca, reinicia, detiene ni borra nada que empiece por epic-, ni evolution, evolution-estados, evo_postgres, evo_redis, luisa-fotos, mary-oido, n8n_db, epic-n8n ni tunel-pc.
   - Nunca «docker system prune», «docker volume prune», «docker image prune» ni «docker rm» sobre algo que no sea nuestro.
3. **WhatsApp.**
   - El agendador solo se vincula con su propio número, nunca con el de la tienda Epic Streaming.
   - Nunca se cierra, desvincula ni reinicia una sesión de WhatsApp que no sea del agendador.
   - Antes de vincular un número, se le pregunta a Alex cuál es y se espera su confirmación.
4. **Recursos.**
   - El servidor tiene 2 núcleos y lo comparte con Mary (Epic), que atiende clientes.
   - Construcciones pesadas, de una en una y con `nice -n 19`.
   - Si algo va a ocupar más de 5 GB de disco, se avisa antes.
5. **Antes de terminar**, decir en una línea: qué contenedores se crearon, cuáles se borraron y que «docker ps -a» quedó limpio.

## 📒 Bitácora y pruebas (en cada cambio)
- **Cada cambio se anota en `BITACORA.md`** (Historial, versión actual y pendientes) en el mismo commit del cambio.
- **Cada mejora que vean las tiendas se agrega a la reseña de los planes** (`DEFAULT_BENEFITS` en `common.js`, la lista vieja a `BENEFITS_VIEJOS`) y a la página de venta (`index.html`), en el mismo cambio. Solo lo que ya está hecho; nunca precios ni funciones que no existen (orden de Alex, 2026-11-13).
- Antes de entregar un zip de Mary: `cd vps && node --test banco/pruebas.js banco/escenarios.js banco/reglas.js` (0 fallas). **Y además `sh banco/como-vps.sh`** (corre el banco como el VPS, sin `gs/`): si eso falla, el cartero no instala (pasó con la 3.47). Un arreglo de Mary trae su escenario nuevo en `vps/banco/escenarios.js`.
- Antes de entregar un zip de la página: `node vps/banco/web.js <carpeta>` (0 fallas). Todas las `?v=` iguales a `APP_VERSION`.
- **Estilos armados:** la página ya no usa `cdn.tailwindcss.com`. Si se agregan clases de Tailwind en los `.html` o `.js` de la página, se rearma `tailwind.css` (`npx tailwindcss@3.4.17 -c tailwind.config.js -i tailwind.entrada.css -o tailwind.css --minify`) y va en el zip de la página. Va enlazado de ÚLTIMO en el `<head>`.
- Después: `graphify update .` para que el mapa del código quede al día (si falta: `pip install graphifyy`).
- El código del VPS vive en `vps/` (fuente de verdad). Los zips se arman desde ahí, sin `node_modules`, `datos` ni `gs/mary-clave.gs`.

## Otras reglas
- Todo se instala por Telegram (bot «Agendador VPS», el cartero) o en el VPS, en `~/agendador`.
- Nunca poner secretos (tokens, claves, llaves) en el código ni en el chat.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
