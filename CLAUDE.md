# Reglas del proyecto Tu Agenda (agendador)

## 🚫 REGLA UNIVERSAL N.º 1 — EPIC NO SE TOCA (manda sobre todo lo demás)
> **Orden de Alex: no se puede modificar ningún contenedor fuera del agendador. Solo se puede copiar.** Texto completo en `LEEME-REGLA-UNIVERSAL.txt`.

**Epic** (Mary de Epic, Luisa, la tienda, epic-waha, epic-tiendas, Epic Channels y todo lo que sea de Epic) y **cualquier otro proyecto**:
- ✅ **Solo se puede COPIAR**: leer su código o su versión y hacer una copia propia del agendador, aparte y con su propio nombre.
- ❌ **JAMÁS se modifica**: ni sus contenedores, ni sus redes, ni sus webhooks, ni sus sesiones de WhatsApp, ni sus archivos, ni su base de datos, ni sus repositorios. Ni reiniciarlo, ni detenerlo, ni conectarlo o desconectarlo de nada.
- ❌ **Ni siquiera para «deshacer», «arreglar» o «limpiar»**. (El 2026-11-12 sacar `epic-waha` de una red «para deshacer» le cortó la conexión a la tienda de Epic.)
- ❌ Ningún script del agendador ejecuta comandos sobre contenedores o archivos que no sean del agendador (`agendador-ia`, `evolution-agendador`, `postgres-agendador`, `waha-agendador`, `oido-agendador`, `~/agendador`).
- 🛑 Si algún paso pudiera afectar a Epic, **se para y se le pregunta a Alex**. Solo Alex, con palabras explícitas, puede autorizar algo sobre Epic.

## 📒 Bitácora y pruebas (en cada cambio)
- **Cada cambio se anota en `BITACORA.md`** (Historial, versión actual y pendientes) en el mismo commit del cambio.
- Antes de entregar un zip de Mary: `cd vps && node --test banco/pruebas.js banco/escenarios.js banco/reglas.js` (0 fallas). Un arreglo de Mary trae su escenario nuevo en `vps/banco/escenarios.js`.
- Antes de entregar un zip de la página: `node vps/banco/web.js <carpeta>` (0 fallas). Todas las `?v=` iguales a `APP_VERSION`.
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
