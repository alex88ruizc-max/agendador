# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~127,493 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 954 nodes · 2757 edges · 44 communities (39 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de674c3f`
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
- bpath
- bogNow
- cartero.py
- mary.gs
- drawStory
- guideSteps
- boot
- renderServices
- estado.js
- openStoryViewer
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- applyBrandColors
- correo.js
- options
- waha-agendador
- toMillis
- textos.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- renderReferrals
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderSettings
- openWizard
- environment
- oido-agendador

## God Nodes (most connected - your core abstractions)
1. `esc()` - 82 edges
2. `toast()` - 49 edges
3. `bogNow()` - 48 edges
4. `bpath()` - 46 edges
5. `crear()` - 38 edges
6. `cop()` - 34 edges
7. `toMillis()` - 34 edges
8. `hora12()` - 33 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `openConsent()` --calls--> `openModal()`  [EXTRACTED]
  app.js → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `clientHistory()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js
- `closeM()` --calls--> `closeModal()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (44 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (99): llega(), assert, GS_MARY, INFO, test, AGRUPA, ahoraLocal(), alEventoConexion() (+91 more)

### Community 1 - "super.js"
Cohesion: 0.06
Nodes (106): aptAction(), aptCard(), bloqueo(), brPreview(), connectWhatsApp(), custName(), imgToDataUrl(), loadLost() (+98 more)

### Community 2 - "app.js"
Cohesion: 0.09
Nodes (32): APP, BIZ_ID, busyUntilLabel(), canChange(), checkPhone(), CITA_LINK, connectTg(), COUNTRIES (+24 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (63): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, closeMenus() (+55 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (40): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, businessFromUrl(), categoriaAuto() (+32 more)

### Community 5 - "estado.js"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (22): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+14 more)

### Community 7 - "bpath"
Cohesion: 0.21
Nodes (22): clientHistory(), closeM(), deleteClient(), geoSkipKey(), goStep(), loadUsers(), manageStory(), markGuide() (+14 more)

### Community 8 - "bogNow"
Cohesion: 0.16
Nodes (26): actStats(), bogDay(), bogHour(), buildRecs(), estadoCupos(), fillAsStory(), freeNowStaff(), freeTimes() (+18 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "drawStory"
Cohesion: 0.18
Nodes (18): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor(), hexRgba(), loadImg() (+10 more)

### Community 12 - "guideSteps"
Cohesion: 0.43
Nodes (7): guideCard(), guideDone(), guideProgress(), guideSteps(), openGuide(), stepDone(), wizPassed()

### Community 13 - "boot"
Cohesion: 0.19
Nodes (17): afterGoogle(), bookingStaff(), boot(), expectedDeposit(), loadProfile(), onErr(), renderAll(), renderCalendar() (+9 more)

### Community 14 - "renderServices"
Cohesion: 0.22
Nodes (18): dayBookable(), dayGrid(), dayRatio(), firstOpenDay(), freeFrom(), hoursOfStaff(), isClosed(), maxDate() (+10 more)

### Community 15 - "estado.js"
Cohesion: 0.24
Nodes (13): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+5 more)

### Community 16 - "openStoryViewer"
Cohesion: 0.26
Nodes (12): openStoryViewer(), draw(), go(), tick(), renderStories(), seen(), brandRow(), dialog() (+4 more)

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
Cohesion: 0.20
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 24 - "applyBrandColors"
Cohesion: 0.29
Nodes (11): apInitials(), darkenIfLight(), renderApPreview(), renderBiz(), applyBrandColors(), darken(), headerBgCss(), hexRgb() (+3 more)

### Community 25 - "correo.js"
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.10
Nodes (40): abrirCupos(), activeStories(), applyPanelBrand(), firstName(), goTab(), h12s(), hoursSummary(), isBusy() (+32 more)

### Community 29 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "renderReferrals"
Cohesion: 0.50
Nodes (4): refCap(), refLevels(), refLink(), renderReferrals()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderSettings"
Cohesion: 0.18
Nodes (19): botCfg(), botGuardar(), isTrial(), lockCard(), maryWaCard(), mwEsperar(), mwPintar(), myPlan() (+11 more)

### Community 45 - "openWizard"
Cohesion: 0.39
Nodes (8): closeWizard(), drawWizard(), openWizard(), wizChange(), wizClick(), wizInput(), wizReadSvcs(), wizWatchTg()

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

- **Why does `hora12()` connect `super.js` to `app.js`, `admin.js`, `common.js`, `bpath`, `bogNow`, `renderSettings`, `mary.gs`, `drawStory`, `boot`, `renderServices`, `toMillis`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.057871692366266894 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `super.js`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.055341055341055344 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `super.js` to `renderReferrals`, `app.js`, `admin.js`, `common.js`, `bpath`, `renderSettings`, `bogNow`, `drawStory`, `guideSteps`, `boot`, `renderServices`, `openStoryViewer`, `applyBrandColors`, `toMillis`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._