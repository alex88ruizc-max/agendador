# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~131,984 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 961 nodes · 2792 edges · 44 communities (39 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `02bb022f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- super.js
- app.js
- admin.js
- common.js
- estado.js
- escenarios.js
- esc
- esc
- cartero.py
- mary.gs
- drawStory
- textos.js
- plansOf
- bpath
- lockedNow
- openStoryViewer
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- handleAct
- pushNav
- options
- waha-agendador
- toMillis
- correo.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- startUpdateWatcher
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderWaBot
- switchTab
- environment
- oido-agendador

## God Nodes (most connected - your core abstractions)
1. `esc()` - 83 edges
2. `bogNow()` - 50 edges
3. `toast()` - 49 edges
4. `bpath()` - 47 edges
5. `crear()` - 38 edges
6. `cop()` - 34 edges
7. `hora12()` - 34 edges
8. `toMillis()` - 34 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `renderNewsAdmin()` --calls--> `esc()`  [EXTRACTED]
  super.js → common.js
- `renderNewsAdmin()` --calls--> `toMillis()`  [EXTRACTED]
  super.js → common.js
- `renderOrders()` --calls--> `cop()`  [EXTRACTED]
  super.js → common.js

## Import Cycles
- None detected.

## Communities (44 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (96): llega(), AGRUPA, ahoraLocal(), alEventoConexion(), alMensaje(), anotar(), armarEstado(), arrancarRelojes() (+88 more)

### Community 1 - "super.js"
Cohesion: 0.09
Nodes (24): DEFAULT_PAY_WARNING, enAppInterna(), PLAN_KEYS, salirAlNavegador(), FILTERS, HIDDEN, hideOrder(), NW_KINDS (+16 more)

### Community 2 - "app.js"
Cohesion: 0.05
Nodes (108): aptCard(), citasHtml(), estadoCupos(), freeNowStaff(), freeSlotsFor(), h12s(), hh(), hoursSummary() (+100 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (69): A, ACT, ACTIVE, actStats(), ALL_TABS, bogDay(), bogHour(), BOT_DEF (+61 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (39): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl() (+31 more)

### Community 5 - "estado.js"
Cohesion: 0.09
Nodes (31): imapflow, mailparser, @resvg/resvg-js, color(), DCORTO, DIAS, fechaLarga(), inicial() (+23 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (21): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+13 more)

### Community 7 - "esc"
Cohesion: 0.13
Nodes (39): aptAction(), bloqueo(), brPreview(), closeM(), connectWhatsApp(), custName(), geoSkipKey(), goStep() (+31 more)

### Community 8 - "esc"
Cohesion: 0.22
Nodes (18): loadModalLocks(), lookupPhone(), openAptModal(), openQuick(), qMinutes(), qSlotsFor(), renderExtras(), renderModalSlots() (+10 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "drawStory"
Cohesion: 0.17
Nodes (20): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba() (+12 more)

### Community 12 - "textos.js"
Cohesion: 0.11
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "plansOf"
Cohesion: 0.16
Nodes (14): planPrice(), pmProblem(), renderPM(), renderTrialPlans(), showTrialForm(), isKeyMethod(), payAccountInput(), planBenefitsIntro() (+6 more)

### Community 14 - "bpath"
Cohesion: 0.17
Nodes (20): abrirCupos(), citasDeClientes(), clientHistory(), deleteClient(), loadLost(), loadQLocks(), loadUsers(), onErr() (+12 more)

### Community 15 - "lockedNow"
Cohesion: 0.43
Nodes (7): guideCard(), guideDone(), guideProgress(), guideSteps(), openGuide(), stepDone(), wizPassed()

### Community 16 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 17 - "environment"
Cohesion: 0.29
Nodes (7): WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED, WAHA_PRINT_QR, WHATSAPP_DEFAULT_ENGINE, WHATSAPP_SWAGGER_ENABLED, environment

### Community 18 - "textos.js"
Cohesion: 0.15
Nodes (48): conNumeros(), corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo() (+40 more)

### Community 19 - "agendador-ia"
Cohesion: 0.18
Nodes (11): build, container_name, cpus, depends_on, env_file, mem_limit, networks, ports (+3 more)

### Community 20 - "postgres-agendador"
Cohesion: 0.18
Nodes (11): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, container_name, environment, image, mem_limit, networks (+3 more)

### Community 21 - "services"
Cohesion: 0.18
Nodes (10): name, name, networks, agenda, services, volumes, evo_instancias, oido_modelos (+2 more)

### Community 22 - "evolution-agendador"
Cohesion: 0.20
Nodes (10): container_name, depends_on, env_file, image, mem_limit, networks, ports, restart (+2 more)

### Community 23 - "reglas.js"
Cohesion: 0.12
Nodes (13): assert, GS_MARY, INFO, test, assert, fs, NUESTROS, path (+5 more)

### Community 24 - "handleAct"
Cohesion: 0.22
Nodes (16): adminUrl(), daysLeft(), dm(), initials(), logoOf(), msgFor(), openM(), openStore() (+8 more)

### Community 25 - "pushNav"
Cohesion: 0.67
Nodes (3): pushNav(), goMoney(), goSV()

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.15
Nodes (27): activeStories(), buildRecs(), fillAsStory(), firstName(), freeTimes(), goTab(), isBusy(), isServing() (+19 more)

### Community 29 - "correo.js"
Cohesion: 0.31
Nodes (6): fs, leerPago(), montos(), pagador(), path, revisarBuzon()

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "startUpdateWatcher"
Cohesion: 0.67
Nodes (3): readPublishedVersion(), reloadFresh(), startUpdateWatcher()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderWaBot"
Cohesion: 0.38
Nodes (7): botCfg(), botGuardar(), maryWaCard(), mwCuenta(), mwEsperar(), mwPintar(), renderWaBot()

### Community 45 - "switchTab"
Cohesion: 0.15
Nodes (28): applyPanelBrand(), isOwner(), isTrial(), linkOptOn(), lockCard(), myPlan(), panelPrefs(), planFor() (+20 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 273 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `admin.js`, `common.js`, `esc`, `esc`, `renderWaBot`, `mary.gs`, `drawStory`, `bpath`, `toMillis`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.060399917542774684 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0896551724137931 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `app.js`, `admin.js`, `common.js`, `esc`, `renderWaBot`, `drawStory`, `switchTab`, `bpath`, `lockedNow`, `plansOf`, `openStoryViewer`, `handleAct`, `toMillis`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._