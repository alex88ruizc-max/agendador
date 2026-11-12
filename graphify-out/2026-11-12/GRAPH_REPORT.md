# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 30 files · ~109,262 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 883 nodes · 2589 edges · 39 communities (34 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9beb280`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- toast
- bogNow
- admin.js
- common.js
- estado.js
- escenarios.js
- super.js
- bogNow
- cartero.py
- mary.gs
- newStory
- renderAppearance
- app.js
- switchTab
- renderSettings
- renderPlan
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- esc
- openWizard
- options
- waha-agendador
- openStoryViewer
- hora12
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js

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
- `aptAction()` --calls--> `uiPrompt()`  [EXTRACTED]
  admin.js → common.js
- `clientHistory()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js
- `closeM()` --calls--> `closeModal()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (39 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.07
Nodes (86): assert, INFO, test, ahoraLocal(), alEventoConexion(), alMensaje(), anotar(), armarEstado() (+78 more)

### Community 1 - "toast"
Cohesion: 0.20
Nodes (33): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), loadUsers() (+25 more)

### Community 2 - "bogNow"
Cohesion: 0.12
Nodes (42): loadLost(), renderMarketing(), renderQDays(), bookingStaff(), boot(), dayBookable(), dayGrid(), dayRatio() (+34 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (61): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, closeMenus() (+53 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (39): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, brandRow(), closeModal() (+31 more)

### Community 5 - "estado.js"
Cohesion: 0.07
Nodes (37): imapflow, mailparser, @resvg/resvg-js, fs, leerPago(), montos(), pagador(), path (+29 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (18): assert, CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY, ids() (+10 more)

### Community 7 - "super.js"
Cohesion: 0.08
Nodes (41): openResched(), copyText(), fechaLarga(), PLAN_FEATURES, planOfBiz(), pushNav(), replaceNav(), uiPrompt() (+33 more)

### Community 8 - "bogNow"
Cohesion: 0.12
Nodes (27): activeStories(), actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeNowStaff() (+19 more)

### Community 9 - "cartero.py"
Cohesion: 0.17
Nodes (19): atender(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl(), decir(), env_leer() (+11 more)

### Community 10 - "mary.gs"
Cohesion: 0.14
Nodes (38): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCategorias_(), maryChat_() (+30 more)

### Community 11 - "newStory"
Cohesion: 0.13
Nodes (25): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+17 more)

### Community 12 - "renderAppearance"
Cohesion: 0.29
Nodes (10): guideCard(), guideDone(), guideProgress(), guideSteps(), lockedNow(), markGuide(), openGuide(), openShareGuide() (+2 more)

### Community 13 - "app.js"
Cohesion: 0.07
Nodes (43): afterGoogle(), APP, BIZ_ID, busyUntilLabel(), checkPhone(), CITA_LINK, connectTg(), COUNTRIES (+35 more)

### Community 14 - "switchTab"
Cohesion: 0.19
Nodes (19): applyPanelBrand(), goTab(), isOwner(), linkOptOn(), myPlan(), onErr(), panelPrefs(), renderLinkCli() (+11 more)

### Community 15 - "renderSettings"
Cohesion: 0.14
Nodes (22): botCfg(), botGuardar(), isTrial(), lockCard(), maryWaCard(), mwEsperar(), mwPintar(), planFor() (+14 more)

### Community 16 - "renderPlan"
Cohesion: 0.17
Nodes (16): planPrice(), pmProblem(), renderPlan(), renderPM(), renderTrialPlans(), showTrialForm(), isKeyMethod(), payAccountInput() (+8 more)

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.08
Nodes (62): corto(), crear(), agendar(), aprender(), cancelarCita(), catalogo(), cliente(), crearCita() (+54 more)

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

### Community 24 - "esc"
Cohesion: 0.19
Nodes (23): aptCard(), openPlatformNews(), renderAgenda(), renderQMains(), apptCard(), canChange(), renderMine(), serviceButton() (+15 more)

### Community 25 - "openWizard"
Cohesion: 0.25
Nodes (11): closeWizard(), drawWizard(), imgToDataUrl(), openWizard(), renderAppearance(), renderPanelOrder(), wizChange(), wizClick() (+3 more)

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 29 - "hora12"
Cohesion: 0.18
Nodes (20): brPreview(), custName(), loadModalLocks(), loadQLocks(), lookupPhone(), openAptModal(), openQuick(), qMinutes() (+12 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 236 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `hora12` to `toast`, `bogNow`, `admin.js`, `common.js`, `super.js`, `bogNow`, `mary.gs`, `newStory`, `app.js`, `renderSettings`, `esc`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06617826617826618 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `hora12`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `bogNow` be split into smaller, more focused modules?**
  _Cohesion score 0.11614401858304298 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `toast`, `bogNow`, `admin.js`, `common.js`, `super.js`, `bogNow`, `newStory`, `renderAppearance`, `app.js`, `switchTab`, `renderSettings`, `renderPlan`, `openWizard`, `openStoryViewer`, `hora12`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.036210317460317464 - nodes in this community are weakly interconnected._