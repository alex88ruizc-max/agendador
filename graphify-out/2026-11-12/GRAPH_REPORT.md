# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~118,709 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 925 nodes · 2669 edges · 50 communities (45 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f09d4063`
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
- bogNow
- correo.js
- esc
- renderPlan
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
- renderReferrals
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- boot
- guideSteps
- handleAct
- openQuick
- applyBrandColors
- estado.js
- environment
- oido-agendador
- renderSettings
- openStoryViewer

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 48 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 44 edges
5. `toMillis()` - 34 edges
6. `cop()` - 34 edges
7. `crear()` - 34 edges
8. `renderHome()` - 32 edges
9. `hora12()` - 31 edges
10. `seguir()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `setDialogBrand()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `warmServer()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (50 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (92): llega(), assert, GS_MARY, INFO, test, AGRUPA, ahoraLocal(), alEventoConexion() (+84 more)

### Community 1 - "toast"
Cohesion: 0.19
Nodes (31): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), manageStory(), openBreak() (+23 more)

### Community 2 - "app.js"
Cohesion: 0.09
Nodes (32): APP, BIZ_ID, busyUntilLabel(), checkPhone(), CITA_LINK, connectTg(), COUNTRIES, country() (+24 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (56): A, ACT, ACTIVE, actStats(), ALL_TABS, bogDay(), bogHour(), BOT_DEF (+48 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (41): app, APP_VERSION, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), categoriaAuto() (+33 more)

### Community 5 - "estado.js"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (19): assert, audio(), CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY (+11 more)

### Community 7 - "super.js"
Cohesion: 0.08
Nodes (27): pmProblem(), renderPM(), auth, isKeyMethod(), payAccountInput(), PLAN_KEYS, pushNav(), RULES_VERSION (+19 more)

### Community 8 - "renderHome"
Cohesion: 0.13
Nodes (36): activeStories(), buildRecs(), fillAsStory(), freeTimes(), goTab(), hh(), isBusy(), isOwner() (+28 more)

### Community 9 - "cartero.py"
Cohesion: 0.11
Nodes (21): atender(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl(), decir(), env_leer() (+13 more)

### Community 10 - "mary.gs"
Cohesion: 0.13
Nodes (39): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+31 more)

### Community 11 - "newStory"
Cohesion: 0.22
Nodes (14): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor(), hexRgba(), loadImg() (+6 more)

### Community 12 - "bogNow"
Cohesion: 0.23
Nodes (21): renderQDays(), dayBookable(), dayGrid(), firstOpenDay(), hoursOfStaff(), isClosed(), maxDate(), nextBookableDay() (+13 more)

### Community 13 - "correo.js"
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 14 - "esc"
Cohesion: 0.15
Nodes (38): aptCard(), brPreview(), custName(), h12s(), hoursSummary(), loadLost(), loadModalLocks(), lookupPhone() (+30 more)

### Community 15 - "renderPlan"
Cohesion: 0.16
Nodes (20): botCfg(), botGuardar(), isTrial(), lockCard(), maryWaCard(), mwEsperar(), mwPintar(), myPlan() (+12 more)

### Community 16 - "plansOf"
Cohesion: 0.50
Nodes (5): renderTrialPlans(), showTrialForm(), planBenefitsIntro(), plansOf(), renderPlanEditor()

### Community 17 - "environment"
Cohesion: 0.29
Nodes (7): WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED, WAHA_PRINT_QR, WHATSAPP_DEFAULT_ENGINE, WHATSAPP_SWAGGER_ENABLED, environment

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
Cohesion: 0.18
Nodes (10): name, name, networks, agenda, services, volumes, evo_instancias, oido_modelos (+2 more)

### Community 22 - "evolution-agendador"
Cohesion: 0.20
Nodes (10): container_name, depends_on, env_file, image, mem_limit, networks, ports, restart (+2 more)

### Community 23 - "reglas.js"
Cohesion: 0.20
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 24 - "openStore"
Cohesion: 0.21
Nodes (16): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+8 more)

### Community 25 - "openWizard"
Cohesion: 0.36
Nodes (9): closeWizard(), drawWizard(), openWizard(), syncPlanGate(), wizChange(), wizClick(), wizInput(), wizReadSvcs() (+1 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "renderAppearance"
Cohesion: 0.40
Nodes (5): applyPanelBrand(), imgToDataUrl(), panelPrefs(), renderAppearance(), renderPanelOrder()

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
Cohesion: 0.25
Nodes (8): loadUsers(), onErr(), refCap(), refLevels(), refLink(), renderReferrals(), setAgendaDate(), subscribeDay()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "boot"
Cohesion: 0.20
Nodes (18): afterGoogle(), bookingStaff(), boot(), doHold(), expectedDeposit(), freeFrom(), loadProfile(), occFor() (+10 more)

### Community 41 - "guideSteps"
Cohesion: 0.25
Nodes (11): goStep(), guideCard(), guideDone(), guideProgress(), guideSteps(), markGuide(), openGuide(), openShareGuide() (+3 more)

### Community 42 - "handleAct"
Cohesion: 0.18
Nodes (16): openConsent(), closeModal(), hideModal(), openModal(), addMonths(), adminUrl(), handleAct(), msgFor() (+8 more)

### Community 43 - "openQuick"
Cohesion: 0.26
Nodes (13): freeNowStaff(), loadQLocks(), myStaff(), openQuick(), qMinutes(), qSlotsFor(), renderQNow(), renderQSlots() (+5 more)

### Community 44 - "applyBrandColors"
Cohesion: 0.36
Nodes (9): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), headerBgCss(), hexRgb(), lum() (+1 more)

### Community 45 - "estado.js"
Cohesion: 0.24
Nodes (13): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+5 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "renderSettings"
Cohesion: 0.33
Nodes (7): readPM(), renderClosed(), renderSettings(), saveSettings(), trialDays(), fastSave(), staffWord()

### Community 49 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 268 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `toast`, `app.js`, `admin.js`, `common.js`, `renderHome`, `boot`, `mary.gs`, `newStory`, `openQuick`, `bogNow`, `renderPlan`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06315789473684211 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09206349206349207 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `renderReferrals`, `toast`, `admin.js`, `app.js`, `common.js`, `super.js`, `renderHome`, `guideSteps`, `boot`, `openQuick`, `applyBrandColors`, `handleAct`, `renderPlan`, `renderSettings`, `openStoryViewer`, `plansOf`, `openStore`, `renderAppearance`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.037405026300409115 - nodes in this community are weakly interconnected._