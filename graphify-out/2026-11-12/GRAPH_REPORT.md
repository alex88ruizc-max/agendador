# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 29 files · ~91,654 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 771 nodes · 2240 edges · 37 communities (32 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 65 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54e15404`
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
- start
- plansOf
- options
- waha-agendador
- openStoryViewer
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
- `clientHistory()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js
- `closeM()` --calls--> `closeModal()`  [EXTRACTED]
  admin.js → common.js
- `freeSlotsFor()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (37 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (85): llega(), assert, INFO, test, fs, leerPago(), montos(), pagador() (+77 more)

### Community 1 - "esc"
Cohesion: 0.08
Nodes (84): aptAction(), aptCard(), brPreview(), clientHistory(), closeM(), closeWizard(), connectWhatsApp(), custName() (+76 more)

### Community 2 - "app.js"
Cohesion: 0.07
Nodes (77): renderQDays(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), checkPhone() (+69 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (52): A, ACT, ACTIVE, actStats(), ALL_TABS, bogDay(), bogHour(), CLIENT_FILTERS (+44 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (38): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl() (+30 more)

### Community 5 - "estado.js"
Cohesion: 0.09
Nodes (31): imapflow, mailparser, @resvg/resvg-js, color(), DCORTO, DIAS, fechaLarga(), inicial() (+23 more)

### Community 6 - "escenarios.js"
Cohesion: 0.05
Nodes (26): assert, CONFIRMADA, DIR, fs, NEG_F, NEGOCIO, os, path (+18 more)

### Community 7 - "super.js"
Cohesion: 0.08
Nodes (24): DEFAULT_PAY_WARNING, readPublishedVersion(), reloadFresh(), replaceNav(), RULES_VERSION, setNavHandler(), startUpdateWatcher(), FILTERS (+16 more)

### Community 8 - "toMillis"
Cohesion: 0.11
Nodes (30): activeStories(), buildRecs(), fillAsStory(), firstName(), freeNowStaff(), freeTimes(), hh(), isBusy() (+22 more)

### Community 9 - "cartero.py"
Cohesion: 0.20
Nodes (13): atender(), bajar(), banco_web(), curl(), decir(), gh(), hacer_apk(), instalar_mary() (+5 more)

### Community 10 - "mary.gs"
Cohesion: 0.21
Nodes (21): maryAgenda(), maryAvisada_(), maryCategorias_(), maryChat_(), maryCitaOut_(), maryCitasDe_(), maryCupos_(), maryInfo_() (+13 more)

### Community 11 - "newStory"
Cohesion: 0.15
Nodes (23): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+15 more)

### Community 12 - "renderAppearance"
Cohesion: 0.25
Nodes (11): goStep(), guideCard(), guideDone(), guideProgress(), guideSteps(), markGuide(), openGuide(), openShareGuide() (+3 more)

### Community 13 - "openStore"
Cohesion: 0.20
Nodes (17): adminUrl(), daysLeft(), dm(), goMoney(), initials(), logoOf(), msgFor(), openStore() (+9 more)

### Community 14 - "renderMarketing"
Cohesion: 0.19
Nodes (19): isTrial(), lockCard(), lockedNow(), maryWaCard(), myPlan(), planFor(), planInfo(), PLANS() (+11 more)

### Community 15 - "openWizard"
Cohesion: 0.24
Nodes (10): drawWizard(), imgToDataUrl(), openWizard(), renderAppearance(), renderPanelOrder(), socialHandle(), wizChange(), wizInit() (+2 more)

### Community 16 - "plansOf"
Cohesion: 0.20
Nodes (10): pmProblem(), renderPM(), isKeyMethod(), payAccountInput(), pushNav(), warmServer(), goSV(), loadPlanCfg() (+2 more)

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "switchTab"
Cohesion: 0.22
Nodes (9): goTab(), refCap(), refLevels(), refLink(), renderReferrals(), show(), showMore(), switchTab() (+1 more)

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
Cohesion: 0.29
Nodes (12): applyPanelBrand(), isOwner(), linkOptOn(), onErr(), panelPrefs(), renderLinkCli(), renderServices(), renderTabs() (+4 more)

### Community 24 - "plansOf"
Cohesion: 0.40
Nodes (6): planPrice(), renderTrialPlans(), showTrialForm(), planBenefitsIntro(), planPriceOf(), plansOf()

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

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

- **Why does `hora12()` connect `esc` to `app.js`, `admin.js`, `common.js`, `toMillis`, `mary.gs`, `newStory`, `renderMarketing`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05531914893617021 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `esc` be split into smaller, more focused modules?**
  _Cohesion score 0.08261617900172118 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `app.js`, `admin.js`, `common.js`, `super.js`, `toMillis`, `newStory`, `renderAppearance`, `openStore`, `renderMarketing`, `openWizard`, `plansOf`, `switchTab`, `start`, `plansOf`, `openStoryViewer`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06635802469135803 - nodes in this community are weakly interconnected._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04040404040404041 - nodes in this community are weakly interconnected._