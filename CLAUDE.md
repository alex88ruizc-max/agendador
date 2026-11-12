# Reglas del proyecto Tu Agenda (agendador)

## 🚫 Regla universal: no se modifica ningún otro proyecto
Este proyecto (Tu Agenda / Agendador IA, «Mary» por dentro) **nunca modifica otro proyecto**: Epic, Mary de Epic, Luisa, epic-tiendas ni ningún otro.
- **Sí se puede copiar:** leer el código o la versión de otro proyecto y hacer una copia propia, aparte y con su propio nombre.
- **No se puede tocar:** sus contenedores, redes, webhooks, sesiones de WhatsApp, archivos, base de datos ni repositorios. Tampoco reiniciarlo ni unirlo a nada del agendador.
- Si el agendador necesita algo de otro proyecto, se crea una copia propia del agendador (ej. `waha-agendador`, `evolution-agendador`), jamás se usa el original.
- Si un script o instrucción rompe esta regla, es un error: se deshace y se corrige.

## 📒 Bitácora y pruebas (en cada cambio)
- **Cada cambio se anota en `BITACORA.md`** (Historial, versión actual y pendientes) en el mismo commit del cambio.
- Antes de entregar un zip de Mary: `cd vps && node --test banco/pruebas.js banco/escenarios.js` (0 fallas). Un arreglo de Mary trae su escenario nuevo en `vps/banco/escenarios.js`.
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
