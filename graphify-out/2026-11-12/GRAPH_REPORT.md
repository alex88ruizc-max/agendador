# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 30 files · ~113,587 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 891 nodes · 2606 edges · 45 communities (40 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 99 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5109912`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- toast
- app.js
- admin.js
- common.js
- package.json
- escenarios.js
- super.js
- renderHome
- cartero.py
- mary.gs
- newStory
- estado.js
- correo.js
- switchTab
- renderSettings
- plansOf
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- renderLane
- openWizard
- options
- waha-agendador
- render
- renderStaffTab
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- toMillis
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderWaBot
- guideSteps
- startUpdateWatcher
- scripts
- isKeyMethod

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 48 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 44 edges
5. `cop()` - 34 edges
6. `toMillis()` - 34 edges
7. `renderHome()` - 32 edges
8. `hora12()` - 31 edges
9. `crear()` - 30 edges
10. `openM()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `brPreview()` --calls--> `fillTemplate()`  [EXTRACTED]
  admin.js → common.js
- `brPreview()` --calls--> `hora12()`  [EXTRACTED]
  admin.js → common.js
- `clientHistory()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (45 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (91): llega(), assert, GS_MARY, INFO, test, AGRUPA, ahoraLocal(), alEventoConexion() (+83 more)

### Community 1 - "toast"
Cohesion: 0.08
Nodes (80): aptAction(), brPreview(), clientHistory(), closeM(), closeWizard(), connectWhatsApp(), custName(), deleteClient() (+72 more)

### Community 2 - "app.js"
Cohesion: 0.05
Nodes (108): aptCard(), h12s(), hoursSummary(), renderClosed(), renderFree(), renderQDays(), afterGoogle(), APP (+100 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (51): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, closeMenus() (+43 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (34): app, auth, BID, BIZ_TYPES, BRAND, businessFromUrl(), categoriaAuto(), db (+26 more)

### Community 5 - "package.json"
Cohesion: 0.15
Nodes (15): imapflow, mailparser, @resvg/resvg-js, png(), dependencies, imapflow@1.0.171, mailparser@3.7.1, @resvg/resvg-js@2.6.2 (+7 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (18): assert, CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY, ids() (+10 more)

### Community 7 - "super.js"
Cohesion: 0.09
Nodes (20): APP_VERSION, PLAN_FEATURES, pushNav(), replaceNav(), FILTERS, goMoney(), goSV(), HIDDEN (+12 more)

### Community 8 - "renderHome"
Cohesion: 0.16
Nodes (21): actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeTimes(), goTab() (+13 more)

### Community 9 - "cartero.py"
Cohesion: 0.17
Nodes (19): atender(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl(), decir(), env_leer() (+11 more)

### Community 10 - "mary.gs"
Cohesion: 0.13
Nodes (39): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+31 more)

### Community 11 - "newStory"
Cohesion: 0.15
Nodes (22): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+14 more)

### Community 12 - "estado.js"
Cohesion: 0.24
Nodes (13): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+5 more)

### Community 13 - "correo.js"
Cohesion: 0.36
Nodes (6): fs, leerPago(), montos(), pagador(), path, revisarBuzon()

### Community 14 - "switchTab"
Cohesion: 0.24
Nodes (15): applyPanelBrand(), isOwner(), linkOptOn(), onErr(), panelPrefs(), renderAgenda(), renderLinkCli(), renderServices() (+7 more)

### Community 15 - "renderSettings"
Cohesion: 0.27
Nodes (13): isTrial(), lockCard(), myPlan(), planFor(), planInfo(), PLANS(), readPM(), renderPlanBanner() (+5 more)

### Community 16 - "plansOf"
Cohesion: 0.50
Nodes (5): planPrice(), renderTrialPlans(), showTrialForm(), planPriceOf(), plansOf()

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.08
Nodes (60): corto(), crear(), agendar(), aprender(), cancelarCita(), catalogo(), cliente(), crearCita() (+52 more)

### Community 19 - "agendador-ia"
Cohesion: 0.18
Nodes (11): build, container_name, cpus, depends_on, env_file, mem_limit, networks, ports (+3 more)

### Community 20 - "postgres-agendador"
Cohesion: 0.18
Nodes (11): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, container_name, environment, image, mem_limit, networks (+3 more)

### Community 21 - "services"
Cohesion: 0.20
Nodes (9): name, name, networks, agenda, services, volumes, evo_instancias, pg_datos (+1 more)

### Community 22 - "evolution-agendador"
Cohesion: 0.20
Nodes (10): container_name, depends_on, env_file, image, mem_limit, networks, ports, restart (+2 more)

### Community 23 - "reglas.js"
Cohesion: 0.18
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 24 - "renderLane"
Cohesion: 0.22
Nodes (16): adminUrl(), daysLeft(), dm(), initials(), logoOf(), msgFor(), openM(), openStore() (+8 more)

### Community 25 - "openWizard"
Cohesion: 0.38
Nodes (7): drawWizard(), openWizard(), socialHandle(), wizChange(), wizInit(), wizInput(), wizWatchTg()

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "render"
Cohesion: 0.32
Nodes (8): hideOrder(), render(), renderNewsAdmin(), renderOrders(), renderPayments(), renderTodo(), start(), unhideOrder()

### Community 29 - "renderStaffTab"
Cohesion: 0.29
Nodes (10): freeNowStaff(), isBusy(), isServing(), meStaff(), renderMyStatus(), renderQNow(), renderStaffTab(), timeOf() (+2 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "toMillis"
Cohesion: 0.24
Nodes (10): activeStories(), newsUnread(), openPlatformNews(), refCap(), refLevels(), refLink(), renderBell(), renderReferrals() (+2 more)

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderWaBot"
Cohesion: 0.47
Nodes (6): botCfg(), botGuardar(), maryWaCard(), mwEsperar(), mwPintar(), renderWaBot()

### Community 41 - "guideSteps"
Cohesion: 0.47
Nodes (6): guideCard(), guideDone(), guideProgress(), guideSteps(), stepDone(), wizPassed()

### Community 42 - "startUpdateWatcher"
Cohesion: 0.67
Nodes (3): readPublishedVersion(), reloadFresh(), startUpdateWatcher()

### Community 43 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, start, test

### Community 48 - "isKeyMethod"
Cohesion: 0.50
Nodes (4): pmProblem(), renderPM(), isKeyMethod(), payAccountInput()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 241 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `toast`, `admin.js`, `common.js`, `renderWaBot`, `renderHome`, `mary.gs`, `newStory`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06206140350877193 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.07911392405063292 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `toast` to `toMillis`, `app.js`, `admin.js`, `common.js`, `super.js`, `renderWaBot`, `guideSteps`, `renderHome`, `newStory`, `switchTab`, `renderSettings`, `isKeyMethod`, `plansOf`, `renderLane`, `render`, `renderStaffTab`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05131917631917632 - nodes in this community are weakly interconnected._