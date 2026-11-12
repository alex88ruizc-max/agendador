# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~124,266 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 941 nodes · 2715 edges · 46 communities (41 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `332b86ba`
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
- renderSettings
- fechaLarga
- hora12
- switchTab
- isKeyMethod
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- bogNow
- estado.js
- options
- waha-agendador
- cop
- textos.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- toMillis
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderStaffTab
- showTicket
- correo.js
- openQuick
- environment
- oido-agendador

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 49 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 45 edges
5. `crear()` - 38 edges
6. `toMillis()` - 34 edges
7. `cop()` - 34 edges
8. `renderHome()` - 32 edges
9. `hora12()` - 32 edges
10. `seguir()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `openConsent()` --calls--> `openModal()`  [EXTRACTED]
  app.js → common.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `setDialogBrand()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (46 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (92): llega(), assert, GS_MARY, INFO, test, AGRUPA, ahoraLocal(), alEventoConexion() (+84 more)

### Community 1 - "toast"
Cohesion: 0.19
Nodes (34): aptAction(), clientHistory(), closeM(), deleteClient(), geoSkipKey(), goStep(), loadUsers(), manageStory() (+26 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (82): renderQDays(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), canChange() (+74 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (63): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, closeMenus() (+55 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (40): app, APP_VERSION, auth, BID, BRAND, brandRow(), businessFromUrl(), categoriaAuto() (+32 more)

### Community 5 - "estado.js"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (21): assert, audio(), CATALOGO, CONFIRMADA, DIR, DOS, filas(), fs (+13 more)

### Community 7 - "super.js"
Cohesion: 0.09
Nodes (25): pushNav(), readPublishedVersion(), reloadFresh(), startUpdateWatcher(), warmServer(), FILTERS, goMoney(), goSV() (+17 more)

### Community 8 - "renderHome"
Cohesion: 0.12
Nodes (26): actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeTimes(), guideCard() (+18 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "newStory"
Cohesion: 0.14
Nodes (24): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+16 more)

### Community 12 - "renderSettings"
Cohesion: 0.16
Nodes (19): botCfg(), botGuardar(), lockCard(), maryWaCard(), mwEsperar(), mwPintar(), planFor(), planInfo() (+11 more)

### Community 13 - "fechaLarga"
Cohesion: 0.18
Nodes (17): renderPlanBanner(), fechaLarga(), planOfBiz(), uiPrompt(), addMonths(), adminUrl(), deleteBusiness(), handleAct() (+9 more)

### Community 14 - "hora12"
Cohesion: 0.22
Nodes (19): aptCard(), bloqueo(), brPreview(), custName(), loadModalLocks(), openAptModal(), openBreak(), payLine() (+11 more)

### Community 15 - "switchTab"
Cohesion: 0.18
Nodes (22): applyPanelBrand(), goTab(), isOwner(), isTrial(), linkOptOn(), loadQLocks(), myPlan(), onErr() (+14 more)

### Community 16 - "isKeyMethod"
Cohesion: 0.50
Nodes (4): pmProblem(), renderPM(), isKeyMethod(), payAccountInput()

### Community 17 - "environment"
Cohesion: 0.29
Nodes (7): WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED, WAHA_PRINT_QR, WHATSAPP_DEFAULT_ENGINE, WHATSAPP_SWAGGER_ENABLED, environment

### Community 18 - "textos.js"
Cohesion: 0.16
Nodes (46): corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo(), cliente() (+38 more)

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

### Community 24 - "bogNow"
Cohesion: 0.33
Nodes (10): bogNow(), daysLeft(), dm(), initials(), logoOf(), renderBiz(), renderLane(), renderMonth() (+2 more)

### Community 25 - "estado.js"
Cohesion: 0.24
Nodes (13): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+5 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "cop"
Cohesion: 0.24
Nodes (13): planPrice(), renderTrialPlans(), showTrialForm(), cop(), planBenefits(), planBenefitsIntro(), planPriceOf(), plansOf() (+5 more)

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

### Community 33 - "toMillis"
Cohesion: 0.21
Nodes (12): activeStories(), newsUnread(), openPlatformNews(), refCap(), refLevels(), refLink(), renderBell(), renderReferrals() (+4 more)

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderStaffTab"
Cohesion: 0.27
Nodes (11): freeNowStaff(), isBusy(), isServing(), meStaff(), myStaff(), renderMyStatus(), renderQNow(), renderStaffTab() (+3 more)

### Community 41 - "showTicket"
Cohesion: 0.27
Nodes (10): renderClosed(), openResched(), presence(), showPay(), showTicket(), closeModal(), copyText(), fechaCorta() (+2 more)

### Community 42 - "correo.js"
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 43 - "openQuick"
Cohesion: 0.36
Nodes (9): lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff(), updQSave() (+1 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 271 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `hora12` to `toast`, `app.js`, `admin.js`, `common.js`, `renderHome`, `showTicket`, `mary.gs`, `newStory`, `openQuick`, `renderSettings`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06315789473684211 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `hora12`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.057181942544459644 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `toast` to `toMillis`, `app.js`, `admin.js`, `common.js`, `super.js`, `renderHome`, `renderStaffTab`, `showTicket`, `openQuick`, `renderSettings`, `newStory`, `hora12`, `switchTab`, `fechaLarga`, `isKeyMethod`, `bogNow`, `cop`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._