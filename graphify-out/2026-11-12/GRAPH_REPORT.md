# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 30 files · ~117,297 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 897 nodes · 2628 edges · 49 communities (40 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `826852a5`
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
- isKeyMethod
- correo.js
- esc
- switchTab
- plansOf
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- openStore
- openWizard
- options
- waha-agendador
- renderAppearance
- textos.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- switchTab
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderWaBot
- guideSteps
- openQuick
- applyBrandColors
- actStats
- closeMenus
- hoursSummary
- syncBottomNav
- toMinW

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 48 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 44 edges
5. `crear()` - 34 edges
6. `cop()` - 34 edges
7. `toMillis()` - 34 edges
8. `renderHome()` - 32 edges
9. `hora12()` - 31 edges
10. `seguir()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `clientHistory()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js
- `closeM()` --calls--> `closeModal()`  [EXTRACTED]
  admin.js → common.js
- `manageStory()` --calls--> `esc()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (49 total, 9 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (91): llega(), assert, GS_MARY, INFO, test, AGRUPA, ahoraLocal(), alEventoConexion() (+83 more)

### Community 1 - "toast"
Cohesion: 0.15
Nodes (39): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), manageStory() (+31 more)

### Community 2 - "app.js"
Cohesion: 0.05
Nodes (99): freeNowStaff(), myStaff(), renderClosed(), renderQDays(), renderQNow(), walkInReason(), afterGoogle(), APP (+91 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (42): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, DAY_SHORT (+34 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (40): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl() (+32 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (18): assert, CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY, ids() (+10 more)

### Community 7 - "super.js"
Cohesion: 0.08
Nodes (24): DEFAULT_PAY_WARNING, PLAN_FEATURES, planOfBiz(), replaceNav(), SERVER_VERSION, FILTERS, HIDDEN, hideOrder() (+16 more)

### Community 8 - "renderHome"
Cohesion: 0.14
Nodes (28): activeStories(), buildRecs(), fillAsStory(), firstName(), freeTimes(), hh(), isBusy(), isOwner() (+20 more)

### Community 9 - "cartero.py"
Cohesion: 0.17
Nodes (19): atender(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl(), decir(), env_leer() (+11 more)

### Community 10 - "mary.gs"
Cohesion: 0.13
Nodes (39): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+31 more)

### Community 11 - "newStory"
Cohesion: 0.20
Nodes (16): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor(), hexRgba(), loadImg() (+8 more)

### Community 12 - "isKeyMethod"
Cohesion: 0.22
Nodes (9): pmProblem(), isKeyMethod(), payAccountInput(), pushNav(), goMoney(), goSV(), loadPlanCfg(), renderDisc() (+1 more)

### Community 13 - "correo.js"
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 14 - "esc"
Cohesion: 0.18
Nodes (26): aptCard(), brPreview(), custName(), loadLost(), loadModalLocks(), openAptModal(), payLine(), renderExtras() (+18 more)

### Community 15 - "switchTab"
Cohesion: 0.24
Nodes (17): isTrial(), lockCard(), myPlan(), planFor(), planInfo(), PLANS(), renderPlan(), renderPlanBanner() (+9 more)

### Community 16 - "plansOf"
Cohesion: 0.32
Nodes (8): planPrice(), renderTrialPlans(), showTrialForm(), planBenefits(), planBenefitsIntro(), planPriceOf(), plansOf(), renderPlanEditor()

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.18
Nodes (41): corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo(), cliente() (+33 more)

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
Cohesion: 0.20
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 24 - "openStore"
Cohesion: 0.22
Nodes (16): adminUrl(), daysLeft(), dm(), initials(), logoOf(), msgFor(), openM(), openStore() (+8 more)

### Community 25 - "openWizard"
Cohesion: 0.21
Nodes (12): closeWizard(), drawWizard(), openWizard(), readPM(), saveSettings(), socialHandle(), wizClick(), wizInit() (+4 more)

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "renderAppearance"
Cohesion: 0.50
Nodes (4): imgToDataUrl(), renderAppearance(), renderPanelOrder(), wizChange()

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

### Community 33 - "switchTab"
Cohesion: 0.16
Nodes (18): applyPanelBrand(), goTab(), linkOptOn(), loadUsers(), onErr(), panelPrefs(), refCap(), refLevels() (+10 more)

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderWaBot"
Cohesion: 0.47
Nodes (6): botCfg(), botGuardar(), maryWaCard(), mwEsperar(), mwPintar(), renderWaBot()

### Community 41 - "guideSteps"
Cohesion: 0.43
Nodes (7): guideCard(), guideDone(), guideProgress(), guideSteps(), openGuide(), stepDone(), wizPassed()

### Community 43 - "openQuick"
Cohesion: 0.39
Nodes (9): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQSlots(), renderQStaff(), updQSave() (+1 more)

### Community 44 - "applyBrandColors"
Cohesion: 0.43
Nodes (8): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), hexRgb(), lum(), onColor()

### Community 46 - "actStats"
Cohesion: 0.67
Nodes (3): actStats(), bogDay(), bogHour()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `toast`, `app.js`, `admin.js`, `common.js`, `renderHome`, `renderWaBot`, `mary.gs`, `newStory`, `openQuick`, `hoursSummary`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06315789473684211 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05273177232057872 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `switchTab`, `toast`, `admin.js`, `app.js`, `common.js`, `super.js`, `renderWaBot`, `guideSteps`, `renderHome`, `openQuick`, `applyBrandColors`, `newStory`, `isKeyMethod`, `switchTab`, `plansOf`, `openStore`, `renderAppearance`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._