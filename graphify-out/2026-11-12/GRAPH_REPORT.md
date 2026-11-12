# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~126,893 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 951 nodes · 2750 edges · 49 communities (41 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `972ce2d0`
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
- drawStory
- renderWaBot
- renderLane
- bogNow
- renderPlan
- openModal
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
- switchTab
- textos.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- isKeyMethod
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderSettings
- openPlatformNews
- closeMenus
- openQuick
- syncBottomNav
- openWizard
- environment
- oido-agendador
- toMinW

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
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `bloqueo()` --calls--> `api()`  [EXTRACTED]
  admin.js → common.js
- `bloqueo()` --calls--> `setBusy()`  [EXTRACTED]
  admin.js → common.js
- `bloqueo()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (49 total, 8 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (97): llega(), assert, GS_MARY, INFO, test, AGRUPA, ahoraLocal(), alEventoConexion() (+89 more)

### Community 1 - "toast"
Cohesion: 0.13
Nodes (50): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), imgToDataUrl() (+42 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (79): activeStories(), afterGoogle(), APP, apptCard(), BIZ_ID, bookingStaff(), boot(), busyUntilLabel() (+71 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (43): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, DAY_SHORT (+35 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (36): app, BID, BRAND, businessFromUrl(), categoriaAuto(), db, DEFAULT_BENEFITS, DEFAULT_BENEFITS_INTRO (+28 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (21): assert, audio(), CATALOGO, CONFIRMADA, DIR, DOS, filas(), fs (+13 more)

### Community 7 - "super.js"
Cohesion: 0.08
Nodes (22): APP_VERSION, auth, BIZ_TYPES, pushNav(), RULES_VERSION, salirAlNavegador(), FILTERS, goMoney() (+14 more)

### Community 8 - "renderHome"
Cohesion: 0.12
Nodes (25): actStats(), bogDay(), bogHour(), buildRecs(), firstName(), freeNowStaff(), hh(), isBusy() (+17 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "drawStory"
Cohesion: 0.24
Nodes (10): drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba(), loadImg(), richLines(), roundRect() (+2 more)

### Community 12 - "renderWaBot"
Cohesion: 0.21
Nodes (14): botCfg(), botGuardar(), guideCard(), guideDone(), guideProgress(), guideSteps(), lockedNow(), maryWaCard() (+6 more)

### Community 13 - "renderLane"
Cohesion: 0.23
Nodes (14): daysLeft(), dm(), hideOrder(), initials(), logoOf(), render(), renderBiz(), renderLane() (+6 more)

### Community 14 - "bogNow"
Cohesion: 0.11
Nodes (40): abrirCupos(), aptCard(), bloqueo(), brPreview(), custName(), drawImage(), estadoCupos(), fillAsStory() (+32 more)

### Community 15 - "renderPlan"
Cohesion: 0.27
Nodes (12): planPrice(), renderTrialPlans(), showTrialForm(), cop(), planBenefits(), planBenefitsIntro(), planPriceOf(), plansOf() (+4 more)

### Community 16 - "openModal"
Cohesion: 0.16
Nodes (16): openConsent(), brandRow(), closeModal(), dialog(), dropOverlay(), hideModal(), openModal(), pushOverlay() (+8 more)

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
Cohesion: 0.36
Nodes (9): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), headerBgCss(), hexRgb(), lum() (+1 more)

### Community 25 - "correo.js"
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "switchTab"
Cohesion: 0.17
Nodes (20): applyPanelBrand(), goTab(), isOwner(), linkOptOn(), onErr(), panelPrefs(), refCap(), refLevels() (+12 more)

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

### Community 33 - "isKeyMethod"
Cohesion: 0.50
Nodes (4): pmProblem(), isKeyMethod(), payAccountInput(), renderPlMethods()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderSettings"
Cohesion: 0.18
Nodes (19): isTrial(), lockCard(), myPlan(), planFor(), planInfo(), PLANS(), readPM(), renderClosed() (+11 more)

### Community 41 - "openPlatformNews"
Cohesion: 0.50
Nodes (4): newsUnread(), openPlatformNews(), renderBell(), startNews()

### Community 43 - "openQuick"
Cohesion: 0.33
Nodes (10): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff() (+2 more)

### Community 45 - "openWizard"
Cohesion: 0.29
Nodes (10): closeWizard(), drawWizard(), openWizard(), socialHandle(), wizChange(), wizClick(), wizInit(), wizInput() (+2 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 273 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `bogNow` to `toast`, `app.js`, `admin.js`, `common.js`, `renderHome`, `mary.gs`, `openQuick`, `renderWaBot`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.059207920792079205 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `bogNow`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.1346938775510204 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `toast` to `isKeyMethod`, `app.js`, `admin.js`, `common.js`, `super.js`, `renderSettings`, `openPlatformNews`, `renderHome`, `openQuick`, `renderWaBot`, `renderLane`, `bogNow`, `renderPlan`, `openModal`, `applyBrandColors`, `switchTab`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._