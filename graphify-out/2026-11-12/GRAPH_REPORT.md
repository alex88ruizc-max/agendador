# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~122,094 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 936 nodes · 2721 edges · 46 communities (41 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b82011dd`
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
- renderHome
- cartero.py
- mary.gs
- newStory
- anotar
- atenderPedidoWa
- esc
- switchTab
- cop
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- pruebas.js
- bogNow
- openWizard
- options
- waha-agendador
- render
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- atenderMensaje
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- guideSteps
- handleAct
- openQuick
- environment
- oido-agendador
- renderSettings
- openStoryViewer

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 48 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 45 edges
5. `crear()` - 38 edges
6. `cop()` - 34 edges
7. `toMillis()` - 34 edges
8. `renderHome()` - 32 edges
9. `hora12()` - 31 edges
10. `seguir()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `clientHistory()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js
- `closeM()` --calls--> `closeModal()`  [EXTRACTED]
  admin.js → common.js
- `loadUsers()` --calls--> `esc()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (46 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (39): llega(), AGRUPA, armarEstado(), atendidos, _banco, BOT, BOT_DEF, buscarClave() (+31 more)

### Community 1 - "toast"
Cohesion: 0.17
Nodes (38): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), loadUsers() (+30 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (90): aptCard(), brPreview(), custName(), payLine(), renderQDays(), afterGoogle(), APP, apptCard() (+82 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (61): A, ACT, ACTIVE, actStats(), ALL_TABS, bogDay(), bogHour(), BOT_DEF (+53 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (41): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl() (+33 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (21): assert, audio(), CATALOGO, CONFIRMADA, DIR, DOS, filas(), fs (+13 more)

### Community 7 - "super.js"
Cohesion: 0.09
Nodes (24): pmProblem(), renderPM(), enAppInterna(), isKeyMethod(), payAccountInput(), pushNav(), salirAlNavegador(), TG_EVENTS (+16 more)

### Community 8 - "renderHome"
Cohesion: 0.12
Nodes (30): activeStories(), buildRecs(), fillAsStory(), firstName(), freeNowStaff(), freeTimes(), hh(), isBusy() (+22 more)

### Community 9 - "cartero.py"
Cohesion: 0.11
Nodes (23): atender(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl(), decir(), env_leer() (+15 more)

### Community 10 - "mary.gs"
Cohesion: 0.13
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "newStory"
Cohesion: 0.15
Nodes (23): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+15 more)

### Community 12 - "anotar"
Cohesion: 0.26
Nodes (23): ahoraLocal(), alEventoConexion(), anotar(), arrancarRelojes(), ASIS, atiende(), botDe(), botFresco() (+15 more)

### Community 13 - "atenderPedidoWa"
Cohesion: 0.43
Nodes (14): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+6 more)

### Community 14 - "esc"
Cohesion: 0.17
Nodes (18): botCfg(), botGuardar(), loadLost(), loadModalLocks(), maryWaCard(), mwEsperar(), mwPintar(), openAptModal() (+10 more)

### Community 15 - "switchTab"
Cohesion: 0.13
Nodes (29): applyPanelBrand(), goTab(), imgToDataUrl(), isOwner(), isTrial(), linkOptOn(), myPlan(), onErr() (+21 more)

### Community 16 - "cop"
Cohesion: 0.47
Nodes (6): planPrice(), renderTrialPlans(), showTrialForm(), cop(), planPriceOf(), plansOf()

### Community 17 - "environment"
Cohesion: 0.29
Nodes (7): WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED, WAHA_PRINT_QR, WHATSAPP_DEFAULT_ENGINE, WHATSAPP_SWAGGER_ENABLED, environment

### Community 18 - "textos.js"
Cohesion: 0.08
Nodes (70): corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo(), cliente() (+62 more)

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

### Community 23 - "pruebas.js"
Cohesion: 0.09
Nodes (21): assert, GS_MARY, INFO, test, assert, fs, NUESTROS, path (+13 more)

### Community 24 - "bogNow"
Cohesion: 0.27
Nodes (12): renderPlanBanner(), bogNow(), daysLeft(), dm(), initials(), logoOf(), planLine(), renderBiz() (+4 more)

### Community 25 - "openWizard"
Cohesion: 0.39
Nodes (8): closeWizard(), drawWizard(), openWizard(), wizChange(), wizClick(), wizInput(), wizReadSvcs(), wizWatchTg()

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "render"
Cohesion: 0.32
Nodes (8): hideOrder(), render(), renderNewsAdmin(), renderOrders(), renderPayments(), renderTodo(), start(), unhideOrder()

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "atenderMensaje"
Cohesion: 0.43
Nodes (7): atenderMensaje(), bajarMediaWaha(), debeResponder(), escuchar(), esWaha(), frenoRobot(), normal()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 41 - "guideSteps"
Cohesion: 0.33
Nodes (9): guideCard(), guideDone(), guideProgress(), guideSteps(), lockedNow(), markGuide(), openGuide(), stepDone() (+1 more)

### Community 42 - "handleAct"
Cohesion: 0.23
Nodes (14): closeModal(), hideModal(), addMonths(), adminUrl(), handleAct(), msgFor(), openM(), openStore() (+6 more)

### Community 43 - "openQuick"
Cohesion: 0.33
Nodes (10): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff() (+2 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "renderSettings"
Cohesion: 0.27
Nodes (12): lockCard(), planFor(), planInfo(), PLANS(), readPM(), renderSettings(), renderTgPrefs(), saveSettings() (+4 more)

### Community 49 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 261 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `toast`, `admin.js`, `common.js`, `renderHome`, `mary.gs`, `newStory`, `openQuick`, `esc`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06039488966318235 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05833905284831846 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `toast`, `app.js`, `admin.js`, `common.js`, `super.js`, `renderHome`, `guideSteps`, `handleAct`, `openQuick`, `newStory`, `switchTab`, `renderSettings`, `openStoryViewer`, `cop`, `bogNow`, `render`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._