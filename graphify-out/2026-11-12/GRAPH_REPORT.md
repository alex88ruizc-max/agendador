# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 30 files · ~101,613 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 841 nodes · 2465 edges · 46 communities (36 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4444e94f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- toast
- app.js
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
- openStore
- renderMarketing
- openWizard
- isKeyMethod
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- start
- plansOf
- toMillis
- options
- waha-agendador
- openStoryViewer
- openQuick
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- handleAct
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- openAptModal
- render
- closeMenus
- mwEsperar
- syncBottomNav
- wizInit
- toMinW

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 47 edges
3. `bpath()` - 44 edges
4. `bogNow()` - 44 edges
5. `toMillis()` - 34 edges
6. `cop()` - 34 edges
7. `renderHome()` - 32 edges
8. `hora12()` - 30 edges
9. `crear()` - 27 edges
10. `openM()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `atenderMensaje()` --calls--> `fotoRecibida()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `atenderMensaje()` --calls--> `fotoSinCita()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `atenderMensaje()` --calls--> `problema()`  [EXTRACTED]
  vps/principal.js → vps/textos.js

## Import Cycles
- None detected.

## Communities (46 total, 10 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (79): assert, INFO, test, fs, leerPago(), montos(), pagador(), path (+71 more)

### Community 1 - "toast"
Cohesion: 0.16
Nodes (40): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), imgToDataUrl() (+32 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (82): freeSlotsFor(), renderClosed(), renderQDays(), afterGoogle(), APP, apptCard(), BIZ_ID, bookingStaff() (+74 more)

### Community 3 - "admin.js"
Cohesion: 0.05
Nodes (40): A, ACT, ACTIVE, ALL_TABS, CLIENT_FILTERS, DAY_SHORT, DAYS, H (+32 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (42): app, APP_VERSION, auth, BID, BRAND, brandRow(), businessFromUrl(), copyText() (+34 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.05
Nodes (35): assert, CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY, ids() (+27 more)

### Community 7 - "super.js"
Cohesion: 0.09
Nodes (20): BIZ_TYPES, pushNav(), readPublishedVersion(), reloadFresh(), replaceNav(), setNavHandler(), startUpdateWatcher(), warmServer() (+12 more)

### Community 8 - "bogNow"
Cohesion: 0.11
Nodes (37): actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeNowStaff(), freeTimes() (+29 more)

### Community 9 - "cartero.py"
Cohesion: 0.20
Nodes (13): atender(), bajar(), banco_web(), curl(), decir(), gh(), hacer_apk(), instalar_mary() (+5 more)

### Community 10 - "mary.gs"
Cohesion: 0.17
Nodes (30): maryAgenda(), maryAvisada_(), maryCatalogo_(), maryCategorias_(), maryChat_(), maryCitaOut_(), maryCitasDe_(), maryCompute_() (+22 more)

### Community 11 - "newStory"
Cohesion: 0.15
Nodes (22): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba() (+14 more)

### Community 12 - "renderAppearance"
Cohesion: 0.31
Nodes (9): guideCard(), guideDone(), guideProgress(), guideSteps(), markGuide(), openGuide(), openShareGuide(), stepDone() (+1 more)

### Community 13 - "openStore"
Cohesion: 0.24
Nodes (15): adminUrl(), daysLeft(), dm(), initials(), logoOf(), msgFor(), openStore(), phoneOf() (+7 more)

### Community 14 - "renderMarketing"
Cohesion: 0.19
Nodes (21): isTrial(), linkOptOn(), lockCard(), maryWaCard(), myPlan(), planFor(), planInfo(), PLANS() (+13 more)

### Community 15 - "openWizard"
Cohesion: 0.24
Nodes (12): closeWizard(), drawWizard(), openWizard(), readPM(), saveSettings(), syncPlanGate(), wizChange(), wizClick() (+4 more)

### Community 16 - "isKeyMethod"
Cohesion: 0.50
Nodes (4): pmProblem(), isKeyMethod(), payAccountInput(), renderPlMethods()

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.10
Nodes (56): corto(), crear(), agendar(), aprender(), catalogo(), cliente(), crearCita(), cupos() (+48 more)

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

### Community 23 - "start"
Cohesion: 0.30
Nodes (12): applyPanelBrand(), isOwner(), onErr(), panelPrefs(), renderAgenda(), renderServices(), renderTabs(), setAgendaDate() (+4 more)

### Community 24 - "plansOf"
Cohesion: 0.29
Nodes (11): planPrice(), renderTrialPlans(), showTrialForm(), cop(), planBenefits(), planBenefitsIntro(), planPriceOf(), plansOf() (+3 more)

### Community 25 - "toMillis"
Cohesion: 0.22
Nodes (11): activeStories(), liveNow(), newsUnread(), openPlatformNews(), refCap(), refLevels(), refLink(), renderBell() (+3 more)

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 29 - "openQuick"
Cohesion: 0.33
Nodes (10): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff() (+2 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "handleAct"
Cohesion: 0.22
Nodes (11): openConsent(), closeModal(), hideModal(), openModal(), planOfBiz(), addMonths(), handleAct(), openM() (+3 more)

### Community 39 - "openAptModal"
Cohesion: 0.28
Nodes (9): aptCard(), brPreview(), custName(), loadModalLocks(), openAptModal(), payLine(), renderExtras(), renderModalSlots() (+1 more)

### Community 40 - "render"
Cohesion: 0.28
Nodes (9): hideOrder(), render(), renderMonth(), renderNewsAdmin(), renderOrders(), renderPayments(), renderTodo(), start() (+1 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `bogNow` to `toast`, `app.js`, `admin.js`, `common.js`, `openAptModal`, `mary.gs`, `newStory`, `openQuick`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06415396952686447 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `bogNow`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0612859097127223 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `renderMarketing` to `toast`, `app.js`, `admin.js`, `common.js`, `super.js`, `bogNow`, `newStory`, `renderAppearance`, `openStore`, `isKeyMethod`, `start`, `plansOf`, `toMillis`, `openStoryViewer`, `openQuick`, `handleAct`, `openAptModal`, `render`, `mwEsperar`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._