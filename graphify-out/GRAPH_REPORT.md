# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 30 files · ~109,921 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 886 nodes · 2591 edges · 48 communities (39 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a23e4e1f`
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
- bogNow
- cartero.py
- mary.gs
- newStory
- renderAppearance
- esc
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
- estado.js
- openQuick
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- toMillis
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- correo.js
- applyBrandColors
- openStore
- actStats
- closeMenus
- syncBottomNav
- wizInit
- toMinW

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 48 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 44 edges
5. `toMillis()` - 34 edges
6. `cop()` - 34 edges
7. `renderHome()` - 32 edges
8. `hora12()` - 31 edges
9. `crear()` - 30 edges
10. `switchTab()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `setDialogBrand()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (48 total, 9 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.07
Nodes (87): llega(), assert, GS_MARY, INFO, test, ahoraLocal(), alEventoConexion(), alMensaje() (+79 more)

### Community 1 - "toast"
Cohesion: 0.14
Nodes (44): aptAction(), brPreview(), clientHistory(), closeM(), connectWhatsApp(), custName(), deleteClient(), geoSkipKey() (+36 more)

### Community 2 - "app.js"
Cohesion: 0.05
Nodes (108): aptCard(), h12s(), hoursSummary(), renderClosed(), renderFree(), renderQDays(), afterGoogle(), APP (+100 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (43): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, DAY_SHORT (+35 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (36): app, APP_VERSION, auth, BID, BRAND, businessFromUrl(), categoriaAuto(), db (+28 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (18): assert, CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY, ids() (+10 more)

### Community 7 - "super.js"
Cohesion: 0.07
Nodes (28): pmProblem(), BIZ_TYPES, isKeyMethod(), payAccountInput(), PLAN_FEATURES, PLAN_KEYS, planBenefitsIntro(), pushNav() (+20 more)

### Community 8 - "bogNow"
Cohesion: 0.12
Nodes (31): activeStories(), buildRecs(), fillAsStory(), firstName(), freeNowStaff(), freeTimes(), goTab(), hh() (+23 more)

### Community 9 - "cartero.py"
Cohesion: 0.17
Nodes (19): atender(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl(), decir(), env_leer() (+11 more)

### Community 10 - "mary.gs"
Cohesion: 0.14
Nodes (39): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+31 more)

### Community 11 - "newStory"
Cohesion: 0.23
Nodes (14): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor(), hexRgba(), loadImg() (+6 more)

### Community 12 - "renderAppearance"
Cohesion: 0.36
Nodes (8): guideCard(), guideDone(), guideProgress(), guideSteps(), markGuide(), openGuide(), stepDone(), wizPassed()

### Community 13 - "esc"
Cohesion: 0.18
Nodes (17): botCfg(), botGuardar(), loadModalLocks(), maryWaCard(), mwEsperar(), mwPintar(), openAptModal(), renderExtras() (+9 more)

### Community 14 - "switchTab"
Cohesion: 0.28
Nodes (13): applyPanelBrand(), isOwner(), linkOptOn(), onErr(), panelPrefs(), renderAgenda(), renderLinkCli(), renderServices() (+5 more)

### Community 15 - "renderSettings"
Cohesion: 0.19
Nodes (19): isTrial(), lockCard(), myPlan(), planFor(), planInfo(), PLANS(), readPM(), renderPlan() (+11 more)

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
Cohesion: 0.20
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 24 - "renderLane"
Cohesion: 0.24
Nodes (14): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+6 more)

### Community 25 - "openWizard"
Cohesion: 0.25
Nodes (11): closeWizard(), drawWizard(), imgToDataUrl(), openWizard(), renderAppearance(), renderPanelOrder(), wizChange(), wizClick() (+3 more)

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "estado.js"
Cohesion: 0.24
Nodes (13): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+5 more)

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

### Community 33 - "toMillis"
Cohesion: 0.23
Nodes (12): newsUnread(), openPlatformNews(), refCap(), refLevels(), refLink(), renderBell(), renderReferrals(), startNews() (+4 more)

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "correo.js"
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 41 - "applyBrandColors"
Cohesion: 0.43
Nodes (8): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), hexRgb(), lum(), onColor()

### Community 42 - "openStore"
Cohesion: 0.38
Nodes (7): adminUrl(), msgFor(), openM(), openStore(), phoneOf(), publicUrl(), waTo()

### Community 43 - "actStats"
Cohesion: 0.67
Nodes (3): actStats(), bogDay(), bogHour()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 239 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `toast`, `admin.js`, `common.js`, `bogNow`, `mary.gs`, `newStory`, `esc`, `openQuick`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06568986568986569 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.13953488372093023 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `toast`, `app.js`, `admin.js`, `toMillis`, `common.js`, `super.js`, `bogNow`, `applyBrandColors`, `openStore`, `newStory`, `renderAppearance`, `switchTab`, `renderSettings`, `plansOf`, `renderLane`, `openWizard`, `openQuick`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05131917631917632 - nodes in this community are weakly interconnected._