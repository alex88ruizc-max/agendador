# Graph Report - agendador  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 763 nodes · 2244 edges · 39 communities (34 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 65 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cff523ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- esc
- app.js
- admin.js
- common.js
- estado.js
- escenarios.js
- super.js
- toMillis
- cartero.py
- mary.gs
- newStory
- renderAppearance
- openStore
- renderMarketing
- openWizard
- plansOf
- environment
- switchTab
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- applyBrandColors
- buildRecs
- render
- options
- waha-agendador
- openStoryViewer
- config.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- openModal
- configurar-waha.sh
- mudar-google.sh
- conectar.sh

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 47 edges
3. `bpath()` - 44 edges
4. `bogNow()` - 44 edges
5. `cop()` - 34 edges
6. `toMillis()` - 34 edges
7. `renderHome()` - 32 edges
8. `hora12()` - 30 edges
9. `openM()` - 24 edges
10. `setBusy()` - 24 edges

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

## Communities (39 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (87): llega(), assert, INFO, test, fs, leerPago(), montos(), pagador() (+79 more)

### Community 1 - "esc"
Cohesion: 0.08
Nodes (88): aptAction(), aptCard(), brPreview(), clientHistory(), closeM(), connectWhatsApp(), custName(), deleteClient() (+80 more)

### Community 2 - "app.js"
Cohesion: 0.07
Nodes (77): renderQDays(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), canChange() (+69 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (48): A, ACT, ACTIVE, ALL_TABS, CLIENT_FILTERS, closeMenus(), DAY_SHORT, DAYS (+40 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (33): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl() (+25 more)

### Community 5 - "estado.js"
Cohesion: 0.09
Nodes (34): imapflow, mailparser, @resvg/resvg-js, color(), DCORTO, DIAS, fechaLarga(), inicial() (+26 more)

### Community 6 - "escenarios.js"
Cohesion: 0.06
Nodes (19): assert, CONFIRMADA, DIR, fs, NEG_F, NEGOCIO, os, path (+11 more)

### Community 7 - "super.js"
Cohesion: 0.08
Nodes (22): pushNav(), readPublishedVersion(), reloadFresh(), replaceNav(), salirAlNavegador(), SERVER_VERSION, startUpdateWatcher(), TG_EVENTS (+14 more)

### Community 8 - "toMillis"
Cohesion: 0.15
Nodes (27): activeStories(), firstName(), freeNowStaff(), isBusy(), isOwner(), isServing(), liveNow(), loadActivity() (+19 more)

### Community 9 - "cartero.py"
Cohesion: 0.20
Nodes (13): atender(), bajar(), banco_web(), curl(), decir(), gh(), hacer_apk(), instalar_mary() (+5 more)

### Community 10 - "mary.gs"
Cohesion: 0.21
Nodes (21): maryAgenda(), maryAvisada_(), maryCategorias_(), maryChat_(), maryCitaOut_(), maryCitasDe_(), maryCupos_(), maryInfo_() (+13 more)

### Community 11 - "newStory"
Cohesion: 0.21
Nodes (16): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba(), loadImg(), loadScript() (+8 more)

### Community 12 - "renderAppearance"
Cohesion: 0.17
Nodes (15): applyPanelBrand(), goStep(), guideCard(), guideDone(), guideProgress(), guideSteps(), markGuide(), openGuide() (+7 more)

### Community 13 - "openStore"
Cohesion: 0.24
Nodes (15): adminUrl(), daysLeft(), dm(), initials(), logoOf(), msgFor(), openStore(), phoneOf() (+7 more)

### Community 14 - "renderMarketing"
Cohesion: 0.24
Nodes (14): isTrial(), lockCard(), lockedNow(), maryWaCard(), myPlan(), planFor(), planInfo(), PLANS() (+6 more)

### Community 15 - "openWizard"
Cohesion: 0.22
Nodes (13): closeWizard(), drawWizard(), imgToDataUrl(), openWizard(), socialHandle(), syncPlanGate(), wizChange(), wizClick() (+5 more)

### Community 16 - "plansOf"
Cohesion: 0.19
Nodes (13): pmProblem(), renderPM(), renderTrialPlans(), showTrialForm(), isKeyMethod(), payAccountInput(), planBenefits(), planBenefitsIntro() (+5 more)

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "switchTab"
Cohesion: 0.18
Nodes (11): goTab(), linkOptOn(), refCap(), refLevels(), refLink(), renderLinkCli(), renderReferrals(), show() (+3 more)

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

### Community 23 - "applyBrandColors"
Cohesion: 0.36
Nodes (9): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), headerBgCss(), hexRgb(), lum() (+1 more)

### Community 24 - "buildRecs"
Cohesion: 0.36
Nodes (8): actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), freeTimes(), hh(), renderActivity()

### Community 25 - "render"
Cohesion: 0.32
Nodes (8): hideOrder(), render(), renderMonth(), renderNewsAdmin(), renderOrders(), renderTodo(), start(), unhideOrder()

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 29 - "config.js"
Cohesion: 0.33
Nodes (5): API_URL, DEFAULT_BUSINESS_ID, firebaseConfig, META_APP_ID, META_CONFIG_ID

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.60
Nodes (5): correoEntidades_(), correoEstado_(), correoFrase_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "openModal"
Cohesion: 0.40
Nodes (5): openConsent(), closeModal(), hideModal(), openModal(), openM()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `app.js`, `admin.js`, `common.js`, `toMillis`, `mary.gs`, `newStory`, `renderMarketing`, `buildRecs`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05788149164950812 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `esc` be split into smaller, more focused modules?**
  _Cohesion score 0.07601880877742946 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `app.js`, `admin.js`, `common.js`, `super.js`, `toMillis`, `newStory`, `renderAppearance`, `openStore`, `renderMarketing`, `plansOf`, `switchTab`, `applyBrandColors`, `render`, `openStoryViewer`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06635802469135803 - nodes in this community are weakly interconnected._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.042352941176470586 - nodes in this community are weakly interconnected._